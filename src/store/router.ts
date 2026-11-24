import { useSyncExternalStore } from "react";

// The shell owns navigation under /learn/<tenantSlug>/<trackId>/<moduleId>/...
// It moves with history.pushState with zero server round trips.

const EVENT = "ptp:navigate";

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(EVENT, callback);
  };
}

const snapshot = () => window.location.pathname + window.location.search;

export function useLocation(initial: string): string {
  return useSyncExternalStore(subscribe, snapshot, () => initial);
}

export function pushUrl(url: string, replace = false): void {
  if (url === snapshot()) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(EVENT));
}

export type ShellRoute = {
  tenantSlug: string;
  trackId: string;
  moduleId: string | null;
  /** Shell-relative path, such as "/deals/dl-ironpeak-perim". Empty when URL names only a module. */
  path: string;
  segments: string[];
  query: URLSearchParams;
};

export function parseLocation(location: string): ShellRoute {
  const [pathname, search = ""] = location.split("?");
  const parts = pathname.split("/").filter(Boolean); // ["learn", tenantSlug, trackId, moduleId, ...rest]
  const segments = parts.slice(4).map(decodeURIComponent);
  return {
    tenantSlug: parts[1] ?? "",
    trackId: parts[2] ?? "",
    moduleId: parts[3] ?? null,
    path: segments.length > 0 ? `/${segments.join("/")}` : "",
    segments,
    query: new URLSearchParams(search),
  };
}
