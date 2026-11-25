"use client";

import { useEffect, useMemo, useState } from "react";
import { nowMs } from "@/lib/format";
import { quoteTotals } from "@/store/quote-math";
import { useSeen, useShell } from "@/store/store";
import type { Activity, Deal, DealStage } from "@/tenants/types";
import { Ext } from "../ext";
import { FloatingComposer, type ComposerKind } from "../floating-composer";
import { date, dateTime, money, money2, shortDate } from "../format";
import { Icon, type IconName } from "../icons";
import { A, Avatar, Button, Card, colorFor, cx, Empty, LineTabs, Menu, MenuItem, Prop, statusTone, Tag } from "../ui";
import { StagePromptModal } from "./stage-prompt-modal";

const COMPANY_ROLE_LABELS = ["General Contractor", "A/E Firm", "Project Owner", "Distributor", "Subcontractor"];
const CONTACT_ROLE_LABELS = ["Decision Maker", "Quote Recipient", "Estimator / Buyer", "Billing Contact", "Project Superintendent"];

function erpOracleCustomerIdFromCompany(company: { erp?: { accountNumber: string } }) {
  if (!company.erp?.accountNumber) return "—";
  return company.erp.accountNumber.split("/")[0]?.trim() ?? "—";
}

const QUICK_ACTIONS: { id: ComposerKind; label: string; icon: IconName }[] = [
  { id: "note", label: "Note", icon: "note" },
  { id: "email", label: "Email", icon: "email" },
  { id: "call", label: "Call", icon: "call" },
  { id: "task", label: "Task", icon: "task" },
  { id: "meeting", label: "Meeting", icon: "meeting" },
];

function QuickActionRow({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (kind: ComposerKind) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between px-1" data-testid="record-quick-actions">
      {QUICK_ACTIONS.map((qa) => (
        <button
          key={qa.id}
          type="button"
          disabled={disabled}
          data-testid={`quick-action-${qa.id}`}
          onClick={() => onSelect(qa.id)}
          className="hs-quick-action disabled:opacity-45"
        >
          <span className="hs-quick-action-circle">
            <Icon name={qa.icon} size={15} />
          </span>
          <span>{qa.label}</span>
        </button>
      ))}
      <Menu
        width={170}
        align="right"
        button={({ toggle }) => (
          <button
            type="button"
            disabled={disabled}
            data-testid="quick-action-more"
            onClick={toggle}
            className="hs-quick-action disabled:opacity-45"
          >
            <span className="hs-quick-action-circle">
              <Icon name="more" size={15} />
            </span>
            <span>More</span>
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem onClick={() => { close(); onSelect("note"); }}>Create pinned note</MenuItem>
            <MenuItem onClick={() => { close(); onSelect("call"); }}>Log WhatsApp / SMS</MenuItem>
            <MenuItem onClick={() => { close(); onSelect("meeting"); }}>Schedule site walk</MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
}

function CollapsibleLeftGroup({
  title,
  defaultOpen = true,
  right,
  testId,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  testId?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[#dfe3eb] px-4 py-3" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-left text-[12.5px] font-bold text-[#33475b] hover:text-[#006162]"
        >
          <Icon name={open ? "chevronDown" : "chevronRight"} size={14} className="text-[#516f90]" />
          <span>{title}</span>
        </button>
        {right}
      </div>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function AssocHeader({
  title,
  count,
  open,
  onToggle,
  onAdd,
  addLabel = "+ Add",
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-left text-[13px] font-bold text-[#33475b] hover:text-[#006162]"
      >
        <Icon name={open ? "chevronDown" : "chevronRight"} size={14} className="text-[#516f90]" />
        <span>
          {title} ({count})
        </span>
      </button>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="text-[12px] font-semibold text-[#006162] hover:text-[#00494b] hover:underline"
        >
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}

function monthHeaderLabel(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "November 2026";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function ActivityTimelinePane({
  activities,
  openTasksCount = 0,
  readOnly,
  primaryEmail,
  onOpenComposer,
}: {
  activities: Activity[];
  openTasksCount?: number;
  readOnly?: boolean;
  primaryEmail?: string;
  onOpenComposer: (kind: ComposerKind) => void;
}) {
  const { pack, world, dispatch } = useShell();
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | "note" | "email" | "call" | "task" | "meeting">("all");
  const [collapsedAll, setCollapsedAll] = useState(false);
  const [callOutcomes, setCallOutcomes] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((a) => {
      if (filterKind !== "all" && a.type !== filterKind) return false;
      if (q && !`${a.title} ${a.body ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activities, filterKind, search]);

  return (
    <div className="space-y-4" data-testid="activity-timeline">
      {/* Search + Filter Pills + Collapse All + Quick Create Buttons */}
      <div className="rounded-[4px] border border-[#dfe3eb] bg-white p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[210px]">
            <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#516f90]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities"
              data-testid="activity-search-input"
              className="hs-input !h-8 w-full !bg-[#f5f8fa] !pl-8"
            />
          </div>
          {!readOnly ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button size="xs" variant="secondary" icon="note" onClick={() => onOpenComposer("note")} data-testid="timeline-create-note">
                Create note
              </Button>
              <Button size="xs" variant="secondary" icon="call" onClick={() => onOpenComposer("call")} data-testid="timeline-log-call">
                Log call
              </Button>
              <Button size="xs" variant="secondary" icon="email" onClick={() => onOpenComposer("email")} data-testid="timeline-log-email">
                Log email
              </Button>
              <Button size="xs" variant="primary" icon="task" onClick={() => onOpenComposer("task")} data-testid="timeline-create-task">
                Create task
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#eaf0f6] pt-2.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-[11.5px] font-medium text-[#516f90]">Filter activity:</span>
            {(
              [
                { id: "all", label: `All activity (${activities.length})` },
                { id: "note", label: "Notes" },
                { id: "email", label: "Emails" },
                { id: "call", label: "Calls" },
                { id: "task", label: `Tasks${openTasksCount ? ` (${openTasksCount})` : ""}` },
                { id: "meeting", label: "Meetings" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilterKind(f.id);
                  if (f.id === "email") dispatch({ t: "flag", k: "email.timeline.emailsTab" });
                }}
                data-testid={`activity-filter-${f.id}`}
                className="hs-filter-pill !h-6 !px-2 !text-[11.5px]"
                data-active={filterKind === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCollapsedAll((c) => !c)}
            className="text-[12px] font-semibold text-[#006162] hover:underline"
          >
            {collapsedAll ? "Expand all" : "Collapse all"}
          </button>
        </div>
      </div>

      {/* Month-Grouped Authentic HubSpot Activity Cards */}
      {filtered.length === 0 ? (
        <Card>
          <Empty title="No activities match this filter">
            Use the quick action icons in the left sidebar or buttons above to log a note, call, Outlook email, or follow-up task.
          </Empty>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((act, idx) => {
            const month = monthHeaderLabel(act.at);
            const prevMonth = idx > 0 ? monthHeaderLabel(filtered[idx - 1].at) : null;
            const authorPersona = act.byId ? pack.personas.find((p) => p.id === act.byId) : undefined;
            const authorName = authorPersona?.name ?? "HubSpot System";
            const matchedTask = act.type === "task" ? world.tasks.find((t) => act.title.includes(t.title) || t.title.includes(act.title)) : undefined;

            const iconName: IconName =
              act.type === "call"
                ? "call"
                : act.type === "email"
                  ? "email"
                  : act.type === "task"
                    ? "task"
                    : act.type === "meeting"
                      ? "meeting"
                      : act.type === "deal" || act.type === "lifecycle"
                        ? "lifecycle"
                        : act.type === "workflow" || act.type === "sync"
                          ? "sync"
                          : "note";

            return (
              <div key={act.id} className="space-y-2">
                {month !== prevMonth ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#516f90]">{month}</span>
                    <span className="h-px flex-1 bg-[#dfe3eb]" />
                  </div>
                ) : null}

                <article className="rounded-[4px] border border-[#dfe3eb] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(51,71,91,0.04)]">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f7f7] text-[#006162]">
                        <Icon name={iconName} size={14} />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-[#33475b]">
                          {act.type === "note"
                            ? `Note by ${authorName}`
                            : act.type === "call"
                              ? `Logged call · ${act.title}`
                              : act.type === "email"
                                ? `Tracked email · ${act.title}`
                                : act.title}
                        </p>
                      </div>
                      {act.legacyPipedrive ? <Tag tone="neutral">Migrated from Pipedrive</Tag> : null}
                    </div>
                    <span className="text-[11.5px] text-[#516f90]">{dateTime(act.at)}</span>
                  </header>

                  {!collapsedAll ? (
                    <div className="mt-2.5 pl-9 text-[13px] text-[#33475b]">
                      {/* Call Metadata Strip */}
                      {act.type === "call" ? (
                        <div className="mb-2 flex flex-wrap items-center gap-3 rounded-[3px] border border-[#eaf0f6] bg-[#f5f8fa] px-3 py-1.5 text-[12px]">
                          <label className="inline-flex items-center gap-1.5">
                            <span className="text-[#516f90]">Call outcome:</span>
                            <select
                              value={callOutcomes[act.id] ?? "Connected"}
                              onChange={(e) => setCallOutcomes((prev) => ({ ...prev, [act.id]: e.target.value }))}
                              className="rounded border border-[#cbd6e2] bg-white px-1.5 py-0.5 text-[11.5px] font-semibold text-[#006162]"
                            >
                              <option value="Connected">Connected</option>
                              <option value="Left voicemail">Left voicemail</option>
                              <option value="No answer">No answer</option>
                            </select>
                          </label>
                          <span className="text-[#516f90]">
                            Direction: <strong className="text-[#33475b]">Outbound</strong>
                          </span>
                          <span className="text-[#516f90]">
                            Logged by: <strong className="text-[#33475b]">{authorName}</strong>
                          </span>
                        </div>
                      ) : null}

                      {/* Email From / To / Subject Headers */}
                      {act.type === "email" ? (
                        <div className="mb-2 space-y-0.5 rounded-[3px] border border-[#eaf0f6] bg-[#f5f8fa] px-3 py-2 text-[12px] text-[#516f90]">
                          <div className="flex items-center justify-between">
                            <span>
                              From: <strong className="text-[#33475b]">{authorName}</strong>
                            </span>
                            <Tag tone="teal">Outlook 365</Tag>
                          </div>
                          <div>
                            To: <strong className="text-[#33475b]">{primaryEmail ?? "Associated Contact"}</strong>
                          </div>
                          <div>
                            Subject: <strong className="text-[#33475b]">{act.title}</strong>
                          </div>
                        </div>
                      ) : null}

                      {/* Interactive Task Checkbox */}
                      {act.type === "task" && matchedTask ? (
                        <label className="mb-2 flex items-center gap-2 rounded-[3px] border border-[#eaf0f6] bg-[#f5f8fa] px-3 py-1.5 text-[12.5px]">
                          <input
                            type="checkbox"
                            checked={matchedTask.status === "done"}
                            onChange={() => dispatch({ t: "task.toggle", id: matchedTask.id })}
                            className="accent-[#006162]"
                          />
                          <span className={cx("font-semibold", matchedTask.status === "done" && "line-through text-[#7c98b6]")}>
                            {matchedTask.title}
                          </span>
                          <Tag tone={matchedTask.priority === "High" ? "red" : "neutral"}>{matchedTask.priority}</Tag>
                        </label>
                      ) : null}

                      {act.body ? <p className="leading-relaxed text-[#33475b]">{act.body}</p> : null}

                      {authorPersona ? (
                        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#516f90]">
                          <Avatar name={authorPersona.name} color={authorPersona.color} size={18} />
                          <span>{authorPersona.name}</span>
                          <span>·</span>
                          <span>{authorPersona.division}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════ 1. CONTACT 3-PANE RECORD ═══════════════════════════ */
export function ContactRecord({ id }: { id: string }) {
  const { pack, world, dispatch } = useShell();
  const contact = world.contacts.find((c) => c.id === id);

  const [tab, setTab] = useState<"overview" | "activities">("overview");
  const [composerKind, setComposerKind] = useState<ComposerKind | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftJobTitle, setDraftJobTitle] = useState<string | null>(null);
  const [draftPhone, setDraftPhone] = useState<string | null>(null);
  const [draftLeadStatus, setDraftLeadStatus] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const [companiesOpen, setCompaniesOpen] = useState(true);
  const [dealsOpen, setDealsOpen] = useState(true);

  if (!contact) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Contact not found">
            <A to="/contacts" className="hs-link">
              Back to Contacts
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const savedOverride = world.ui[`ctEdit:${contact.id}`] ? JSON.parse(world.ui[`ctEdit:${contact.id}`]) : {};
  const effectiveTitle = draftJobTitle ?? savedOverride.title ?? contact.title;
  const effectivePhone = draftPhone ?? savedOverride.phone ?? contact.phone;
  const effectiveStatus = draftLeadStatus ?? savedOverride.leadStatus ?? contact.leadStatus;
  const isDirty = draftJobTitle !== null || draftPhone !== null || draftLeadStatus !== null;

  const company = contact.companyId ? world.companies.find((c) => c.id === contact.companyId) : undefined;
  const deals = world.deals.filter((d) => d.contactIds.includes(contact.id));
  const activities = world.activities.filter((a) => a.contactIds?.includes(contact.id));
  const owner = pack.personas.find((p) => p.id === contact.ownerId);

  useEffect(() => {
    if (composerKind === "email") {
      dispatch({ t: "flag", k: "email.composer.opened" });
      dispatch({ t: "flag", k: `email.composer.${contact.id}` });
    }
  }, [composerKind, contact.id, dispatch]);

  return (
    <div className="hs-record-3pane" data-testid="contact-record">
      {/* LEFT SIDEBAR */}
      <aside className="hs-record-left hs-scroll">
        <div className="p-4">
          <A to="/contacts" className="hs-link inline-flex items-center gap-1 text-[12.5px]">
            <Icon name="chevronLeft" size={14} /> Contacts
          </A>

          <div className="mt-3 flex items-start gap-3">
            <Avatar name={`${contact.firstName} ${contact.lastName}`} color={colorFor(contact.id)} size={42} />
            <div className="min-w-0 flex-1">
              <div className="group flex items-center gap-1.5">
                <h1 className="truncate text-[18px] font-bold text-[#33475b]">
                  {contact.firstName} {contact.lastName}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditingTitle((e) => !e)}
                  className="text-[#006162] opacity-0 group-hover:opacity-100"
                  title="Edit contact"
                >
                  <Icon name="edit" size={13} />
                </button>
              </div>
              <p className="truncate text-[12.5px] text-[#516f90]">{effectiveTitle}</p>
              <p className="truncate text-[12px] text-[#006162]">{contact.email}</p>
            </div>
          </div>

          <QuickActionRow onSelect={(k) => setComposerKind(k)} />
        </div>

        <CollapsibleLeftGroup title="About this contact" defaultOpen>
          <dl>
            <Prop label="Email (Unique Key)">{contact.email}</Prop>
            <Prop label="Job title" editable onEditClick={() => setDraftJobTitle(effectiveTitle)}>
              {editingTitle || draftJobTitle !== null ? (
                <input
                  value={effectiveTitle}
                  onChange={(e) => setDraftJobTitle(e.target.value)}
                  className="hs-input !h-7 w-full !bg-white"
                />
              ) : (
                effectiveTitle
              )}
            </Prop>
            <Prop label="Phone number" editable onEditClick={() => setDraftPhone(effectivePhone)}>
              {draftPhone !== null ? (
                <input
                  value={effectivePhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  className="hs-input !h-7 w-full !bg-white"
                />
              ) : (
                effectivePhone
              )}
            </Prop>
            <Prop label="Lead status">
              <select
                value={effectiveStatus}
                onChange={(e) => setDraftLeadStatus(e.target.value)}
                className="hs-input !h-7 w-full !bg-white"
              >
                {["New", "Open", "In Progress", "Open Deal", "Connected"].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </Prop>
            <Prop label="Lifecycle stage">
              <Tag tone="blue">{contact.lifecycle}</Tag>
            </Prop>
            <Prop label="Contact owner">{owner?.name ?? contact.ownerId ?? "—"}</Prop>
          </dl>
        </CollapsibleLeftGroup>

        {isDirty ? (
          <div
            className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-[#cbd6e2] bg-[#f5f8fa] px-4 py-3 shadow-[0_-4px_12px_rgba(31,42,55,0.08)]"
            data-testid="left-sidebar-dirty-bar"
          >
            <Button
              variant="primary"
              size="sm"
              data-testid="save-record-props-btn"
              onClick={() => {
                dispatch({
                  t: "ui",
                  k: `ctEdit:${contact.id}`,
                  v: JSON.stringify({ title: effectiveTitle, phone: effectivePhone, leadStatus: effectiveStatus }),
                });
                setDraftJobTitle(null);
                setDraftPhone(null);
                setDraftLeadStatus(null);
                setEditingTitle(false);
                setSavedToast(true);
                setTimeout(() => setSavedToast(false), 1800);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              data-testid="cancel-record-props-btn"
              onClick={() => {
                setDraftJobTitle(null);
                setDraftPhone(null);
                setDraftLeadStatus(null);
                setEditingTitle(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : savedToast ? (
          <div className="mt-auto border-t border-[#dfe3eb] bg-[#e5f8f6] px-4 py-2 text-[12px] font-semibold text-[#006c5f]">
            ✓ Contact properties saved
          </div>
        ) : null}
      </aside>

      {/* MIDDLE CANVAS */}
      <section className="hs-record-center hs-scroll">
        <div className="border-b border-[#dfe3eb] bg-white px-6 pt-1">
          <LineTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "overview", label: "Overview", testId: "record-tab-overview" },
              { id: "activities", label: `Activities (${activities.length})`, testId: "record-tab-activities" },
            ]}
          />
        </div>

        <div className="space-y-4 p-5">
          {tab === "overview" ? (
            <>
              <Card title="Data highlights">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Lifecycle Stage</p>
                    <p className="mt-1 text-[13.5px] font-bold text-[#33475b]">{contact.lifecycle}</p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Lead Status</p>
                    <p className="mt-1 text-[13.5px] font-bold text-[#006162]">{effectiveStatus}</p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Associated Deals</p>
                    <p className="mt-1 text-[13.5px] font-bold text-[#33475b]">{deals.length}</p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Last Activity</p>
                    <p className="mt-1 text-[13.5px] font-bold text-[#33475b]">
                      {activities[0] ? shortDate(activities[0].at) : "—"}
                    </p>
                  </div>
                </div>
              </Card>

              <ActivityTimelinePane
                activities={activities}
                primaryEmail={contact.email}
                onOpenComposer={(k) => setComposerKind(k)}
              />
            </>
          ) : (
            <ActivityTimelinePane
              activities={activities}
              primaryEmail={contact.email}
              onOpenComposer={(k) => setComposerKind(k)}
            />
          )}
        </div>
      </section>

      {/* RIGHT SIDEBAR */}
      <aside className="hs-record-right hs-scroll divide-y divide-[#dfe3eb]">
        <div className="p-4">
          <AssocHeader title="Companies" count={company ? 1 : 0} open={companiesOpen} onToggle={() => setCompaniesOpen((o) => !o)} />
          {companiesOpen ? (
            <div className="mt-2.5 space-y-2">
              {company ? (
                <div className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] p-3 text-[13px] hover:border-[#99acc2]">
                  <div className="flex items-center justify-between gap-2">
                    <A to={`/companies/${company.id}`} className="hs-link">
                      {company.name}
                    </A>
                    <Tag tone="blue">Primary</Tag>
                  </div>
                  <p className="mt-1 text-[11.5px] text-[#516f90]">
                    {company.domain} · {company.crossDivision?.primaryDivision ?? company.industry}
                  </p>
                </div>
              ) : (
                <p className="text-[12.5px] text-[#516f90]">No associated company.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <AssocHeader title="Deals" count={deals.length} open={dealsOpen} onToggle={() => setDealsOpen((o) => !o)} />
          {dealsOpen ? (
            <div className="mt-2.5 space-y-2">
              {deals.map((d) => {
                const labels = d.contactLabels?.[contact.id] ?? [];
                return (
                  <div key={d.id} className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] p-3 text-[13px] hover:border-[#99acc2]">
                    <A to={`/deals/${d.id}`} className="hs-link">
                      {d.name}
                    </A>
                    <p className="mt-0.5 text-[12px] text-[#516f90]">
                      {d.division} · <strong className="text-[#33475b]">{money(d.amount)}</strong>
                    </p>
                    {labels.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {labels.map((lb) => (
                          <Tag key={lb} tone="teal">
                            {lb}
                          </Tag>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </aside>

      {composerKind ? (
        <FloatingComposer
          kind={composerKind}
          onKindChange={setComposerKind}
          onClose={() => setComposerKind(null)}
          target={{
            recordLabel: `${contact.firstName} ${contact.lastName}`,
            contactIds: [contact.id],
            companyIds: company ? [company.id] : [],
            dealIds: deals.map((d) => d.id),
            defaultEmailTo: contact.email,
            contactFirstName: contact.firstName,
            companyName: company?.name,
          }}
        />
      ) : null}
    </div>
  );
}

/* ═══════════════════════════ 2. COMPANY 3-PANE RECORD ═══════════════════════════ */
export function CompanyRecord({ id }: { id: string }) {
  const { pack, world, persona, dispatch } = useShell();
  const company = world.companies.find((c) => c.id === id);
  useSeen(`seen.company.${id}`, Boolean(company));

  const [tab, setTab] = useState<"overview" | "activities">("overview");
  const [composerKind, setComposerKind] = useState<ComposerKind | null>(null);
  const [draftPhone, setDraftPhone] = useState<string | null>(null);
  const [draftCity, setDraftCity] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const [relOpen, setRelOpen] = useState(true);
  const [contactsOpen, setContactsOpen] = useState(true);
  const [dealsOpen, setDealsOpen] = useState(true);
  const [eqOpen, setEqOpen] = useState(true);
  const [projOpen, setProjOpen] = useState(true);

  if (!company) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Company not found">
            <A to="/companies" className="hs-link">
              Back to Companies
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const primaryDiv = company.crossDivision?.primaryDivision ?? "All Divisions";
  const owner = pack.personas.find((p) => p.id === company.ownerId);
  const canEditCompany =
    persona.permissionSet === "sales-manager" ||
    persona.permissionSet === "executive" ||
    (persona.permissionSet !== "project-manager" && (persona.division === primaryDiv || company.ownerId === persona.id));

  const savedOverride = world.ui[`coEdit:${company.id}`] ? JSON.parse(world.ui[`coEdit:${company.id}`]) : {};
  const effectivePhone = draftPhone ?? savedOverride.phone ?? company.phone;
  const effectiveCity = draftCity ?? savedOverride.city ?? company.city;
  const isDirty = draftPhone !== null || draftCity !== null;

  const parentCompany = company.parentCompanyId ? world.companies.find((c) => c.id === company.parentCompanyId) : undefined;
  const childCompanies = (company.childCompanyIds ?? [])
    .map((cid) => world.companies.find((c) => c.id === cid))
    .filter(Boolean);
  const duplicateTarget = company.missingDomainDuplicateOf
    ? world.companies.find((c) => c.id === company.missingDomainDuplicateOf)
    : undefined;

  const contacts = world.contacts.filter((c) => c.companyId === company.id);
  const allCompanyDeals = world.deals.filter((d) => d.companyId === company.id && d.pipelineId !== "global");
  const visibleDeals =
    persona.permissionSet === "sales-manager" || persona.permissionSet === "executive"
      ? allCompanyDeals
      : allCompanyDeals.filter((d) => d.division === persona.division || d.ownerId === persona.id);
  const restrictedDealCount = allCompanyDeals.length - visibleDeals.length;

  const epicorQuotes = world.epicorQuotes.filter((eq) => eq.companyId === company.id);
  const projects = world.projects.filter((p) => p.companyId === company.id);
  const activities = world.activities.filter((a) => a.companyIds?.includes(company.id));
  const flagged = Boolean(company.flaggedDuplicate || world.flags["company.duplicateFlagged"]);

  return (
    <div className="hs-record-3pane" data-testid="company-record">
      {/* LEFT SIDEBAR */}
      <aside className="hs-record-left hs-scroll">
        <div className="p-4">
          <A to="/companies" className="hs-link inline-flex items-center gap-1 text-[12.5px]">
            <Icon name="chevronLeft" size={14} /> Companies
          </A>

          <div className="mt-3 flex items-start gap-3">
            <Avatar name={company.name} color={colorFor(company.id)} size={42} />
            <div className="min-w-0 flex-1">
              <h1 className="text-[17.5px] font-bold leading-snug text-[#33475b]">{company.name}</h1>
              <p className="mt-0.5 truncate text-[12px] text-[#006162]">{company.domain || "No domain on record"}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Tag tone="blue">{primaryDiv}</Tag>
                {parentCompany ? <Tag tone="teal">Child Branch</Tag> : null}
                {childCompanies.length > 0 ? <Tag tone="teal">Parent HQ</Tag> : null}
              </div>
            </div>
          </div>

          <QuickActionRow onSelect={(k) => setComposerKind(k)} />
        </div>

        {company.crossDivision ? (
          <CollapsibleLeftGroup title="Cross-Division Activity" defaultOpen testId="cross-division-left-card">
            <dl>
              <Prop label="Divisions active">
                <span className="flex flex-wrap gap-1">
                  {company.crossDivision.divisionsActive.map((divName) => (
                    <span key={divName} className="hs-assoc-chip rounded px-1.5 py-0.5 text-[11px]">
                      {divName}
                    </span>
                  ))}
                </span>
              </Prop>
              <Prop label="Most recent active division">{company.crossDivision.mostRecentActiveDivision}</Prop>
              <Prop label="Most recent division contact">{company.crossDivision.mostRecentDivisionContact}</Prop>
              <Prop label="Last division activity">{shortDate(company.crossDivision.lastDivisionActivity)}</Prop>
            </dl>
          </CollapsibleLeftGroup>
        ) : null}

        <CollapsibleLeftGroup title="Key information" defaultOpen>
          <dl>
            <Prop label="Company owner">{owner?.name ?? company.ownerId ?? "—"}</Prop>
            <Prop label="Street Address">{`${effectiveCity}, ${company.state}`}</Prop>
            <Prop label="Customer Account # (Oracle)">{company.erp ? erpOracleCustomerIdFromCompany(company) : "—"}</Prop>
          </dl>
        </CollapsibleLeftGroup>

        <CollapsibleLeftGroup
          title="About this company"
          defaultOpen
          right={!canEditCompany ? <Tag tone="amber">Locked</Tag> : undefined}
        >
          <dl>
            <Prop label="Company domain name">{company.domain || "— (Missing)"}</Prop>
            <Prop label="Industry">{company.industry}</Prop>
            <Prop label="Primary AMICO Division">{primaryDiv}</Prop>
            <Prop label="Company owner">{owner?.name ?? company.ownerId ?? "—"}</Prop>
            <Prop
              label="Phone number"
              editable={canEditCompany}
              onEditClick={() => canEditCompany && setDraftPhone(effectivePhone)}
            >
              {draftPhone !== null ? (
                <input
                  value={effectivePhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  className="hs-input !h-7 w-full !bg-white"
                />
              ) : (
                effectivePhone
              )}
            </Prop>
            <Prop
              label="City"
              editable={canEditCompany}
              onEditClick={() => canEditCompany && setDraftCity(effectiveCity)}
            >
              {draftCity !== null ? (
                <input
                  value={effectiveCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  className="hs-input !h-7 w-full !bg-white"
                />
              ) : (
                `${effectiveCity}, ${company.state}`
              )}
            </Prop>
            <Prop label="Annual revenue">{company.revenue ? money(company.revenue) : "—"}</Prop>
          </dl>
        </CollapsibleLeftGroup>

        {company.erp ? (
          <CollapsibleLeftGroup title="Epicor ERP Account Details" defaultOpen>
            <dl>
              <Prop label="ERP System">{company.erp.systemName ?? "Epicor Kinetic"}</Prop>
              <Prop label="Epicor Customer ID">
                <span className="font-mono font-semibold">{company.erp.accountNumber}</span>
              </Prop>
              <Prop label="Credit Status">
                <Tag tone={statusTone(company.erp.creditStatus)}>{company.erp.creditStatus}</Tag>
              </Prop>
              <Prop label="Credit Limit">{money(company.erp.creditLimit)}</Prop>
            </dl>
          </CollapsibleLeftGroup>
        ) : null}

        {isDirty ? (
          <div
            className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-[#cbd6e2] bg-[#f5f8fa] px-4 py-3 shadow-[0_-4px_12px_rgba(31,42,55,0.08)]"
            data-testid="left-sidebar-dirty-bar"
          >
            <Button
              variant="primary"
              size="sm"
              data-testid="save-record-props-btn"
              onClick={() => {
                dispatch({
                  t: "ui",
                  k: `coEdit:${company.id}`,
                  v: JSON.stringify({ phone: effectivePhone, city: effectiveCity }),
                });
                setDraftPhone(null);
                setDraftCity(null);
                setSavedToast(true);
                setTimeout(() => setSavedToast(false), 1800);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              data-testid="cancel-record-props-btn"
              onClick={() => {
                setDraftPhone(null);
                setDraftCity(null);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : savedToast ? (
          <div className="mt-auto border-t border-[#dfe3eb] bg-[#e5f8f6] px-4 py-2 text-[12px] font-semibold text-[#006c5f]">
            ✓ Company properties saved
          </div>
        ) : null}
      </aside>

      {/* MIDDLE CANVAS */}
      <section className="hs-record-center hs-scroll">
        <div className="border-b border-[#dfe3eb] bg-white px-6 pt-1">
          <LineTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "overview", label: "Overview", testId: "record-tab-overview" },
              { id: "activities", label: `Activities (${activities.length})`, testId: "record-tab-activities" },
            ]}
          />
        </div>

        <div className="space-y-4 p-5">
          {/* Governance Banners */}
          {!canEditCompany ? (
            <Ext id="division-edit-lock">
              <div
                className="flex items-center gap-2.5 rounded-[4px] border border-[#f5c26b] bg-[#fef6e7] px-4 py-2.5 text-[12.5px] font-semibold text-[#8a5300]"
                data-testid="company-edit-locked-banner"
              >
                <Icon name="lock" size={15} className="shrink-0" />
                <span>
                  Company properties edit-locked ({primaryDiv} primary account) · Timeline notes, @mentions &amp; your division Deals remain open
                </span>
              </div>
            </Ext>
          ) : null}

          {company.missingDomainDuplicateOf ? (
            <Ext id="duplicate-escalation-rule">
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-[#f7b2b6] bg-[#fdecee] px-4 py-3 text-[13px]"
                data-testid="suspected-duplicate-banner"
              >
                <div>
                  <p className="font-semibold text-[#b0232a]">
                    Suspected Legacy ERP Duplicate (Missing Domain){duplicateTarget ? ` of ${duplicateTarget.name}` : ""}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#516f90]">
                    AMICO Governance: Never merge or delete Companies manually — ERP customer keys must be reconciled by your NSM or Penguin Strategies.
                  </p>
                </div>
                {flagged ? (
                  <Tag tone="green">✓ Escalated to NSM / Penguin Admin</Tag>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    icon="flag"
                    data-testid="flag-duplicate-btn"
                    onClick={() => dispatch({ t: "company.flagDuplicate", companyId: company.id, at: nowMs() })}
                  >
                    Flag duplicate to NSM / Penguin
                  </Button>
                )}
              </div>
            </Ext>
          ) : null}

          {tab === "overview" ? (
            <>
              {/* 4-Column HubSpot Data Highlights */}
              <Card title="Data highlights">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Primary Division</p>
                    <p className="mt-1 text-[13px] font-bold text-[#33475b]">{primaryDiv}</p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Divisions Active</p>
                    <p className="mt-1 text-[13px] font-bold text-[#006162]">
                      {company.crossDivision?.divisionsActive.length ?? 1} of 9
                    </p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Annual Revenue</p>
                    <p className="mt-1 text-[13px] font-bold tabular-nums text-[#33475b]">
                      {company.revenue ? money(company.revenue) : "—"}
                    </p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Last Activity</p>
                    <p className="mt-1 text-[13px] font-bold text-[#33475b]">
                      {company.crossDivision ? shortDate(company.crossDivision.lastDivisionActivity) : "Recent"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Cross-Division Account Penetration Card (Overview Centerpiece) */}
              {company.crossDivision ? (
                <Ext id="cross-division-card">
                  <Card
                    title="Cross-Division Summary & Account Penetration"
                    right={<Tag tone="purple">AMICO Multi-Division Visibility</Tag>}
                    testId="cross-division-card"
                  >
                    <p className="mb-3 text-[12.5px] text-[#516f90]">
                      Shows which AMICO divisions actively sell into {company.name} so reps coordinate via <code className="rounded bg-[#eaf0f6] px-1 text-[#33475b]">@mention</code> before outbound outreach, while keeping restricted division pricing private.
                    </p>
                    <div className="grid grid-cols-2 gap-3 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3 text-[12.5px]">
                      <div>
                        <span className="text-[11px] font-semibold uppercase text-[#516f90]">Active AMICO Divisions</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {company.crossDivision.divisionsActive.map((divName) => (
                            <Tag key={divName} tone={divName === primaryDiv ? "blue" : "purple"}>
                              {divName}
                            </Tag>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p>
                          <span className="text-[#516f90]">Most Recent Division:</span>{" "}
                          <strong className="text-[#33475b]">{company.crossDivision.mostRecentActiveDivision}</strong>
                        </p>
                        <p>
                          <span className="text-[#516f90]">Division Point of Contact:</span>{" "}
                          <strong className="text-[#33475b]">{company.crossDivision.mostRecentDivisionContact}</strong>
                        </p>
                        <p>
                          <span className="text-[#516f90]">Last Cross-Division Touch:</span>{" "}
                          <strong className="text-[#33475b]">{date(company.crossDivision.lastDivisionActivity)}</strong>
                        </p>
                      </div>
                    </div>
                    {restrictedDealCount > 0 ? (
                      <p className="mt-2.5 text-[11.5px] text-[#516f90]">
                        <Icon name="shield" size={12} className="mr-1 inline text-[#006162]" />
                        {restrictedDealCount} other-division deal{restrictedDealCount === 1 ? " is" : "s are"} hidden per {persona.division} team permissions — @mention {company.crossDivision.mostRecentDivisionContact} on a Note to coordinate.
                      </p>
                    ) : null}
                  </Card>
                </Ext>
              ) : null}

              {/* Recent Activities + Quick Launch */}
              <ActivityTimelinePane
                activities={activities}
                primaryEmail={contacts[0]?.email}
                onOpenComposer={(k) => setComposerKind(k)}
              />
            </>
          ) : (
            <ActivityTimelinePane
              activities={activities}
              primaryEmail={contacts[0]?.email}
              onOpenComposer={(k) => setComposerKind(k)}
            />
          )}
        </div>
      </section>

      {/* RIGHT SIDEBAR */}
      <aside className="hs-record-right hs-scroll divide-y divide-[#dfe3eb]">
        {/* Related Companies (Parent / Child) */}
        <div className="p-4" data-testid="related-companies-card">
          <Ext id="parent-child-hierarchy">
            <AssocHeader
              title="Related Companies"
              count={(parentCompany ? 1 : 0) + childCompanies.length}
              open={relOpen}
              onToggle={() => setRelOpen((o) => !o)}
            />
            {relOpen ? (
              <div className="mt-2.5 space-y-2">
                {!parentCompany && childCompanies.length === 0 ? (
                  <p className="text-[12px] text-[#516f90]">Standalone corporate account.</p>
                ) : null}
                {parentCompany ? (
                  <div className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-2.5 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <Tag tone="teal">Parent HQ</Tag>
                      <button
                        type="button"
                        onClick={() => dispatch({ t: "ui", k: "preview", v: `company:${parentCompany.id}` })}
                        className="hs-preview-btn"
                      >
                        Preview
                      </button>
                    </div>
                    <A
                      to={`/companies/${parentCompany.id}`}
                      className="hs-link mt-1 block"
                      data-testid={`parent-company-link-${parentCompany.id}`}
                    >
                      {parentCompany.name}
                    </A>
                    <p className="text-[11.5px] text-[#516f90]">
                      {parentCompany.city}, {parentCompany.state}
                    </p>
                  </div>
                ) : null}
                {childCompanies.map((ch) =>
                  ch ? (
                    <div key={ch.id} className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-2.5 text-[12.5px]">
                      <div className="flex items-center justify-between">
                        <Tag tone="blue">Child Branch</Tag>
                        <button
                          type="button"
                          onClick={() => dispatch({ t: "ui", k: "preview", v: `company:${ch.id}` })}
                          className="hs-preview-btn"
                        >
                          Preview
                        </button>
                      </div>
                      <A
                        to={`/companies/${ch.id}`}
                        className="hs-link mt-1 block"
                        data-testid={`child-company-link-${ch.id}`}
                      >
                        {ch.name}
                      </A>
                      <p className="text-[11.5px] text-[#516f90]">
                        {ch.crossDivision?.primaryDivision ?? ch.industry} · {ch.city}, {ch.state}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null}
          </Ext>
        </div>

        {/* Associated Contacts */}
        <div className="p-4">
          <AssocHeader title="Contacts" count={contacts.length} open={contactsOpen} onToggle={() => setContactsOpen((o) => !o)} />
          {contactsOpen ? (
            <div className="mt-2.5 space-y-2">
              {contacts.map((c, idx) => (
                <div key={c.id} className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px] hover:border-[#99acc2]">
                  <div className="flex items-center justify-between gap-2">
                    <A to={`/contacts/${c.id}`} className="hs-link">
                      {c.firstName} {c.lastName}
                    </A>
                    {idx === 0 ? <Tag tone="blue">Primary</Tag> : null}
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[#516f90]">{c.title}</p>
                  <p className="truncate text-[11.5px] text-[#006162]">{c.email}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Associated Deals */}
        <div className="p-4">
          <AssocHeader title="Deals" count={visibleDeals.length} open={dealsOpen} onToggle={() => setDealsOpen((o) => !o)} />
          {dealsOpen ? (
            <div className="mt-2.5 space-y-2">
              {visibleDeals.map((d) => (
                <div key={d.id} className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px] hover:border-[#99acc2]">
                  <A to={`/deals/${d.id}`} className="hs-link">
                    {d.name}
                  </A>
                  <p className="mt-0.5 text-[11.5px] text-[#516f90]">
                    {d.division} · <strong className="text-[#33475b]">{money(d.amount)}</strong>
                  </p>
                </div>
              ))}
              {visibleDeals.length === 0 ? (
                <p className="text-[12px] text-[#516f90]">No deals visible for your division.</p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Synced Epicor Quotes */}
        {epicorQuotes.length > 0 ? (
          <div className="p-4">
            <AssocHeader title="Epicor Quotes" count={epicorQuotes.length} open={eqOpen} onToggle={() => setEqOpen((o) => !o)} />
            {eqOpen ? (
              <div className="mt-2.5 space-y-2">
                {epicorQuotes.map((eq) => (
                  <div key={eq.id} className="rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <A to={`/epicor-quotes/${eq.id}`} className="hs-link">
                        {eq.quoteNumber}
                      </A>
                      <Tag tone={statusTone(eq.status)}>{eq.status}</Tag>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-[#516f90]">{eq.title} · {money2(eq.total)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Delivery Projects */}
        {projects.length > 0 ? (
          <div className="p-4">
            <AssocHeader title="Projects" count={projects.length} open={projOpen} onToggle={() => setProjOpen((o) => !o)} />
            {projOpen ? (
              <div className="mt-2.5 space-y-2">
                {projects.map((p) => (
                  <div key={p.id} className="rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
                    <A to={`/projects/${p.id}`} className="hs-link">
                      {p.code} · {p.name}
                    </A>
                    <p className="mt-0.5 text-[11.5px] text-[#516f90]">{p.status}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>

      {composerKind ? (
        <FloatingComposer
          kind={composerKind}
          onKindChange={setComposerKind}
          onClose={() => setComposerKind(null)}
          target={{
            recordLabel: company.name,
            contactIds: contacts.map((c) => c.id),
            companyIds: [company.id],
            dealIds: visibleDeals.map((d) => d.id),
            defaultEmailTo: contacts[0]?.email,
          }}
        />
      ) : null}
    </div>
  );
}

/* ═══════════════════════════ 3. DEAL 3-PANE RECORD ═══════════════════════════ */
export function DealRecord({ id }: { id: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const deal = world.deals.find((d) => d.id === id);
  useSeen(`seen.deal.${id}`, Boolean(deal));

  const [tab, setTab] = useState<"overview" | "activities" | "quoting">("overview");
  const [composerKind, setComposerKind] = useState<ComposerKind | null>(null);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);
  const [selectedSku, setSelectedSku] = useState(pack.products[0]?.sku ?? "");
  const [skuQty, setSkuQty] = useState("10");

  // Left-sidebar inline edit draft state + sticky Save / Cancel footer
  const [draftAmount, setDraftAmount] = useState<string | null>(null);
  const [draftCloseDate, setDraftCloseDate] = useState<string | null>(null);
  const [draftBidDate, setDraftBidDate] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const [coOpen, setCoOpen] = useState(true);
  const [ctOpen, setCtOpen] = useState(true);
  const [prjOpen, setPrjOpen] = useState(true);
  const [attOpen, setAttOpen] = useState(true);

  if (!deal) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Deal not found">
            <A to="/deals" className="hs-link">
              Back to Deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const pipeline = pack.pipelines.find((p) => p.id === deal.pipelineId);
  const isReadOnly = Boolean(deal.readOnly || pipeline?.readOnly);
  const currentStage = pipeline?.stages.find((s) => s.id === deal.stage);

  const primaryCompany = world.companies.find((c) => c.id === deal.companyId);
  const allCompanyIds = [...new Set([deal.companyId, ...(deal.additionalCompanyIds ?? []), ...Object.keys(deal.companyLabels ?? {})])];
  const associatedCompanies = allCompanyIds.map((cid) => world.companies.find((c) => c.id === cid)).filter(Boolean);
  const associatedContacts = world.contacts.filter((c) => deal.contactIds.includes(c.id));
  const epicorQuotes = world.epicorQuotes.filter((eq) => eq.dealId === deal.id);
  const nativeQuotes = world.quotes.filter((q) => q.dealId === deal.id);
  const primaryQuote = nativeQuotes[0];
  const linkedProjects = world.projects.filter((p) => p.dealId === deal.id);
  const activities = world.activities.filter((a) => a.dealIds?.includes(deal.id));
  const openTasks = world.tasks.filter((t) => t.dealId === deal.id && t.status !== "done");

  const isDirty = draftAmount !== null || draftCloseDate !== null || draftBidDate !== null;

  useEffect(() => {
    if (composerKind === "email") {
      dispatch({ t: "flag", k: "email.composer.opened" });
      dispatch({ t: "flag", k: `email.composer.deal.${deal.id}` });
    }
  }, [composerKind, deal.id, dispatch]);

  function handleStageClick(st: DealStage) {
    if (isReadOnly || st.id === deal?.stage) return;
    if (st.prompt) {
      setPendingStage(st);
      return;
    }
    dispatch({ t: "deal.setStage", dealId: deal!.id, stage: st.id, at: nowMs() });
  }

  const shippingSummary = [deal.shippingStreet || deal.projectAddress, deal.shippingCity || deal.projectCity, deal.projectState]
    .filter(Boolean)
    .join(", ");

  const hasWorkbook = (deal.workbookPresets && deal.workbookPresets.length > 0) || deal.pipelineId === "security-fence";

  return (
    <div className="hs-record-3pane" data-testid="deal-record">
      {/* 1. LEFT SIDEBAR (305px, #ffffff, right border #dfe3eb, independently scrollable) */}
      <aside className="hs-record-left hs-scroll">
        <div className="p-4">
          <A to="/deals" className="hs-link inline-flex items-center gap-1 text-[12.5px]">
            <Icon name="chevronLeft" size={14} /> Deals
          </A>

          <div className="mt-2.5">
            <h1 className="text-[17.5px] font-bold leading-snug text-[#33475b]">{deal.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
              <span className="text-[17px] font-bold tabular-nums text-[#33475b]" data-testid="deal-amount">
                {money2(deal.amount)}
              </span>
              <Tag tone="blue">{deal.division}</Tag>
            </div>
            <p className="mt-1 text-[12px] text-[#516f90]">
              Pipeline: <strong className="text-[#33475b]">{pipeline?.name ?? deal.division}</strong>
            </p>
          </div>

          <QuickActionRow disabled={isReadOnly} onSelect={(k) => setComposerKind(k)} />

          {/* Deal Stage Segmented Progress Bar + Stage Dropdown + Close Date */}
          {pipeline ? (
            <Ext id="stage-gate-prompts" className="mt-4 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#516f90]">Stage:</span>
                <select
                  disabled={isReadOnly}
                  aria-label="Deal stage"
                  value={deal.stage}
                  onChange={(e) => {
                    const st = pipeline.stages.find((s) => s.id === e.target.value);
                    if (st) handleStageClick(st);
                  }}
                  className="rounded border border-[#cbd6e2] bg-white px-2 py-0.5 text-[12px] font-semibold text-[#006162]"
                >
                  {pipeline.stages.map((st) => {
                    const pct = st.probability > 0 && st.probability <= 1 ? Math.round(st.probability * 100) : Math.round(st.probability);
                    return (
                      <option key={st.id} value={st.id}>
                        {st.label} ({pct}%)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Clickable Segmented Stage Progress Bar */}
              <div className="mt-2.5 flex flex-wrap gap-1" data-testid="deal-stage-bar">
                {pipeline.stages.map((st, idx) => {
                  const activeIdx = pipeline.stages.findIndex((x) => x.id === deal.stage);
                  const passed = idx <= activeIdx;
                  const active = st.id === deal.stage;
                  const pct = st.probability > 0 && st.probability <= 1 ? Math.round(st.probability * 100) : Math.round(st.probability);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={isReadOnly}
                      title={`${st.label} (${pct}%)`}
                      data-testid={`deal-stage-${st.id}`}
                      onClick={() => handleStageClick(st)}
                      className={cx(
                        "rounded-[3px] px-1.5 py-1 text-[10.5px] font-semibold transition-colors",
                        active
                          ? "bg-[#ff5c35] text-white"
                          : passed
                            ? "bg-[#006162]/20 text-[#00494b] hover:bg-[#006162]/30"
                            : "bg-white text-[#516f90] border border-[#dfe3eb] hover:bg-[#eaf0f6]",
                        isReadOnly && "cursor-default",
                      )}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#516f90]">
                <span>Close date: <strong className="text-[#33475b]">{shortDate(deal.closeDate)}</strong></span>
                {currentStage ? (
                  <span>
                    {currentStage.probability > 0 && currentStage.probability <= 1
                      ? Math.round(currentStage.probability * 100)
                      : Math.round(currentStage.probability)}
                    % prob.
                  </span>
                ) : null}
              </div>
            </Ext>
          ) : null}
        </div>

        {/* Collapsible Group 1: About this deal */}
        <CollapsibleLeftGroup title="About this deal" defaultOpen>
          <dl>
            <Prop
              label="Amount"
              editable={!isReadOnly}
              onEditClick={() => !isReadOnly && setDraftAmount(String(deal.amount))}
            >
              {draftAmount !== null ? (
                <input
                  type="number"
                  value={draftAmount}
                  data-testid="deal-amount-input"
                  onChange={(e) => setDraftAmount(e.target.value)}
                  className="hs-input !h-7 w-full !bg-white tabular-nums"
                />
              ) : (
                <span className="font-semibold tabular-nums">{money2(deal.amount)}</span>
              )}
            </Prop>
            <Prop
              label="Close date"
              editable={!isReadOnly}
              onEditClick={() => !isReadOnly && setDraftCloseDate(deal.closeDate.slice(0, 10))}
            >
              {draftCloseDate !== null ? (
                <input
                  type="date"
                  value={draftCloseDate}
                  data-testid="deal-closedate-input"
                  onChange={(e) => setDraftCloseDate(e.target.value)}
                  className="hs-input !h-7 w-full !bg-white"
                />
              ) : (
                date(deal.closeDate)
              )}
            </Prop>
            {deal.bidDate || draftBidDate !== null ? (
              <Prop
                label="Bid date"
                editable={!isReadOnly}
                onEditClick={() => !isReadOnly && setDraftBidDate((deal.bidDate ?? deal.closeDate).slice(0, 10))}
              >
                {draftBidDate !== null ? (
                  <input
                    type="date"
                    value={draftBidDate}
                    onChange={(e) => setDraftBidDate(e.target.value)}
                    className="hs-input !h-7 w-full !bg-white"
                  />
                ) : (
                  date(deal.bidDate!)
                )}
              </Prop>
            ) : null}
            <Prop label="Pipeline">{pipeline?.name ?? deal.pipelineId}</Prop>
            <Prop label="Quoting route">{pipeline?.quotingRoute ?? deal.externalQuoteSource ?? "HubSpot"}</Prop>
          </dl>
        </CollapsibleLeftGroup>

        {/* Collapsible Group 2: Deal Team (Multi-Owner) */}
        <Ext id="multi-owner-deal">
          <CollapsibleLeftGroup title="Deal Team (Multi-Owner)" defaultOpen testId="deal-owners-card">
            <div className="space-y-2.5 text-[12px]">
              <label className="block space-y-0.5">
                <span className="text-[11.5px] font-medium text-[#516f90]">Outside Sales Owner</span>
                <select
                  disabled={isReadOnly}
                  value={deal.outsideSalesOwnerId ?? deal.ownerId ?? ""}
                  data-testid="outside-owner-select"
                  onChange={(e) =>
                    dispatch({
                      t: "deal.updateFields",
                      dealId: deal.id,
                      patch: { outsideSalesOwnerId: e.target.value },
                      at: nowMs(),
                    })
                  }
                  className="hs-input !h-7 w-full !bg-white !text-[12px]"
                >
                  {pack.personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.division})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-0.5">
                <span className="text-[11.5px] font-medium text-[#516f90]">Inside Sales Coordinator</span>
                <select
                  disabled={isReadOnly}
                  value={deal.insideSalesOwnerId ?? ""}
                  data-testid="inside-owner-select"
                  onChange={(e) =>
                    dispatch({
                      t: "deal.updateFields",
                      dealId: deal.id,
                      patch: { insideSalesOwnerId: e.target.value || undefined },
                      at: nowMs(),
                    })
                  }
                  className="hs-input !h-7 w-full !bg-white !text-[12px]"
                >
                  <option value="">Unassigned</option>
                  {pack.personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.title})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-0.5">
                <span className="text-[11.5px] font-medium text-[#516f90]">Assigned Estimator</span>
                <select
                  disabled={isReadOnly}
                  value={deal.estimatorOwnerId ?? ""}
                  data-testid="estimator-owner-select"
                  onChange={(e) =>
                    dispatch({
                      t: "deal.updateFields",
                      dealId: deal.id,
                      patch: { estimatorOwnerId: e.target.value || undefined },
                      at: nowMs(),
                    })
                  }
                  className="hs-input !h-7 w-full !bg-white !text-[12px]"
                >
                  <option value="">Unassigned</option>
                  {pack.personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.title})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </CollapsibleLeftGroup>
        </Ext>

        {/* Collapsible Group 3: Security Fence Estimating & Bid Details */}
        <CollapsibleLeftGroup title="Security Fence Estimating & Bid Details" defaultOpen testId="deal-pipedrive-card">
          <dl>
            <Prop label="Drawings Received">{deal.drawingsReceived ?? "—"}</Prop>
            <Prop label="Engineering Required">{deal.engineeringRequired ?? "—"}</Prop>
            <Prop label="Project / PM Handoff Required">{deal.handoffRequired ?? "—"}</Prop>
            {deal.customerPo ? <Prop label="Customer PO #">{deal.customerPo}</Prop> : null}
            {deal.amicoOrderNumber ? <Prop label="AMICO Order #">{deal.amicoOrderNumber}</Prop> : null}
            {deal.lostReason ? <Prop label="Lost Reason">{deal.lostReason}</Prop> : null}
            {shippingSummary ? <Prop label="Jobsite Shipping Address">{shippingSummary}</Prop> : null}
          </dl>
        </CollapsibleLeftGroup>

        {/* Sticky Left-Sidebar Save / Cancel Bar on Unsaved Edits */}
        {isDirty ? (
          <div
            className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-[#cbd6e2] bg-[#f5f8fa] px-4 py-3 shadow-[0_-4px_12px_rgba(31,42,55,0.08)]"
            data-testid="left-sidebar-dirty-bar"
          >
            <Button
              variant="primary"
              size="sm"
              data-testid="save-record-props-btn"
              onClick={() => {
                const patch: Partial<Deal> = {};
                if (draftAmount !== null) patch.amount = Number(draftAmount) || 0;
                if (draftCloseDate !== null) patch.closeDate = draftCloseDate;
                if (draftBidDate !== null) patch.bidDate = draftBidDate;
                dispatch({ t: "deal.updateFields", dealId: deal.id, patch, at: nowMs() });
                setDraftAmount(null);
                setDraftCloseDate(null);
                setDraftBidDate(null);
                setSavedToast(true);
                setTimeout(() => setSavedToast(false), 1800);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              data-testid="cancel-record-props-btn"
              onClick={() => {
                setDraftAmount(null);
                setDraftCloseDate(null);
                setDraftBidDate(null);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : savedToast ? (
          <div className="mt-auto border-t border-[#dfe3eb] bg-[#e5f8f6] px-4 py-2 text-[12px] font-semibold text-[#006c5f]">
            ✓ Deal properties saved
          </div>
        ) : null}
      </aside>

      {/* 2. MIDDLE CANVAS (#f5f8fa, independently scrollable) */}
      <section className="hs-record-center hs-scroll">
        <div className="border-b border-[#dfe3eb] bg-white px-6 pt-1">
          <LineTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "overview", label: "Overview", testId: "record-tab-overview" },
              { id: "activities", label: `Activities (${activities.length})`, testId: "record-tab-activities" },
              { id: "quoting", label: "Quotes / Bidding", testId: "record-tab-quoting" },
            ]}
          />
        </div>

        <div className="space-y-4 p-5">
          {isReadOnly ? (
            <Ext id="global-shadow-pipeline">
              <div
                className="flex items-center gap-2.5 rounded-[4px] border border-[#f5c26b] bg-[#fef6e7] px-4 py-2.5 text-[12.5px] font-semibold text-[#8a5300]"
                data-testid="global-readonly-banner"
              >
                <Icon name="lock" size={15} className="shrink-0" />
                <span>
                  Read-only Global Shadow Deal · Synced automatically from {deal.sourceDivision ?? deal.division} source deal
                </span>
              </div>
            </Ext>
          ) : null}

          {tab === "overview" ? (
            <>
              {/* 4-Column HubSpot Data Highlights */}
              <Card title="Data highlights">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Amount</p>
                    <p className="mt-1 text-[14px] font-bold tabular-nums text-[#33475b]">{money(deal.amount)}</p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Deal Stage</p>
                    <p className="mt-1 truncate text-[13px] font-bold text-[#006162]">{currentStage?.label ?? deal.stage}</p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Close Date</p>
                    <p className="mt-1 text-[13px] font-bold text-[#33475b]">{shortDate(deal.closeDate)}</p>
                  </div>
                  <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
                    <p className="text-[11px] font-semibold uppercase text-[#516f90]">Active Quote</p>
                    <p className="mt-1 truncate text-[13px] font-bold text-[#33475b]">
                      {deal.quoteNumber ? `${deal.quoteNumber} ${deal.quoteRevision ?? ""}` : epicorQuotes[0]?.quoteNumber ?? "Pending"}
                    </p>
                  </div>
                </div>
              </Card>

              {deal.pipelineId === "security-fence" ? (
                <>
                  <Card title="Estimating Progress" testId="deal-estimating-progress-card">
                    <dl className="grid grid-cols-2 gap-3 text-[13px]">
                      <Prop label="Drawings Received">{deal.drawingsReceived ?? "—"}</Prop>
                      <Prop label="Engineering Required">{deal.engineeringRequired ?? "—"}</Prop>
                      <Prop label="Project / Handoff Required">{deal.handoffRequired ?? "—"}</Prop>
                    </dl>
                  </Card>
                  <Card title="Quoting" testId="deal-quoting-card">
                    <dl className="grid grid-cols-2 gap-3 text-[13px]">
                      <Prop label="Quote Date">{deal.quoteDate ? shortDate(deal.quoteDate) : "—"}</Prop>
                      <Prop label="Quoted Value">{money(deal.amount)}</Prop>
                      <Prop label="Quote Number">{deal.quoteNumber ?? "—"}</Prop>
                      <Prop label="Quoted Lead Time (weeks)">{deal.quotedLeadTimeWeeks ?? "—"}</Prop>
                    </dl>
                  </Card>
                </>
              ) : null}

              {/* Scheduled Open Tasks on Deal */}
              {openTasks.length > 0 ? (
                <Card title={`Open Deal Tasks (${openTasks.length})`} testId="deal-open-tasks-card">
                  <div className="space-y-2">
                    {openTasks.map((tk) => (
                      <label
                        key={tk.id}
                        className="flex items-center justify-between gap-3 rounded-[3px] border border-[#dfe3eb] bg-[#f5f8fa] px-3 py-2 text-[13px]"
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={tk.status === "done"}
                            data-testid={`deal-task-check-${tk.id}`}
                            onChange={() => dispatch({ t: "task.toggle", id: tk.id })}
                            className="accent-[#006162]"
                          />
                          <span className="font-semibold text-[#33475b]">{tk.title}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {tk.queue ? <Tag tone="purple">{tk.queue}</Tag> : null}
                          <Tag tone={tk.priority === "High" ? "red" : "neutral"}>{tk.priority}</Tag>
                        </div>
                      </label>
                    ))}
                  </div>
                </Card>
              ) : null}

              {/* Oracle SKU Quote Builder (for Native HubSpot Quote Pipelines) */}
              {!isReadOnly && pipeline?.quotingRoute.toLowerCase().includes("hubspot") ? (
                <Ext id="oracle-native-quotes">
                  <Card title="Oracle Product Library & Native HubSpot Quote" testId="oracle-quote-builder-card">
                    <div className="flex flex-wrap items-end gap-2 text-[13px]">
                      <label className="flex-1 space-y-1">
                        <span className="text-[11.5px] font-medium text-[#516f90]">Oracle SKU</span>
                        <select
                          value={selectedSku}
                          onChange={(e) => setSelectedSku(e.target.value)}
                          data-testid="oracle-sku-select"
                          className="hs-input !h-8 w-full !bg-white"
                        >
                          {pack.products.map((pr) => (
                            <option key={pr.sku} value={pr.sku}>
                              {pr.sku} · {pr.name} ({money2(pr.price)})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="w-20 space-y-1">
                        <span className="text-[11.5px] font-medium text-[#516f90]">Qty</span>
                        <input
                          type="number"
                          min={1}
                          value={skuQty}
                          onChange={(e) => setSkuQty(e.target.value)}
                          data-testid="oracle-qty-input"
                          className="hs-input !h-8 w-full !bg-white"
                        />
                      </label>
                      <Button
                        size="sm"
                        icon="plus"
                        data-testid="add-oracle-sku-btn"
                        onClick={() =>
                          dispatch({
                            t: "deal.addOracleLine",
                            dealId: deal.id,
                            sku: selectedSku,
                            qty: Math.max(1, Number(skuQty) || 1),
                            at: nowMs(),
                          })
                        }
                      >
                        Add line item
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon="quote"
                        data-testid="create-native-quote-btn"
                        onClick={() => {
                          dispatch({ t: "quote.create", dealId: deal.id, at: nowMs() });
                          const existing = world.quotes.find((q) => q.dealId === deal.id);
                          if (existing) navigate(`/quotes/${existing.id}`);
                        }}
                      >
                        Create HubSpot Quote
                      </Button>
                    </div>

                    {deal.lineItems.length > 0 ? (
                      <div className="mt-3 hs-grid-wrap">
                        <table className="hs-grid" data-testid="deal-lines-table">
                          <thead>
                            <tr>
                              <th>SKU</th>
                              <th>Item</th>
                              <th className="!text-right">Qty</th>
                              <th className="!text-right">Unit Price</th>
                              <th className="!text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deal.lineItems.map((ln, idx) => (
                              <tr key={idx}>
                                <td className="font-mono text-[12px] font-semibold">{ln.sku}</td>
                                <td>{ln.name}</td>
                                <td className="text-right tabular-nums">{ln.qty}</td>
                                <td className="text-right tabular-nums">{money2(ln.unitPrice)}</td>
                                <td className="text-right font-semibold tabular-nums">
                                  {money2(ln.qty * ln.unitPrice * (1 - (ln.discountPct ?? 0) / 100))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </Card>
                </Ext>
              ) : null}

              <ActivityTimelinePane
                activities={activities}
                openTasksCount={openTasks.length}
                readOnly={isReadOnly}
                primaryEmail={associatedContacts[0]?.email}
                onOpenComposer={(k) => setComposerKind(k)}
              />
            </>
          ) : tab === "activities" ? (
            <ActivityTimelinePane
              activities={activities}
              openTasksCount={openTasks.length}
              readOnly={isReadOnly}
              primaryEmail={associatedContacts[0]?.email}
              onOpenComposer={(k) => setComposerKind(k)}
            />
          ) : (
            /* Quotes / Bidding Tab */
            <div className="space-y-4">
              <Card title="Quoting Route & Revision History">
                <p className="text-[13px] text-[#516f90]">
                  Division Quoting Method: <strong className="text-[#33475b]">{pipeline?.quotingRoute ?? "HubSpot"}</strong>
                </p>
                {deal.workbookPresets && deal.workbookPresets.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {deal.workbookPresets.map((wb) => (
                      <div key={wb.id} className="flex items-center justify-between rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3 text-[13px]">
                        <div>
                          <p className="font-semibold text-[#33475b]">
                            {wb.quoteNumber} ({wb.revision}) · {wb.summary}
                          </p>
                          <p className="text-[12px] text-[#516f90]">
                            {money2(wb.amount)} · Lead time: {wb.leadTimeWeeks} weeks · PDF: {wb.pdfName}
                          </p>
                        </div>
                        {!isReadOnly ? (
                          <Button
                            size="xs"
                            variant={deal.quoteRevision === wb.revision ? "secondary" : "primary"}
                            onClick={() => dispatch({ t: "deal.ingestWorkbookQuote", dealId: deal.id, presetId: wb.id, at: nowMs() })}
                          >
                            {deal.quoteRevision === wb.revision ? "Active Revision" : `Ingest ${wb.revision}`}
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* 3. RIGHT SIDEBAR (315px, #ffffff, left border #dfe3eb, independently scrollable) */}
      <aside className="hs-record-right hs-scroll divide-y divide-[#dfe3eb]">
        {/* AMICO Custom Card: Epicor ERP Sync / Pricing Workbook Quote Ingestion */}
        {hasWorkbook || epicorQuotes.length > 0 || deal.externalQuoteSource ? (
          <div className="p-4" data-testid="workbook-ingestion-card">
            <Ext id="workbook-quote-sync">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[#33475b]">Epicor &amp; Quote Ingestion</span>
                <Tag tone="purple">
                  {deal.quoteRevision ? `${deal.quoteNumber ?? "WB"} · ${deal.quoteRevision}` : epicorQuotes[0]?.quoteNumber ?? "ERP / Workbook"}
                </Tag>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-[#516f90]">
                {hasWorkbook
                  ? "Ingest Security Fence Excel takeoff revisions onto this single Deal — updates Amount, Revision, Lead Time, and PDF."
                  : `Synced read-only from ${deal.externalQuoteSource ?? "Epicor ERP"}.`}
              </p>

              {deal.workbookPresets && deal.workbookPresets.length > 0 && !isReadOnly ? (
                <div className="mt-2.5 space-y-1.5">
                  {deal.workbookPresets.map((preset) => (
                    <Button
                      key={preset.id}
                      size="sm"
                      variant={deal.quoteRevision === preset.revision ? "secondary" : "primary"}
                      icon="sync"
                      className="w-full !justify-start !text-left !text-[12px]"
                      data-testid={`ingest-wb-${preset.id}`}
                      onClick={() =>
                        dispatch({
                          t: "deal.ingestWorkbookQuote",
                          dealId: deal.id,
                          presetId: preset.id,
                          at: nowMs(),
                        })
                      }
                    >
                      <span className="truncate">
                        Ingest {preset.revision} ({money(preset.amount)})
                      </span>
                    </Button>
                  ))}
                </div>
              ) : null}

              {deal.externalQuotePdf ? (
                <div className="mt-2.5 rounded-[3px] border border-[#99e2d8] bg-[#e5f8f6] px-2.5 py-1.5 text-[11.5px] font-medium text-[#006c5f]">
                  ✓ Synced PDF: {deal.externalQuotePdf} ({deal.quotedLeadTimeWeeks}w lead)
                </div>
              ) : null}

              {epicorQuotes.map((eq) => (
                <div key={eq.id} className="mt-2 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-2.5 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <A to={`/epicor-quotes/${eq.id}`} className="hs-link" data-testid={`deal-epicor-quote-${eq.id}`}>
                      {eq.quoteNumber} · {eq.title}
                    </A>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[#516f90]">
                    {eq.status} · {money2(eq.total)}
                  </p>
                </div>
              ))}
            </Ext>
          </div>
        ) : null}

        {/* Companies Association Card */}
        <div className="p-4" data-testid="deal-companies-card">
          <Ext id="association-role-labels">
            <AssocHeader
              title="Companies"
              count={associatedCompanies.length}
              open={coOpen}
              onToggle={() => setCoOpen((o) => !o)}
            />
            {coOpen ? (
              <div className="mt-2.5 space-y-2">
                {associatedCompanies.map((co) =>
                  co ? (
                    <div key={co.id} className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px] hover:border-[#99acc2]">
                      <div className="flex items-center justify-between gap-2">
                        <A to={`/companies/${co.id}`} className="hs-link">
                          {co.name}
                        </A>
                        <button
                          type="button"
                          onClick={() => dispatch({ t: "ui", k: "preview", v: `company:${co.id}` })}
                          className="hs-preview-btn"
                        >
                          Preview
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-[#516f90]">{co.domain || co.industry}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {co.id === primaryCompany?.id ? <Tag tone="blue">Primary</Tag> : null}
                        {(deal.companyLabels?.[co.id] ?? []).map((lb) => (
                          <Tag key={lb} tone="teal">
                            {lb}
                          </Tag>
                        ))}
                        {!isReadOnly ? (
                          <Menu
                            align="right"
                            width={195}
                            button={({ toggle }) => (
                              <button type="button" onClick={toggle} className="text-[11px] font-semibold text-[#006162] hover:underline">
                                + Add label
                              </button>
                            )}
                          >
                            {(close) =>
                              COMPANY_ROLE_LABELS.map((lb) => (
                                <MenuItem
                                  key={lb}
                                  onClick={() => {
                                    close();
                                    dispatch({ t: "deal.addCompanyLabel", dealId: deal.id, companyId: co.id, label: lb });
                                  }}
                                >
                                  {lb}
                                </MenuItem>
                              ))
                            }
                          </Menu>
                        ) : null}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null}
          </Ext>
        </div>

        {/* Contacts Association Card */}
        <div className="p-4" data-testid="deal-contacts-card">
          <AssocHeader
            title="Contacts"
            count={associatedContacts.length}
            open={ctOpen}
            onToggle={() => setCtOpen((o) => !o)}
          />
          {ctOpen ? (
            <div className="mt-2.5 space-y-2">
              {associatedContacts.map((ct, idx) => (
                <div key={ct.id} className="hs-assoc-card rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px] hover:border-[#99acc2]">
                  <div className="flex items-center justify-between gap-2">
                    <A to={`/contacts/${ct.id}`} className="hs-link">
                      {ct.firstName} {ct.lastName}
                    </A>
                    {!isReadOnly ? (
                      <Menu
                        align="right"
                        width={195}
                        button={({ toggle }) => (
                          <button
                            type="button"
                            onClick={toggle}
                            data-testid={`add-contact-label-${ct.id}`}
                            className="text-[11px] font-semibold text-[#006162] hover:underline"
                          >
                            + Role label
                          </button>
                        )}
                      >
                        {(close) =>
                          CONTACT_ROLE_LABELS.map((lb) => (
                            <MenuItem
                              key={lb}
                              onClick={() => {
                                close();
                                dispatch({ t: "deal.addContactLabel", dealId: deal.id, contactId: ct.id, label: lb });
                              }}
                            >
                              {lb}
                            </MenuItem>
                          ))
                        }
                      </Menu>
                    ) : null}
                  </div>
                  <p className="text-[11.5px] text-[#516f90]">{ct.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {idx === 0 ? <Tag tone="neutral">Primary</Tag> : null}
                    {(deal.contactLabels?.[ct.id] ?? []).map((lb) => (
                      <Tag key={lb} tone="blue">
                        {lb}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Linked Shadow / Cross-Sell Deals */}
        {deal.dealLinks && deal.dealLinks.length > 0 ? (
          <div className="p-4" data-testid="deal-links-card">
            <p className="text-[13px] font-bold text-[#33475b]">Deals ({deal.dealLinks.length})</p>
            <div className="mt-2 space-y-2">
              {deal.dealLinks.map((lnk) => {
                const other = world.deals.find((x) => x.id === lnk.dealId);
                if (!other) return null;
                return (
                  <div key={lnk.dealId} className="rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
                    <Tag tone="amber">{lnk.label}</Tag>
                    <A to={`/deals/${other.id}`} className="hs-link mt-1 block" data-testid={`linked-deal-${other.id}`}>
                      {other.name}
                    </A>
                    <p className="text-[11.5px] text-[#516f90]">{money(other.amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Native HubSpot Quotes */}
        {nativeQuotes.length > 0 ? (
          <div className="p-4">
            <p className="text-[13px] font-bold text-[#33475b]">Quotes ({nativeQuotes.length})</p>
            <div className="mt-2 space-y-2">
              {nativeQuotes.map((qt) => (
                <div key={qt.id} className="rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <A to={`/quotes/${qt.id}`} className="hs-link" data-testid={`deal-native-quote-${qt.id}`}>
                      {qt.number}: {qt.title}
                    </A>
                    <Tag tone={statusTone(qt.status)}>{qt.status}</Tag>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Post-Award Delivery Projects */}
        {linkedProjects.length > 0 ? (
          <div className="p-4" data-testid="deal-projects-card">
            <AssocHeader title="Projects" count={linkedProjects.length} open={prjOpen} onToggle={() => setPrjOpen((o) => !o)} />
            {prjOpen ? (
              <div className="mt-2 space-y-2">
                {linkedProjects.map((prj) => (
                  <div key={prj.id} className="rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
                    <A to={`/projects/${prj.id}`} className="hs-link" data-testid={`deal-project-link-${prj.id}`}>
                      {prj.code} · {prj.name}
                    </A>
                    <p className="mt-0.5 text-[11.5px] text-[#516f90]">Status: {prj.status}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Attachments Card */}
        <div className="p-4">
          <AssocHeader
            title="Attachments"
            count={deal.externalQuotePdf ? 1 : 0}
            open={attOpen}
            onToggle={() => setAttOpen((o) => !o)}
          />
          {attOpen ? (
            <div className="mt-2 text-[12px] text-[#516f90]">
              {deal.externalQuotePdf ? (
                <div className="flex items-center gap-2 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-2 text-[#33475b]">
                  <Icon name="paperclip" size={14} className="shrink-0 text-[#006162]" />
                  <span className="truncate font-medium">{deal.externalQuotePdf}</span>
                </div>
              ) : (
                <p>No files attached yet.</p>
              )}
            </div>
          ) : null}
        </div>
      </aside>

      {pendingStage ? (
        <StagePromptModal
          deal={deal}
          targetStage={pendingStage}
          onCancel={() => setPendingStage(null)}
          onConfirm={(values) => {
            dispatch({
              t: "deal.setStage",
              dealId: deal.id,
              stage: pendingStage.id,
              promptValues: values,
              at: nowMs(),
            });
            setPendingStage(null);
          }}
        />
      ) : null}

      {composerKind ? (
        <FloatingComposer
          kind={composerKind}
          onKindChange={setComposerKind}
          onClose={() => setComposerKind(null)}
          target={{
            recordLabel: deal.name,
            contactIds: deal.contactIds,
            companyIds: [deal.companyId],
            dealIds: [deal.id],
            defaultEmailTo: associatedContacts[0]?.email,
            contactFirstName: associatedContacts[0]?.firstName,
            companyName: primaryCompany?.name,
            dealName: deal.name,
            quoteId: primaryQuote?.id,
            quoteLabel: primaryQuote?.number,
            quoteNumber: primaryQuote?.number,
            quoteTotal: primaryQuote ? money(quoteTotals(primaryQuote).total) : undefined,
            closeDate: deal.closeDate,
            division: pipeline?.division,
          }}
        />
      ) : null}
    </div>
  );
}
