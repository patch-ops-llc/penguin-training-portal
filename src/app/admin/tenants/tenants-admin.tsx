"use client";

import { useState, useTransition } from "react";
import { formatDateTimeUtc } from "@/lib/format";
import { switchActiveTenantAction } from "@/app/launchpad/actions";
import { createTenantAction, setTenantStatusAction } from "../actions";
import { AdminTable, cell, cellNoWrap, muted, Pill, type AdminColumn } from "../table";

const field = "rounded-md border border-[#cfcbe0] bg-white px-3 py-2 text-[13.5px] text-[#16122b] outline-none focus:border-penguin";

interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
  divisions: string[];
  defaultTrackIds: string[];
  userCount: number;
  attemptCount: number;
  completedModules: number;
  active7d: number;
  createdAt: string;
}

const COLUMNS: AdminColumn[] = [
  { label: "Organization", width: 220 },
  { label: "Divisions" },
  { label: "Status", width: 100 },
  { label: "Users", width: 80 },
  { label: "Active (7d)", width: 100 },
  { label: "Completions", width: 105 },
  { label: "Created", width: 155 },
  { label: "Actions", width: 190 },
];

export function TenantsAdmin({ tenants }: { tenants: TenantSummary[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await createTenantAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Could not create tenant.");
        return;
      }
      setMessage(res.message ?? "Tenant created.");
    });
  }

  function handleStatus(tenantId: string, nextStatus: "ACTIVE" | "DISABLED") {
    setError(null);
    const fd = new FormData();
    fd.set("tenantId", tenantId);
    fd.set("status", nextStatus);
    startTransition(async () => {
      const res = await setTenantStatusAction(fd);
      if (!res.ok) setError(res.error ?? "Status update failed.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">Penguin Super-Admin — Client organizations</h1>
        <p className="mt-1 text-[13.5px] text-[#5f5b73]">
          Provision isolated client tenants, monitor cross-tenant learner adoption, and switch your active admin context.
        </p>
      </div>

      {/* Create Tenant Form */}
      <section className="rounded-xl border border-[#e4e2ee] bg-white p-5">
        <h2 className="text-[16px] font-semibold">Provision new client tenant</h2>
        <form action={handleCreate} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4" data-testid="create-tenant-form">
          <label className="block space-y-1 text-[13px]">
            <span className="font-medium">Tenant slug (URL-safe)</span>
            <input type="text" name="slug" required placeholder="northstar-mfg" data-testid="tenant-slug-input" className={`${field} w-full`} />
          </label>
          <label className="block space-y-1 text-[13px]">
            <span className="font-medium">Organization name</span>
            <input type="text" name="name" required placeholder="Northstar Manufacturing" data-testid="tenant-name-input" className={`${field} w-full`} />
          </label>
          <label className="block space-y-1 text-[13px]">
            <span className="font-medium">Divisions (comma-separated)</span>
            <input type="text" name="divisions" placeholder="Industrial, Commercial, Service" className={`${field} w-full`} />
          </label>
          <div className="flex items-end gap-3">
            <label className="block flex-1 space-y-1 text-[13px]">
              <span className="font-medium">Brand color</span>
              <input type="text" name="accentColor" defaultValue="#1b4f72" className={`${field} w-full`} />
            </label>
            <button
              type="submit"
              disabled={isPending}
              data-testid="create-tenant-btn"
              className="rounded-md bg-penguin px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-penguin-strong disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
        {error ? (
          <p role="alert" className="mt-3 rounded-md border border-[#f3b4b4] bg-[#fdf1f1] px-3 py-2 text-[13px] text-[#a11212]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-3 rounded-md border border-[#b9e0c4] bg-[#eefaf1] px-3 py-2 text-[13px] text-[#0b5b2b]">
            {message}
          </p>
        ) : null}
      </section>

      {/* Cross-tenant analytics & management */}
      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <AdminTable columns={COLUMNS} minWidth={1120} testId="tenants-table">
          {tenants.map((t) => (
            <tr key={t.id} className="border-t border-[#eeecf5]" data-testid={`tenant-row-${t.slug}`}>
              <td className={cell}>
                <div className="font-semibold">{t.name}</div>
                <div className={`text-[12px] ${muted}`}>/{t.slug}</div>
              </td>
              <td className={cell}>
                <div className="text-[12.5px]">{t.divisions.join(", ") || "—"}</div>
              </td>
              <td className={cellNoWrap}>
                <Pill tone={t.status === "ACTIVE" ? "green" : "gray"}>{t.status}</Pill>
              </td>
              <td className={cellNoWrap}>{t.userCount}</td>
              <td className={cellNoWrap}>{t.active7d}</td>
              <td className={cellNoWrap}>{t.completedModules}</td>
              <td className={`${cellNoWrap} ${muted}`}>{formatDateTimeUtc(new Date(t.createdAt))}</td>
              <td className={cell}>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <form action={switchActiveTenantAction}>
                    <input type="hidden" name="tenantSlug" value={t.slug} />
                    <input type="hidden" name="returnTo" value="/admin" />
                    <button type="submit" className="font-semibold text-penguin hover:underline">
                      Manage roster
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => handleStatus(t.id, t.status === "DISABLED" ? "ACTIVE" : "DISABLED")}
                    className="font-medium text-[#5f5b73] hover:underline"
                  >
                    {t.status === "DISABLED" ? "Enable" : "Disable"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
