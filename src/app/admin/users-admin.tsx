"use client";

import { useState, useTransition } from "react";
import { PenguinMark } from "@/components/brand";
import { TenantLogo } from "@/components/tenant-logo";
import { formatDateTimeUtc } from "@/lib/format";
import {
  inviteUsersAction,
  issuePasswordResetAction,
  removeUserAction,
  setUserStatusAction,
  updateUserAssignmentAction,
  type ActionLinkResult,
} from "./actions";
import { AdminTable, cell, cellNoWrap, Clip, EmptyRow, muted, Pill, type AdminColumn } from "./table";

const field = "rounded-md border border-[#cfcbe0] bg-white px-3 py-2 text-[13.5px] text-[#16122b] outline-none focus:border-penguin";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: "PENGUIN_ADMIN" | "CLIENT_ADMIN" | "TRAINEE";
  status: "INVITED" | "ACTIVE" | "DISABLED";
  division: string | null;
  jobRole: string | null;
  assignedTrackIds: string[];
  trackLocked: boolean;
  lastLoginAt: string | null;
  completedModules: number;
}

const COLUMNS: AdminColumn[] = [
  { label: "Learner", width: 250 },
  { label: "Portal role", width: 130 },
  { label: "Division & job role", width: 200 },
  { label: "Assigned tracks" },
  { label: "Status", width: 100 },
  { label: "Completed", width: 95 },
  { label: "Last sign-in", width: 155 },
  { label: "Actions", width: 230 },
];

export function UsersAdmin({
  actorId,
  isPenguinAdmin,
  tenant,
  divisions,
  jobRoles,
  tracks,
  users,
}: {
  actorId: string;
  isPenguinAdmin: boolean;
  tenant: { id: string; slug: string; name: string; defaultTrackIds: string[] };
  divisions: string[];
  jobRoles: string[];
  tracks: { id: string; title: string; moduleCount: number }[];
  users: UserRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [issuedLinks, setIssuedLinks] = useState<ActionLinkResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  function handleInvite(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await inviteUsersAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Invite failed.");
        return;
      }
      setIssuedLinks(res.links ?? []);
    });
  }

  function handleReset(userId: string) {
    setError(null);
    const fd = new FormData();
    fd.set("userId", userId);
    startTransition(async () => {
      const res = await issuePasswordResetAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not issue reset link.");
        return;
      }
      setIssuedLinks(res.links ?? []);
    });
  }

  function handleStatus(userId: string, nextStatus: "ACTIVE" | "DISABLED") {
    setError(null);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("status", nextStatus);
    startTransition(async () => {
      const res = await setUserStatusAction(fd);
      if (!res.ok) setError(res.error ?? "Status update failed.");
    });
  }

  function handleRemove(userId: string) {
    setError(null);
    const fd = new FormData();
    fd.set("userId", userId);
    startTransition(async () => {
      const res = await removeUserAction(fd);
      if (!res.ok) setError(res.error ?? "Remove failed.");
    });
  }

  function handleEditSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateUserAssignmentAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Update failed.");
        return;
      }
      setEditingUserId(null);
    });
  }

  async function copyLink(email: string, link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail((c) => (c === email ? null : c)), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3.5">
        <TenantLogo tenantSlug={tenant.slug} tenantName={tenant.name} mode="mark" height={36} testId="admin-users-tenant-mark" />
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">{tenant.name} — Users &amp; invitations</h1>
          <p className="mt-0.5 text-[13.5px] text-[#5f5b73]">
            Invite trainees or client admins individually or in bulk, assign divisions and required curriculum tracks, and issue password reset links.
          </p>
        </div>
      </div>

      {/* Invite / Bulk Invite Card */}
      <section className="rounded-xl border border-[#e4e2ee] bg-white p-5">
        <h2 className="text-[16px] font-semibold">Invite learners to {tenant.name}</h2>
        <form action={handleInvite} className="mt-4 space-y-4" data-testid="invite-form">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block space-y-1 text-[13px] md:col-span-2">
              <span className="font-medium">Work email(s) — enter one or paste multiple separated by commas or newlines</span>
              <textarea
                name="emails"
                rows={2}
                required
                placeholder="rep1@amico.example, estimator@amico.example"
                data-testid="invite-emails-input"
                className={`${field} w-full`}
              />
            </label>
            <label className="block space-y-1 text-[13px]">
              <span className="font-medium">Name (optional, single invite)</span>
              <input type="text" name="name" placeholder="Jordan Alvarez" className={`${field} w-full`} />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block space-y-1 text-[13px]">
              <span className="font-medium">Portal role</span>
              <select name="role" defaultValue="TRAINEE" data-testid="invite-role-select" className={`${field} w-full`}>
                <option value="TRAINEE">Trainee</option>
                <option value="CLIENT_ADMIN">Client Training Admin ({tenant.name})</option>
                {isPenguinAdmin ? <option value="PENGUIN_ADMIN">Penguin Super-Admin</option> : null}
              </select>
            </label>
            <label className="block space-y-1 text-[13px]">
              <span className="font-medium">Division</span>
              <select name="division" defaultValue={divisions[0] ?? ""} data-testid="invite-division-select" className={`${field} w-full`}>
                <option value="">All / Unassigned</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-[13px]">
              <span className="font-medium">Job role</span>
              <select name="jobRole" defaultValue={jobRoles[0] ?? ""} className={`${field} w-full`}>
                <option value="">Unspecified</option>
                {jobRoles.map((jr) => (
                  <option key={jr} value={jr}>
                    {jr}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eeecf5] pt-4">
            <div className="space-y-1.5">
              <div className="text-[12.5px] font-medium text-[#5f5b73]">Required curriculum tracks</div>
              <div className="flex flex-wrap items-center gap-4">
                {tracks.map((t) => (
                  <label key={t.id} className="inline-flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      name="assignedTrackIds"
                      value={t.id}
                      defaultChecked={tenant.defaultTrackIds.includes(t.id)}
                      className="rounded border-[#cfcbe0] text-penguin"
                    />
                    <span>{t.title}</span>
                  </label>
                ))}
                <label className="inline-flex items-center gap-2 text-[12.5px] text-[#5f5b73]">
                  <input type="checkbox" name="trackLocked" value="true" className="rounded border-[#cfcbe0] text-penguin" />
                  <span>Lock learner strictly to assigned tracks</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              data-testid="invite-submit-btn"
              className="rounded-md bg-penguin px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-penguin-strong disabled:opacity-50"
            >
              {isPending ? "Sending…" : "Create invite link(s)"}
            </button>
          </div>
        </form>

        {error ? (
          <p role="alert" className="mt-4 rounded-md border border-[#f3b4b4] bg-[#fdf1f1] px-3 py-2 text-[13px] text-[#a11212]">
            {error}
          </p>
        ) : null}

        {issuedLinks.length > 0 ? (
          <div className="mt-4 space-y-2 rounded-lg border border-[#cfcbe0] bg-[#faf9fd] p-4" data-testid="issued-links-box">
            <div className="text-[12.5px] font-semibold text-[#16122b]">
              One-time onboarding / reset links (share directly if email delivery is disabled):
            </div>
            {issuedLinks.map((item) => (
              <div key={item.email} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#e4e2ee] bg-white px-3 py-2 text-[12.5px]">
                <span className="font-medium">{item.email}</span>
                <code className="truncate text-[12px] text-penguin" data-testid={`invite-link-${item.email}`}>
                  {item.link}
                </code>
                <button
                  type="button"
                  onClick={() => copyLink(item.email, item.link)}
                  className="rounded border border-[#cfcbe0] px-2.5 py-1 text-[12px] font-medium hover:bg-[#f6f5fb]"
                >
                  {copiedEmail === item.email ? "Copied" : "Copy link"}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Roster Table */}
      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <AdminTable columns={COLUMNS} minWidth={1180} testId="users-table">
          {users.map((u) => {
            const isEditing = editingUserId === u.id;
            const statusTone = u.status === "ACTIVE" ? "green" : u.status === "INVITED" ? "amber" : "gray";
            const assignedTitles = u.assignedTrackIds
              .map((id) => tracks.find((t) => t.id === id)?.title ?? id)
              .join(", ");

            return (
              <tr key={u.id} className="border-t border-[#eeecf5]" data-testid={`user-row-${u.email}`}>
                <td className={cell}>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">
                      {u.role === "PENGUIN_ADMIN" ? (
                        <span className="inline-grid h-5 w-5 place-items-center rounded-[5px] bg-penguin-soft text-penguin" title="Penguin Strategies">
                          <PenguinMark size={12} />
                        </span>
                      ) : (
                        <TenantLogo tenantSlug={tenant.slug} tenantName={tenant.name} mode="mark" height={20} />
                      )}
                    </span>
                    <div className="min-w-0">
                      {u.name ? <div className="font-medium">{u.name}</div> : null}
                      <Clip className={muted}>{u.email}</Clip>
                    </div>
                  </div>
                </td>
                <td className={cellNoWrap}>
                  <span className="text-[12.5px] font-medium">
                    {u.role === "PENGUIN_ADMIN" ? "Penguin Admin" : u.role === "CLIENT_ADMIN" ? "Client Admin" : "Trainee"}
                  </span>
                </td>
                <td className={cell}>
                  {isEditing ? (
                    <form id={`edit-${u.id}`} action={handleEditSubmit} className="space-y-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} className={`${field} w-full py-1 text-[12px]`}>
                        <option value="TRAINEE">Trainee</option>
                        <option value="CLIENT_ADMIN">Client Admin</option>
                        {isPenguinAdmin ? <option value="PENGUIN_ADMIN">Penguin Admin</option> : null}
                      </select>
                      <select name="division" defaultValue={u.division ?? ""} className={`${field} w-full py-1 text-[12px]`}>
                        <option value="">All / Unassigned</option>
                        {divisions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <select name="jobRole" defaultValue={u.jobRole ?? ""} className={`${field} w-full py-1 text-[12px]`}>
                        <option value="">Unspecified</option>
                        {jobRoles.map((jr) => (
                          <option key={jr} value={jr}>
                            {jr}
                          </option>
                        ))}
                      </select>
                    </form>
                  ) : (
                    <>
                      <div className="font-medium">{u.division ?? "All Divisions"}</div>
                      <div className={`text-[12px] ${muted}`}>{u.jobRole ?? "—"}</div>
                    </>
                  )}
                </td>
                <td className={cell}>
                  {isEditing ? (
                    <div className="space-y-1">
                      {tracks.map((t) => (
                        <label key={t.id} className="flex items-center gap-1.5 text-[12px]">
                          <input
                            form={`edit-${u.id}`}
                            type="checkbox"
                            name="assignedTrackIds"
                            value={t.id}
                            defaultChecked={u.assignedTrackIds.includes(t.id)}
                          />
                          <span>{t.title}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-1.5 text-[11.5px] text-[#5f5b73]">
                        <input form={`edit-${u.id}`} type="checkbox" name="trackLocked" value="true" defaultChecked={u.trackLocked} />
                        <span>Track-locked</span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-[12.5px]">
                      {assignedTitles || "Default tracks"}
                      {u.trackLocked ? <span className="ml-1.5 rounded bg-[#ececf1] px-1.5 py-0.5 text-[10.5px]">Locked</span> : null}
                    </div>
                  )}
                </td>
                <td className={cellNoWrap}>
                  <Pill tone={statusTone}>{u.status}</Pill>
                </td>
                <td className={cellNoWrap}>{u.completedModules}</td>
                <td className={`${cellNoWrap} ${muted}`}>
                  {u.lastLoginAt ? formatDateTimeUtc(new Date(u.lastLoginAt)) : "Never"}
                </td>
                <td className={cell}>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        form={`edit-${u.id}`}
                        className="rounded bg-penguin px-2.5 py-1 text-[12px] font-semibold text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="rounded border border-[#cfcbe0] px-2.5 py-1 text-[12px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      {u.role !== "PENGUIN_ADMIN" || isPenguinAdmin ? (
                        <button
                          type="button"
                          onClick={() => setEditingUserId(u.id)}
                          className="font-medium text-penguin hover:underline"
                        >
                          Edit
                        </button>
                      ) : null}
                      {u.status === "ACTIVE" && (u.role !== "PENGUIN_ADMIN" || isPenguinAdmin) ? (
                        <button type="button" onClick={() => handleReset(u.id)} className="font-medium text-penguin hover:underline">
                          Reset link
                        </button>
                      ) : null}
                      {u.id !== actorId && (u.role !== "PENGUIN_ADMIN" || isPenguinAdmin) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatus(u.id, u.status === "DISABLED" ? "ACTIVE" : "DISABLED")}
                            className="font-medium text-[#5f5b73] hover:underline"
                          >
                            {u.status === "DISABLED" ? "Enable" : "Disable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(u.id)}
                            className="font-medium text-[#a11212] hover:underline"
                          >
                            Remove
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {users.length === 0 ? <EmptyRow columns={COLUMNS.length}>No learners in this organization yet.</EmptyRow> : null}
        </AdminTable>
      </section>
    </div>
  );
}
