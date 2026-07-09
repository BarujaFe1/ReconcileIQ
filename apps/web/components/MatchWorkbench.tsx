import { getOrder, getPayment } from "@/lib/matching";
import type { MatchCandidate } from "@/types";

function statusClass(status: string): string {
  if (status === "matched") return "ok";
  if (status === "fuzzy_matched") return "accent";
  if (status === "exception") return "warn";
  return "danger";
}

export function MatchWorkbench({
  matches,
  selected,
  onSelect,
}: {
  matches: MatchCandidate[];
  selected: MatchCandidate | null;
  onSelect: (match: MatchCandidate) => void;
}) {
  const order = selected ? getOrder(selected.order_id) : undefined;
  const payment = selected ? getPayment(selected.payment_id) : undefined;

  return (
    <div className="split">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Payment</th>
              <th>Method</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr
                key={`${match.order_id}-${match.payment_id ?? "none"}`}
                onClick={() => onSelect(match)}
                style={{
                  cursor: "pointer",
                  background:
                    selected?.order_id === match.order_id &&
                    selected?.payment_id === match.payment_id
                      ? "rgba(94, 224, 192, 0.08)"
                      : undefined,
                }}
              >
                <td>{match.order_id}</td>
                <td>{match.payment_id ?? "—"}</td>
                <td>
                  <span className={`badge ${match.method === "exact_ref" ? "ok" : match.method.startsWith("fuzzy") ? "accent" : "warn"}`}>
                    {match.method}
                  </span>
                </td>
                <td>{match.confidence.toFixed(1)}</td>
                <td>
                  <span className={`badge ${statusClass(match.status)}`}>
                    {match.status}
                  </span>
                </td>
                <td>R$ {match.financial_impact.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="diff">
        <div className="diff-pane">
          <h3>Order side</h3>
          {order ? (
            <>
              <p><strong>{order.order_id}</strong></p>
              <p className="muted">Ref: {order.external_ref}</p>
              <p>{order.customer_name}</p>
              <p>{order.channel} · {order.order_date}</p>
              <p>Gross: R$ {order.gross_amount.toFixed(2)}</p>
              <p className="muted">Status: {order.status}</p>
            </>
          ) : selected ? (
            <p className="muted">No order record for this row.</p>
          ) : (
            <p className="muted">Select a match row to inspect the pair.</p>
          )}
        </div>
        <div className="diff-pane">
          <h3>Payment / fee side</h3>
          {payment ? (
            <>
              <p><strong>{payment.payment_id}</strong></p>
              <p className="muted">Ref: {payment.order_ref}</p>
              <p>{payment.payer_name}</p>
              <p>{payment.provider} · {payment.paid_at.slice(0, 10)}</p>
              <p>Net: R$ {payment.net_amount.toFixed(2)} · Fee: R$ {payment.fee_amount.toFixed(2)}</p>
              {selected ? (
                <>
                  <p>Δ amount: R$ {selected.amount_delta.toFixed(2)}</p>
                  <p>Δ fee: R$ {selected.fee_delta.toFixed(2)}</p>
                  <p className="muted">{selected.reasons.join(" · ")}</p>
                </>
              ) : null}
            </>
          ) : selected ? (
            <>
              <p className="muted">Payment missing</p>
              <p>{selected.reasons.join(" · ")}</p>
            </>
          ) : (
            <p className="muted">Diff viewer waits for a selected candidate.</p>
          )}
        </div>
      </div>
    </div>
  );
}
