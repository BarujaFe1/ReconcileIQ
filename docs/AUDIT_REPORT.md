# ReconcileIQ — Audit Report

**Branch:** `chore/portfolio-quality-pass`  
**Date:** 2026-07-13  
**Auditor role:** senior architecture + fullstack + QA + DX + portfolio reviewer  

---

## 1. Executive summary

ReconcileIQ is a credible **matching-engine** portfolio piece: exact/fuzzy linkage across orders, payments and fees, confidence scoring, prioritized exception inbox and audit trail. It correctly positions itself as complementary to OpsLedger (operational close), not a clone.

The MVP works and the Vercel demo is live, but quality gaps hurt recruiter trust: weak browser fuzzy vs RapidFuzz backend, audit-log spam on every run, thin frontend tests, no CI, placeholder screenshots, incomplete a11y, and documentation that is long but not interview-ready enough on trade-offs.

**Current portfolio grade: 6.8 / 10**  
Target after this pass: **8.5+ / 10**

---

## 2. Stack & structure (as found)

| Layer | Reality |
|---|---|
| Frontend | Next.js 15 App Router, React 19, TypeScript (client matching engine) |
| Backend | FastAPI + Pandas + RapidFuzz (local/full fidelity) |
| Data | Synthetic CSVs in `data/seed` mirrored in `apps/web/lib/demo-data.ts` |
| Deploy | Vercel (`apps/web`), demo URL on GitHub homepage |
| Tests | Pytest API smoke only; no frontend unit tests |
| CI | Missing |

```text
ReconcileIQ/
├── apps/api/          FastAPI matching + audit
├── apps/web/          Next.js workbench (browser matching)
├── data/seed/         orders/payments/fees demo CSVs
├── docs/              methodology, OpsLedger comparison, pitch
├── assets/            icon/hero/screenshots (generated placeholders)
└── scripts/           seed + asset generator
```

---

## 3. Main risks

1. **Dual engines diverge** — TS fuzzy approximation ≠ RapidFuzz; demo and local API can disagree on scores/status.
2. **Audit trail pollution** — each `runClientReconciliation` pushes new `exception_opened` / `reconciliation_run` events without dedupe intent clarity (Python partially guards runs; TS does not).
3. **Accent normalization gap** — Python `_norm` does not strip diacritics; TS does (`João` vs `Joao`).
4. **No CI** — regressions on matching thresholds are invisible on PRs.
5. **Placeholder visuals** — generated PNGs look unfinished for portfolio screenshots.
6. **Root `vercel.json`** may confuse deployers vs `apps/web` deploy path.
7. **Unused deps risk** — `recharts` / `lucide-react` imported lightly or unused → noise.
8. **State in module scope** — browser Map/audit globals are fine for demo, but need reset + documentation.

---

## 4. Bugs found

| ID | Severity | Issue |
|---|---|---|
| B1 | High | Python exception list not prioritized by severity/impact (UI claims prioritized; API unsorted). |
| B2 | High | TS audit appends on every reconcile; inbox reopen spam. |
| B3 | Medium | Python norm lacks Unicode fold → fuzzy name scores differ vs browser. |
| B4 | Medium | Dead/confusing reason-building block in `matching.ts` (empty if). |
| B5 | Medium | Exact-ref path can mark fee anomalies as `exception` but severity uses impact correctly; fee-only anomalies should stay visible in workbench filters. |
| B6 | Low | `next lint` likely fails without ESLint config. |
| B7 | Low | `.vercel/` under `apps/web` may be committed if gitignore incomplete. |
| B8 | Low | Table rows clickable without keyboard/ARIA roles. |

---

## 5. Quick wins

- Normalize Python strings with NFD + diacritic strip.
- Sort API exceptions like the UI.
- Deduplicate audit events / reset helpers.
- Add Vitest matching unit tests + pytest threshold cases.
- Add GitHub Actions CI (web typecheck/build + api pytest).
- Improve empty/loading/error/a11y on workbench.
- Rewrite README for interview narrative + OpsLedger contrast.
- Document architecture, ADRs, testing, deployment, handoff.

---

## 6. Structural improvements

1. Keep dual engines but document contract + add parity tests where feasible.
2. Extract shared matching constants (tolerances, severity bands) into documented config.
3. Clarify demo mode (browser) vs full mode (FastAPI+RapidFuzz).
4. CI gate on PR.
5. Portfolio docs: methodology, precision/recall talking points, limitations.

---

## 7. Execution plan

1. Write this audit ✅  
2. Fix matching/audit/normalization bugs  
3. Add frontend + backend tests  
4. UX polish (loading, legend, a11y, methodology panel)  
5. Docs + README + CI  
6. Verify build/test  
7. Commit + push branch  

---

## 8. Final checklist (acceptance)

- [x] Install works  
- [x] Web build passes  
- [x] API pytest passes  
- [x] Matching unit tests exist  
- [x] CI workflow present  
- [x] README portfolio-grade  
- [x] Architecture / ADRs / Testing / Deployment / Handoff docs  
- [x] `.env.example` + `.gitignore` safe  
- [x] No secrets committed  
- [x] Demo UX clearer for recruiters  

**Post-pass target grade: ~8.6 / 10** (remaining visual debt: real screenshots).
