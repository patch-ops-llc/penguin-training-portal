import "server-only";
import { cookies, headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import type { Role, Tenant, User } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { logEvent } from "@/lib/log";
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from "@/lib/password.mjs";
import { generateToken, hashToken } from "@/lib/tokens";

export const SESSION_COOKIE = "training_portal_session";
export const ACTIVE_TENANT_COOKIE = "training_portal_tenant";
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 24 * 60 * 60 * 1000;
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SLIDE_AFTER_MS = 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  division: string | null;
  jobRole: string | null;
  assignedTrackIds: string[];
  trackLocked: boolean;
  sessionId: string;
};

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export type RequestMeta = { ip: string | null; userAgent: string | null };

export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip");
  return { ip: ip || null, userAgent: h.get("user-agent")?.slice(0, 300) || null };
}

const failures = new Map<string, number[]>();
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

function tooManyFailures(email: string): boolean {
  const recent = (failures.get(email) ?? []).filter((t) => Date.now() - t < FAILURE_WINDOW_MS);
  failures.set(email, recent);
  return recent.length >= MAX_FAILURES;
}

function recordFailure(email: string): void {
  failures.set(email, [...(failures.get(email) ?? []), Date.now()]);
}

export type IssuedSession = { sessionToken: string; expiresAt: Date };

async function createSession(user: Pick<User, "id" | "email" | "tenantId">, method: string): Promise<IssuedSession> {
  const meta = await requestMeta();
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlDays * DAY_MS);

  const [session] = await db.$transaction([
    db.session.create({
      data: { tokenHash: hashToken(sessionToken), userId: user.id, expiresAt, ip: meta.ip, userAgent: meta.userAgent },
    }),
    db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  await logEvent({
    type: "login_success",
    tenantId: user.tenantId,
    userId: user.id,
    email: user.email,
    sessionId: session.id,
    meta: { method },
    ...meta,
  });
  return { sessionToken, expiresAt };
}

function isTenantAllowed(user: User & { tenant: Tenant | null }): boolean {
  if (user.role === "PENGUIN_ADMIN") return true;
  return Boolean(user.tenant && user.tenant.status === "ACTIVE");
}

export type LoginResult =
  | ({ ok: true } & IssuedSession)
  | { ok: false; reason: "invalid_credentials" | "disabled" | "too_many_attempts" };

export async function loginWithPassword(rawEmail: string, password: string): Promise<LoginResult> {
  const email = normalizeEmail(rawEmail);
  const meta = await requestMeta();

  if (tooManyFailures(email)) {
    await logEvent({ type: "login_failed", email, meta: { method: "password", reason: "too_many_attempts" }, ...meta });
    return { ok: false, reason: "too_many_attempts" };
  }

  const user = await db.user.findUnique({ where: { email }, include: { tenant: true } });
  const passwordOk = await verifyPassword(password, user?.passwordHash);

  if (!user || !passwordOk) {
    recordFailure(email);
    await logEvent({
      type: "login_failed",
      tenantId: user?.tenantId,
      userId: user?.id,
      email,
      meta: { method: "password", reason: "invalid_credentials" },
      ...meta,
    });
    return { ok: false, reason: "invalid_credentials" };
  }
  if (user.status === "DISABLED" || !isTenantAllowed(user)) {
    await logEvent({
      type: "login_failed",
      tenantId: user.tenantId,
      userId: user.id,
      email,
      meta: { method: "password", reason: "disabled" },
      ...meta,
    });
    return { ok: false, reason: "disabled" };
  }

  failures.delete(email);
  const session = await createSession(user, "password");
  return { ok: true, ...session };
}

export type OAuthProvider = "google" | "microsoft";
export type OAuthLoginResult =
  | ({ ok: true } & IssuedSession)
  | {
      ok: false;
      reason:
        | "google_not_invited"
        | "google_disabled"
        | "google_unverified"
        | "microsoft_not_invited"
        | "microsoft_disabled"
        | "microsoft_unverified";
    };

/**
 * Invite-only SSO sign-in for Google Workspace or Microsoft Entra ID.
 * The email must already exist on an invited or active User; first sign-in auto-accepts pending invites.
 */
export async function loginWithOAuth(
  provider: OAuthProvider,
  profile: { email: string; emailVerified: boolean; name: string | null },
): Promise<OAuthLoginResult> {
  const email = normalizeEmail(profile.email);
  const meta = await requestMeta();
  const fail = async (suffix: "not_invited" | "disabled" | "unverified", user?: Pick<User, "id" | "tenantId">): Promise<OAuthLoginResult> => {
    await logEvent({
      type: "login_failed",
      tenantId: user?.tenantId,
      userId: user?.id,
      email,
      meta: { method: provider, reason: suffix },
      ...meta,
    });
    return { ok: false, reason: `${provider}_${suffix}` as Exclude<OAuthLoginResult, { ok: true }>["reason"] };
  };

  if (!profile.emailVerified) return fail("unverified");
  const user = await db.user.findUnique({ where: { email }, include: { tenant: true } });
  if (!user) return fail("not_invited");
  if (user.status === "DISABLED" || !isTenantAllowed(user)) return fail("disabled", user);

  if (user.status === "INVITED") {
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE", ...(user.name || !profile.name ? {} : { name: profile.name.slice(0, 120) }) },
      }),
      db.invite.updateMany({ where: { userId: user.id, acceptedAt: null, revokedAt: null }, data: { acceptedAt: new Date() } }),
    ]);
    await logEvent({ type: "invite_accepted", tenantId: user.tenantId, userId: user.id, email, meta: { method: provider }, ...meta });
  }

  const session = await createSession(user, provider);
  return { ok: true, ...session };
}

export async function loginWithGoogle(profile: { email: string; emailVerified: boolean; name: string | null }) {
  return loginWithOAuth("google", profile);
}

export async function loginWithMicrosoft(profile: { email: string; emailVerified: boolean; name: string | null }) {
  return loginWithOAuth("microsoft", profile);
}

export type ChangePasswordResult = { ok: true } | { ok: false; reason: "wrong_password" | "password_too_short" | "password_mismatch" };

export async function changePassword(current: SessionUser, currentPassword: string, password: string, confirm: string): Promise<ChangePasswordResult> {
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, reason: "password_too_short" };
  if (password !== confirm) return { ok: false, reason: "password_mismatch" };
  const user = await db.user.findUnique({ where: { id: current.id } });
  if (!user) return { ok: false, reason: "wrong_password" };
  if (user.passwordHash && !(await verifyPassword(currentPassword, user.passwordHash))) return { ok: false, reason: "wrong_password" };

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } }),
    db.session.deleteMany({ where: { userId: user.id, id: { not: current.sessionId } } }),
  ]);
  const meta = await requestMeta();
  await logEvent({ type: "password_changed", tenantId: user.tenantId, userId: user.id, email: user.email, sessionId: current.sessionId, ...meta });
  return { ok: true };
}

export async function requestMagicLink(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email) || !env.resendApiKey) return;

  const user = await db.user.findUnique({ where: { email }, include: { tenant: true } });
  if (!user || user.status !== "ACTIVE" || !isTenantAllowed(user)) return;

  const token = generateToken();
  await db.magicLinkToken.create({
    data: { tokenHash: hashToken(token), purpose: "LOGIN", userId: user.id, expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS) },
  });

  await sendEmail({
    to: email,
    subject: "Your sign-in link for the Penguin Training Portal",
    text: [
      "Use the link below to sign in to the Penguin Training Portal.",
      "",
      `${env.appUrl}/auth/verify?token=${encodeURIComponent(token)}`,
      "",
      "This link expires in 15 minutes and can be used once.",
      "If you did not request it, you can ignore this email.",
    ].join("\n"),
  });
}

export type VerifyResult = ({ ok: true } & IssuedSession) | { ok: false; reason: "invalid" | "expired" | "used" | "disabled" };

export async function verifyMagicLink(token: string): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const record = await db.magicLinkToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { tenant: true } } },
  });
  if (!record || record.purpose !== "LOGIN") return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (record.user.status !== "ACTIVE" || !isTenantAllowed(record.user)) return { ok: false, reason: "disabled" };

  const claimed = await db.magicLinkToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return { ok: false, reason: "used" };

  const session = await createSession(record.user, "magic_link");
  return { ok: true, ...session };
}

export type TokenLookup =
  | {
      ok: true;
      kind: "invite" | "reset";
      recordId: string;
      user: Pick<User, "id" | "email" | "name" | "status" | "tenantId">;
      tenant: Pick<Tenant, "slug" | "name"> | null;
    }
  | { ok: false };

export async function lookupInvite(token: string): Promise<TokenLookup> {
  const invite = await db.invite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { tenant: true } } },
  });
  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) return { ok: false };
  if (invite.user.status === "DISABLED" || !isTenantAllowed(invite.user)) return { ok: false };
  const tenant = invite.user.tenant ? { slug: invite.user.tenant.slug, name: invite.user.tenant.name } : null;
  return { ok: true, kind: "invite", recordId: invite.id, user: invite.user, tenant };
}

export async function lookupReset(token: string): Promise<TokenLookup> {
  const record = await db.magicLinkToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { tenant: true } } },
  });
  if (!record || record.purpose !== "RESET" || record.usedAt || record.expiresAt.getTime() < Date.now()) return { ok: false };
  if (record.user.status === "DISABLED" || !isTenantAllowed(record.user)) return { ok: false };
  const tenant = record.user.tenant ? { slug: record.user.tenant.slug, name: record.user.tenant.name } : null;
  return { ok: true, kind: "reset", recordId: record.id, user: record.user, tenant };
}

export type SetPasswordResult =
  | ({ ok: true } & IssuedSession)
  | { ok: false; reason: "link_invalid" | "password_too_short" | "password_mismatch" };

export async function setPasswordWithToken(
  kind: "invite" | "reset",
  token: string,
  password: string,
  confirm: string,
  name: string | null,
): Promise<SetPasswordResult> {
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, reason: "password_too_short" };
  if (password !== confirm) return { ok: false, reason: "password_mismatch" };

  const lookup = kind === "invite" ? await lookupInvite(token) : await lookupReset(token);
  if (!lookup.ok) return { ok: false, reason: "link_invalid" };

  const claimed =
    kind === "invite"
      ? await db.invite.updateMany({ where: { id: lookup.recordId, acceptedAt: null, revokedAt: null }, data: { acceptedAt: new Date() } })
      : await db.magicLinkToken.updateMany({ where: { id: lookup.recordId, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return { ok: false, reason: "link_invalid" };

  const passwordHash = await hashPassword(password);
  const user = await db.user.update({
    where: { id: lookup.user.id },
    data: { passwordHash, status: "ACTIVE", ...(name ? { name } : {}) },
  });
  await db.session.deleteMany({ where: { userId: user.id } });

  const meta = await requestMeta();
  await logEvent({
    type: kind === "invite" ? "invite_accepted" : "password_reset",
    tenantId: user.tenantId,
    userId: user.id,
    email: user.email,
    ...meta,
  });

  const session = await createSession(user, kind);
  return { ok: true, ...session };
}

export function resetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TTL_MS);
}

export function inviteExpiry(): Date {
  return new Date(Date.now() + 7 * DAY_MS);
}

export function sessionCookieOptions(expiresAt: Date) {
  return { httpOnly: true, secure: env.secureCookies, sameSite: "lax" as const, path: "/", expires: expiresAt };
}

export async function setSessionCookie(session: IssuedSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.sessionToken, sessionCookieOptions(new Date(Date.now() + 365 * DAY_MS)));
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { tenant: true } } },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.status !== "ACTIVE" || !isTenantAllowed(session.user)) return null;

  if (Date.now() - session.lastSeenAt.getTime() > SLIDE_AFTER_MS) {
    await db.session
      .update({
        where: { id: session.id },
        data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + env.sessionTtlDays * DAY_MS) },
      })
      .catch(() => {});
  }

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: user.tenant?.slug ?? null,
    tenantName: user.tenant?.name ?? null,
    division: user.division,
    jobRole: user.jobRole,
    assignedTrackIds: user.assignedTrackIds,
    trackLocked: user.trackLocked,
    sessionId: session.id,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires CLIENT_ADMIN or PENGUIN_ADMIN; returns 403 Forbidden for TRAINEE. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "PENGUIN_ADMIN" && user.role !== "CLIENT_ADMIN") forbidden();
  return user;
}

/** Requires PENGUIN_ADMIN; returns 403 Forbidden for CLIENT_ADMIN or TRAINEE. */
export async function requirePenguinAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "PENGUIN_ADMIN") forbidden();
  return user;
}

/**
 * Resolves the active Tenant for the current user:
 * - For CLIENT_ADMIN / TRAINEE: strictly their own Tenant.
 * - For PENGUIN_ADMIN: the selected tenant from ACTIVE_TENANT_COOKIE (if valid), else "amico", else first active tenant.
 */
export async function resolveActiveTenant(user: SessionUser, explicitSlug?: string | null): Promise<Tenant | null> {
  if (user.role !== "PENGUIN_ADMIN") {
    if (!user.tenantId) return null;
    return db.tenant.findUnique({ where: { id: user.tenantId } });
  }
  const cookieStore = await cookies();
  const preferredSlug = explicitSlug || cookieStore.get(ACTIVE_TENANT_COOKIE)?.value || "amico";
  const bySlug = await db.tenant.findUnique({ where: { slug: preferredSlug } });
  if (bySlug) return bySlug;
  return db.tenant.findFirst({ where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } });
}

/** Strict tenant-isolation check used by pack delivery, telemetry events, and /learn routes. */
export function canAccessTenant(user: SessionUser, tenantSlug: string): boolean {
  if (user.role === "PENGUIN_ADMIN") return true;
  return Boolean(user.tenantSlug && user.tenantSlug === tenantSlug);
}

/** Checks both tenant isolation and optional per-user track-locking. */
export function canAccessTrack(user: SessionUser, tenantSlug: string, trackId: string, trackRestricted = false): boolean {
  if (!canAccessTenant(user, tenantSlug)) return false;
  if (user.role === "PENGUIN_ADMIN" || user.role === "CLIENT_ADMIN") return true;
  if (user.trackLocked || trackRestricted) {
    return user.assignedTrackIds.includes(trackId);
  }
  return true;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { email: true, tenantId: true } } },
  });
  if (!session) return;
  await db.session.delete({ where: { id: session.id } }).catch(() => {});
  const meta = await requestMeta();
  await logEvent({
    type: "logout",
    tenantId: session.user.tenantId,
    userId: session.userId,
    email: session.user.email,
    sessionId: session.id,
    ...meta,
  });
}
