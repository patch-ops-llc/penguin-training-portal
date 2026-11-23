import type { Metadata } from "next";
import { requireUser, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantTracks } from "@/tenants/catalog";
import { tenantPackVersions } from "@/tenants/server";
import { Launchpad, type ModuleProgressSnapshot } from "./launchpad";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Training Launchpad" };

export default async function LaunchpadPage() {
  const user = await requireUser();
  const activeTenant = await resolveActiveTenant(user);

  if (!activeTenant) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-20 font-penguin text-[#16122b]">
        <h1 className="text-[22px] font-semibold">No active organization configured</h1>
        <p className="mt-2 text-[14px] text-[#5f5b73]">Ask a Penguin Strategies administrator to provision or enable your tenant.</p>
      </main>
    );
  }

  const allTenants =
    user.role === "PENGUIN_ADMIN"
      ? await db.tenant.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { slug: true, name: true } })
      : [];

  const tracks = getTenantTracks(activeTenant.slug, activeTenant.name, activeTenant.defaultTrackIds);
  const versions = await tenantPackVersions(activeTenant.slug, activeTenant.name, activeTenant.defaultTrackIds);

  const progressRows = await db.trainingProgress.findMany({
    where: { userId: user.id, tenantId: activeTenant.id },
  });

  const progressMap: Record<string, ModuleProgressSnapshot> = {};
  for (const row of progressRows) {
    progressMap[`${row.trackId}/${row.moduleId}`] = {
      status: row.status,
      furthestStep: row.furthestStep,
      totalSteps: row.totalSteps,
      completedCount: row.completedCount,
      usedShowMeCount: row.usedShowMeCount,
    };
  }

  const brandMeta =
    activeTenant.brandMeta && typeof activeTenant.brandMeta === "object" && !Array.isArray(activeTenant.brandMeta)
      ? (activeTenant.brandMeta as Record<string, unknown>)
      : {};
  const accentColor = typeof brandMeta.accentColor === "string" ? brandMeta.accentColor : "#0b6e6e";

  const assignedIds =
    user.role === "PENGUIN_ADMIN"
      ? activeTenant.defaultTrackIds
      : user.assignedTrackIds.length > 0
        ? user.assignedTrackIds
        : activeTenant.defaultTrackIds;

  const visibleTracks = user.trackLocked && user.role === "TRAINEE" ? tracks.filter((t) => assignedIds.includes(t.id)) : tracks;

  return (
    <Launchpad
      user={{
        email: user.email,
        name: user.name,
        role: user.role,
        division: user.division,
        jobRole: user.jobRole,
        trackLocked: user.trackLocked,
      }}
      tenant={{
        slug: activeTenant.slug,
        name: activeTenant.name,
        accentColor,
      }}
      allTenants={allTenants}
      tracks={visibleTracks}
      requiredTrackIds={assignedIds}
      packVersions={versions}
      progressMap={progressMap}
    />
  );
}
