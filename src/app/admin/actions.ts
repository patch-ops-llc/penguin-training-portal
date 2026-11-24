"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { inviteExpiry, requireAdmin, requirePenguinAdmin, resetTokenExpiry, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { auditAdmin, logEvent, requestMeta } from "@/lib/log";
import { generateToken, hashToken, normalizeEmail } from "@/lib/tokens";
import { getTenantTracks } from "@/tenants/catalog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9-]{2,48}$/;

export interface ActionLinkResult {
  email: string;
  link: string;
  emailed: boolean;
}

export interface AdminActionResult {
  ok: boolean;
  error?: string;
  links?: ActionLinkResult[];
  message?: string;
}

/**
 * Invites one or many users (bulk emails separated by newline, comma, or semicolon) into the active tenant.
 * Strictly scopes CLIENT_ADMIN to their own tenant and forbids CLIENT_ADMIN from granting PENGUIN_ADMIN.
 */
export async function inviteUsersAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requireAdmin();
  const activeTenant = await resolveActiveTenant(actor);
  if (!activeTenant) return { ok: false, error: "No active tenant selected." };

  const rawEmails = String(formData.get("emails") ?? "");
  const emails = [...new Set(rawEmails.split(/[\n,;]+/).map((s) => normalizeEmail(s)).filter(Boolean))];
  if (emails.length === 0) return { ok: false, error: "Enter at least one work email address." };
  if (emails.length > 100) return { ok: false, error: "Invite at most 100 email addresses at a time." };

  for (const e of emails) {
    if (!EMAIL_RE.test(e) || e.length > 254) {
      return { ok: false, error: `Invalid email address: ${e}` };
    }
  }

  const singleName = emails.length === 1 ? String(formData.get("name") ?? "").trim().slice(0, 120) || null : null;
  const requestedRole = String(formData.get("role") ?? "TRAINEE") as Role;
  const role: Role =
    actor.role === "PENGUIN_ADMIN" && (requestedRole === "PENGUIN_ADMIN" || requestedRole === "CLIENT_ADMIN" || requestedRole === "TRAINEE")
      ? requestedRole
      : requestedRole === "CLIENT_ADMIN"
        ? "CLIENT_ADMIN"
        : "TRAINEE";

  const targetTenantId = role === "PENGUIN_ADMIN" ? null : activeTenant.id;
  const division = String(formData.get("division") ?? "").trim().slice(0, 80) || null;
  const jobRole = String(formData.get("jobRole") ?? "").trim().slice(0, 80) || null;
  const trackLocked = formData.get("trackLocked") === "on" || formData.get("trackLocked") === "true";

  const validTrackIds = new Set(getTenantTracks(activeTenant.slug, activeTenant.name, activeTenant.defaultTrackIds).map((t) => t.id));
  const selectedTracks = formData
    .getAll("assignedTrackIds")
    .map((v) => String(v))
    .filter((id) => validTrackIds.has(id));
  const assignedTrackIds = selectedTracks.length > 0 ? selectedTracks : activeTenant.defaultTrackIds;

  const links: ActionLinkResult[] = [];
  const meta = await requestMeta();

  for (const email of emails) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && existing.status === "ACTIVE") {
      continue;
    }
    // Prevent CLIENT_ADMIN from hijacking an invited/disabled user belonging to a different tenant
    if (existing && actor.role !== "PENGUIN_ADMIN" && existing.tenantId !== actor.tenantId) {
      return { ok: false, error: `${email} is already registered to another organization.` };
    }

    const user = existing
      ? await db.user.update({
          where: { id: existing.id },
          data: {
            role,
            tenantId: targetTenantId,
            status: "INVITED",
            division,
            jobRole,
            assignedTrackIds,
            trackLocked,
            ...(singleName ? { name: singleName } : {}),
            invitedById: actor.id,
          },
        })
      : await db.user.create({
          data: {
            email,
            name: singleName,
            role,
            tenantId: targetTenantId,
            status: "INVITED",
            division,
            jobRole,
            assignedTrackIds,
            trackLocked,
            invitedById: actor.id,
          },
        });

    await db.invite.updateMany({ where: { userId: user.id, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });

    const rawToken = generateToken();
    const expiresAt = inviteExpiry();
    await db.invite.create({
      data: {
        tokenHash: hashToken(rawToken),
        userId: user.id,
        tenantId: activeTenant.id,
        expiresAt,
      },
    });

    const link = `${env.appUrl}/invite/${rawToken}`;
    const emailed = await sendEmail({
      to: email,
      subject: `You are invited to the ${activeTenant.name} HubSpot Training Portal`,
      text: [
        `${actor.name ?? actor.email} invited you to the ${activeTenant.name} HubSpot Training Portal.`,
        "",
        `Set up your account: ${link}`,
        "",
        "This invitation link expires in 7 days.",
      ].join("\n"),
    });

    await auditAdmin({
      actor,
      tenantId: activeTenant.id,
      action: existing ? "invite_resent" : "invite_sent",
      target: user,
      after: { role, division, jobRole, assignedTrackIds: assignedTrackIds.join(",") },
    });
    await logEvent({ type: "invite_created", tenantId: activeTenant.id, userId: user.id, email: user.email, ...meta });

    links.push({ email, link, emailed });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/progress");
  if (links.length === 0) {
    return { ok: false, error: "All entered email addresses already have active accounts." };
  }
  return { ok: true, links };
}

export async function updateUserAssignmentAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requireAdmin();
  const activeTenant = await resolveActiveTenant(actor);
  if (!activeTenant) return { ok: false, error: "No active tenant." };

  const userId = String(formData.get("userId") ?? "");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };
  if (actor.role !== "PENGUIN_ADMIN" && target.tenantId !== actor.tenantId) {
    return { ok: false, error: "Forbidden cross-tenant modification." };
  }
  if (target.role === "PENGUIN_ADMIN" && actor.role !== "PENGUIN_ADMIN") {
    return { ok: false, error: "Forbidden role modification." };
  }

  const division = String(formData.get("division") ?? "").trim().slice(0, 80) || null;
  const jobRole = String(formData.get("jobRole") ?? "").trim().slice(0, 80) || null;
  const trackLocked = formData.get("trackLocked") === "on" || formData.get("trackLocked") === "true";

  const requestedRole = String(formData.get("role") ?? target.role) as Role;
  const nextRole: Role =
    actor.role === "PENGUIN_ADMIN"
      ? requestedRole
      : requestedRole === "CLIENT_ADMIN"
        ? "CLIENT_ADMIN"
        : "TRAINEE";

  const validTrackIds = new Set(getTenantTracks(activeTenant.slug, activeTenant.name, activeTenant.defaultTrackIds).map((t) => t.id));
  const assignedTrackIds = formData
    .getAll("assignedTrackIds")
    .map((v) => String(v))
    .filter((id) => validTrackIds.has(id));

  await db.user.update({
    where: { id: target.id },
    data: {
      role: target.id === actor.id ? target.role : nextRole,
      division,
      jobRole,
      assignedTrackIds: assignedTrackIds.length > 0 ? assignedTrackIds : activeTenant.defaultTrackIds,
      trackLocked,
    },
  });

  await auditAdmin({
    actor,
    tenantId: activeTenant.id,
    action: "learner_updated",
    target,
    before: { role: target.role, division: target.division, jobRole: target.jobRole, trackLocked: target.trackLocked },
    after: { role: nextRole, division, jobRole, trackLocked },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/progress");
  return { ok: true, message: `Updated ${target.email}` };
}

export async function issuePasswordResetAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };
  if (actor.role !== "PENGUIN_ADMIN" && target.tenantId !== actor.tenantId) {
    return { ok: false, error: "Forbidden cross-tenant reset." };
  }
  if (target.role === "PENGUIN_ADMIN" && actor.role !== "PENGUIN_ADMIN") {
    return { ok: false, error: "Forbidden." };
  }

  await db.magicLinkToken.updateMany({
    where: { userId: target.id, purpose: "RESET", usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = generateToken();
  await db.magicLinkToken.create({
    data: {
      tokenHash: hashToken(rawToken),
      purpose: "RESET",
      userId: target.id,
      expiresAt: resetTokenExpiry(),
    },
  });

  const link = `${env.appUrl}/reset/${rawToken}`;
  const emailed = await sendEmail({
    to: target.email,
    subject: "Reset your Penguin Training Portal password",
    text: `Use this link within 60 minutes to choose a new password:\n\n${link}`,
  });

  await auditAdmin({
    actor,
    tenantId: target.tenantId ?? actor.tenantId,
    action: "password_reset_sent",
    target,
  });

  revalidatePath("/admin");
  return { ok: true, links: [{ email: target.email, link, emailed }] };
}

export async function setUserStatusAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") === "DISABLED" ? "DISABLED" : "ACTIVE";

  if (userId === actor.id) return { ok: false, error: "You cannot disable your own account." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };
  if (actor.role !== "PENGUIN_ADMIN" && target.tenantId !== actor.tenantId) {
    return { ok: false, error: "Forbidden cross-tenant action." };
  }
  if (target.role === "PENGUIN_ADMIN" && actor.role !== "PENGUIN_ADMIN") {
    return { ok: false, error: "Forbidden." };
  }

  await db.user.update({ where: { id: target.id }, data: { status: nextStatus } });
  if (nextStatus === "DISABLED") {
    await db.session.deleteMany({ where: { userId: target.id } });
  }

  await auditAdmin({
    actor,
    tenantId: target.tenantId ?? actor.tenantId,
    action: nextStatus === "DISABLED" ? "user_disabled" : "user_enabled",
    target,
    before: { status: target.status },
    after: { status: nextStatus },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function removeUserAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (userId === actor.id) return { ok: false, error: "You cannot remove your own account." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };
  if (actor.role !== "PENGUIN_ADMIN" && target.tenantId !== actor.tenantId) {
    return { ok: false, error: "Forbidden cross-tenant action." };
  }
  if (target.role === "PENGUIN_ADMIN" && actor.role !== "PENGUIN_ADMIN") {
    return { ok: false, error: "Forbidden." };
  }

  await db.user.delete({ where: { id: target.id } });
  await auditAdmin({
    actor,
    tenantId: target.tenantId ?? actor.tenantId,
    action: "user_removed",
    target,
    before: { role: target.role, status: target.status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/progress");
  return { ok: true };
}

export async function createTenantAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requirePenguinAdmin();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const divisionsRaw = String(formData.get("divisions") ?? "");
  const accentColor = String(formData.get("accentColor") ?? "#1b4f72").trim();

  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: "Slug must be 2–48 lowercase letters, digits, or hyphens." };
  }
  if (!name) {
    return { ok: false, error: "Organization name is required." };
  }

  const existing = await db.tenant.findUnique({ where: { slug } });
  if (existing) {
    return { ok: false, error: `Tenant slug "${slug}" already exists.` };
  }

  const divisionOptions = divisionsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaultTrackIds = [`${slug}-hubspot-101`];

  const tenant = await db.tenant.create({
    data: {
      slug,
      name,
      status: "ACTIVE",
      divisionOptions: divisionOptions.length > 0 ? divisionOptions : ["Commercial Sales", "Operations"],
      defaultTrackIds,
      brandMeta: { accentColor, cobrandLabel: `${name} × HubSpot | Trained by Penguin Strategies` },
    },
  });

  await auditAdmin({
    actor,
    tenantId: tenant.id,
    action: "tenant_created",
    after: { slug: tenant.slug, name: tenant.name },
  });

  revalidatePath("/admin/tenants");
  revalidatePath("/admin");
  revalidatePath("/launchpad");
  return { ok: true, message: `Created tenant ${tenant.name} (${tenant.slug})` };
}

export async function setTenantStatusAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requirePenguinAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") === "DISABLED" ? "DISABLED" : "ACTIVE";

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { ok: false, error: "Tenant not found." };

  await db.tenant.update({ where: { id: tenant.id }, data: { status: nextStatus } });
  await auditAdmin({
    actor,
    tenantId: tenant.id,
    action: "tenant_status_changed",
    before: { status: tenant.status },
    after: { status: nextStatus },
  });

  revalidatePath("/admin/tenants");
  revalidatePath("/admin");
  revalidatePath("/launchpad");
  return { ok: true };
}
