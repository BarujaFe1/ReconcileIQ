import {
  DEMO_FEES,
  DEMO_NOTICE,
  DEMO_ORDERS,
  DEMO_PAYMENTS,
  type FeeRow,
  type OrderRow,
  type PaymentRow,
} from "@/lib/demo-data";
import {
  AMOUNT_TOLERANCE,
  FUZZY_AMOUNT_TOLERANCE,
  FUZZY_CANDIDATE_THRESHOLD,
  FUZZY_MATCH_CONFIDENCE,
  SEVERITY_RANK,
} from "@/lib/thresholds";
import type {
  AuditEvent,
  DemoSummary,
  ExceptionItem,
  ExceptionSeverity,
  MatchCandidate,
  ReconciliationResponse,
} from "@/types";

let auditTrail: AuditEvent[] = [];
const exceptionState = new Map<string, ExceptionItem["status"]>();
const openedExceptions = new Set<string>();

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function tokens(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .sort();
}

/** Lightweight token_sort_ratio approximation for browser demo (RapidFuzz on API). */
export function tokenSortRatio(a: string, b: string): number {
  const ta = tokens(a).join(" ");
  const tb = tokens(b).join(" ");
  if (!ta && !tb) return 100;
  if (!ta || !tb) return 0;
  const longer = ta.length >= tb.length ? ta : tb;
  const shorter = ta.length >= tb.length ? tb : ta;
  if (longer.includes(shorter)) {
    return Math.round((shorter.length / longer.length) * 100);
  }
  let matches = 0;
  const used = new Array(longer.length).fill(false);
  for (const ch of shorter) {
    const idx = longer.split("").findIndex((c, i) => c === ch && !used[i]);
    if (idx >= 0) {
      used[idx] = true;
      matches += 1;
    }
  }
  return Math.round(((2 * matches) / (ta.length + tb.length)) * 100);
}

export function partialRatio(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na.includes(nb) || nb.includes(na)) return 100;
  const short = na.length <= nb.length ? na : nb;
  const long = na.length <= nb.length ? nb : na;
  let best = 0;
  for (let i = 0; i <= long.length - short.length; i += 1) {
    const window = long.slice(i, i + short.length);
    let hits = 0;
    for (let j = 0; j < short.length; j += 1) {
      if (short[j] === window[j]) hits += 1;
    }
    best = Math.max(best, Math.round((hits / short.length) * 100));
  }
  return best;
}

export function severityFromImpact(impact: number): ExceptionSeverity {
  const abs = Math.abs(impact);
  if (abs >= 150) return "critical";
  if (abs >= 60) return "high";
  if (abs >= 20) return "medium";
  return "low";
}

export function confidenceExact(amountDelta: number, feeDelta: number): number {
  let score = 98;
  score -= Math.min(25, Math.abs(amountDelta) * 0.4);
  score -= Math.min(15, Math.abs(feeDelta) * 0.5);
  return Math.round(Math.max(70, score) * 10) / 10;
}

export function confidenceFuzzy(
  nameScore: number,
  refScore: number,
  amountDelta: number,
): number {
  let base = 0.55 * nameScore + 0.35 * refScore;
  base -= Math.min(30, Math.abs(amountDelta) * 0.5);
  return Math.round(Math.max(40, Math.min(92, base)) * 10) / 10;
}

function pushAudit(
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown>,
  actor = "system",
) {
  auditTrail = [
    {
      event_id: `aud_${Math.random().toString(16).slice(2, 12)}`,
      timestamp: nowIso(),
      actor,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    },
    ...auditTrail,
  ].slice(0, 100);
}

export function resetDemoState(): void {
  auditTrail = [];
  exceptionState.clear();
  openedExceptions.clear();
}

export function getDemoSummary(): DemoSummary {
  const result = runClientReconciliation();
  return {
    orders: DEMO_ORDERS.length,
    payments: DEMO_PAYMENTS.length,
    fees: DEMO_FEES.length,
    matched: result.summary.matched_count + result.summary.fuzzy_count,
    exceptions: result.summary.exception_count,
    leakage_total: result.summary.leakage_total,
    currency: "BRL",
    notice: DEMO_NOTICE,
  };
}

export function runClientReconciliation(): ReconciliationResponse {
  const feeByPayment = new Map(
    DEMO_FEES.map((f) => [normalizeText(f.payment_ref), f]),
  );
  const paymentsByRef = new Map(
    DEMO_PAYMENTS.map((p) => [normalizeText(p.order_ref), p]),
  );
  const usedPayments = new Set<string>();
  const matches: MatchCandidate[] = [];

  for (const order of DEMO_ORDERS) {
    const ref = normalizeText(order.external_ref);
    let payment: PaymentRow | undefined = paymentsByRef.get(ref);
    let method = "exact_ref";
    const reasons: string[] = [];
    let nameScore = 0;
    let refScore = 0;

    if (!payment) {
      let bestScore = -1;
      let best: { payment: PaymentRow; nameScore: number; refScore: number } | null =
        null;
      for (const candidate of DEMO_PAYMENTS) {
        if (usedPayments.has(candidate.payment_id)) continue;
        const ns = tokenSortRatio(order.customer_name, candidate.payer_name);
        const rs = partialRatio(order.external_ref, candidate.order_ref);
        const amountGap = Math.abs(
          order.gross_amount - candidate.net_amount - candidate.fee_amount,
        );
        const combined = 0.5 * ns + 0.3 * rs + Math.max(0, 20 - amountGap);
        if (combined > bestScore) {
          bestScore = combined;
          best = { payment: candidate, nameScore: ns, refScore: rs };
        }
      }
      if (best && bestScore >= FUZZY_CANDIDATE_THRESHOLD) {
        payment = best.payment;
        nameScore = best.nameScore;
        refScore = best.refScore;
        method = "fuzzy_name_amount";
        reasons.push(`Fuzzy name score ${nameScore}`);
        reasons.push(`Fuzzy ref score ${refScore}`);
      } else {
        const impact = order.gross_amount;
        matches.push({
          order_id: order.order_id,
          payment_id: null,
          fee_id: null,
          confidence: 0,
          status: "unmatched_order",
          method: "none",
          amount_delta: impact,
          fee_delta: 0,
          reasons: ["No payment candidate above fuzzy threshold"],
          severity: severityFromImpact(impact),
          financial_impact: impact,
        });
        continue;
      }
    }

    usedPayments.add(payment.payment_id);
    const fee: FeeRow | undefined = feeByPayment.get(
      normalizeText(payment.payment_id),
    );
    const expectedGross = payment.net_amount + payment.fee_amount;
    const amountDelta =
      Math.round((order.gross_amount - expectedGross) * 100) / 100;
    const expectedFee = fee
      ? Math.round(payment.net_amount * fee.expected_rate * 100) / 100
      : payment.fee_amount;
    const chargedFee = fee ? fee.charged_amount : payment.fee_amount;
    const feeDelta = Math.round((chargedFee - expectedFee) * 100) / 100;

    let confidence: number;
    let status: MatchCandidate["status"];
    if (method === "exact_ref") {
      confidence = confidenceExact(amountDelta, feeDelta);
      status =
        Math.abs(amountDelta) < AMOUNT_TOLERANCE &&
        Math.abs(feeDelta) < AMOUNT_TOLERANCE
          ? "matched"
          : "exception";
      reasons.push("Exact external_ref ↔ order_ref");
    } else {
      confidence = confidenceFuzzy(nameScore, refScore, amountDelta);
      status =
        Math.abs(amountDelta) < FUZZY_AMOUNT_TOLERANCE &&
        confidence >= FUZZY_MATCH_CONFIDENCE
          ? "fuzzy_matched"
          : "exception";
    }

    if (Math.abs(amountDelta) >= AMOUNT_TOLERANCE) {
      reasons.push(`Amount delta R$ ${amountDelta.toFixed(2)}`);
    }
    if (Math.abs(feeDelta) >= AMOUNT_TOLERANCE) {
      reasons.push(`Fee anomaly R$ ${feeDelta.toFixed(2)}`);
    }
    if (!reasons.some((r) => r.startsWith("Amount") || r.startsWith("Fee") || r.startsWith("No "))) {
      reasons.push("Amounts and fees within tolerance");
    }

    const impact =
      Math.round((Math.abs(amountDelta) + Math.abs(feeDelta)) * 100) / 100;
    if (
      (status === "matched" || status === "fuzzy_matched") &&
      impact >= AMOUNT_TOLERANCE
    ) {
      status = "exception";
    }

    matches.push({
      order_id: order.order_id,
      payment_id: payment.payment_id,
      fee_id: fee?.fee_id ?? null,
      confidence,
      status,
      method,
      amount_delta: amountDelta,
      fee_delta: feeDelta,
      reasons,
      severity: status === "exception" ? severityFromImpact(impact) : "low",
      financial_impact: status === "exception" ? impact : 0,
    });
  }

  for (const payment of DEMO_PAYMENTS) {
    if (usedPayments.has(payment.payment_id)) continue;
    const impact = payment.net_amount;
    matches.push({
      order_id: "—",
      payment_id: payment.payment_id,
      fee_id: null,
      confidence: 0,
      status: "unmatched_payment",
      method: "none",
      amount_delta: -impact,
      fee_delta: 0,
      reasons: ["Payment without matching order"],
      severity: severityFromImpact(impact),
      financial_impact: impact,
    });
  }

  const titleMap: Record<string, string> = {
    exception: "Divergência financeira no par pedido/pagamento",
    unmatched_order: "Pedido sem pagamento correspondente",
    unmatched_payment: "Pagamento sem pedido correspondente",
  };

  const exceptions: ExceptionItem[] = matches
    .filter((m) => m.status !== "matched" && m.status !== "fuzzy_matched")
    .map((match) => {
      const exceptionId = `exc_${match.order_id}_${match.payment_id ?? "none"}`;
      const item: ExceptionItem = {
        exception_id: exceptionId,
        match,
        title: titleMap[match.status] ?? "Exceção de reconciliação",
        description: match.reasons.join("; "),
        severity: match.severity,
        financial_impact: match.financial_impact,
        status: exceptionState.get(exceptionId) ?? "open",
        suggested_action: match.method.startsWith("fuzzy")
          ? "Confirm fuzzy match after human review"
          : "Investigate source files and resolve manually",
      };
      if (!openedExceptions.has(exceptionId)) {
        openedExceptions.add(exceptionId);
        if (!exceptionState.has(exceptionId)) {
          exceptionState.set(exceptionId, "open");
        }
        pushAudit("exception_opened", "exception", exceptionId, {
          severity: item.severity,
          impact: item.financial_impact,
        });
      }
      return item;
    })
    .sort((a, b) => {
      const bySev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (bySev !== 0) return bySev;
      return b.financial_impact - a.financial_impact;
    });

  const matchedCount = matches.filter((m) => m.status === "matched").length;
  const fuzzyCount = matches.filter((m) => m.status === "fuzzy_matched").length;
  const leakage =
    Math.round(exceptions.reduce((s, e) => s + e.financial_impact, 0) * 100) /
    100;
  const feeAnomaly =
    Math.round(
      matches
        .filter((m) => Math.abs(m.fee_delta) >= AMOUNT_TOLERANCE)
        .reduce((s, m) => s + Math.abs(m.fee_delta), 0) * 100,
    ) / 100;
  const confidences = matches
    .filter((m) => m.confidence > 0)
    .map((m) => m.confidence);
  const avgConfidence =
    confidences.length > 0
      ? Math.round(
          (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 10,
        ) / 10
      : 0;

  pushAudit("reconciliation_run", "batch", "demo", {
    orders: DEMO_ORDERS.length,
    payments: DEMO_PAYMENTS.length,
    exceptions: exceptions.length,
    leakage,
  });

  const matchedVolume =
    Math.round(
      DEMO_ORDERS.filter((o) =>
        matches.some(
          (m) =>
            m.order_id === o.order_id &&
            (m.status === "matched" || m.status === "fuzzy_matched"),
        ),
      ).reduce((s, o) => s + o.gross_amount, 0) * 100,
    ) / 100;

  return {
    summary: {
      orders_total: DEMO_ORDERS.length,
      payments_total: DEMO_PAYMENTS.length,
      fees_total: DEMO_FEES.length,
      matched_count: matchedCount,
      fuzzy_count: fuzzyCount,
      exception_count: exceptions.length,
      unmatched_orders: matches.filter((m) => m.status === "unmatched_order")
        .length,
      unmatched_payments: matches.filter((m) => m.status === "unmatched_payment")
        .length,
      leakage_total: leakage,
      fee_anomaly_total: feeAnomaly,
      avg_confidence: avgConfidence,
      currency: "BRL",
    },
    matches,
    exceptions,
    audit_trail: auditTrail.slice(0, 50),
    financial_board: {
      matched_volume: matchedVolume,
      leakage_total: leakage,
      fee_anomaly_total: feeAnomaly,
      open_exceptions: exceptions.filter((e) => e.status === "open").length,
    },
  };
}

export function resolveClientException(
  exceptionId: string,
  action: string,
  note = "",
  actor = "analyst@reconcileiq.local",
): {
  exception_id: string;
  status: ExceptionItem["status"];
  action: string;
  note: string;
  actor: string;
  timestamp: string;
} {
  const status: ExceptionItem["status"] =
    action === "confirm_match" ||
    action === "reject_match" ||
    action === "write_off"
      ? "resolved"
      : "investigating";
  exceptionState.set(exceptionId, status);
  pushAudit(action, "exception", exceptionId, { note, new_status: status }, actor);
  return {
    exception_id: exceptionId,
    status,
    action,
    note,
    actor,
    timestamp: nowIso(),
  };
}

export function getOrder(orderId: string): OrderRow | undefined {
  return DEMO_ORDERS.find((o) => o.order_id === orderId);
}

export function getPayment(paymentId: string | null): PaymentRow | undefined {
  if (!paymentId) return undefined;
  return DEMO_PAYMENTS.find((p) => p.payment_id === paymentId);
}
