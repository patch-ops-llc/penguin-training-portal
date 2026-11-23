// Background telemetry beacon from the browser. Events are queued and sent in small batches;
// nothing typed into the simulated HubSpot UI ever leaves the browser.

export type BeaconEvent = {
  type:
    | "launchpad_opened"
    | "track_opened"
    | "module_started"
    | "step_reached"
    | "show_me_used"
    | "module_completed"
    | "module_reset"
    | "module_switched"
    | "highlight_used";
  tenantSlug?: string;
  trackId?: string;
  moduleId?: string;
  step?: number;
  totalSteps?: number;
  runId?: string;
  title?: string;
};

const ENDPOINT = "/api/events";
const FLUSH_MS = 1200;
let queue: (BeaconEvent & { at: number })[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let bound = false;

export function flushEvents(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0 || typeof navigator === "undefined") return;
  const payload = JSON.stringify({ events: queue });
  queue = [];
  try {
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }))) return;
    fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  } catch {
    // Dropped on purpose.
  }
}

export function track(event: BeaconEvent): void {
  if (typeof window === "undefined") return;
  if (!bound) {
    bound = true;
    window.addEventListener("pagehide", flushEvents);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushEvents();
    });
  }
  queue.push({ ...event, at: Date.now() });
  if (!timer) timer = setTimeout(flushEvents, FLUSH_MS);
  // Flush milestones immediately so navigating back to /launchpad or /admin/progress sees persisted progress right away.
  if (event.type === "module_completed" || event.type === "show_me_used") {
    flushEvents();
  }
}

export const emitEvent = track;

export function newRunId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
