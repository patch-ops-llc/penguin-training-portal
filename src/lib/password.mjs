// Plain JS so both the Next.js app and the Prisma seed (plain Node) can share it.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

/**
 * @param {string} password
 * @returns {Promise<string>} "scrypt$<salt>$<hash>" in base64url
 */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = /** @type {Buffer} */ (await scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS));
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

/**
 * @param {string} password
 * @param {string | null | undefined} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const derived = /** @type {Buffer} */ (await scrypt(password, salt, expected.length, SCRYPT_PARAMS));
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export const MIN_PASSWORD_LENGTH = 10;
