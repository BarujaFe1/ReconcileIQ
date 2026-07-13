<div align="center">
  <img src="./assets/icon.png" alt="ReconcileIQ Logo" width="120" height="120" />

  <h1>ReconcileIQ</h1>
  <p><strong>Matching engine for orders, payments and fees — exact/fuzzy linkage, confidence scores and a prioritized exception inbox.</strong></p>
  <p><em>OpsLedger fecha a operação. ReconcileIQ decide o que parear — e com que confiança.</em></p>

  <p>
    <a href="https://reconcile-iq-eight.vercel.app"><strong>Live Demo</strong></a> ·
    <a href="#problem">Problem</a> ·
    <a href="#solution">Solution</a> ·
    <a href="#architecture">Architecture</a> ·
    <a href="#quick-start">Quick Start</a> ·
    <a href="#interview">Interview</a>
  </p>

  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img alt="RapidFuzz" src="https://img.shields.io/badge/RapidFuzz-Matching-F59E0B?style=for-the-badge" />
    <img alt="CI" src="https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" />
  </p>
</div>

<p align="center">
  <img src="./assets/hero-cover.png" alt="ReconcileIQ matching workbench overview" width="100%" />
</p>

---

## Status

**Portfolio-ready MVP / lab** — live Vercel demo with browser matching engine; local FastAPI + RapidFuzz for full fidelity. Durable audit on disk (API JSONL) and `localStorage` (browser). **Not** a multi-tenant settlement system.

| Item | Value |
|---|---|
| Demo | https://reconcile-iq-eight.vercel.app |
| Slug | `reconcile-iq` |
| License | MIT |
| Honest limits | Fuzzy scores may differ browser↔RapidFuzz; canonical `reconcile-iq.vercel.app` alias is unavailable |

<p align="center">
  <img src="./assets/screenshots/02-exception-inbox.png" alt="Exception inbox prioritized" width="100%" />
</p>

---

## Problem

Marketplaces, delivery and e-commerce ops receive **orders, payments and fees** from different systems. References break, payer names vary, commissions drift — and teams burn hours reconciling spreadsheets. Errors become leakage, late closes and audit pain.

**OpsLedger** answers “what broke in the operational close (orders × payments × stock)?”.  
**ReconcileIQ** answers “which records should be paired, with what confidence, and what becomes an exception?”

---

## Solution

ReconcileIQ turns three demo ledgers into an auditable matching workflow:

1. Exact join on references  
2. Fuzzy candidates (name / ref / amount proximity)  
3. Fee anomaly checks  
4. Explainable confidence scores  
5. Prioritized exception inbox (severity → impact)  
6. Human resolution + append-only audit trail  

<p align="center">
  <img src="./assets/screenshots/01-matching-workbench.png" alt="Matching workbench" width="100%" />
</p>

---

## Core features

- **Matching workbench** — pairs, method, confidence, side-by-side diff  
- **Exception inbox** — prioritized queue with confirm / investigate / write-off  
- **Confidence scoring** — exact & fuzzy with delta penalties  
- **Financial leakage board** — matched volume, leakage, fee anomalies, orphans  
- **Audit trail** — append-only events; API persists to JSONL, browser to `localStorage`  
- **Demo CSVs** — downloadable synthetic seed (12/12/11)
- **Parity gate** — golden corpus locks status/method/severity across TS and Python

---

<a id="architecture"></a>

## Architecture

```text
Demo CSVs → normalize → exact join → fuzzy candidates → fee checks
         → confidence → exception routing → human resolve → audit
```

Monorepo:

```text
apps/web   Next.js workbench + browser matching (Vercel demo)
apps/api   FastAPI + Pandas + RapidFuzz (local full mode)
data/seed  orders_demo / payments_demo / fees_demo
docs/      architecture, ADRs, testing, deployment, handoff
```

Details: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/TECHNICAL_DECISIONS.md](./docs/TECHNICAL_DECISIONS.md) · [docs/opsledger_vs_reconcileiq.md](./docs/opsledger_vs_reconcileiq.md)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Backend | FastAPI, Pydantic v2, Pandas, RapidFuzz |
| Tests | Pytest, Vitest |
| CI | GitHub Actions |
| Deploy | Vercel (`apps/web`) |

---

<a id="quick-start"></a>

## Quick start

### Prerequisites

- Node.js 20+
- Python 3.10+ (3.12 preferred)
- Git

### Option A — Windows integrated

```bash
start.bat
```

### Option B — Manual

**API**

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Web**

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 — browser engine works **without** the API.  
Optional: set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` to use RapidFuzz.

### Environment

Copy `.env.example` → `.env` (never commit secrets).

```txt
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## Tests

```bash
# API
cd apps/api && pytest -q

# Web
cd apps/web && npm test && npm run typecheck && npm run build
```

See [docs/TESTING.md](./docs/TESTING.md).

---

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Browser matching for Vercel | One-click demo | Fuzzy scores ≈ RapidFuzz, not identical (golden corpus covers decisions) |
| Local durable audit (JSONL / localStorage) | Survives reload without Postgres | Not multi-user cloud ledger |
| Exact-first linkage | High precision | Needs fuzzy for broken refs |
| Human write-off | Safer narrative | Not fully automated |

---

## Roadmap

- **MVP ✅** — demo CSVs, exact/fuzzy, confidence, inbox, audit, Vercel demo  
- **Phase 2** — configurable rules, N:N matching, explainability UI, export  
- **Phase 3** — mock connectors, learning from resolutions, monthly close risk view  

Out of scope: full fiscal accounting, live banks in MVP, personal finance app.

---

## What this project demonstrates

- Record linkage (exact + fuzzy) with precision/recall awareness  
- Confidence as **decision support**, not silent automation  
- Exception management with severity, impact and auditability  
- Full-stack data product packaging (Next.js + FastAPI monorepo)  
- Clear product differentiation vs a sibling portfolio case (OpsLedger)

---

<a id="interview"></a>

## How I’d present this in an interview (3 minutes)

1. **Problem:** multi-source settlement → leakage and late close  
2. **Positioning:** OpsLedger closes ops; ReconcileIQ matches with confidence  
3. **Demo:** show exact vs fuzzy filter → open a fuzzy pair in the diff viewer  
4. **Inbox:** sort by severity → investigate one exception → show audit event  
5. **Trade-off:** browser approx for demo vs RapidFuzz locally; human-in-the-loop by design  

Pitch notes: [docs/portfolio_pitch.md](./docs/portfolio_pitch.md)

---

## Docs

- [AUDIT_REPORT.md](./docs/AUDIT_REPORT.md)
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [TECHNICAL_DECISIONS.md](./docs/TECHNICAL_DECISIONS.md)
- [TESTING.md](./docs/TESTING.md)
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)
- [CHANGELOG.md](./docs/CHANGELOG.md)
- [PORTFOLIO_HANDOFF.md](./docs/PORTFOLIO_HANDOFF.md)
- [HANDOFF.md](./docs/HANDOFF.md)

---

## Author

**Felipe Alirio Baruja**

- Portfolio: https://barujafe.vercel.app/
- GitHub: https://github.com/BarujaFe1
- LinkedIn: https://www.linkedin.com/in/barujafe/

## License

MIT — Copyright (c) 2026 Felipe Alirio Baruja
