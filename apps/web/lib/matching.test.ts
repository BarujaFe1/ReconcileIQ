import { describe, expect, it, beforeEach } from "vitest";
import {
  confidenceExact,
  confidenceFuzzy,
  normalizeText,
  partialRatio,
  resetDemoState,
  runClientReconciliation,
  resolveClientException,
  severityFromImpact,
  tokenSortRatio,
} from "@/lib/matching";
import { AMOUNT_TOLERANCE, SEVERITY_RANK } from "@/lib/thresholds";

describe("normalizeText", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalizeText("João Pedro")).toBe(normalizeText("Joao Pedro"));
    expect(normalizeText("  Ana Souza ")).toBe("ana souza");
  });
});

describe("fuzzy helpers", () => {
  it("scores similar names highly", () => {
    expect(tokenSortRatio("Felipe Baruja", "Felipe A. Baruja")).toBeGreaterThan(70);
  });

  it("detects near refs with partial ratio", () => {
    expect(partialRatio("MP-77840", "MP-7784O")).toBeGreaterThan(70);
  });
});

describe("scoring", () => {
  it("penalizes amount and fee deltas on exact confidence", () => {
    expect(confidenceExact(0, 0)).toBeGreaterThan(confidenceExact(10, 5));
  });

  it("maps impact to severity bands", () => {
    expect(severityFromImpact(200)).toBe("critical");
    expect(severityFromImpact(80)).toBe("high");
    expect(severityFromImpact(25)).toBe("medium");
    expect(severityFromImpact(5)).toBe("low");
  });

  it("keeps fuzzy confidence within bounds", () => {
    const score = confidenceFuzzy(90, 80, 0);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(92);
  });
});

describe("runClientReconciliation", () => {
  beforeEach(() => {
    resetDemoState();
  });

  it("produces exact, fuzzy and exception signals on demo seed", () => {
    const result = runClientReconciliation();
    const methods = new Set(result.matches.map((m) => m.method));
    const statuses = new Set(result.matches.map((m) => m.status));
    expect(methods.has("exact_ref")).toBe(true);
    expect(methods.has("fuzzy_name_amount") || statuses.has("fuzzy_matched")).toBe(true);
    expect(statuses.has("unmatched_payment")).toBe(true);
    expect(statuses.has("unmatched_order")).toBe(true);
    expect(result.summary.exception_count).toBeGreaterThan(0);
    expect(result.summary.avg_confidence).toBeGreaterThan(0);
  });

  it("prioritizes exceptions by severity then impact", () => {
    const result = runClientReconciliation();
    const ranks = result.exceptions.map((e) => SEVERITY_RANK[e.severity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    for (let i = 1; i < result.exceptions.length; i += 1) {
      const prev = result.exceptions[i - 1];
      const curr = result.exceptions[i];
      if (prev.severity === curr.severity) {
        expect(prev.financial_impact).toBeGreaterThanOrEqual(curr.financial_impact);
      }
    }
  });

  it("does not reopen exception_opened audit events on rerun", () => {
    runClientReconciliation();
    const firstOpened = runClientReconciliation().audit_trail.filter(
      (e) => e.action === "exception_opened",
    ).length;
    const second = runClientReconciliation();
    const secondOpened = second.audit_trail.filter((e) => e.action === "exception_opened")
      .length;
    expect(secondOpened).toBe(firstOpened);
  });

  it("preserves investigating status after resolve", () => {
    const first = runClientReconciliation();
    const id = first.exceptions[0].exception_id;
    resolveClientException(id, "mark_investigating", "reviewing");
    const again = runClientReconciliation();
    const item = again.exceptions.find((e) => e.exception_id === id);
    expect(item?.status).toBe("investigating");
  });

  it("flags material fee deltas above tolerance", () => {
    const result = runClientReconciliation();
    const feeHits = result.matches.filter(
      (m) => Math.abs(m.fee_delta) >= AMOUNT_TOLERANCE,
    );
    expect(feeHits.length).toBeGreaterThan(0);
    expect(result.summary.fee_anomaly_total).toBeGreaterThan(0);
  });
});
