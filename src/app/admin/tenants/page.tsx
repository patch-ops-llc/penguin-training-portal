import { requirePenguinAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { nowMs } from "@/lib/format";
import { TenantsAdmin } from "./tenants-admin";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminTenantsPage() {
  await requirePenguinAdmin();
  const since7d = new Date(nowMs() - 7 * DAY_MS);

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          users: true,
          trainingAttempts: true,
        },
      },
      trainingProgress: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
      accessEvents: {
        where: { at: { gte: since7d }, userId: { not: null } },
        select: { userId: true },
      },
    },
  });

  return (
    <TenantsAdmin
      tenants={tenants.map((t) => {
        const meta =
          t.brandMeta && typeof t.brandMeta === "object" && !Array.isArray(t.brandMeta)
            ? (t.brandMeta as Record<string, unknown>)
            : {};
        const accentColor = typeof meta.accentColor === "string" ? meta.accentColor : "#1b4f72";
        return {
          id: t.id,
          slug: t.slug,
          name: t.name,
          accentColor,
          status: t.status,
          divisions: t.divisionOptions,
          defaultTrackIds: t.defaultTrackIds,
          userCount: t._count.users,
          attemptCount: t._count.trainingAttempts,
          completedModules: t.trainingProgress.length,
          active7d: new Set(t.accessEvents.map((e) => e.userId).filter(Boolean)).size,
          createdAt: t.createdAt.toISOString(),
        };
      })}
    />
  );
}
