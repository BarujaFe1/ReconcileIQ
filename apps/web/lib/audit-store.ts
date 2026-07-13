/**
 * Browser-side durable audit/exception store (localStorage).
 * Survives reloads in the same browser profile; not a multi-user DB.
 */

import type { AuditEvent, ExceptionItem } from "@/types";

const AUDIT_KEY = "reconcileiq.audit.v1";
const STATE_KEY = "reconcileiq.exception_state.v1";
const OPENED_KEY = "reconcileiq.opened_exceptions.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadPersistedAudit(): AuditEvent[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditEvent[];
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function savePersistedAudit(events: AuditEvent[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(events.slice(0, 100)));
  } catch {
    // Quota / private mode — keep in-memory only.
  }
}

export function loadPersistedExceptionState(): Map<string, ExceptionItem["status"]> {
  const map = new Map<string, ExceptionItem["status"]>();
  if (!canUseStorage()) return map;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return map;
    const parsed = JSON.parse(raw) as Record<string, ExceptionItem["status"]>;
    Object.entries(parsed || {}).forEach(([k, v]) => map.set(k, v));
  } catch {
    return map;
  }
  return map;
}

export function savePersistedExceptionState(
  state: Map<string, ExceptionItem["status"]>,
): void {
  if (!canUseStorage()) return;
  try {
    const obj: Record<string, ExceptionItem["status"]> = {};
    state.forEach((v, k) => {
      obj[k] = v;
    });
    window.localStorage.setItem(STATE_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

export function loadOpenedExceptions(): Set<string> {
  const set = new Set<string>();
  if (!canUseStorage()) return set;
  try {
    const raw = window.localStorage.getItem(OPENED_KEY);
    if (!raw) return set;
    const parsed = JSON.parse(raw) as string[];
    if (Array.isArray(parsed)) parsed.forEach((id) => set.add(id));
  } catch {
    return set;
  }
  return set;
}

export function saveOpenedExceptions(opened: Set<string>): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(OPENED_KEY, JSON.stringify([...opened]));
  } catch {
    // ignore
  }
}

export function clearPersistedBrowserStore(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUDIT_KEY);
  window.localStorage.removeItem(STATE_KEY);
  window.localStorage.removeItem(OPENED_KEY);
}
