from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from rapidfuzz import fuzz

from app.services.audit_store import (
    append_audit_event,
    clear_persisted_store,
    load_audit_events,
    load_exception_state,
    save_exception_state,
)
from app.services.demo_data import load_fees, load_orders, load_payments
from app.services.thresholds import (
    AMOUNT_TOLERANCE,
    FUZZY_AMOUNT_TOLERANCE,
    FUZZY_CANDIDATE_THRESHOLD,
    FUZZY_MATCH_CONFIDENCE,
    confidence_exact,
    confidence_fuzzy,
    normalize_text,
    severity_from_impact,
    sort_exceptions,
)

# Hot cache backed by durable JSONL/JSON on disk.
_AUDIT: list[dict[str, Any]] = []
_EXCEPTIONS: dict[str, dict[str, Any]] = {}
_LOADED = False


def _ensure_loaded() -> None:
    global _LOADED
    if _LOADED:
        return
    _AUDIT.clear()
    _AUDIT.extend(load_audit_events(limit=500))
    _EXCEPTIONS.clear()
    _EXCEPTIONS.update(load_exception_state())
    _LOADED = True


def reset_state(*, clear_disk: bool = True) -> None:
    """Test/demo helper: clear append-only stores (memory + optional disk)."""
    global _LOADED
    _AUDIT.clear()
    _EXCEPTIONS.clear()
    if clear_disk:
        clear_persisted_store()
    _LOADED = True


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _audit(
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict[str, Any],
    actor: str = "system",
) -> None:
    _ensure_loaded()
    event = {
        "event_id": f"aud_{uuid.uuid4().hex[:10]}",
        "timestamp": _now(),
        "actor": actor,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
    }
    _AUDIT.append(event)
    append_audit_event(event)


def run_reconciliation() -> dict[str, Any]:
    _ensure_loaded()
    orders = load_orders()
    payments = load_payments()
    fees = load_fees()

    fee_by_payment = {
        normalize_text(row.payment_ref): row for row in fees.itertuples(index=False)
    }
    payments_by_ref = {
        normalize_text(row.order_ref): row for row in payments.itertuples(index=False)
    }
    used_payments: set[str] = set()
    matches: list[dict[str, Any]] = []

    for order in orders.itertuples(index=False):
        order_id = str(order.order_id)
        ref = normalize_text(order.external_ref)
        payment = payments_by_ref.get(ref)
        method = "exact_ref"
        reasons: list[str] = []
        name_score = 0.0
        ref_score = 0.0

        if payment is None:
            best = None
            best_score = -1.0
            for candidate in payments.itertuples(index=False):
                if str(candidate.payment_id) in used_payments:
                    continue
                ns = float(
                    fuzz.token_sort_ratio(
                        normalize_text(order.customer_name),
                        normalize_text(candidate.payer_name),
                    )
                )
                rs = float(
                    fuzz.partial_ratio(ref, normalize_text(candidate.order_ref))
                )
                amount_gap = abs(
                    float(order.gross_amount)
                    - float(candidate.net_amount)
                    - float(candidate.fee_amount)
                )
                combined = 0.5 * ns + 0.3 * rs + max(0.0, 20.0 - amount_gap)
                if combined > best_score:
                    best_score = combined
                    best = (candidate, ns, rs)

            if best and best_score >= FUZZY_CANDIDATE_THRESHOLD:
                payment, name_score, ref_score = best
                method = "fuzzy_name_amount"
                reasons.append(f"Fuzzy name score {name_score:.0f}")
                reasons.append(f"Fuzzy ref score {ref_score:.0f}")
            else:
                impact = float(order.gross_amount)
                matches.append(
                    {
                        "order_id": order_id,
                        "payment_id": None,
                        "fee_id": None,
                        "confidence": 0.0,
                        "status": "unmatched_order",
                        "method": "none",
                        "amount_delta": impact,
                        "fee_delta": 0.0,
                        "reasons": ["No payment candidate above fuzzy threshold"],
                        "severity": severity_from_impact(impact),
                        "financial_impact": impact,
                    }
                )
                continue

        payment_id = str(payment.payment_id)
        used_payments.add(payment_id)
        fee = fee_by_payment.get(normalize_text(payment_id))
        expected_gross = float(payment.net_amount) + float(payment.fee_amount)
        amount_delta = round(float(order.gross_amount) - expected_gross, 2)
        expected_fee = (
            round(float(payment.net_amount) * float(fee.expected_rate), 2)
            if fee is not None
            else float(payment.fee_amount)
        )
        charged_fee = (
            float(fee.charged_amount) if fee is not None else float(payment.fee_amount)
        )
        fee_delta = round(charged_fee - expected_fee, 2)

        if method == "exact_ref":
            confidence = confidence_exact(amount_delta, fee_delta)
            status = (
                "matched"
                if abs(amount_delta) < AMOUNT_TOLERANCE and abs(fee_delta) < AMOUNT_TOLERANCE
                else "exception"
            )
            reasons.append("Exact external_ref ↔ order_ref")
        else:
            confidence = confidence_fuzzy(name_score, ref_score, amount_delta)
            status = (
                "fuzzy_matched"
                if abs(amount_delta) < FUZZY_AMOUNT_TOLERANCE
                and confidence >= FUZZY_MATCH_CONFIDENCE
                else "exception"
            )

        if abs(amount_delta) >= AMOUNT_TOLERANCE:
            reasons.append(f"Amount delta R$ {amount_delta:.2f}")
        if abs(fee_delta) >= AMOUNT_TOLERANCE:
            reasons.append(f"Fee anomaly R$ {fee_delta:.2f}")
        if not any(r.startswith(("Amount", "Fee", "No ")) for r in reasons):
            reasons.append("Amounts and fees within tolerance")

        impact = round(abs(amount_delta) + abs(fee_delta), 2)
        if status in {"matched", "fuzzy_matched"} and impact >= AMOUNT_TOLERANCE:
            status = "exception"

        matches.append(
            {
                "order_id": order_id,
                "payment_id": payment_id,
                "fee_id": str(fee.fee_id) if fee is not None else None,
                "confidence": confidence,
                "status": status,
                "method": method,
                "amount_delta": amount_delta,
                "fee_delta": fee_delta,
                "reasons": reasons,
                "severity": severity_from_impact(impact if status == "exception" else 0),
                "financial_impact": impact if status == "exception" else 0.0,
            }
        )

    for payment in payments.itertuples(index=False):
        if str(payment.payment_id) in used_payments:
            continue
        impact = float(payment.net_amount)
        matches.append(
            {
                "order_id": "—",
                "payment_id": str(payment.payment_id),
                "fee_id": None,
                "confidence": 0.0,
                "status": "unmatched_payment",
                "method": "none",
                "amount_delta": -impact,
                "fee_delta": 0.0,
                "reasons": ["Payment without matching order"],
                "severity": severity_from_impact(impact),
                "financial_impact": impact,
            }
        )

    title_map = {
        "exception": "Divergência financeira no par pedido/pagamento",
        "unmatched_order": "Pedido sem pagamento correspondente",
        "unmatched_payment": "Pagamento sem pedido correspondente",
    }

    exceptions: list[dict[str, Any]] = []
    for match in matches:
        if match["status"] in {"matched", "fuzzy_matched"}:
            continue
        exception_id = f"exc_{match['order_id']}_{match['payment_id'] or 'none'}"
        prior = _EXCEPTIONS.get(exception_id, {})
        item = {
            "exception_id": exception_id,
            "match": match,
            "title": title_map.get(match["status"], "Exceção de reconciliação"),
            "description": "; ".join(match["reasons"]),
            "severity": match["severity"],
            "financial_impact": match["financial_impact"],
            "status": prior.get("status", "open"),
            "suggested_action": (
                "Confirm fuzzy match after human review"
                if match["method"].startswith("fuzzy")
                else "Investigate source files and resolve manually"
            ),
        }
        exceptions.append(item)
        if exception_id not in _EXCEPTIONS:
            _EXCEPTIONS[exception_id] = item
            _audit(
                "exception_opened",
                "exception",
                exception_id,
                {"severity": item["severity"], "impact": item["financial_impact"]},
            )
        else:
            # Preserve resolution status while refreshing match payload.
            _EXCEPTIONS[exception_id] = {**item, "status": prior.get("status", "open")}

    save_exception_state(_EXCEPTIONS)
    exceptions = sort_exceptions(exceptions)

    matched_count = sum(1 for m in matches if m["status"] == "matched")
    fuzzy_count = sum(1 for m in matches if m["status"] == "fuzzy_matched")
    exception_count = len(exceptions)
    unmatched_orders = sum(1 for m in matches if m["status"] == "unmatched_order")
    unmatched_payments = sum(1 for m in matches if m["status"] == "unmatched_payment")
    leakage = round(sum(e["financial_impact"] for e in exceptions), 2)
    fee_anomaly = round(
        sum(abs(m["fee_delta"]) for m in matches if abs(m["fee_delta"]) >= AMOUNT_TOLERANCE),
        2,
    )
    confidences = [m["confidence"] for m in matches if m["confidence"] > 0]
    avg_confidence = (
        round(sum(confidences) / len(confidences), 1) if confidences else 0.0
    )

    _audit(
        "reconciliation_run",
        "batch",
        "demo",
        {
            "orders": int(len(orders)),
            "payments": int(len(payments)),
            "exceptions": exception_count,
            "leakage": leakage,
        },
    )

    return {
        "summary": {
            "orders_total": int(len(orders)),
            "payments_total": int(len(payments)),
            "fees_total": int(len(fees)),
            "matched_count": matched_count,
            "fuzzy_count": fuzzy_count,
            "exception_count": exception_count,
            "unmatched_orders": unmatched_orders,
            "unmatched_payments": unmatched_payments,
            "leakage_total": leakage,
            "fee_anomaly_total": fee_anomaly,
            "avg_confidence": avg_confidence,
            "currency": "BRL",
        },
        "matches": matches,
        "exceptions": exceptions,
        "audit_trail": list(reversed(_AUDIT[-50:])),
        "financial_board": {
            "matched_volume": round(
                float(
                    orders.loc[
                        orders["order_id"].isin(
                            [
                                m["order_id"]
                                for m in matches
                                if m["status"] in {"matched", "fuzzy_matched"}
                            ]
                        ),
                        "gross_amount",
                    ].sum()
                ),
                2,
            ),
            "leakage_total": leakage,
            "fee_anomaly_total": fee_anomaly,
            "open_exceptions": float(
                sum(1 for e in exceptions if e["status"] == "open")
            ),
        },
    }


def resolve_exception(
    exception_id: str, action: str, note: str, actor: str
) -> dict[str, Any]:
    _ensure_loaded()
    if exception_id not in _EXCEPTIONS:
        run_reconciliation()
    if exception_id not in _EXCEPTIONS:
        raise KeyError(f"Exception not found: {exception_id}")

    status = (
        "resolved"
        if action in {"confirm_match", "reject_match", "write_off"}
        else "investigating"
    )
    _EXCEPTIONS[exception_id]["status"] = status
    save_exception_state(_EXCEPTIONS)
    _audit(
        action,
        "exception",
        exception_id,
        {"note": note, "new_status": status},
        actor=actor,
    )
    return {
        "exception_id": exception_id,
        "status": status,
        "action": action,
        "note": note,
        "actor": actor,
        "timestamp": _now(),
    }


def get_audit_trail() -> list[dict[str, Any]]:
    _ensure_loaded()
    if not _AUDIT:
        run_reconciliation()
    return list(reversed(_AUDIT[-100:]))


def export_match_fingerprint() -> list[dict[str, Any]]:
    """Stable fields for golden-corpus / parity tests (not fuzzy score equality)."""
    result = run_reconciliation()
    rows = [
        {
            "order_id": match["order_id"],
            "payment_id": match["payment_id"],
            "status": match["status"],
            "method": match["method"],
            "has_fee_anomaly": abs(float(match["fee_delta"])) >= AMOUNT_TOLERANCE,
            "severity": match["severity"],
        }
        for match in result["matches"]
    ]
    rows.sort(
        key=lambda r: (
            0 if str(r["order_id"]).startswith("ORD") else 1,
            str(r["order_id"]),
            str(r["payment_id"] or ""),
        )
    )
    return rows
