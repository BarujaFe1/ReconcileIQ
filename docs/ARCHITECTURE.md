# Architecture — ReconcileIQ

## Purpose

ReconcileIQ is a **matching engine** for operational financial reconciliation. It links orders, payments and fees, scores confidence, and routes material divergences into a prioritized exception inbox with an append-only audit trail.

It is intentionally complementary to **OpsLedger** (operational close with stock rules and batch reporting), not a duplicate.

## High-level topology

```text
┌──────────────────────────────┐
│  apps/web (Next.js 15)       │
│  Browser matching engine     │
│  Workbench + Exception Inbox │
└──────────────┬───────────────┘
               │ optional NEXT_PUBLIC_API_URL
┌──────────────▼───────────────┐
│  apps/api (FastAPI)          │
│  Pandas + RapidFuzz          │
│  /api/reconcile /audit /demo │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│  data/seed/*.csv             │
│  orders / payments / fees    │
└──────────────────────────────┘
```

## Dual-engine contract

| Mode | Where | Matching library | Deploy target |
|---|---|---|---|
| Demo | `apps/web/lib/matching.ts` | Lightweight fuzzy approx | Vercel |
| Full | `apps/api/app/services/matching.py` | RapidFuzz | Local / Render-like |

Shared thresholds live in:
- `apps/web/lib/thresholds.ts`
- `apps/api/app/services/thresholds.py`

Both engines must agree on:
- amount/fee tolerances;
- severity bands;
- exception prioritization (severity → impact);
- Unicode-normalized text (NFD + strip diacritics).

Fuzzy **scores** may differ slightly (approx vs RapidFuzz). Statuses on the demo seed should still surface exact, fuzzy, orphans and fee anomalies.

## Domain flow

1. Normalize refs/names.
2. Exact join `orders.external_ref` ↔ `payments.order_ref`.
3. Fuzzy candidate search for unmatched orders.
4. Fee expected vs charged check.
5. Confidence scoring with delta penalties.
6. Exception routing + human resolution actions.
7. Append-only audit events.

## State model (MVP)

- In-memory exception status map + audit list (API and browser).
- Not durable across process restarts — acceptable for portfolio demo.
- `reset_state` / `resetDemoState` helpers for tests.

## Non-goals

- Full fiscal accounting
- Live bank connectors in MVP
- Fully automated write-offs without human review
- Stock/WMS rules (OpsLedger territory)
