"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useSeen, useShell } from "@/store/store";
import type { LeadItem } from "@/tenants/types";
import { Ext } from "../ext";
import { FloatingComposer, type ComposerKind } from "../floating-composer";
import { date, dateTime, money, shortDate } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, cx, Drawer, LineTabs, Modal, Prop, Tag } from "../ui";

type LeadStageLabel = "New" | "Attempting" | "Connected" | "Qualified" | "Disqualified";

function leadStageTone(stage: string) {
  switch (stage) {
    case "New":
      return "blue" as const;
    case "Attempting":
      return "amber" as const;
    case "Connected":
      return "teal" as const;
    case "Qualified":
      return "green" as const;
    case "Disqualified":
      return "red" as const;
    default:
      return "neutral" as const;
  }
}

export function LeadsPage() {
  const { pack, world, persona, navigate, dispatch } = useShell();
  useSeen("seen.leads", true);

  const [wsTab, setWsTab] = useState<"summary" | "leads" | "deals" | "schedule">("leads");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [composerKind, setComposerKind] = useState<ComposerKind | null>(null);

  const [qualifying, setQualifying] = useState<LeadItem | null>(null);
  const [outsideOwner, setOutsideOwner] = useState(
    () => pack.personas.find((p) => p.id === "outside-rep")?.id ?? pack.personas[0]?.id ?? "outside-rep",
  );
  const [insideOwner, setInsideOwner] = useState(
    () => pack.personas.find((p) => p.id === "inside-rep")?.id ?? pack.personas[0]?.id ?? "inside-rep",
  );

  const stageFor = (lead: LeadItem): LeadStageLabel => {
    if (lead.convertedDealId) return "Qualified";
    const override = world.ui[`leadStage:${lead.id}`] as LeadStageLabel | undefined;
    return override || (lead.status as LeadStageLabel);
  };

  const openTasks = world.tasks.filter((t) => t.status === "open");
  const myOpenTasks = openTasks.filter((t) => t.ownerId === persona.id);
  const overdueCount = openTasks.filter((t) => new Date(t.dueAt).getTime() < nowMs()).length;
  const openLeadsCount = world.leads.filter((l) => {
    const st = stageFor(l);
    return st !== "Qualified" && st !== "Disqualified";
  }).length;
  const activeDeals = world.deals.filter((d) => !d.readOnly && d.stage !== "closed-lost");

  const filteredLeads = world.leads.filter((l) => {
    const st = stageFor(l);
    if (stageFilter && st !== stageFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${l.name} ${l.contactName} ${l.companyName} ${l.division} ${l.marketSegment}`.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const activeLead = activeLeadId ? world.leads.find((l) => l.id === activeLeadId) ?? null : null;
  const activeLeadActivities = activeLead
    ? world.activities.filter(
        (a) =>
          (activeLead.companyId && a.companyIds?.includes(activeLead.companyId)) ||
          a.title.toLowerCase().includes(activeLead.companyName.toLowerCase()),
      )
    : [];

  function submitQualify() {
    if (!qualifying) return;
    const leadId = qualifying.id;
    dispatch({
      t: "lead.qualify",
      leadId,
      outsideSalesOwnerId: outsideOwner,
      insideSalesOwnerId: insideOwner,
      stage: "planning",
      at: nowMs(),
    });
    setQualifying(null);
    setActiveLeadId(null);
    navigate(`/deals/dl-qual-${leadId}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f5f8fa]" data-testid="sales-workspace">
      {/* 1. Authentic HubSpot Sales Workspace Header + Tabs */}
      <header className="border-b border-[#dfe3eb] bg-white px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar name={persona.name} color={persona.color} size={36} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="hs-heading text-[20px] font-bold text-[#33475b]">Sales Workspace</h1>
                <Tag tone="blue">Sales Hub</Tag>
              </div>
              <p className="text-[12px] text-[#516f90]">
                {persona.name} · {persona.title} ({persona.division})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag tone="teal">NSM &amp; Rep Prospecting Queue</Tag>
          </div>
        </div>

        <LineTabs
          value={wsTab}
          onChange={setWsTab}
          tabs={[
            { id: "summary", label: "Summary", testId: "ws-tab-summary" },
            { id: "leads", label: `Leads (${world.leads.length})`, testId: "ws-tab-leads" },
            { id: "deals", label: `Deals (${activeDeals.length})`, testId: "ws-tab-deals" },
            { id: "schedule", label: "Schedule", testId: "ws-tab-schedule" },
          ]}
        />
      </header>

      {/* 2. Daily Sales Workspace KPI Strip */}
      <div className="grid grid-cols-4 gap-3 px-6 pt-4" data-testid="sales-workspace-kpis">
        <div className="rounded-[4px] border border-[#dfe3eb] bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#516f90]">Tasks due today</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums text-[#33475b]">{myOpenTasks.length || openTasks.length}</p>
          <p className="text-[11.5px] text-[#0091ae]">In shared &amp; personal queues</p>
        </div>
        <div className="rounded-[4px] border border-[#dfe3eb] bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#516f90]">Open leads</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums text-[#0091ae]">{openLeadsCount}</p>
          <p className="text-[11.5px] text-[#516f90]">Awaiting NSM / rep qualification</p>
        </div>
        <div className="rounded-[4px] border border-[#dfe3eb] bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#516f90]">Overdue tasks</p>
          <p className={cx("mt-1 text-[22px] font-bold tabular-nums", overdueCount > 0 ? "text-[#b0232a]" : "text-[#33475b]")}>
            {overdueCount}
          </p>
          <p className="text-[11.5px] text-[#516f90]">Follow-up &amp; stuck-deal alerts</p>
        </div>
        <div className="rounded-[4px] border border-[#dfe3eb] bg-white px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#516f90]">Active deals</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums text-[#33475b]">{activeDeals.length}</p>
          <p className="text-[11.5px] text-[#516f90]">
            {money(activeDeals.reduce((s, d) => s + d.amount, 0))} pipeline
          </p>
        </div>
      </div>

      {/* 3. Workspace Tab Content */}
      <div className="flex-1 px-6 py-4">
        {wsTab === "summary" ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Guided Prospecting Actions" right={<Tag tone="blue">{world.leads.length} leads</Tag>}>
              <div className="space-y-2.5">
                {world.leads.map((l) => {
                  const st = stageFor(l);
                  return (
                    <div
                      key={l.id}
                      className="flex items-center justify-between gap-3 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3 text-[13px]"
                    >
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setActiveLeadId(l.id)}
                          className="hs-link block truncate text-left"
                        >
                          {l.name}
                        </button>
                        <p className="truncate text-[12px] text-[#516f90]">
                          {l.contactName} · {l.companyName} · Est. {money(l.estimatedAmount)}
                        </p>
                      </div>
                      <Tag tone={leadStageTone(st)}>{st}</Tag>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="My Priority Follow-Up Tasks">
              <div className="space-y-2">
                {openTasks.slice(0, 5).map((tk) => (
                  <label
                    key={tk.id}
                    className="flex items-center justify-between gap-2 rounded-[4px] border border-[#dfe3eb] px-3 py-2 text-[12.5px]"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tk.status === "done"}
                        onChange={() => dispatch({ t: "task.toggle", id: tk.id })}
                        className="accent-[#0091ae]"
                      />
                      <span className="font-semibold text-[#33475b]">{tk.title}</span>
                    </span>
                    <Tag tone={tk.priority === "High" ? "red" : "neutral"}>{tk.priority}</Tag>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        ) : wsTab === "deals" ? (
          <Card title="Active Pipeline Deals in Workspace" pad={false}>
            <div className="hs-grid-wrap border-0">
              <table className="hs-grid">
                <thead>
                  <tr>
                    <th>Deal Name</th>
                    <th>Division</th>
                    <th>Stage</th>
                    <th>Close Date</th>
                    <th className="!text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDeals.map((dl) => (
                    <tr key={dl.id}>
                      <td>
                        <A to={`/deals/${dl.id}`} className="hs-link">
                          {dl.name}
                        </A>
                      </td>
                      <td>
                        <Tag tone="neutral">{dl.division}</Tag>
                      </td>
                      <td>{dl.stage}</td>
                      <td>{shortDate(dl.closeDate)}</td>
                      <td className="text-right font-semibold tabular-nums">{money(dl.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : wsTab === "schedule" ? (
          <Card title="Today's Connected Outlook 365 Schedule">
            <div className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3">
                <div>
                  <p className="font-semibold text-[#33475b]">9:30 AM — Security Fence Bid Review &amp; Estimator Sync</p>
                  <p className="text-[12px] text-[#516f90]">Attendees: Jordan Vance, Casey Morales, Devon Park</p>
                </div>
                <Tag tone="teal">Outlook 365</Tag>
              </div>
              <div className="flex items-center justify-between rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3">
                <div>
                  <p className="font-semibold text-[#33475b]">2:00 PM — GC Perimeter Specification Call</p>
                  <p className="text-[12px] text-[#516f90]">Associated with IronPeak Ashburn Campus</p>
                </div>
                <Tag tone="blue">Scheduled</Tag>
              </div>
            </div>
          </Card>
        ) : (
          /* LEADS TAB (Default): HubSpot Leads Grid + Inline Lead Slide-Over Workspace Drawer */
          <Ext id="nsm-lead-routing">
            <div className="rounded-[4px] border border-[#dfe3eb] bg-white">
              {/* Leads Filter & Search Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe3eb] px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#516f90]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search leads"
                      className="hs-input !h-8 w-[240px] !bg-[#f5f8fa] !pl-8"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {(["", "New", "Attempting", "Connected", "Qualified", "Disqualified"] as const).map((st) => (
                      <button
                        key={st || "all"}
                        type="button"
                        onClick={() => setStageFilter(st)}
                        className="hs-filter-pill !h-7 !text-[12px]"
                        data-active={stageFilter === st}
                      >
                        {st || "All stages"}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[12px] text-[#516f90]">Click any lead to open the Workspace Slide-Over Drawer</span>
              </div>

              <div className="hs-scroll overflow-x-auto">
                <table className="hs-grid" data-testid="leads-table">
                  <thead>
                    <tr>
                      <th className="hs-sticky-check">
                        <input type="checkbox" aria-label="Select all leads" className="accent-[#0091ae]" />
                      </th>
                      <th className="hs-sticky-name">Lead Name</th>
                      <th>Lead Stage</th>
                      <th>Company</th>
                      <th>Division</th>
                      <th>Market Segment</th>
                      <th className="!text-right">Est. Value</th>
                      <th>Created</th>
                      <th>Next Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((l) => {
                      const st = stageFor(l);
                      return (
                        <tr
                          key={l.id}
                          data-testid={`row-${l.id}`}
                          data-selected={activeLeadId === l.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("button,a,input,select")) return;
                            setActiveLeadId(l.id);
                          }}
                        >
                          <td className="hs-sticky-check">
                            <input type="checkbox" aria-label={`Select ${l.name}`} className="accent-[#0091ae]" />
                          </td>
                          <td className="hs-sticky-name">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <button
                                  type="button"
                                  data-testid={`lead-open-${l.id}`}
                                  onClick={() => setActiveLeadId(l.id)}
                                  className="hs-link text-left"
                                >
                                  {l.name}
                                </button>
                                <p className="text-[11.5px] text-[#516f90]">
                                  {l.contactName} · {l.title}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveLeadId(l.id)}
                                className="hs-preview-btn"
                              >
                                Open drawer
                              </button>
                            </div>
                          </td>
                          <td>
                            <Tag tone={leadStageTone(st)}>{st}</Tag>
                          </td>
                          <td className="font-medium text-[#33475b]">{l.companyName}</td>
                          <td>
                            <Tag tone="neutral">{l.division}</Tag>
                          </td>
                          <td>{l.marketSegment}</td>
                          <td className="text-right font-semibold tabular-nums">{money(l.estimatedAmount)}</td>
                          <td className="text-[12px] text-[#516f90]">{dateTime(l.createdAt)}</td>
                          <td>
                            {l.convertedDealId ? (
                              <A to={`/deals/${l.convertedDealId}`} className="hs-link" data-testid={`lead-deal-link-${l.id}`}>
                                Open deal →
                              </A>
                            ) : (
                              <Button
                                size="xs"
                                variant="primary"
                                data-testid={`qualify-lead-${l.id}`}
                                onClick={() => setQualifying(l)}
                              >
                                Qualify &amp; create deal
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Ext>
        )}
      </div>

      {/* 4. Inline Right-Side Lead Slide-Over Workspace Drawer */}
      {activeLead ? (
        <Drawer
          title={activeLead.name}
          subtitle={`${activeLead.contactName} · ${activeLead.companyName}`}
          width={510}
          onClose={() => setActiveLeadId(null)}
          testId="lead-workspace-drawer"
          footer={
            activeLead.convertedDealId ? (
              <Button
                variant="primary"
                onClick={() => {
                  const id = activeLead.convertedDealId!;
                  setActiveLeadId(null);
                  navigate(`/deals/${id}`);
                }}
              >
                Open Converted Deal
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  data-testid="drawer-qualify-lead-btn"
                  onClick={() => setQualifying(activeLead)}
                >
                  Qualify → Create Deal
                </Button>
                <Button onClick={() => setActiveLeadId(null)}>Close</Button>
              </>
            )
          }
        >
          <div className="space-y-4">
            {/* Lead Stage Selector + Quick Prospecting Action Strip */}
            <div className="rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <label className="block flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#516f90]">Lead stage</span>
                  <select
                    value={stageFor(activeLead)}
                    data-testid="drawer-lead-stage-select"
                    onChange={(e) => {
                      const val = e.target.value as LeadStageLabel;
                      dispatch({ t: "ui", k: `leadStage:${activeLead.id}`, v: val });
                      if (val === "Qualified" && !activeLead.convertedDealId) {
                        setQualifying(activeLead);
                      }
                    }}
                    className="hs-input mt-1 !h-8 w-full !bg-white font-semibold text-[#0091ae]"
                  >
                    {(["New", "Attempting", "Connected", "Qualified", "Disqualified"] as const).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#516f90]">Est. Deal Size</span>
                  <p className="mt-1 text-[16px] font-bold tabular-nums text-[#33475b]">{money(activeLead.estimatedAmount)}</p>
                </div>
              </div>

              {/* Quick Outreach Buttons inside Lead Drawer */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[#dfe3eb] pt-3">
                <Button size="xs" icon="call" onClick={() => setComposerKind("call")} data-testid="lead-drawer-log-call">
                  Log Call
                </Button>
                <Button size="xs" icon="email" onClick={() => setComposerKind("email")} data-testid="lead-drawer-log-email">
                  Log Email
                </Button>
                <Button size="xs" icon="task" onClick={() => setComposerKind("task")} data-testid="lead-drawer-create-task">
                  Create Task
                </Button>
                <Button size="xs" icon="note" onClick={() => setComposerKind("note")}>
                  Add Note
                </Button>
              </div>
            </div>

            <Card title="Inbound Inquiry & Contact Details">
              <p className="rounded-[4px] border border-[#eaf0f6] bg-[#f5f8fa] p-3 text-[12.5px] leading-relaxed text-[#33475b]">
                {activeLead.inquirySummary}
              </p>
              <dl className="mt-2">
                <Prop label="Contact">{activeLead.contactName} ({activeLead.title})</Prop>
                <Prop label="Email">{activeLead.email}</Prop>
                <Prop label="Phone">{activeLead.phone}</Prop>
                <Prop label="Company">{activeLead.companyName} ({activeLead.domain})</Prop>
                <Prop label="Division & Segment">{activeLead.division} · {activeLead.marketSegment}</Prop>
              </dl>
            </Card>

            <Card title={`Lead Activity Timeline (${activeLeadActivities.length + 1})`}>
              <div className="space-y-3 text-[12.5px]">
                <div className="rounded-[4px] border border-[#eaf0f6] bg-[#f5f8fa] p-3">
                  <div className="flex items-center justify-between text-[11px] text-[#516f90]">
                    <span className="font-bold uppercase text-[#0091ae]">Web Form Submission</span>
                    <span>{date(activeLead.createdAt)}</span>
                  </div>
                  <p className="mt-1 font-semibold text-[#33475b]">Inbound RFQ routed to NSM Queue ({activeLead.division})</p>
                  <p className="mt-0.5 text-[#516f90]">{activeLead.inquirySummary}</p>
                </div>
                {activeLeadActivities.map((act) => (
                  <div key={act.id} className="rounded-[4px] border border-[#eaf0f6] p-3">
                    <div className="flex items-center justify-between text-[11px] text-[#516f90]">
                      <span className="font-bold uppercase text-[#33475b]">{act.type}</span>
                      <span>{dateTime(act.at)}</span>
                    </div>
                    <p className="mt-1 font-semibold text-[#33475b]">{act.title}</p>
                    {act.body ? <p className="mt-0.5 text-[#516f90]">{act.body}</p> : null}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Drawer>
      ) : null}

      {/* 5. Qualify -> Create Deal Modal */}
      {qualifying ? (
        <Modal
          title={`Qualify Lead → Create Deal`}
          subtitle={`${qualifying.companyName} · ${qualifying.division}`}
          onClose={() => setQualifying(null)}
          testId="qualify-lead-modal"
          footer={
            <>
              <Button variant="primary" onClick={submitQualify} data-testid="confirm-qualify-btn">
                Create Security Fence Deal
              </Button>
              <Button onClick={() => setQualifying(null)}>Cancel</Button>
            </>
          }
        >
          <div className="space-y-4 text-[13px]">
            <div className="rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3.5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#33475b]">
                  {qualifying.contactName} · {qualifying.companyName}
                </p>
                <Tag tone="blue">{money(qualifying.estimatedAmount)}</Tag>
              </div>
              <p className="mt-1 text-[12px] text-[#516f90]">{qualifying.inquirySummary}</p>
            </div>

            <label className="block space-y-1">
              <span className="font-semibold text-[#33475b]">Outside Sales Rep (Territory Owner) *</span>
              <select
                value={outsideOwner}
                onChange={(e) => setOutsideOwner(e.target.value)}
                data-testid="qualify-outside-owner"
                className="hs-input w-full !bg-white"
              >
                {pack.personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#33475b]">Inside Sales Coordinator *</span>
              <select
                value={insideOwner}
                onChange={(e) => setInsideOwner(e.target.value)}
                data-testid="qualify-inside-owner"
                className="hs-input w-full !bg-white"
              >
                {pack.personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      ) : null}

      {composerKind && activeLead ? (
        <FloatingComposer
          kind={composerKind}
          onKindChange={setComposerKind}
          onClose={() => setComposerKind(null)}
          target={{
            recordLabel: activeLead.name,
            contactIds: [],
            companyIds: activeLead.companyId ? [activeLead.companyId] : [],
            dealIds: activeLead.convertedDealId ? [activeLead.convertedDealId] : [],
            defaultEmailTo: activeLead.email,
          }}
        />
      ) : null}
    </div>
  );
}
