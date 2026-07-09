/** Synthetic marketplace settlement demo (mirrors data/seed/*.csv). */

export type OrderRow = {
  order_id: string;
  external_ref: string;
  customer_name: string;
  channel: string;
  order_date: string;
  gross_amount: number;
  currency: string;
  status: string;
};

export type PaymentRow = {
  payment_id: string;
  order_ref: string;
  payer_name: string;
  provider: string;
  paid_at: string;
  net_amount: number;
  fee_amount: number;
  currency: string;
  status: string;
};

export type FeeRow = {
  fee_id: string;
  payment_ref: string;
  fee_type: string;
  expected_rate: number;
  charged_amount: number;
  currency: string;
};

export const DEMO_ORDERS: OrderRow[] = [
  { order_id: "ORD-1001", external_ref: "MP-77821", customer_name: "Ana Souza", channel: "marketplace", order_date: "2026-06-01", gross_amount: 250.0, currency: "BRL", status: "paid" },
  { order_id: "ORD-1002", external_ref: "MP-77822", customer_name: "Bruno Lima", channel: "marketplace", order_date: "2026-06-01", gross_amount: 180.5, currency: "BRL", status: "paid" },
  { order_id: "ORD-1003", external_ref: "ST-99011", customer_name: "Carla Mendes", channel: "ecommerce", order_date: "2026-06-02", gross_amount: 420.0, currency: "BRL", status: "paid" },
  { order_id: "ORD-1004", external_ref: "ST-99012", customer_name: "Diego Alves", channel: "ecommerce", order_date: "2026-06-02", gross_amount: 95.0, currency: "BRL", status: "paid" },
  { order_id: "ORD-1005", external_ref: "DL-44100", customer_name: "Elena Rocha", channel: "delivery", order_date: "2026-06-03", gross_amount: 67.9, currency: "BRL", status: "paid" },
  { order_id: "ORD-1006", external_ref: "DL-44101", customer_name: "Felipe Baruja", channel: "delivery", order_date: "2026-06-03", gross_amount: 112.4, currency: "BRL", status: "paid" },
  { order_id: "ORD-1007", external_ref: "MP-77830", customer_name: "Gabriela Nunes", channel: "marketplace", order_date: "2026-06-04", gross_amount: 310.0, currency: "BRL", status: "paid" },
  { order_id: "ORD-1008", external_ref: "ST-99020", customer_name: "Hugo Martins", channel: "ecommerce", order_date: "2026-06-04", gross_amount: 540.0, currency: "BRL", status: "paid" },
  { order_id: "ORD-1009", external_ref: "MP-77840", customer_name: "Isabela Freitas", channel: "marketplace", order_date: "2026-06-05", gross_amount: 75.0, currency: "BRL", status: "paid" },
  { order_id: "ORD-1010", external_ref: "DL-44110", customer_name: "Joao Pedro Silva", channel: "delivery", order_date: "2026-06-05", gross_amount: 148.2, currency: "BRL", status: "paid" },
  { order_id: "ORD-1011", external_ref: "MP-77850", customer_name: "Karina Lopes", channel: "marketplace", order_date: "2026-06-06", gross_amount: 199.9, currency: "BRL", status: "paid" },
  { order_id: "ORD-1012", external_ref: "ST-99030", customer_name: "Lucas Ferreira", channel: "ecommerce", order_date: "2026-06-06", gross_amount: 88.0, currency: "BRL", status: "open" },
];

export const DEMO_PAYMENTS: PaymentRow[] = [
  { payment_id: "PAY-9001", order_ref: "MP-77821", payer_name: "Ana Souza", provider: "mercadopago", paid_at: "2026-06-01T14:10:00Z", net_amount: 237.5, fee_amount: 12.5, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9002", order_ref: "MP-77822", payer_name: "Bruno Lima", provider: "mercadopago", paid_at: "2026-06-01T15:02:00Z", net_amount: 171.48, fee_amount: 9.02, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9003", order_ref: "ST-99011", payer_name: "Carla Mendes", provider: "stripe", paid_at: "2026-06-02T11:20:00Z", net_amount: 399.0, fee_amount: 21.0, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9004", order_ref: "ST-99012", payer_name: "Diego Alves", provider: "stripe", paid_at: "2026-06-02T16:45:00Z", net_amount: 90.25, fee_amount: 4.75, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9005", order_ref: "DL-44100", payer_name: "Elena Rocha", provider: "delivery_wallet", paid_at: "2026-06-03T19:01:00Z", net_amount: 64.5, fee_amount: 3.4, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9006", order_ref: "DL-44101", payer_name: "Felipe A. Baruja", provider: "delivery_wallet", paid_at: "2026-06-03T20:12:00Z", net_amount: 106.78, fee_amount: 5.62, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9007", order_ref: "MP-77830", payer_name: "Gabriela Nunes", provider: "mercadopago", paid_at: "2026-06-04T09:30:00Z", net_amount: 279.0, fee_amount: 15.5, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9008", order_ref: "ST-99020", payer_name: "Hugo Martins", provider: "stripe", paid_at: "2026-06-04T13:18:00Z", net_amount: 502.2, fee_amount: 27.0, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9009", order_ref: "MP-7784O", payer_name: "Isabela Freitas", provider: "mercadopago", paid_at: "2026-06-05T10:05:00Z", net_amount: 71.25, fee_amount: 3.75, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9010", order_ref: "DL-44110", payer_name: "João Pedro Silva", provider: "delivery_wallet", paid_at: "2026-06-05T21:40:00Z", net_amount: 140.79, fee_amount: 7.41, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9011", order_ref: "MP-77850", payer_name: "Karina Lopes", provider: "mercadopago", paid_at: "2026-06-06T08:55:00Z", net_amount: 170.0, fee_amount: 9.99, currency: "BRL", status: "settled" },
  { payment_id: "PAY-9012", order_ref: "ORPHAN-01", payer_name: "Marina Costa", provider: "stripe", paid_at: "2026-06-06T17:22:00Z", net_amount: 130.0, fee_amount: 6.5, currency: "BRL", status: "settled" },
];

export const DEMO_FEES: FeeRow[] = [
  { fee_id: "FEE-1", payment_ref: "PAY-9001", fee_type: "marketplace_commission", expected_rate: 0.05, charged_amount: 12.5, currency: "BRL" },
  { fee_id: "FEE-2", payment_ref: "PAY-9002", fee_type: "marketplace_commission", expected_rate: 0.05, charged_amount: 9.02, currency: "BRL" },
  { fee_id: "FEE-3", payment_ref: "PAY-9003", fee_type: "card_processing", expected_rate: 0.05, charged_amount: 21.0, currency: "BRL" },
  { fee_id: "FEE-4", payment_ref: "PAY-9004", fee_type: "card_processing", expected_rate: 0.05, charged_amount: 4.75, currency: "BRL" },
  { fee_id: "FEE-5", payment_ref: "PAY-9005", fee_type: "delivery_fee", expected_rate: 0.05, charged_amount: 3.4, currency: "BRL" },
  { fee_id: "FEE-6", payment_ref: "PAY-9006", fee_type: "delivery_fee", expected_rate: 0.05, charged_amount: 5.62, currency: "BRL" },
  { fee_id: "FEE-7", payment_ref: "PAY-9007", fee_type: "marketplace_commission", expected_rate: 0.05, charged_amount: 31.0, currency: "BRL" },
  { fee_id: "FEE-8", payment_ref: "PAY-9008", fee_type: "card_processing", expected_rate: 0.05, charged_amount: 37.8, currency: "BRL" },
  { fee_id: "FEE-9", payment_ref: "PAY-9009", fee_type: "marketplace_commission", expected_rate: 0.05, charged_amount: 3.75, currency: "BRL" },
  { fee_id: "FEE-10", payment_ref: "PAY-9010", fee_type: "delivery_fee", expected_rate: 0.05, charged_amount: 7.41, currency: "BRL" },
  { fee_id: "FEE-11", payment_ref: "PAY-9011", fee_type: "marketplace_commission", expected_rate: 0.05, charged_amount: 9.99, currency: "BRL" },
];

export const DEMO_NOTICE =
  "Synthetic marketplace demo: exact refs, fuzzy name/ref pairs, fee anomalies, unmatched order and orphan payment — complementary to OpsLedger's operational close.";
