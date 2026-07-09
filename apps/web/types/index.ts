export type MatchStatus =
  | "matched"
  | "fuzzy_matched"
  | "exception"
  | "unmatched_order"
  | "unmatched_payment";

export type ExceptionSeverity = "low" | "medium" | "high" | "critical";

export interface DemoSummary {
  orders: number;
  payments: number;
  fees: number;
  matched: number;
  exceptions: number;
  leakage_total: number;
  currency: string;
  notice: string;
}

export interface MatchCandidate {
  order_id: string;
  payment_id: string | null;
  fee_id: string | null;
  confidence: number;
  status: MatchStatus;
  method: string;
  amount_delta: number;
  fee_delta: number;
  reasons: string[];
  severity: ExceptionSeverity;
  financial_impact: number;
}

export interface ExceptionItem {
  exception_id: string;
  match: MatchCandidate;
  title: string;
  description: string;
  severity: ExceptionSeverity;
  financial_impact: number;
  status: "open" | "investigating" | "resolved";
  suggested_action: string;
}

export interface AuditEvent {
  event_id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
}

export interface ReconciliationSummary {
  orders_total: number;
  payments_total: number;
  fees_total: number;
  matched_count: number;
  fuzzy_count: number;
  exception_count: number;
  unmatched_orders: number;
  unmatched_payments: number;
  leakage_total: number;
  fee_anomaly_total: number;
  avg_confidence: number;
  currency: string;
}

export interface ReconciliationResponse {
  summary: ReconciliationSummary;
  matches: MatchCandidate[];
  exceptions: ExceptionItem[];
  audit_trail: AuditEvent[];
  financial_board: Record<string, number>;
}
