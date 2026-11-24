import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const SIGN_IN_EVENTS = [
  "login_success",
  "login_failed",
  "logout",
  "invite_accepted",
  "invite_created",
  "password_reset",
  "password_changed",
  "session_ended_by_admin",
] as const;

/** Events the browser may report. Anything else posted to /api/events is dropped. */
export const TRAINING_EVENTS = [
  "launchpad_opened",
  "track_opened",
  "module_started",
  "step_reached",
  "show_me_used",
  "module_completed",
  "module_reset",
  "module_switched",
  "highlight_used",
] as const;

export type TrainingEventType = (typeof TRAINING_EVENTS)[number];

export const EVENT_LABELS: Record<string, string> = {
  login_success: "Signed in",
  login_failed: "Sign-in failed",
  logout: "Signed out",
  invite_accepted: "Invite accepted",
  invite_created: "Invitation sent",
  password_reset: "Password reset",
  password_changed: "Password changed",
  session_ended_by_admin: "Sessions ended by admin",
  launchpad_opened: "Opened training launchpad",
  track_opened: "Opened track",
  module_started: "Started module",
  step_reached: "Completed step",
  show_me_used: "Used Show me assist",
  module_completed: "Completed module",
  module_reset: "Reset module",
  module_switched: "Switched module",
  highlight_used: "Highlighted coaching callouts",
};

export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
    const userAgent = h.get("user-agent")?.slice(0, 300) ?? null;
    return { ip: forwarded, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export type LogInput = {
  type: string;
  tenantId?: string | null;
  userId?: string | null;
  email?: string | null;
  sessionId?: string | null;
  runId?: string | null;
  trackId?: string | null;
  moduleId?: string | null;
  step?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Prisma.InputJsonValue;
  at?: Date;
};

/** Never throws: a logging failure must not break a sign-in or a training session. */
export async function logEvent(input: LogInput): Promise<void> {
  try {
    await db.accessEvent.create({ data: input });
  } catch (error) {
    console.error("[log] Failed to record event:", error);
  }
}

export async function logAudit(input: {
  actor: { id: string; email: string };
  tenantId?: string | null;
  action: string;
  target?: { id?: string | null; email?: string | null };
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.adminAudit.create({
      data: {
        tenantId: input.tenantId ?? null,
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        action: input.action,
        targetId: input.target?.id ?? null,
        targetEmail: input.target?.email ?? null,
        before: input.before,
        after: input.after,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to record:", error);
  }
}

export const auditAdmin = logAudit;
