import Link from "next/link";
import { TenantLogo } from "@/components/tenant-logo";
import { requireAdmin, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { AMICO_DIVISIONS, getTenantTracks } from "@/tenants/catalog";
import { cell, Clip, muted } from "../table";

export const dynamic = "force-dynamic";

const field = "rounded-md border border-[#cfcbe0] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-penguin";

export default async function CompletionMatrixPage({ searchParams }: PageProps<"/admin/progress">) {
  const actor = await requireAdmin();
  const activeTenant = await resolveActiveTenant(actor);
  if (!activeTenant) {
    return <p className="text-[14px] text-[#5f5b73]">No active tenant configured.</p>;
  }

  const params = await searchParams;
  const divisionFilter = typeof params.division === "string" ? params.division.trim() : "";
  const trackFilter = typeof params.track === "string" ? params.track.trim() : "";
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const tracks = getTenantTracks(activeTenant.slug, activeTenant.name, activeTenant.defaultTrackIds);
  const displayedTracks = trackFilter ? tracks.filter((t) => t.id === trackFilter) : tracks;
  const allModules = displayedTracks.flatMap((t) =>
    t.modules.map((m) => ({ trackId: t.id, trackTitle: t.title, moduleId: m.id, code: m.code, title: m.title })),
  );

  const users = await db.user.findMany({
    where: {
      tenantId: activeTenant.id,
      ...(divisionFilter ? { division: divisionFilter } : {}),
      ...(query ? { OR: [{ email: { contains: query } }, { name: { contains: query, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ division: "asc" }, { email: "asc" }],
    include: {
      trainingProgress: {
        where: { tenantId: activeTenant.id },
      },
    },
  });

  const divisions = activeTenant.divisionOptions.length > 0 ? activeTenant.divisionOptions : [...AMICO_DIVISIONS];

  const learnerSummaries = users.map((u) => {
    const progByKey = new Map(u.trainingProgress.map((p) => [`${p.trackId}/${p.moduleId}`, p]));
    const reqTrackIds = u.assignedTrackIds.length > 0 ? u.assignedTrackIds : activeTenant.defaultTrackIds;
    const reqModules = tracks
      .filter((t) => reqTrackIds.includes(t.id))
      .flatMap((t) => t.modules.map((m) => `${t.id}/${m.id}`));
    const completedReq = reqModules.filter((k) => progByKey.get(k)?.status === "COMPLETED").length;

    return { user: u, progByKey, completedReq, totalReq: reqModules.length };
  });

  const totalRequiredSlots = learnerSummaries.reduce((acc, s) => acc + s.totalReq, 0);
  const totalCompletedRequired = learnerSummaries.reduce((acc, s) => acc + s.completedReq, 0);
  const learnersAllDone = learnerSummaries.filter((s) => s.totalReq > 0 && s.completedReq === s.totalReq).length;

  const overallRate = totalRequiredSlots > 0 ? Math.round((totalCompletedRequired / totalRequiredSlots) * 100) : 0;

  const tiles = [
    { label: "Learners in view", value: users.length },
    { label: "Completed all required", value: learnersAllDone },
    { label: "Required modules completed", value: totalCompletedRequired },
    { label: "Overall completion rate", value: `${overallRate}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3.5">
        <TenantLogo
          tenantSlug={activeTenant.slug}
          tenantName={activeTenant.name}
          mode="mark"
          height={36}
          testId="admin-progress-tenant-mark"
        />
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">{activeTenant.name} — Learner completion matrix</h1>
          <p className="mt-0.5 text-[13.5px] text-[#5f5b73]">
            Module-by-module completion status, furthest step reached, and guided &ldquo;Show me&rdquo; usage across divisions and tracks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-[#e4e2ee] bg-white px-5 py-4">
            <div className="text-[12.5px] text-[#5f5b73]">{tile.label}</div>
            <div className="mt-1 text-[26px] font-semibold tabular-nums">{tile.value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <form method="get" className="flex flex-wrap items-center gap-3 border-b border-[#e4e2ee] p-4">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Filter by name or email"
            aria-label="Filter by name or email"
            className={`${field} w-64`}
          />
          <select name="division" defaultValue={divisionFilter} aria-label="Division" className={field}>
            <option value="">All divisions</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select name="track" defaultValue={trackFilter} aria-label="Track" className={field}>
            <option value="">All tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-penguin px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-penguin-strong">
            Filter
          </button>
          {query || divisionFilter || trackFilter ? (
            <Link href="/admin/progress" className="text-[13px] font-medium text-penguin underline underline-offset-2">
              Clear
            </Link>
          ) : null}
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]" style={{ minWidth: 960 }} data-testid="completion-matrix">
            <thead className="bg-[#faf9fd] text-[11px] uppercase tracking-wide text-[#5f5b73]">
              <tr>
                <th className="px-4 py-2.5 font-semibold" style={{ minWidth: 220 }}>
                  Learner
                </th>
                <th className="px-3 py-2.5 font-semibold" style={{ minWidth: 140 }}>
                  Division
                </th>
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap" style={{ minWidth: 110 }}>
                  Required
                </th>
                {allModules.map((mod) => (
                  <th key={`${mod.trackId}/${mod.moduleId}`} className="px-3 py-2.5 font-semibold" style={{ minWidth: 125 }} title={mod.title}>
                    <div>{mod.code}</div>
                    <div className="truncate font-normal normal-case text-[#7a7691]" style={{ maxWidth: 120 }}>
                      {mod.title}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {learnerSummaries.map(({ user: u, progByKey, completedReq, totalReq }) => (
                <tr key={u.id} className="border-t border-[#eeecf5]" data-testid={`matrix-row-${u.email}`}>
                  <td className={cell}>
                    <div className="flex items-start gap-2.5">
                      <TenantLogo tenantSlug={activeTenant.slug} tenantName={activeTenant.name} mode="mark" height={20} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        {u.name ? <div className="font-medium">{u.name}</div> : null}
                        <Clip className={muted}>{u.email}</Clip>
                      </div>
                    </div>
                  </td>
                  <td className={cell}>
                    <div className="font-medium">{u.division ?? "All Divisions"}</div>
                    <div className={`text-[11.5px] ${muted}`}>{u.jobRole ?? u.role}</div>
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap font-semibold tabular-nums">
                    {completedReq} / {totalReq}
                  </td>
                  {allModules.map((mod) => {
                    const p = progByKey.get(`${mod.trackId}/${mod.moduleId}`);
                    return (
                      <td key={`${mod.trackId}/${mod.moduleId}`} className="px-3 py-3 align-top">
                        {p?.status === "COMPLETED" ? (
                          <div>
                            <span className="inline-block rounded-full bg-[#e5f5ec] px-2 py-0.5 text-[11px] font-semibold text-[#11603a]">
                              ✓ Done{p.completedCount > 1 ? ` (${p.completedCount}×)` : ""}
                            </span>
                            {p.usedShowMeCount > 0 ? (
                              <div className="mt-0.5 text-[10.5px] text-[#5f5b73]">Show me: {p.usedShowMeCount}×</div>
                            ) : null}
                          </div>
                        ) : p ? (
                          <div>
                            <span className="inline-block rounded-full bg-[#fff4d9] px-2 py-0.5 text-[11px] font-semibold text-[#7a5200]">
                              Step {p.furthestStep}{p.totalSteps ? `/${p.totalSteps}` : ""}
                            </span>
                            {p.usedShowMeCount > 0 ? (
                              <div className="mt-0.5 text-[10.5px] text-[#5f5b73]">Show me: {p.usedShowMeCount}×</div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[#9b97b0]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {learnerSummaries.length === 0 ? (
                <tr>
                  <td colSpan={3 + allModules.length} className="px-4 py-8 text-center text-[#5f5b73]">
                    No learners match the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
