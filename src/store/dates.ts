const TOKEN = /^@([+-]?)(\d+)(mi|h|d|w|mo)$/;
const UNIT_MS: Record<string, number> = { mi: 60_000, h: 3_600_000, d: 86_400_000, w: 7 * 86_400_000 };

/** Turns one offset token ("@-3d", "@+2w", "@0d", "@-14mo") into an ISO timestamp. Other strings pass through. */
export function resolveDate(value: string, now: number): string {
  const match = TOKEN.exec(value);
  if (!match) return value;
  const sign = match[1] === "-" ? -1 : 1;
  const amount = Number(match[2]);
  if (match[3] === "mo") {
    const date = new Date(now);
    date.setMonth(date.getMonth() + sign * amount);
    return date.toISOString();
  }
  return new Date(now + sign * amount * UNIT_MS[match[3]]).toISOString();
}

/** Walks a freshly parsed pack and resolves every offset token in place. */
export function resolveDates<T>(value: T, now: number): T {
  if (typeof value === "string") return resolveDate(value, now) as T;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = resolveDates(value[i], now);
    return value;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) record[key] = resolveDates(record[key], now);
  }
  return value;
}
