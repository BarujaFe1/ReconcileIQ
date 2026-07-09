import type { ExceptionItem } from "@/types";

function severityClass(severity: string): string {
  if (severity === "critical" || severity === "high") return "danger";
  if (severity === "medium") return "warn";
  return "accent";
}

export function ExceptionInbox({
  exceptions,
  pending,
  onResolve,
}: {
  exceptions: ExceptionItem[];
  pending: boolean;
  onResolve: (exceptionId: string, action: string) => void;
}) {
  return (
    <div className="list">
      {exceptions.map((item) => (
        <article key={item.exception_id} className="exception">
          <header>
            <strong>{item.title}</strong>
            <span className={`badge ${severityClass(item.severity)}`}>
              {item.severity}
            </span>
          </header>
          <p>{item.description}</p>
          <p className="muted">
            {item.exception_id} · impact R$ {item.financial_impact.toFixed(2)} ·{" "}
            {item.status}
          </p>
          <p className="muted">Suggested: {item.suggested_action}</p>
          <div className="actions">
            <button
              type="button"
              disabled={pending || item.status === "resolved"}
              onClick={() => onResolve(item.exception_id, "confirm_match")}
            >
              Confirm match
            </button>
            <button
              type="button"
              disabled={pending || item.status === "resolved"}
              onClick={() => onResolve(item.exception_id, "mark_investigating")}
            >
              Investigate
            </button>
            <button
              type="button"
              disabled={pending || item.status === "resolved"}
              onClick={() => onResolve(item.exception_id, "write_off")}
            >
              Write-off
            </button>
          </div>
        </article>
      ))}
      {exceptions.length === 0 ? (
        <p className="muted">No open exceptions in the current reconciliation run.</p>
      ) : null}
    </div>
  );
}
