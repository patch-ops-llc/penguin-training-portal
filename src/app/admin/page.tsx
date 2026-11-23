import { requireAdmin, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { AMICO_DIVISIONS, AMICO_JOB_ROLES, getTenantTracks } from "@/tenants/catalog";
import { UsersAdmin } from "./users-admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const actor = await requireAdmin();
  const activeTenant = await resolveActiveTenant(actor);

  if (!activeTenant) {
    return <p className="text-[14px] text-[#5f5b73]">No active tenant found.</p>;
  }

  const users = await db.user.findMany({
    where:
      actor.role === "PENGUIN_ADMIN"
        ? { OR: [{ tenantId: activeTenant.id }, { role: "PENGUIN_ADMIN" }] }
        : { tenantId: activeTenant.id },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    include: {
      trainingProgress: {
        where: { tenantId: activeTenant.id, status: "COMPLETED" },
        select: { trackId: true, moduleId: true },
      },
    },
  });

  const tracks = getTenantTracks(activeTenant.slug, activeTenant.name, activeTenant.defaultTrackIds);
  const divisions =
    activeTenant.divisionOptions.length > 0 ? activeTenant.divisionOptions : [...AMICO_DIVISIONS];

  return (
    <UsersAdmin
      actorId={actor.id}
      isPenguinAdmin={actor.role === "PENGUIN_ADMIN"}
      tenant={{
        id: activeTenant.id,
        slug: activeTenant.slug,
        name: activeTenant.name,
        defaultTrackIds: activeTenant.defaultTrackIds,
      }}
      divisions={divisions}
      jobRoles={[...AMICO_JOB_ROLES]}
      tracks={tracks.map((t) => ({ id: t.id, title: t.title, moduleCount: t.modules.length }))}
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        division: u.division,
        jobRole: u.jobRole,
        assignedTrackIds: u.assignedTrackIds,
        trackLocked: u.trackLocked,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        completedModules: u.trainingProgress.length,
      }))}
    />
  );
}
