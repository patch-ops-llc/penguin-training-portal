import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdmin, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTimeUtc, nowMs } from "@/lib/format";
import { EVENT_LABELS, SIGN_IN_EVENTS, TRAINING_EVENTS } from "@/lib/log";
import { AdminTable, cell, cellNoWrap, Clip, EmptyRow, muted, type AdminColumn } from "../table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const field = "rounded-md border border-[#cfcbe0] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-penguin";

const COLUMNS: AdminColumn[] = [
  { label: "Time (UTC)", width: 172 },
  { label: "User", width: 250 },
  { label: "Event", width: 165 },
  { label: "Track", width: 160 },
  { label: "Module", width: 160 },
  { label: "Step", width: 54 },
  { label: "Detail" },
  { label: "IP address", width: 138 },
];

const GROUPS: Record<string, { label: string; types: readonly string[] | null }> = {
  all: { label: "All events", types: null },
  signin: { label: "Sign-ins", types: SIGN_IN_EVENTS },
  training: { label: "Training activity", types: TRAINING_EVENTS },
};

function detail(event: { type: string; meta: Prisma.JsonValue }): string {
  const meta = event.meta && typeof event.meta === "object" && !Array.isArray(event.meta) ? (event.meta as Record<string, unknown>) : {};
  if (event.type === "login_success") return meta.method ? `Method: ${String(meta.method).replace("_", " ")}` : "";
  if (event.type === "login_failed")
    return [meta.method ? `Method: ${String(meta.method).replace("_", " ")}` : "", meta.reason ? `Reason: ${String(meta.reason).replaceAll("_", " ")}` : ""]
      .filter(Boolean)
      .join(". ");
  if (event.type === "step_reached" && meta.title) return String(meta.title);
  if (event.type === "highlight_used" && meta.extId) return `Callout: ${String(meta.extId)}`;
  return "";
}

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const actor = await requireAdmin();
  const activeTenant = await resolveActiveTenant(actor);
  if (!activeTenant) return <p className="text-[14px] text-[#5f5b73]">No active tenant.</p>;

  const params = await searchParams;
  const userFilter = typeof params.user === "string" ? params.user.trim().toLowerCase() : "";
  const group = typeof params.group === "string" && params.group in GROUPS ? params.group : "all";
  const before = typeof params.before === "string" && !Number.isNaN(Date.parse(params.before)) ? new Date(params.before) : null;

  const tenantScope: Prisma.AccessEventWhereInput =
    actor.role === "PENGUIN_ADMIN" ? { OR: [{ tenantId: activeTenant.id }, { tenantId: null }] } : { tenantId: activeTenant.id };

  const where: Prisma.AccessEventWhereInput = {
    ...tenantScope,
    ...(userFilter ? { email: { contains: userFilter } } : {}),
    ...(GROUPS[group].types ? { type: { in: [...GROUPS[group].types!] } } : {}),
    ...(before ? { at: { lt: before } } : {}),
  };

  const now = nowMs();
  const [events, active7, active30, attempts7, logins7] = await Promise.all([
    db.accessEvent.findMany({ where, orderBy: { at: "desc" }, take: PAGE_SIZE + 1, include: { user: { select: { name: true } } } }),
    db.accessEvent.findMany({
      where: { tenantId: activeTenant.id, at: { gte: new Date(now - 7 * DAY_MS) }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.accessEvent.findMany({
      where: { tenantId: activeTenant.id, at: { gte: new Date(now - 30 * DAY_MS) }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.trainingAttempt.count({ where: { tenantId: activeTenant.id, startedAt: { gte: new Date(now - 7 * DAY_MS) } } }),
    db.accessEvent.count({ where: { tenantId: activeTenant.id, type: "login_success", at: { gte: new Date(now - 7 * DAY_MS) } } }),
  ]);

  const hasMore = events.length > PAGE_SIZE;
  const rows = events.slice(0, PAGE_SIZE);
  const olderParams = new URLSearchParams();
  if (userFilter) olderParams.set("user", userFilter);
  if (group !== "all") olderParams.set("group", group);
  if (rows.length > 0) olderParams.set("before", rows[rows.length - 1].at.toISOString());

  const tiles = [
    { label: "Active learners, 7 days", value: active7.length },
    { label: "Active learners, 30 days", value: active30.length },
    { label: "Sign-ins, 7 days", value: logins7 },
    { label: "Module attempts, 7 days", value: attempts7 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">{activeTenant.name} — Access &amp; telemetry log</h1>
        <p className="mt-1 text-[13.5px] text-[#5f5b73]">
          Every sign-in, track opened, module started, and completion milestone for {activeTenant.name}. Free-text sandbox inputs are never logged.
        </p>
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
          <input type="search" name="user" defaultValue={userFilter} placeholder="Filter by email" aria-label="Filter by email" className={`${field} w-72`} />
          <select name="group" defaultValue={group} aria-label="Event type" className={field}>
            {Object.entries(GROUPS).map(([key, g]) => (
              <option key={key} value={key}>
                {g.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-penguin px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-penguin-strong">
            Apply
          </button>
          {userFilter || group !== "all" || before ? (
            <Link href="/admin/activity" className="text-[13px] font-medium text-penguin underline underline-offset-2">
              Clear
            </Link>
          ) : null}
          <span className="ml-auto text-[12.5px] text-[#5f5b73]">
            {rows.length} {rows.length === 1 ? "event" : "events"}
            {hasMore ? ", more available" : ""}
          </span>
        </form>
        <AdminTable columns={COLUMNS} minWidth={1160} testId="access-log">
          {rows.map((event) => (
            <tr key={event.id} className="border-t border-[#eeecf5]">
              <td className={cellNoWrap}>{formatDateTimeUtc(event.at)}</td>
              <td className={cell}>
                {event.user?.name ? <div className="font-medium">{event.user.name}</div> : null}
                <Clip className={muted}>{event.email ?? "Unknown"}</Clip>
              </td>
              <td className={`${cell} font-medium ${event.type === "login_failed" ? "text-[#a11212]" : ""}`}>
                {EVENT_LABELS[event.type] ?? event.type}
              </td>
              <td className={cell}>{event.trackId ?? ""}</td>
              <td className={cell}>{event.moduleId ?? ""}</td>
              <td className={cellNoWrap}>{event.step ?? ""}</td>
              <td className={`${cell} ${muted}`}>{detail(event)}</td>
              <td className={`${cell} tabular-nums`}>{event.ip ? <Clip className={muted}>{event.ip}</Clip> : null}</td>
            </tr>
          ))}
          {rows.length === 0 ? <EmptyRow columns={COLUMNS.length}>No events match.</EmptyRow> : null}
        </AdminTable>
        {hasMore ? (
          <div className="border-t border-[#e4e2ee] p-4 text-center">
            <Link href={`/admin/activity?${olderParams.toString()}`} className="text-[13.5px] font-medium text-penguin underline underline-offset-2">
              Show older events
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
