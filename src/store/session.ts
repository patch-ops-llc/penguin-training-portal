import type { Action } from "./world";

/** Progress through one module in browser sessionStorage. `marks[i]` is `changes.length` when step i became current. */
export type Run = { runId: string; marks: number[]; furthest: number; completed: boolean; showMeCount: number };

export type Saved = { version: string; changes: Action[]; runs: Record<string, Run> };

const key = (tenantSlug: string, trackId: string) => `ptp.session.${tenantSlug}.${trackId}`;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadSession(tenantSlug: string, trackId: string, version: string): Saved | null {
  try {
    const raw = storage()?.getItem(key(tenantSlug, trackId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    return saved.version === version && Array.isArray(saved.changes) ? saved : null;
  } catch {
    return null;
  }
}

export function saveSession(tenantSlug: string, trackId: string, saved: Saved): void {
  try {
    storage()?.setItem(key(tenantSlug, trackId), JSON.stringify(saved));
  } catch {
    // Storage full or blocked.
  }
}

export function clearSession(tenantSlug: string, trackId: string): void {
  try {
    storage()?.removeItem(key(tenantSlug, trackId));
  } catch {
    // Nothing to clear.
  }
}

export function hasSavedModuleSession(tenantSlug: string, trackId: string, moduleId: string): boolean {
  try {
    const raw = storage()?.getItem(key(tenantSlug, trackId));
    if (!raw) return false;
    const saved = JSON.parse(raw) as Saved;
    return saved.changes.length > 0 && Boolean(saved.runs?.[moduleId]);
  } catch {
    return false;
  }
}

export const hasSavedSession = hasSavedModuleSession;
