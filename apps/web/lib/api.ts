import type { DemoSummary, ReconciliationResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchDemo(): Promise<DemoSummary> {
  return getJson<DemoSummary>("/api/demo");
}

export function runReconcile(): Promise<ReconciliationResponse> {
  return getJson<ReconciliationResponse>("/api/reconcile");
}

export async function resolveException(payload: {
  exception_id: string;
  action: string;
  note?: string;
  actor?: string;
}): Promise<{ status: string; action: string }> {
  const response = await fetch(`${API_URL}/api/exceptions/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actor: "analyst@reconcileiq.local",
      note: "",
      ...payload,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resolve failed with ${response.status}`);
  }
  return response.json();
}
