import { requireAdmin, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTimeUtc } from "@/lib/format";
import { AdminTable, cell, cellNoWrap, Clip, EmptyRow, muted, type AdminColumn } from "../table";

export const dynamic = "force-dynamic";

const COLUMNS: AdminColumn[] = [
  { label: "Time (UTC)", width: 172 },
  { label: "Admin", width: 240 },
  { label: "Action", width: 180 },
  { label: "Target", width: 260 },
  { label: "Before" },
  { label: "After" },
];

const LABELS: Record<string, string> = {
  invite_sent: "Invite sent",
  invite_resent: "Invite resent",
  invite_revoked: "Invite revoked",
  learner_updated: "Learner updated",
  user_disabled: "User disabled",
  user_enabled: "User enabled",
  user_removed: "User removed",
  password_reset_sent: "Password reset sent",
  tenant_created: "Tenant created",
  tenant_status_changed: "Tenant status changed",
};

function show(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

export default async function AuditPage() {
  const actor = await requireAdmin();
  const activeTenant = await resolveActiveTenant(actor);
  if (!activeTenant) return <p className="text-[14px] text-[#5f5b73]">No active tenant.</p>;

  const rows = await db.adminAudit.findMany({
    where: actor.role === "PENGUIN_ADMIN" ? { OR: [{ tenantId: activeTenant.id }, { tenantId: null }] } : { tenantId: activeTenant.id },
    orderBy: { at: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">{activeTenant.name} — Admin audit</h1>
        <p className="mt-1 text-[13.5px] text-[#5f5b73]">
          Administrative changes to users, invitations, and tenant settings with before and after snapshots.
        </p>
      </div>
      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <AdminTable columns={COLUMNS} minWidth={1160} testId="admin-audit">
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#eeecf5]">
              <td className={cellNoWrap}>{formatDateTimeUtc(row.at)}</td>
              <td className={cell}>
                <Clip>{row.actorEmail}</Clip>
              </td>
              <td className={`${cellNoWrap} font-medium`}>{LABELS[row.action] ?? row.action}</td>
              <td className={cell}>{row.targetEmail ? <Clip>{row.targetEmail}</Clip> : null}</td>
              <td className={`${cell} ${muted}`}>{show(row.before)}</td>
              <td className={`${cell} ${muted}`}>{show(row.after)}</td>
            </tr>
          ))}
          {rows.length === 0 ? <EmptyRow columns={COLUMNS.length}>No admin actions recorded yet.</EmptyRow> : null}
        </AdminTable>
      </section>
    </div>
  );
}
