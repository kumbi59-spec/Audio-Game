# Production Deploy — Render + Supabase

End-to-end walkthrough for getting EchoQuest online.

| Layer | Provider | Why |
|---|---|---|
| Web (Next.js) | Render web service | Native Node.js builds, autoscaling, free SSL |
| API (Fastify) | Render web service | WebSocket support, persistent connections |
| Database | Supabase Postgres | Managed Postgres + pgvector extension in one click |
| Rate-limit store (optional) | Upstash Redis | Web rate limits; without it they use a Postgres table |

## 1. Provision Supabase

1. Sign up at [supabase.com](https://supabase.com) and create a new project. Pick the same region you'll deploy Render in (e.g. `us-west-1` for Render Oregon).
2. Wait for the project to finish provisioning (~2 minutes).
3. **Enable the pgvector extension**: Database → Extensions → search `vector` → toggle on.
4. **Grab the connection string**: Project → **Connect** → **Session pooler**. It looks like

   ```
   postgresql://postgres.<project-ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
   ```

   Use the **session pooler** (port `5432`, user `postgres.<project-ref>`) for **both** services:
   - Not the **direct** connection (`db.<project-ref>.supabase.co`). That host is IPv6-only and Render has no outbound IPv6, so the service cannot connect at all.
   - Not the **transaction** pooler (port `6543`). `prisma migrate deploy` takes advisory locks, which need session mode. (Transaction mode would also need `?pgbouncer=true` for Prisma.)
   - pgvector works through the pooler, and the api uses no `LISTEN/NOTIFY`, so the api needs no direct connection.
5. **Percent-encode the password.** Characters such as `@ : / ? # [ ] %` in the password must be written as `%40 %3A %2F %3F %23 %5B %5D %25`, or the URL is parsed wrongly.
6. **TLS for each service** (append to the URL):
   - **web** (Prisma): `?sslmode=require`. Prisma encrypts without checking the certificate chain.
   - **api** (node-postgres): `?sslmode=verify-full&sslrootcert=/etc/secrets/supabase-ca.crt`. Download the CA from Supabase (Project Settings → Database → SSL Configuration) and add it to the api service as a Render **Secret File** named `supabase-ca.crt` (Render mounts it under `/etc/secrets/`). At minimum use `?sslmode=no-verify`, which encrypts without verification.
   - **Never use `?sslmode=require` for the api.** `pg` 8.13 treats `require` as `verify-full`, Supabase's CA is not in Node's trust store, and every query fails with "self-signed certificate in certificate chain". Settings parsed from the URL override any `ssl` options in code.
7. **Pool size.** Supavisor's session pool is small on the lower compute tiers. Set the api's `DATABASE_POOL_MAX` (its `pg` pool size, default `10`) to about `5` on small Supabase compute, so the web's Prisma pool plus the api stay under the session pool size.
8. The URLs contain the password: store them in Render secrets, never commit them.

## 2. Database migrations

`apps/web/prisma/schema.prisma` is already `postgresql`, and the migrations are committed under `apps/web/prisma/migrations/`. The web service's start command runs `prisma migrate deploy` before `next start`, so every deploy applies any new migration, and a fresh database is migrated from scratch. The api creates its own tables (`worlds`, `campaigns`, `turns`, …) on boot from `apps/api/src/state/schema.sql`. They do not collide with the web's Prisma tables.

To apply migrations by hand (from a machine with IPv4, through the same session pooler URL):

```bash
DATABASE_URL="<supabase-session-pooler-url>?sslmode=require" \
  pnpm --filter @audio-rpg/web exec prisma migrate deploy
```

New migrations are created locally against the docker-compose Postgres (see the README) with `pnpm --filter @audio-rpg/web db:migrate`.

## 3. Provision Render

1. Sign up at [render.com](https://render.com) and connect your GitHub account.
2. New → **Blueprint** → pick this repo and the `main` branch. Render reads [`render.yaml`](./render.yaml) and proposes two web services (`echoquest-web`, `echoquest-api`).
3. Click **Apply**. Both services start as failed builds because secrets aren't set yet — that's expected.
4. For each service, open Environment → fill the secrets marked `sync: false` in `render.yaml`. Use the values from `.env.production.example` as a checklist.
5. After secrets are in place, click **Manual Deploy → Deploy latest commit** on each service.

The web service's `NEXTAUTH_URL` should match its Render URL (e.g. `https://echoquest-web.onrender.com`). The api's `ALLOWED_ORIGINS` should list the same web URL — include the apex/custom domain too (e.g. `https://echoquest.us`) once it's wired up, otherwise the multiplayer lobby's WebSocket upgrade is rejected by CORS.

For the multiplayer lobby to work in production, set `NEXT_PUBLIC_API_URL` on the web service to the api service's public URL (e.g. `https://echoquest-api.onrender.com`). The browser opens `/ws/lobby/:campaignId` against this host, so it must be reachable over HTTPS/WSS.

Also set `SESSION_SIGNING_KEY` to the **same** value on both `echoquest-web` and `echoquest-api`. The web service mints HMAC-signed lobby tokens and the api verifies them; mismatched keys produce an "Invalid auth token" error in the lobby. Generate one 32-byte random value (e.g. `openssl rand -base64 32`) and paste it into both services.

**Set `SESSION_SIGNING_KEY` on the api before deploying.** The blueprint runs the api with `NODE_ENV=production`, and in production the api refuses to boot when the key is unset or still a dev value (`change-me`, `dev-insecure-change-me`): with a public key anyone could forge session, lobby and tier tokens.

Other api settings in the blueprint:
- `TRUST_PROXY_HOPS=1`: Render's proxy is one hop in front of the api, and the per-IP rate limits read the client address through it. Keep it at `1` on Render.
- `ENABLE_DEV_TIER_TOKENS` mounts an unauthenticated route that mints any tier token. It is for local development only, is ignored when `NODE_ENV=production`, and must never be set on Render.
- `/tts/stream` (server-side ElevenLabs narration) requires a **storyteller** tier token. Clients without one fall back to on-device TTS.
- `DEEPGRAM_API_KEY` and `DEEPGRAM_PROJECT_ID` enable speech-to-text. Without both, `POST /stt/token` returns `503` and clients use the platform recognizer; `GET /stt/status` reports which applies without minting a key.

**Redis is optional.** Only `UPSTASH_REDIS_REST_URL` plus `UPSTASH_REDIS_REST_TOKEN` (on the web service) switch rate limiting to Redis. Without them the web uses the Postgres `RateLimitBucket` table. No other Redis or `REDIS_URL` setting is read.

## 4. Seed the admin account

Once the web service is live and the database is migrated, open Render → echoquest-web → Shell and run:

```bash
ADMIN_SEED_EMAIL=you@example.com \
ADMIN_SEED_PASSWORD='strong-password' \
pnpm --filter @audio-rpg/web db:seed:admin
```

Make sure `ADMIN_EMAILS` (set in the Render dashboard) also contains that email so the account auto-elevates to Creator on every sign-in.

## 5. Stripe live mode

1. Create products + prices in Stripe Dashboard → Products: one `Storyteller` ($9/mo + annual) and one `Creator` ($19/mo + annual). Copy the four `price_…` IDs. Then create the three one-time AI minute packs (60, 180 and 600 minutes) and copy their `price_…` IDs.
2. Webhook endpoint: `https://echoquest-web.onrender.com/api/payments/webhook`. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded` (credits minute packs paid by a delayed method), `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret.
3. Paste keys into Render: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, the four subscription `STRIPE_PRICE_*`, and `STRIPE_PRICE_PACK_60`, `STRIPE_PRICE_PACK_180`, `STRIPE_PRICE_PACK_600`.

## 6. Domains, email, push

- **Custom domain** — Render → Settings → Custom Domains. Update `NEXTAUTH_URL` and `ALLOWED_ORIGINS` to match. If the api also has a custom domain, update `NEXT_PUBLIC_API_URL` on the web service so the multiplayer lobby's WebSocket targets the new hostname.
- **Resend** — verify your sending domain (SPF + DKIM DNS records). Set `RESEND_FROM=EchoQuest <noreply@yourdomain.com>`.
- **Web push** — locally run `npx web-push generate-vapid-keys`, paste both halves into Render. The public key also needs `NEXT_PUBLIC_` prefix so the browser bundle picks it up.

## 7. Smoke tests

After both services deploy:

```bash
curl https://echoquest-web.onrender.com/api/healthz   # → {"ok":true,"service":"echoquest-web"}
curl https://echoquest-api.onrender.com/health        # → {"ok":true,"storageBackend":"postgres",…}
curl -fsS https://echoquest-api.onrender.com/worlds   # → 200 with a JSON list; a 500 means the api's Postgres store is failing (see its logs)
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
