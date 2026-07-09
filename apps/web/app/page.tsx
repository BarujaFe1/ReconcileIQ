"use client";

import { useEffect, useState, useTransition } from "react";
import { ExceptionInbox } from "@/components/ExceptionInbox";
import { MatchWorkbench } from "@/components/MatchWorkbench";
import { fetchDemo, resolveException, runReconcile } from "@/lib/api";
import type {
  DemoSummary,
  MatchCandidate,
  ReconciliationResponse,
} from "@/types";

export default function HomePage() {
  const [demo, setDemo] = useState<DemoSummary | null>(null);
  const [result, setResult] = useState<ReconciliationResponse | null>(null);
  const [selected, setSelected] = useState<MatchCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadAll() {
    startTransition(async () => {
      try {
        setError(null);
        const [d, r] = await Promise.all([fetchDemo(), runReconcile()]);
        setDemo(d);
        setResult(r);
        setSelected(r.matches[0] ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load ReconcileIQ API");
      }
    });
  }

  useEffect(() => {
    loadAll();
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

  return (
    <main>
      <section className="hero">
        <p className="muted">Matching workbench · exceptions · audit trail</p>
        <h1 className="brand">ReconcileIQ</h1>
        <p className="lede">
          Inteligência de reconciliação que cruza pedidos, pagamentos e taxas com
          matching exato/fuzzy, score de confiança, fila de exceções e trilha de
          auditoria append-only.
        </p>
      </section>

      {error ? (
        <div className="notice">
          API indisponível ({error}). Suba o backend em <code>apps/api</code> na
          porta 8000.
        </div>
      ) : null}

      <section className="panel">
        <h2>Financial leakage board</h2>
        <div className="controls">
          <button type="button" disabled={pending} onClick={loadAll}>
            {pending ? "Reconciling…" : "Run reconciliation"}
          </button>
        </div>
        <div className="grid">
          <div className="kpi">
            <span>Orders</span>
            <strong>{summary?.orders_total ?? demo?.orders ?? "—"}</strong>
          </div>
          <div className="kpi">
            <span>Matched</span>
            <strong>
              {(summary?.matched_count ?? 0) + (summary?.fuzzy_count ?? 0) || "—"}
            </strong>
          </div>
          <div className="kpi">
            <span>Exceptions</span>
            <strong>{summary?.exception_count ?? "—"}</strong>
          </div>
          <div className="kpi">
            <span>Leakage</span>
            <strong>
              {summary ? `R$ ${summary.leakage_total.toFixed(2)}` : "—"}
            </strong>
          </div>
        </div>
        <div className="grid" style={{ marginTop: "0.75rem" }}>
          <div className="kpi">
            <span>Avg confidence</span>
            <strong>{summary?.avg_confidence ?? "—"}</strong>
          </div>
          <div className="kpi">
            <span>Fee anomalies</span>
            <strong>
              {summary ? `R$ ${summary.fee_anomaly_total.toFixed(2)}` : "—"}
            </strong>
          </div>
          <div className="kpi">
            <span>Unmatched orders</span>
            <strong>{summary?.unmatched_orders ?? "—"}</strong>
          </div>
          <div className="kpi">
            <span>Unmatched payments</span>
            <strong>{summary?.unmatched_payments ?? "—"}</strong>
          </div>
        </div>
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          {demo?.notice}
        </p>
      </section>

      <section className="panel">
        <h2>Matching workbench</h2>
        {result ? (
          <MatchWorkbench
            matches={result.matches}
            selected={selected}
            onSelect={setSelected}
          />
        ) : (
          <p className="muted">Waiting for reconciliation result…</p>
        )}
      </section>

      <section className="panel">
        <h2>Exception inbox</h2>
        {result ? (
          <ExceptionInbox
            exceptions={result.exceptions}
            pending={pending}
            onResolve={onResolve}
          />
        ) : null}
      </section>

      <section className="panel">
        <h2>Audit trail</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
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
        </div>
      </section>
    </main>
  );
}
