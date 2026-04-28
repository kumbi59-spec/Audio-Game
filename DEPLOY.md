# Production Deploy — Render + Supabase

End-to-end walkthrough for getting EchoQuest online.

| Layer | Provider | Why |
|---|---|---|
| Web (Next.js) | Render web service | Native Node.js builds, autoscaling, free SSL |
| API (Fastify) | Render web service | WebSocket support, persistent connections |
| Database | Supabase Postgres | Managed Postgres + pgvector extension in one click |
| Asset storage (optional) | Cloudflare R2 | Cheaper egress than S3 for narration audio |

## 1. Provision Supabase

1. Sign up at [supabase.com](https://supabase.com) and create a new project. Pick the same region you'll deploy Render in (e.g. `us-west-1` for Render Oregon).
2. Wait for the project to finish provisioning (~2 minutes).
3. **Enable the pgvector extension**: Database → Extensions → search `vector` → toggle on.
4. **Grab connection strings** from Project Settings → Database → Connection string:
   - **Pooled** (port `6543`) — copy this into the web service's `DATABASE_URL`. Pooling protects against Next.js's serverless cold-start connection storms.
   - **Direct** (port `5432`) — copy this into the api service's `DATABASE_URL`. The api uses pgvector + holds long-lived WebSocket connections; it needs a direct (non-pooled) connection.
   - Both URLs already contain the password — store them in Render secrets, never commit them.

## 2. Switch Prisma to Postgres

The default `apps/web/prisma/schema.prisma` ships with `provider = "sqlite"` for fast local dev. Before deploying:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
+  // Uncomment if you use the Supabase pooler in `DATABASE_URL`:
+  // directUrl = env("DIRECT_DATABASE_URL")
 }
```

Then create the initial migration locally against the **direct** Supabase URL:

```bash
DATABASE_URL="<supabase-direct-url>" \
  pnpm --filter @audio-rpg/web exec prisma migrate dev --name initial_postgres
```

Commit the generated `prisma/migrations/` directory. Render's build step will run `prisma generate` automatically; you can run `prisma migrate deploy` from a Render shell or as a release command on each deploy.

## 3. Provision Render

1. Sign up at [render.com](https://render.com) and connect your GitHub account.
2. New → **Blueprint** → pick this repo and the `main` branch. Render reads [`render.yaml`](./render.yaml) and proposes two web services (`echoquest-web`, `echoquest-api`).
3. Click **Apply**. Both services start as failed builds because secrets aren't set yet — that's expected.
4. For each service, open Environment → fill the secrets marked `sync: false` in `render.yaml`. Use the values from `.env.production.example` as a checklist.
5. After secrets are in place, click **Manual Deploy → Deploy latest commit** on each service.

The web service's `NEXTAUTH_URL` should match its Render URL (e.g. `https://echoquest-web.onrender.com`). The api's `ALLOWED_ORIGINS` should list the same web URL.

## 4. Seed the admin account

Once the web service is live and the database is migrated, open Render → echoquest-web → Shell and run:

```bash
ADMIN_SEED_EMAIL=you@example.com \
ADMIN_SEED_PASSWORD='strong-password' \
pnpm --filter @audio-rpg/web db:seed:admin
```

Make sure `ADMIN_EMAILS` (set in the Render dashboard) also contains that email so the account auto-elevates to Creator on every sign-in.

## 5. Stripe live mode

1. Create products + prices in Stripe Dashboard → Products: one `Storyteller` ($9/mo + annual) and one `Creator` ($19/mo + annual). Copy the four `price_…` IDs.
2. Webhook endpoint: `https://echoquest-web.onrender.com/api/payments/webhook`. Subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret.
3. Paste keys into Render: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, the four `STRIPE_PRICE_*`.

## 6. Domains, email, push

- **Custom domain** — Render → Settings → Custom Domains. Update `NEXTAUTH_URL` and `ALLOWED_ORIGINS` to match.
- **Resend** — verify your sending domain (SPF + DKIM DNS records). Set `RESEND_FROM=EchoQuest <noreply@yourdomain.com>`.
- **Web push** — locally run `npx web-push generate-vapid-keys`, paste both halves into Render. The public key also needs `NEXT_PUBLIC_` prefix so the browser bundle picks it up.

## 7. Smoke tests

After both services deploy:

```bash
curl https://echoquest-web.onrender.com/api/healthz   # → {"ok":true,"service":"echoquest-web"}
curl https://echoquest-api.onrender.com/health        # → {"ok":true}
```

Then sign in with the admin account, start a campaign, and confirm narration streams end-to-end.

## Rolling forward

`autoDeploy: true` in `render.yaml` means every push to `main` triggers a rebuild of both services. Keep main deployable; gate risky changes behind feature flags or PR previews.

## Cost note (rough)

| Service | Plan | Monthly |
|---|---|---|
| Render web (web app) | Starter | ~$7 |
| Render web (api) | Starter | ~$7 |
| Supabase | Free tier (500 MB DB) | $0 |
| **Total** | | **~$14/mo** before traffic |

Bump Render plans if you start seeing memory pressure on streaming Claude responses; the api in particular benefits from the Standard plan once concurrent sessions exceed ~50.
