import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdmin, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTimeUtc } from "@/lib/format";
import { getModuleMeta, getTrackMeta } from "@/tenants/catalog";
import { AdminTable, cell, cellNoWrap, Clip, EmptyRow, muted, Pill, type AdminColumn } from "../table";

export const dynamic = "force-dynamic";

const field = "rounded-md border border-[#cfcbe0] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-penguin";

const COLUMNS: AdminColumn[] = [
  { label: "Started (UTC)", width: 170 },
  { label: "Learner", width: 240 },
  { label: "Track", width: 220 },
  { label: "Module" },
  { label: "Outcome", width: 120 },
  { label: "Steps", width: 85 },
  { label: "Show me", width: 85 },
  { label: "Resets", width: 75 },
];

export default async function AttemptsPage({ searchParams }: PageProps<"/admin/attempts">) {
  const actor = await requireAdmin();
  const activeTenant = await resolveActiveTenant(actor);
  if (!activeTenant) return <p className="text-[14px] text-[#5f5b73]">No active tenant.</p>;

  const params = await searchParams;
  const userFilter = typeof params.user === "string" ? params.user.trim().toLowerCase() : "";
  const statusFilter = typeof params.status === "string" ? params.status : "all";

  const where: Prisma.TrainingAttemptWhereInput = {
    tenantId: activeTenant.id,
    ...(userFilter ? { user: { email: { contains: userFilter } } } : {}),
    ...(statusFilter === "completed" ? { completed: true } : statusFilter === "incomplete" ? { completed: false } : {}),
  };

  const rows = await db.trainingAttempt.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true, division: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">{activeTenant.name} — Module attempts</h1>
        <p className="mt-1 text-[13.5px] text-[#5f5b73]">
          Individual sandbox sessions launched by learners, including step progression, &ldquo;Show me&rdquo; assists, and resets.
        </p>
      </div>

      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <form method="get" className="flex flex-wrap items-center gap-3 border-b border-[#e4e2ee] p-4">
          <input
            type="search"
            name="user"
            defaultValue={userFilter}
            placeholder="Filter by email"
            aria-label="Filter by email"
            className={`${field} w-72`}
          />
          <select name="status" defaultValue={statusFilter} aria-label="Outcome" className={field}>
            <option value="all">All attempts</option>
            <option value="completed">Completed only</option>
            <option value="incomplete">In progress / incomplete</option>
          </select>
          <button type="submit" className="rounded-md bg-penguin px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-penguin-strong">
            Apply
          </button>
          {userFilter || statusFilter !== "all" ? (
            <Link href="/admin/attempts" className="text-[13px] font-medium text-penguin underline underline-offset-2">
              Clear
            </Link>
          ) : null}
        </form>

        <AdminTable columns={COLUMNS} minWidth={1120} testId="attempts-table">
          {rows.map((row) => {
            const track = getTrackMeta(activeTenant.slug, row.trackId, activeTenant.name);
            const mod = getModuleMeta(activeTenant.slug, row.trackId, row.moduleId);
            return (
              <tr key={row.id} className="border-t border-[#eeecf5]">
                <td className={cellNoWrap}>{formatDateTimeUtc(row.startedAt)}</td>
                <td className={cell}>
                  {row.user.name ? <div className="font-medium">{row.user.name}</div> : null}
                  <Clip className={muted}>{row.user.email}</Clip>
                </td>
                <td className={cell}>{track?.title ?? row.trackId}</td>
                <td className={cell}>{mod ? `${mod.code} · ${mod.title}` : row.moduleId}</td>
                <td className={cellNoWrap}>
                  <Pill tone={row.completed ? "green" : "amber"}>{row.completed ? "Completed" : "In progress"}</Pill>
                </td>
                <td className={cellNoWrap}>
                  {row.furthestStep}{row.totalSteps ? ` / ${row.totalSteps}` : ""}
                </td>
                <td className={cellNoWrap}>{row.showMeSteps}</td>
                <td className={cellNoWrap}>{row.resets}</td>
              </tr>
            );
          })}
          {rows.length === 0 ? <EmptyRow columns={COLUMNS.length}>No module attempts recorded yet.</EmptyRow> : null}
        </AdminTable>
      </section>
    </div>
  );
}
