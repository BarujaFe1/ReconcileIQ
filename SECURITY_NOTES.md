# SECURITY_NOTES.md

## Scope

Portfolio MVP with synthetic demo data only. No production customer ledgers.

## Findings (2026-07-13)

- No `.env` secrets committed.
- `.env.example` contains non-secret placeholders only.
- `.gitignore` excludes `.env*`, `.venv`, `node_modules`, `.vercel`, uploads.
- In-memory audit/exception state is process-local — not a credential store.
- Optional future connectors (Stripe/Mercado Pago) must never land real tokens in git.

## If a secret is found later

1. Rotate the credential immediately.
2. Remove from git history if it was committed.
3. Document the incident here **without** pasting the secret value.
