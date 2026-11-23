import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// Raw tokens go to the user (email or cookie). Only the HMAC of the token is stored,
// so a database read alone cannot be replayed as a valid token.
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHmac("sha256", env.sessionSecret).update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
