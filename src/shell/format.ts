const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const number = new Intl.NumberFormat("en-US");
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export const money = (value: number) => (Number.isInteger(value) ? usd0.format(value) : usd2.format(value));
export const money2 = (value: number) => usd2.format(value);
export const num = (value: number) => number.format(value);
export const date = (iso: string) => dateFmt.format(new Date(iso));
export const dateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const time = (iso: string) => timeFmt.format(new Date(iso));
export const pct = (value: number) => `${Math.round(value * 10) / 10}%`;

export function compactMoney(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return money(value);
}

/** "5 minutes ago", "Yesterday", "in 3 days", or a date once it is more than a week away. */
export function relative(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const past = diff <= 0;
  const phrase = (n: number, unit: string) => (past ? `${n} ${unit}${n === 1 ? "" : "s"} ago` : `in ${n} ${unit}${n === 1 ? "" : "s"}`);
  if (abs < 60_000) return past ? "Just now" : "in a moment";
  if (abs < 3_600_000) return phrase(Math.round(abs / 60_000), "minute");
  if (abs < 86_400_000) return phrase(Math.round(abs / 3_600_000), "hour");
  if (abs < 2 * 86_400_000) return past ? "Yesterday" : "Tomorrow";
  if (abs < 7 * 86_400_000) return phrase(Math.round(abs / 86_400_000), "day");
  return date(iso);
}

export function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
