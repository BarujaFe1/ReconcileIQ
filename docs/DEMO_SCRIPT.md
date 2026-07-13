# Demo script — ReconcileIQ (3–5 minutes)

Audience: analytics engineering / data product / fullstack interview.

## Setup

Open https://reconcile-iq-eight.vercel.app (or local `npm run dev` in `apps/web`).

Synthetic data only — no PII.

## Script

1. **Opening (30s)**  
   “OpsLedger fecha a operação (pedidos × pagamentos × estoque). ReconcileIQ é o motor de matching: exact/fuzzy, confidence e exception inbox.”

2. **Leakage board (45s)**  
   Point to Exact matched / Fuzzy matched / Exceptions / Leakage.  
   Claim only what is on screen (demo seed counts).

3. **Fuzzy workbench (90s)**  
   Filter → Fuzzy only. Select ORD-1009.  
   Show `MP-77840` vs `MP-7784O`, confidence ~85.8, reasons.

4. **Exception inbox (60s)**  
   Scroll to prioritized inbox. Explain severity → impact.  
   Click **Investigate** on one item; show status change.

5. **Audit trail (45s)**  
   Show append-only events. Mention: browser persists via localStorage; API via JSONL on disk. Not a multi-tenant ledger.

6. **Close (30s)**  
   Trade-off: browser fuzzy ≈ RapidFuzz (golden corpus locks status/method/severity, not exact scores). Human-in-the-loop by design.

## Do not say

- “enterprise-ready”
- “production settlement”
- “AI matching”
- that fuzzy scores are identical across engines
