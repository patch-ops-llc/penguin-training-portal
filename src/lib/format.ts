const DATE_TIME = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** A date and time in UTC, without the zone: the table columns that show it say UTC in their heading. */
export function formatDateTimeUtc(date: Date | null | undefined): string {
  return date ? DATE_TIME.format(date) : "Never";
}

export function formatDate(date: Date | null | undefined): string {
  return date ? DATE.format(date) : "";
}

export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** The current time, for request handlers and event handlers. Kept in one place so render code never reads the clock directly. */
export function nowMs(): number {
  return Date.now();
}
