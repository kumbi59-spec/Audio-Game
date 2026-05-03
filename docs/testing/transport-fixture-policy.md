# Transport Fixture Update Policy

When introducing a new transport envelope or session event version, updates are mandatory:

1. Add a new fixture in `apps/api/src/routes/__fixtures__/session-transport-fixtures.ts`.
2. Update replay assertions in `apps/api/src/routes/session-compat.replay.test.ts`.
3. Update compatibility contract assertions in `apps/api/src/routes/session-compat.contract.test.ts`.
4. Add or update deprecation window metadata in `TRANSPORT_FIXTURE_DEPRECATION`.

CI enforces compatibility through dedicated replay and contract test steps in `.github/workflows/ci.yml`.
