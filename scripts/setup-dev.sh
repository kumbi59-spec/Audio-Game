#!/usr/bin/env bash
# One-shot dev environment bootstrap for the web app.
# Run once after cloning: bash scripts/setup-dev.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
ENV_FILE="$WEB_DIR/.env.local"

echo "==> Installing dependencies..."
cd "$REPO_ROOT"
pnpm install

if [ -f "$ENV_FILE" ]; then
  echo "==> $ENV_FILE already exists, skipping generation."
else
  echo "==> Generating $ENV_FILE..."
  SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  cat > "$ENV_FILE" <<EOF
# Required for NextAuth v5
AUTH_SECRET=$SECRET
NEXTAUTH_SECRET=$SECRET
NEXTAUTH_URL=http://localhost:3000

# SQLite database (local dev — no external DB needed)
DATABASE_URL=file:./dev.db

# Optional: add your Anthropic key to enable AI features
# ANTHROPIC_API_KEY=sk-ant-...
EOF
  echo "    Created $ENV_FILE with a fresh secret."
fi

echo "==> Initialising the database..."
cd "$WEB_DIR"
pnpm db:push

echo ""
echo "Setup complete. Start the dev server with:"
echo "  pnpm --filter @audio-rpg/web dev"
echo "  # or from the repo root:"
echo "  pnpm dev:web"
