import type { MatchCandidate } from "@/types";

function statusClass(status: string): string {
  if (status === "matched" || status === "fuzzy_matched") return "ok";
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
                <td>{match.method}</td>
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
          {selected ? (
            <>
              <p className="muted">ID: {selected.order_id}</p>
              <p>Amount delta: R$ {selected.amount_delta.toFixed(2)}</p>
              <p>Fee delta: R$ {selected.fee_delta.toFixed(2)}</p>
            </>
          ) : (
            <p className="muted">Select a match row to inspect the pair.</p>
          )}
        </div>
        <div className="diff-pane">
          <h3>Payment / fee side</h3>
          {selected ? (
            <>
              <p className="muted">Payment: {selected.payment_id ?? "missing"}</p>
              <p className="muted">Fee: {selected.fee_id ?? "n/a"}</p>
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
