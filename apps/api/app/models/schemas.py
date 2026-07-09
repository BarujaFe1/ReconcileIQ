from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


MatchStatus = Literal[
    "matched",
    "fuzzy_matched",
    "exception",
    "unmatched_order",
    "unmatched_payment",
]

ExceptionSeverity = Literal["low", "medium", "high", "critical"]
ResolutionAction = Literal[
    "confirm_match",
    "reject_match",
    "write_off",
    "escalate",
    "mark_investigating",
]


class OrderRecord(BaseModel):
    order_id: str
    external_ref: str
    customer_name: str
    channel: str
    order_date: str
    gross_amount: float
    currency: str = "BRL"
    status: str


class PaymentRecord(BaseModel):
    payment_id: str
    order_ref: str
    payer_name: str
    provider: str
    paid_at: str
    net_amount: float
    fee_amount: float
    currency: str = "BRL"
    status: str


class FeeRecord(BaseModel):
    fee_id: str
    payment_ref: str
    fee_type: str
    expected_rate: float
    charged_amount: float
    currency: str = "BRL"


class MatchCandidate(BaseModel):
    order_id: str
    payment_id: str | None = None
    fee_id: str | None = None
    confidence: float = Field(ge=0, le=100)
    status: MatchStatus
    method: str
    amount_delta: float
    fee_delta: float
    reasons: list[str]
    severity: ExceptionSeverity
    financial_impact: float


class ExceptionItem(BaseModel):
    exception_id: str
    match: MatchCandidate
    title: str
    description: str
    severity: ExceptionSeverity
    financial_impact: float
    status: Literal["open", "investigating", "resolved"] = "open"
    suggested_action: str


class AuditEvent(BaseModel):
    event_id: str
    timestamp: str
    actor: str
    action: str
    entity_type: str
    entity_id: str
    details: dict[str, Any]


class ResolveRequest(BaseModel):
    exception_id: str
    action: ResolutionAction
    note: str = ""
    actor: str = "analyst@reconcileiq.local"


class DemoSummary(BaseModel):
    orders: int
    payments: int
    fees: int
    matched: int
    exceptions: int
    leakage_total: float
    currency: str = "BRL"
    notice: str


class ReconciliationSummary(BaseModel):
    orders_total: int
    payments_total: int
    fees_total: int
    matched_count: int
    fuzzy_count: int
    exception_count: int
    unmatched_orders: int
    unmatched_payments: int
    leakage_total: float
    fee_anomaly_total: float
    avg_confidence: float
    currency: str = "BRL"


class ReconciliationResponse(BaseModel):
    summary: ReconciliationSummary
    matches: list[MatchCandidate]
    exceptions: list[ExceptionItem]
    audit_trail: list[AuditEvent]
    financial_board: dict[str, float]
