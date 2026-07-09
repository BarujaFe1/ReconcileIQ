import {
  getDemoSummary,
  resolveClientException,
  runClientReconciliation,
} from "@/lib/matching";
import type { DemoSummary, ReconciliationResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Prefer local/browser matching engine for Vercel demo.
 * Optional FastAPI backend when NEXT_PUBLIC_API_URL is set.
 */
async function tryBackend<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...init,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchDemo(): Promise<DemoSummary> {
  const remote = await tryBackend<DemoSummary>("/api/demo");
  return remote ?? getDemoSummary();
}

export async function runReconcile(): Promise<ReconciliationResponse> {
  const remote = await tryBackend<ReconciliationResponse>("/api/reconcile");
  return remote ?? runClientReconciliation();
}

export async function resolveException(payload: {
  exception_id: string;
  action: string;
  note?: string;
  actor?: string;
}): Promise<{ status: string; action: string }> {
  const remote = await tryBackend<{ status: string; action: string }>(
    "/api/exceptions/resolve",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: "analyst@reconcileiq.local",
        note: "",
        ...payload,
      }),
    },
  );
  if (remote) return remote;
  return resolveClientException(
    payload.exception_id,
    payload.action,
    payload.note ?? "",
    payload.actor ?? "analyst@reconcileiq.local",
  );
}
