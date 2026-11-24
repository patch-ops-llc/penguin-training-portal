import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { canAccessTenant, canAccessTrack, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TRAINING_EVENTS, requestMeta, type TrainingEventType } from "@/lib/log";

const ALLOWED: ReadonlySet<string> = new Set<string>(TRAINING_EVENTS);
const RUN_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SLUG_RE = /^[a-z0-9-]{2,64}$/;
const MAX_BATCH = 50;

interface IncomingEvent {
  type?: unknown;
  tenantSlug?: unknown;
  trackId?: unknown;
  moduleId?: unknown;
  step?: unknown;
  totalSteps?: unknown;
  runId?: unknown;
  title?: unknown;
  extId?: unknown;
  at?: unknown;
}

function smallInt(value: unknown, max: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
}

function shortText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/**
 * Receives training telemetry and completion milestones from the signed-in browser.
 * Enforces strict tenant isolation (`403` if a user attempts to post events for another tenant),
 * inserts `AccessEvent` audit rows, upserts `TrainingAttempt`, and upserts `TrainingProgress`.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: { events?: unknown };
  try {
    body = (await request.json()) as { events?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const raw = Array.isArray(body.events) ? (body.events.slice(0, MAX_BATCH) as IncomingEvent[]) : [];
  if (raw.length === 0) return NextResponse.json({ ok: true });

  // Tenant isolation check across all incoming events in the batch
  const requestedSlugs = new Set<string>();
  for (const item of raw) {
    if (typeof item?.tenantSlug === "string" && item.tenantSlug.trim()) {
      const slug = item.tenantSlug.trim().toLowerCase();
      if (!canAccessTenant(user, slug)) {
        return NextResponse.json({ ok: false, error: "forbidden_tenant" }, { status: 403 });
      }
      requestedSlugs.add(slug);
    }
  }
  if (requestedSlugs.size === 0 && user.tenantSlug) {
    requestedSlugs.add(user.tenantSlug);
  }

  const tenants = await db.tenant.findMany({ where: { slug: { in: [...requestedSlugs] }, status: "ACTIVE" } });
  const tenantBySlug = new Map(tenants.map((t) => [t.slug, t]));

  const { ip, userAgent } = await requestMeta();
  const now = Date.now();

  const accepted = raw.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof item.type !== "string" || !ALLOWED.has(item.type)) return [];
    const type = item.type as TrainingEventType;
    const slug = typeof item.tenantSlug === "string" ? item.tenantSlug.trim().toLowerCase() : (user.tenantSlug ?? "");
    const tenant = tenantBySlug.get(slug) ?? null;
    if (slug && !tenant) return [];

    const trackId = typeof item.trackId === "string" && SLUG_RE.test(item.trackId) ? item.trackId : null;
    if (trackId && slug && !canAccessTrack(user, slug, trackId)) return [];

    const moduleId = typeof item.moduleId === "string" && SLUG_RE.test(item.moduleId) ? item.moduleId : null;
    const step = smallInt(item.step, 99);
    const totalSteps = smallInt(item.totalSteps, 99);
    const runId = typeof item.runId === "string" && RUN_ID_RE.test(item.runId) ? item.runId : null;
    const clientAt = typeof item.at === "number" && Number.isFinite(item.at) ? item.at : now;
    const at = new Date(Math.min(now + 5_000, Math.max(now - 24 * 60 * 60 * 1000, clientAt)));
    const meta: Record<string, string | number> = {};
    if (runId) meta.runId = runId;
    if (totalSteps !== null) meta.totalSteps = totalSteps;
    const title = shortText(item.title, 120);
    if (title) meta.title = title;
    const extId = shortText(item.extId, 60);
    if (extId) meta.extId = extId;
    return [{ type, tenantId: tenant?.id ?? user.tenantId, trackId, moduleId, step, totalSteps, runId, at, meta }];
  });

  if (accepted.length === 0) return NextResponse.json({ ok: true });

  await db.accessEvent.createMany({
    data: accepted.map((e) => ({
      type: e.type,
      userId: user.id,
      tenantId: e.tenantId,
      email: user.email,
      ip,
      userAgent,
      trackId: e.trackId,
      moduleId: e.moduleId,
      step: e.step,
      at: e.at,
      meta: Object.keys(e.meta).length > 0 ? (e.meta as Prisma.InputJsonObject) : undefined,
    })),
  });

  // Upsert TrainingAttempt and TrainingProgress sequentially so step monotonic max & completion counters are exact
  for (const e of accepted) {
    if (!e.tenantId || !e.trackId || !e.moduleId) continue;

    const stepNum = e.step ?? 1;
    const isComplete = e.type === "module_completed";
    const isShowMe = e.type === "show_me_used";
    const isReset = e.type === "module_reset";

    if (e.runId) {
      const existingAttempt = await db.trainingAttempt.findUnique({ where: { id: e.runId } });
      if (!existingAttempt) {
        await db.trainingAttempt.create({
          data: {
            id: e.runId,
            userId: user.id,
            tenantId: e.tenantId,
            trackId: e.trackId,
            moduleId: e.moduleId,
            startedAt: e.at,
            lastEventAt: e.at,
            endedAt: isComplete ? e.at : null,
            furthestStep: stepNum,
            totalSteps: e.totalSteps ?? 0,
            completed: isComplete,
            showMeSteps: isShowMe ? 1 : 0,
            resets: isReset ? 1 : 0,
          },
        });
      } else if (existingAttempt.userId === user.id && existingAttempt.tenantId === e.tenantId) {
        await db.trainingAttempt.update({
          where: { id: e.runId },
          data: {
            lastEventAt: e.at > existingAttempt.lastEventAt ? e.at : existingAttempt.lastEventAt,
            furthestStep: Math.max(existingAttempt.furthestStep, stepNum),
            totalSteps: Math.max(existingAttempt.totalSteps, e.totalSteps ?? 0),
            ...(isComplete ? { completed: true, endedAt: existingAttempt.endedAt ?? e.at } : {}),
            ...(isShowMe ? { showMeSteps: { increment: 1 } } : {}),
            ...(isReset ? { resets: { increment: 1 } } : {}),
          },
        });
      }
    }

    const existingProg = await db.trainingProgress.findUnique({
      where: {
        userId_tenantId_trackId_moduleId: {
          userId: user.id,
          tenantId: e.tenantId,
          trackId: e.trackId,
          moduleId: e.moduleId,
        },
      },
    });

    if (!existingProg) {
      await db.trainingProgress.create({
        data: {
          userId: user.id,
          tenantId: e.tenantId,
          trackId: e.trackId,
          moduleId: e.moduleId,
          status: isComplete ? "COMPLETED" : "IN_PROGRESS",
          furthestStep: stepNum,
          totalSteps: e.totalSteps ?? 0,
          completedAt: isComplete ? e.at : null,
          completedCount: isComplete ? 1 : 0,
          usedShowMeCount: isShowMe ? 1 : 0,
          lastAccessedAt: e.at,
        },
      });
    } else {
      await db.trainingProgress.update({
        where: { id: existingProg.id },
        data: {
          status: isComplete || existingProg.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
          furthestStep: Math.max(existingProg.furthestStep, stepNum),
          totalSteps: Math.max(existingProg.totalSteps, e.totalSteps ?? 0),
          completedAt: existingProg.completedAt ?? (isComplete ? e.at : null),
          ...(isComplete ? { completedCount: { increment: 1 } } : {}),
          ...(isShowMe ? { usedShowMeCount: { increment: 1 } } : {}),
          lastAccessedAt: e.at > existingProg.lastAccessedAt ? e.at : existingProg.lastAccessedAt,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
