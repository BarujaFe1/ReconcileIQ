# ReconcileIQ — Matching Methodology

## Sources

MVP demo uses three normalized CSV sources:

- `orders_demo.csv`
- `payments_demo.csv`
- `fees_demo.csv`

## Matching stages

1. **Exact join** on `orders.external_ref` ↔ `payments.order_ref`
2. **Fuzzy candidate search** with RapidFuzz (`token_sort_ratio` on names, `partial_ratio` on refs) plus amount proximity
3. **Fee check** comparing charged fee vs expected rate × net amount
4. **Confidence scoring** with penalties for amount/fee deltas
5. **Exception routing** for unmatched records, low-confidence pairs and financial deltas

## Confidence interpretation

- `>= 90` and exact method: auto-suggest matched
- `75–92` fuzzy: human-assisted confirmation recommended
- below threshold / material delta: exception inbox

## Explicit non-goals

- Full fiscal accounting
- Live bank integrations in MVP
- Fully automated write-offs without human review
