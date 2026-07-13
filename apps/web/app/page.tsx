"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ExceptionInbox } from "@/components/ExceptionInbox";
import { MatchWorkbench } from "@/components/MatchWorkbench";
import { DEMO_FEES, DEMO_ORDERS, DEMO_PAYMENTS } from "@/lib/demo-data";
import { demoFromResult, resolveException, runReconcile } from "@/lib/api";
import type {
  DemoSummary,
  MatchCandidate,
  ReconciliationResponse,
} from "@/types";

function toCsv(
  headers: string[],
  rows: Record<string, string | number>[],
): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}

function SkeletonBoard() {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="kpi skeleton-kpi">
          <span>Loading</span>
          <strong>—</strong>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [demo, setDemo] = useState<DemoSummary | null>(null);
  const [result, setResult] = useState<ReconciliationResponse | null>(null);
  const [selected, setSelected] = useState<MatchCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<
    "all" | "exact" | "fuzzy" | "exception"
  >("all");

  function loadAll() {
    startTransition(async () => {
      try {
        setError(null);
        // Single reconcile pass; derive demo KPIs from the same result.
        const r = await runReconcile();
        setDemo(demoFromResult(r));
        setResult(r);
        const firstFuzzy = r.matches.find((m) => m.status === "fuzzy_matched");
        const firstException = r.matches.find(
          (m) => m.status === "exception" || m.status.startsWith("unmatched"),
        );
        setSelected(firstFuzzy ?? firstException ?? r.matches[0] ?? null);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load ReconcileIQ demo",
        );
      }
    });
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onResolve(exceptionId: string, action: string) {
    startTransition(async () => {
      try {
        setError(null);
        await resolveException({
          exception_id: exceptionId,
          action,
          note: `Resolved via workbench action: ${action}`,
        });
        const r = await runReconcile();
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Resolve failed");
      }
    });
  }

  const summary = result?.summary;

  const filteredMatches = useMemo(() => {
    if (!result) return [];
    if (filter === "all") return result.matches;
    if (filter === "exact")
      return result.matches.filter((m) => m.method === "exact_ref");
    if (filter === "fuzzy")
      return result.matches.filter((m) => m.method.startsWith("fuzzy"));
    return result.matches.filter(
      (m) => m.status !== "matched" && m.status !== "fuzzy_matched",
    );
  }, [result, filter]);

  function downloadSeeds() {
    const files: [string, string][] = [
      [
        "orders_demo.csv",
        toCsv(
          [
            "order_id",
            "external_ref",
            "customer_name",
            "channel",
            "order_date",
            "gross_amount",
            "currency",
            "status",
          ],
          DEMO_ORDERS as unknown as Record<string, string | number>[],
        ),
      ],
      [
        "payments_demo.csv",
        toCsv(
          [
            "payment_id",
            "order_ref",
            "payer_name",
            "provider",
            "paid_at",
            "net_amount",
            "fee_amount",
            "currency",
            "status",
          ],
          DEMO_PAYMENTS as unknown as Record<string, string | number>[],
        ),
      ],
      [
        "fees_demo.csv",
        toCsv(
          [
            "fee_id",
            "payment_ref",
            "fee_type",
            "expected_rate",
            "charged_amount",
            "currency",
          ],
          DEMO_FEES as unknown as Record<string, string | number>[],
        ),
      ],
    ];
    for (const [name, content] of files) {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <main>
      <a className="skip-link" href="#workbench">
        Skip to matching workbench
      </a>

      <section className="hero">
        <p className="muted">
          Matching engine · confidence · prioritized exceptions
        </p>
        <h1 className="brand">ReconcileIQ</h1>
        <p className="lede">
          Motor de matching exact/fuzzy para pedidos, pagamentos e taxas — com
          score de confiança, fila de exceções priorizada e auditoria.
          Complementa o OpsLedger (fechamento operacional), sem duplicá-lo.
        </p>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Demo mode: browser matching engine (no API required). Local full mode
          uses FastAPI + RapidFuzz when <code>NEXT_PUBLIC_API_URL</code> is set.
        </p>
      </section>

      {error ? (
        <div className="notice" role="alert">
          {error}
        </div>
      ) : null}

      <section className="panel">
        <h2>Demo synthetic CSVs</h2>
        <p className="muted">
          12 pedidos · 12 pagamentos · 11 taxas. Inclui matches exatos, pares
          fuzzy (nome/ref), anomalias de taxa, pedido sem settlement e pagamento
          órfão.
        </p>
        <div className="controls">
          <button type="button" disabled={pending} onClick={loadAll}>
            {pending ? "Reconciling…" : "Run reconciliation"}
          </button>
          <button type="button" onClick={downloadSeeds}>
            Download demo CSVs
          </button>
        </div>
      </section>

      <section className="panel" aria-busy={pending && !result}>
        <h2>Financial leakage board</h2>
        {!result ? (
          <SkeletonBoard />
        ) : (
          <>
            <div className="grid">
              <div className="kpi">
                <span>Orders</span>
                <strong>
                  {summary?.orders_total ?? demo?.orders ?? "—"}
                </strong>
              </div>
              <div className="kpi">
                <span>Exact matched</span>
                <strong>{summary?.matched_count ?? "—"}</strong>
              </div>
              <div className="kpi">
                <span>Fuzzy matched</span>
                <strong>{summary?.fuzzy_count ?? "—"}</strong>
              </div>
              <div className="kpi">
                <span>Exceptions</span>
                <strong>{summary?.exception_count ?? "—"}</strong>
              </div>
            </div>
            <div className="grid" style={{ marginTop: "0.75rem" }}>
              <div className="kpi" title="Average confidence across scored pairs">
                <span>Avg confidence</span>
                <strong>{summary?.avg_confidence ?? "—"}</strong>
              </div>
              <div className="kpi" title="Sum of financial impact on exceptions">
                <span>Leakage</span>
                <strong>
                  {summary ? `R$ ${summary.leakage_total.toFixed(2)}` : "—"}
                </strong>
              </div>
              <div className="kpi">
                <span>Fee anomalies</span>
                <strong>
                  {summary
                    ? `R$ ${summary.fee_anomaly_total.toFixed(2)}`
                    : "—"}
                </strong>
              </div>
              <div className="kpi">
                <span>Orphans</span>
                <strong>
                  {summary
                    ? summary.unmatched_orders + summary.unmatched_payments
                    : "—"}
                </strong>
              </div>
            </div>
          </>
        )}
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          {demo?.notice}
        </p>
      </section>

      <section className="panel" id="workbench">
        <h2>Matching workbench</h2>
        <div className="legend muted">
          <span className="badge ok">exact_ref</span> join por referência ·{" "}
          <span className="badge accent">fuzzy_*</span> candidato por
          nome/ref/valor · <span className="badge warn">exception</span> delta
          material ou baixa confiança
        </div>
        <div className="controls">
          <label htmlFor="match-filter">
            Filter
            <select
              id="match-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              style={{ display: "block", marginTop: "0.35rem" }}
            >
              <option value="all">All pairs</option>
              <option value="exact">Exact only</option>
              <option value="fuzzy">Fuzzy only</option>
              <option value="exception">Exceptions only</option>
            </select>
          </label>
        </div>
        {result ? (
          <MatchWorkbench
            matches={filteredMatches}
            selected={selected}
            onSelect={setSelected}
          />
        ) : (
          <p className="muted" role="status">
            Waiting for reconciliation result…
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Exception inbox (prioritized)</h2>
        {result ? (
          <ExceptionInbox
            exceptions={result.exceptions}
            pending={pending}
            onResolve={onResolve}
          />
        ) : (
          <p className="muted" role="status">
            Exception inbox appears after the first run.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Audit trail</h2>
        <div className="table-wrap">
          <table aria-label="Append-only audit trail">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Entity</th>
              </tr>
            </thead>
            <tbody>
              {(result?.audit_trail ?? []).slice(0, 12).map((event) => (
                <tr key={event.event_id}>
                  <td>{event.timestamp}</td>
                  <td>{event.actor}</td>
                  <td>{event.action}</td>
                  <td>
                    {event.entity_type}:{event.entity_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!result?.audit_trail?.length ? (
            <p className="muted">No audit events yet.</p>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2>Methodology (interview talking points)</h2>
        <ul className="method-list">
          <li>
            <strong>Exact first:</strong> join em{" "}
            <code>external_ref ↔ order_ref</code> maximiza precisão.
          </li>
          <li>
            <strong>Fuzzy next:</strong> RapidFuzz (API) / aproximação no browser
            para recall quando a referência quebra.
          </li>
          <li>
            <strong>Confidence:</strong> penaliza deltas de valor/taxa — suporte
            à decisão, não automação cega.
          </li>
          <li>
            <strong>Human-in-the-loop:</strong> confirm / investigate / write-off
            com audit append-only.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2>OpsLedger vs ReconcileIQ</h2>
        <p className="muted">
          <strong>OpsLedger</strong> = fechamento operacional (pedidos ×
          pagamentos × estoque, regras testáveis, batch e relatório executivo).{" "}
          <strong>ReconcileIQ</strong> = motor de matching (exact/fuzzy,
          confidence score, fee anomalies e exception inbox). Produtos
          complementares, não clones.
        </p>
      </section>
    </main>
  );
}
