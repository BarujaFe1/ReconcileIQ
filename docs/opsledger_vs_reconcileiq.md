# OpsLedger vs ReconcileIQ

## Positioning

| | **OpsLedger** | **ReconcileIQ** |
|---|---|---|
| Job | Fechamento operacional | Motor de matching |
| Inputs | Pedidos + pagamentos + estoque | Pedidos + pagamentos + taxas |
| Core | Regras testáveis de reconciliação | Exact/fuzzy record linkage + confidence |
| Output | Batch, issues por regra, relatório de close | Match pairs, score, exception inbox, audit |
| Metaphor | Closing desk | Matching engine |

## Complementary, not duplicate

- OpsLedger answers: *“O que quebrou no fechamento da operação (pedido/pagamento/estoque)?”*
- ReconcileIQ answers: *“Quais registros devem ser pareados, com que confiança, e o que vira exceção?”*

ReconcileIQ intentionally does **not** reimplement OpsLedger’s stock rules, channel aliases, batch wizard or executive close report. It deepens the matching layer: fuzzy candidates, confidence penalties, fee anomalies and prioritized human resolution.
