#!/usr/bin/env bash
# One-shot dev environment bootstrap for the web app.
# Run once after cloning: bash scripts/setup-dev.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
ENV_FILE="$WEB_DIR/.env.local"
# docker-compose.yml's Postgres. The web's tables go in their own schema so
# they never mix with the api's tables (same URL as apps/web/prisma/.env).
DEFAULT_DATABASE_URL="postgres://audio_rpg:audio_rpg@localhost:5432/audio_rpg?schema=web"

echo "==> Installing dependencies..."
cd "$REPO_ROOT"
pnpm install

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "==> Starting Postgres (docker compose up -d postgres)..."
  docker compose up -d postgres
  for _ in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U audio_rpg -d audio_rpg >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
else
  echo "==> Docker is not available; expecting a Postgres with pgvector at localhost:5432"
  echo "    (see docker-compose.yml for the user, password and database)."
fi

if [ -f "$ENV_FILE" ]; then
  echo "==> $ENV_FILE already exists, skipping generation."
else
  echo "==> Generating $ENV_FILE..."
  SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  # Detect GitHub Codespaces and set the correct public URL
  if [ -n "${CODESPACE_NAME:-}" ]; then
    NEXTAUTH_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  else
    NEXTAUTH_URL="http://localhost:3000"
  fi

  cat > "$ENV_FILE" <<EOF
# Required for NextAuth v5
AUTH_SECRET=$SECRET
NEXTAUTH_SECRET=$SECRET
NEXTAUTH_URL=$NEXTAUTH_URL

# Local Postgres (docker compose up -d postgres), web tables in schema "web"
DATABASE_URL=$DEFAULT_DATABASE_URL

# Optional: add your Anthropic key to enable AI features
# ANTHROPIC_API_KEY=sk-ant-...
EOF
  echo "    Created $ENV_FILE with a fresh secret."
fi

# The Prisma CLI doesn't read .env.local, so pass its DATABASE_URL along.
DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' "$ENV_FILE" | tail -n 1 | tr -d "\"'")"
DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
case "$DATABASE_URL" in
  postgres://*|postgresql://*) ;;
  *)
    echo "==> $ENV_FILE has DATABASE_URL=$DATABASE_URL, but the schema is Postgres-only."
    echo "    Change it to $DEFAULT_DATABASE_URL and re-run this script."
    exit 1
    ;;
esac
export DATABASE_URL

echo "==> Applying database migrations..."
cd "$WEB_DIR"
if ! pnpm exec prisma migrate deploy; then
  echo "==> Could not migrate the database. Start Postgres (docker compose up -d postgres)"
  echo "    and re-run: bash scripts/setup-dev.sh"
  exit 1
fi

echo ""
echo "Setup complete. Start the dev server with:"
echo "  pnpm --filter @audio-rpg/web dev"
echo "  # or from the repo root:"
echo "  pnpm dev:web"
