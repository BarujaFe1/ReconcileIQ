# Technical Decisions — ReconcileIQ

## ADR-001 — Dual matching engines (browser + FastAPI)

**Decision:** Ship a TypeScript matching engine for Vercel demo and keep FastAPI+RapidFuzz for local/full fidelity.

**Why:** Vercel static/serverless Next deploy must work without a Python sidecar. Recruiters need a one-click demo.

**Trade-off:** Fuzzy score parity is approximate. Mitigated by shared thresholds, Unicode normalization, prioritized exceptions and documented limitations.

## ADR-002 — Exact-first, fuzzy-second linkage

**Decision:** Prefer exact reference joins before fuzzy name/ref/amount candidates.

**Why:** Maximizes precision; fuzzy is recall for broken refs (e.g. `MP-77840` vs `MP-7784O`).

**Trade-off:** Misses true matches when both ref and name are badly corrupted. Future: blocking keys + probabilistic record linkage.

## ADR-003 — Confidence as decision support, not automation

**Decision:** Confidence scores guide humans; write-offs/confirms require explicit actions + audit.

**Why:** Financial resolution without human review is a portfolio anti-pattern and operational risk.

## ADR-004 — In-memory audit for MVP

**Decision:** Append-only lists in process memory (not Postgres yet).

**Why:** Keeps demo frictionless. Persistence is Phase 2/3 (Supabase/Postgres).

**Trade-off:** State resets on cold start. Tests use explicit reset helpers.

## ADR-005 — Complementary positioning vs OpsLedger

**Decision:** Do not reimplement stock rules, batch wizard or close report.

**Why:** Clear portfolio narrative: OpsLedger = operational close; ReconcileIQ = matching engine.

## ADR-006 — Remove unused UI dependencies

**Decision:** Drop `recharts` and `lucide-react` until charts/icons are actually used.

**Why:** Smaller install surface and clearer dependency story for reviewers.
