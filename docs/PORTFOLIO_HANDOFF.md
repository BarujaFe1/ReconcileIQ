# Portfolio Handoff — ReconcileIQ

**Date:** 2026-07-13  
**Branch:** `chore/portfolio-quality-pass`  
**Recommendation:** **Destaque / Selecionado (Tier S)** — matching engine with honest limits, live demo, parity tests, durable audit MVP.

---

## Before → After

| Area | Before | After |
|---|---|---|
| Audit | In-memory only | API JSONL + exception state JSON; browser `localStorage` |
| Engine parity | Undocumented divergence | Golden fingerprint tests (status/method/severity) |
| Screenshots | Generated placeholders | Real UI captures from local demo |
| Docs | Quality-pass handoff | Demo script, changelog, portfolio handoff, ADRs updated |
| Public demo | Risk of stale build | Redeployed to https://reconcileiq-eight.vercel.app (`reconcileiq`) |

## What was verified

- API pytest: 10 passed  
- Web vitest: 12 passed (includes golden parity)  
- Web typecheck/lint/build: green (re-run in final gate)  
- Live URL (canonical after redeploy): https://reconcileiq-eight.vercel.app  
- Alias `reconcile-iq.vercel.app` belongs to another app (“ReconcileIQ Pro”) — do not claim it

## Claims allowed

- Matching engine for orders/payments/fees  
- Exact + fuzzy linkage with confidence and prioritized exceptions  
- Complementary to OpsLedger  
- Durable local audit for MVP (disk / localStorage)  
- Golden corpus parity on **decisions**, not fuzzy score equality  

## Claims forbidden

- Enterprise / production settlement  
- Identical fuzzy scores across engines  
- Canonical alias `reconcile-iq.vercel.app`  
- AI / ML ranking of payers  

## Interview path

See `docs/DEMO_SCRIPT.md` (3–5 min).

## Next steps

1. Merge branch after CI green (demo already redeployed to `reconcileiq-eight`)  
2. Upload `assets/social-preview.png` in GitHub Social Preview settings  
3. Optional: host FastAPI and set `NEXT_PUBLIC_API_URL` for full-mode demo  
4. Point portfolio site demo CTA to https://reconcileiq-eight.vercel.app if still on the hyphenated URL  

## Supermegaprompt

External file (required):  
`C:\dev\prompts_para_port\reconcileiq-supermegaprompt-portfolio.md`
