# Handoff — ReconcileIQ portfolio quality pass

**Branch:** `chore/portfolio-quality-pass`  
**Date:** 2026-07-13  

---

## What we found

- Strong product thesis and OpsLedger differentiation already present.
- Dual engines (TS browser vs Python RapidFuzz) risked silent divergence.
- Exception inbox claimed “prioritized” but API list was unsorted.
- Python text norm lacked diacritic folding (`João` vs `Joao`).
- Browser audit could reopen `exception_opened` noise; load path double-ran reconcile.
- No frontend unit tests, no CI, unused deps (`recharts`, `lucide-react`).
- README was long but less interview/trade-off oriented than needed.
- Placeholder screenshots remain generated (visual debt for later).

## What we fixed / improved

- Shared thresholds modules (TS + Python) with Unicode normalization.
- API exception sort by severity → impact; pytest coverage expanded.
- Browser audit dedupe + `resetDemoState`; single reconcile on page load.
- Workbench a11y (keyboard rows, skip link, labels, empty/loading states).
- Methodology panel + clearer demo vs full-mode messaging.
- Vitest matching tests; ESLint config; removed unused UI deps.
- GitHub Actions CI (api pytest/ruff + web typecheck/test/lint/build).
- Docs: AUDIT, ARCHITECTURE, TECHNICAL_DECISIONS, TESTING, DEPLOYMENT, HANDOFF.
- Portfolio-grade README rewrite.
- `.gitignore` includes `.vercel/`.

## Commands run

```bash
# API
cd apps/api && pytest -q   # 7 passed (pre-final); re-run after changes

# Web
cd apps/web && npm install && npm test && npm run typecheck && npm run lint && npm run build
```

## Tests

| Suite | Expectation |
|---|---|
| `apps/api` pytest | health, reconcile, priority, resolve, normalize, fuzzy/orphan |
| `apps/web` vitest | normalize, scoring, demo signals, priority, audit dedupe, resolve |

## Still missing / residual risks

1. Placeholder PNG screenshots — replace with real UI captures when possible.
2. Fuzzy score parity browser≠RapidFuzz — document & live with it for demo.
3. In-memory audit — no durable store yet.
4. `reconcile-iq.vercel.app` alias may be owned by another project; canonical demo URL is `reconcileiq-eight.vercel.app`.
5. No E2E/Playwright yet.
6. Root `vercel.json` vs `apps/web` deploy path — follow DEPLOYMENT.md.

## Next steps

1. Capture real screenshots from the live demo and replace `assets/screenshots/*`.
2. Optional: publish FastAPI somewhere and wire `NEXT_PUBLIC_API_URL` for full-mode demo.
3. Phase 2: configurable rules + N:N matching + CSV upload UI.
4. Merge this branch after CI green.

## Portfolio suggestions

- Keep slug `reconcile-iq` featured next to OpsLedger with the contrast one-liner.
- In interviews, open Exact → Fuzzy filter, then resolve one exception live.
- Mention precision/recall and why confidence is not auto-settlement.

## Suggested commit message

```txt
chore: improve portfolio quality, docs, tests and stability
```
