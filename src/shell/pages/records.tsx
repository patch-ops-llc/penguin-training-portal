"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useSeen, useShell } from "@/store/store";
import type { Activity, DealStage } from "@/tenants/types";
import { Ext } from "../ext";
import { date, dateTime, money, money2 } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, cx, Empty, LineTabs, Menu, MenuItem, Prop, Tag } from "../ui";
import { StagePromptModal } from "./stage-prompt-modal";

const COMPANY_ROLE_LABELS = ["General Contractor", "A/E Firm", "Project Owner", "Distributor", "Subcontractor"];
const CONTACT_ROLE_LABELS = ["Decision Maker", "Quote Recipient", "Estimator / Buyer", "Billing Contact", "Project Superintendent"];

function ActivitySection({
  activities,
  contactIds,
  companyIds,
  dealIds,
  readOnly = false,
}: {
  activities: Activity[];
  contactIds: string[];
  companyIds: string[];
  dealIds: string[];
  readOnly?: boolean;
}) {
  const { pack, world, dispatch } = useShell();
  const [composerKind, setComposerKind] = useState<"note" | "email" | "call" | "meeting" | "task">("note");
  const [text, setText] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "note" | "email" | "call" | "task">("all");

  const filtered = activities.filter((a) => filterTab === "all" || a.type === filterTab);

  function submitActivity() {
    if (!text.trim()) return;
    dispatch({
      t: "log",
      kind: composerKind,
      text: text.trim(),
      contactIds,
      companyIds,
      dealIds,
      at: nowMs(),
    });
    setText("");
  }

  return (
    <div className="space-y-4">
      {!readOnly ? (
        <Card title="Log Activity (Note, Outlook Email, Call, Meeting, Task)" testId="activity-composer">
          <div className="flex flex-wrap gap-1.5 pb-2.5">
            {(
              [
                { id: "note", label: "Note (@mention)", icon: "note" },
                { id: "call", label: "Log Call", icon: "call" },
                { id: "email", label: "Log Outlook Email", icon: "email" },
                { id: "meeting", label: "Log Meeting", icon: "meeting" },
                { id: "task", label: "Create Follow-Up Task", icon: "task" },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                data-testid={`composer-kind-${btn.id}`}
                onClick={() => setComposerKind(btn.id)}
                className={cx(
                  "inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-[12.5px] font-semibold",
                  composerKind === btn.id ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-[#f5f5f5]",
                )}
              >
                <Icon name={btn.icon} size={13} />
                {btn.label}
              </button>
            ))}
          </div>

          {composerKind === "email" && world.profile.outlookConnected ? (
            <p className="mb-2 text-[11.5px] font-medium text-[#0b5b2b]">
              ✓ Synced with Microsoft Outlook 365 · Associations automatically include Contact + Company + Deal
            </p>
          ) : null}

          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              composerKind === "note"
                ? "Write a note or @mention a teammate across divisions…"
                : composerKind === "call"
                  ? "Call summary, buyer feedback, and next step…"
                  : composerKind === "email"
                    ? "Summary or body of customer Outlook email…"
                    : composerKind === "task"
                      ? "Follow-up task title (e.g., Follow up on quote Q-2041)…"
                      : "Meeting notes & attendees…"
            }
            data-testid="composer-textarea"
            className="w-full rounded-[6px] border border-line p-2.5 text-[13px] focus:border-ink focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11.5px] text-ink-muted">
              Associated: {companyIds.length} company · {contactIds.length} contact(s) · {dealIds.length} deal(s)
            </span>
            <Button size="sm" variant="primary" disabled={!text.trim()} onClick={submitActivity} data-testid="composer-save-btn">
              Save {composerKind}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card pad={false} testId="activity-timeline">
        <div className="px-4 pt-2">
          <LineTabs
            value={filterTab}
            onChange={setFilterTab}
            tabs={[
              { id: "all", label: `Activity (${activities.length})` },
              { id: "note", label: "Notes" },
              { id: "email", label: "Emails" },
              { id: "call", label: "Calls" },
              { id: "task", label: "Tasks" },
            ]}
          />
        </div>
        <div className="divide-y divide-line-soft p-4">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-muted">No timeline entries in this filter yet.</p>
          ) : (
            filtered.map((act) => {
              const author = act.byId ? pack.personas.find((p) => p.id === act.byId)?.name : undefined;
              return (
                <div key={act.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11.5px] text-ink-muted">
                    <span className="font-semibold uppercase tracking-wide text-ink">{act.type}</span>
                    <span>
                      {author ? `${author} · ` : ""}
                      {dateTime(act.at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13.5px] font-semibold">{act.title}</p>
                  {act.body ? <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{act.body}</p> : null}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────── CONTACT RECORD ─────────────────────────── */
export function ContactRecord({ id }: { id: string }) {
  const { pack, world } = useShell();
  const contact = world.contacts.find((c) => c.id === id);

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

  const company = contact.companyId ? world.companies.find((c) => c.id === contact.companyId) : undefined;
  const deals = world.deals.filter((d) => d.contactIds.includes(contact.id));
  const activities = world.activities.filter((a) => a.contactIds?.includes(contact.id));
  const owner = pack.personas.find((p) => p.id === contact.ownerId);

  return (
    <div className="min-h-full" data-testid="contact-record">
      <header className="border-b border-line bg-white px-6 py-4">
        <A to="/contacts" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
          <Icon name="chevronLeft" size={14} /> Contacts
        </A>
        <div className="mt-1 flex items-center gap-3">
          <Avatar name={`${contact.firstName} ${contact.lastName}`} size={36} />
          <div>
            <h1 className="text-[20px] font-semibold">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-[12.5px] text-ink-muted">
              {contact.title} · {contact.email}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[280px_1fr_300px]">
        <Card title="About this Contact">
          <dl className="divide-y divide-line-soft">
            <Prop label="Email (Unique Key)">{contact.email}</Prop>
            <Prop label="Phone">{contact.phone}</Prop>
            <Prop label="Job Title">{contact.title}</Prop>
            <Prop label="Lead Status">{contact.leadStatus}</Prop>
            <Prop label="Lifecycle Stage">{contact.lifecycle}</Prop>
            <Prop label="Contact Owner">{owner?.name ?? contact.ownerId ?? "—"}</Prop>
          </dl>
        </Card>

        <ActivitySection
          activities={activities}
          contactIds={[contact.id]}
          companyIds={company ? [company.id] : []}
          dealIds={deals.map((d) => d.id)}
        />

        <div className="space-y-4">
          <Card title="Primary Company">
            {company ? (
              <div className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                <A to={`/companies/${company.id}`} className="hs-link font-semibold">
                  {company.name}
                </A>
                <p className="mt-0.5 text-[12px] text-ink-muted">{company.crossDivision?.primaryDivision ?? company.industry}</p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">No company linked.</p>
            )}
          </Card>

          <Card title={`Deals (${deals.length})`}>
            <div className="space-y-2">
              {deals.map((d) => {
                const labels = d.contactLabels?.[contact.id] ?? [];
                return (
                  <div key={d.id} className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                    <A to={`/deals/${d.id}`} className="hs-link font-semibold">
                      {d.name}
                    </A>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {d.division} · {money(d.amount)}
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
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── COMPANY RECORD (PARENT/CHILD + CROSS-DIVISION + EDIT LOCK) ─────────────────────────── */
export function CompanyRecord({ id }: { id: string }) {
  const { pack, world, persona, dispatch } = useShell();
  const company = world.companies.find((c) => c.id === id);
  useSeen(`seen.company.${id}`, Boolean(company));

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

  const parentCompany = company.parentCompanyId ? world.companies.find((c) => c.id === company.parentCompanyId) : undefined;
  const childCompanies = (company.childCompanyIds ?? [])
    .map((cid) => world.companies.find((c) => c.id === cid))
    .filter(Boolean);
  const duplicateTarget = company.missingDomainDuplicateOf
    ? world.companies.find((c) => c.id === company.missingDomainDuplicateOf)
    : undefined;

  const contacts = world.contacts.filter((c) => c.companyId === company.id);
  const deals = world.deals.filter((d) => d.companyId === company.id && d.pipelineId !== "global");
  const epicorQuotes = world.epicorQuotes.filter((eq) => eq.companyId === company.id);
  const projects = world.projects.filter((p) => p.companyId === company.id);
  const activities = world.activities.filter((a) => a.companyIds?.includes(company.id));

  const flagged = Boolean(company.flaggedDuplicate || world.flags["company.duplicateFlagged"]);

  return (
    <div className="min-h-full" data-testid="company-record">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <A to="/companies" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
              <Icon name="chevronLeft" size={14} /> Companies
            </A>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <h1 className="text-[20px] font-semibold">{company.name}</h1>
              <Tag tone="blue">{primaryDiv}</Tag>
              {parentCompany ? <Tag tone="teal">Child Branch</Tag> : null}
              {childCompanies.length > 0 ? <Tag tone="teal">Parent HQ ({childCompanies.length} branch)</Tag> : null}
            </div>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              {company.domain || "No domain on record"} · {company.city}, {company.state} · Account Owner: {owner?.name ?? company.ownerId ?? "—"}
            </p>
          </div>

          {!canEditCompany ? (
            <Ext id="division-edit-lock">
              <div
                className="flex items-center gap-2 rounded-[8px] border border-[#fdefc8] bg-[#fff9ec] px-3.5 py-2 text-[12.5px] font-semibold text-[#754c00]"
                data-testid="company-edit-locked-banner"
              >
                <Icon name="lock" size={15} />
                Company fields edit-locked ({primaryDiv} owned) · Timeline notes &amp; @mentions open
              </div>
            </Ext>
          ) : null}
        </div>

        {/* Suspected Missing-Domain Duplicate Escalation Banner */}
        {company.missingDomainDuplicateOf ? (
          <Ext id="duplicate-escalation-rule" className="mt-3">
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#f3b4b4] bg-[#fdf4f4] px-4 py-3 text-[13px]"
              data-testid="suspected-duplicate-banner"
            >
              <div>
                <p className="font-semibold text-[#99201a]">
                  Suspected ERP Import Duplicate (Missing Website Domain){duplicateTarget ? ` of ${duplicateTarget.name}` : ""}
                </p>
                <p className="text-[12px] text-ink-muted">
                  AMICO Data Governance: Never merge or delete Companies manually in HubSpot — ERP account sync keys must be reconciled by your NSM or Penguin Strategies.
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
      </header>

      <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[280px_1fr_330px]">
        <div className="space-y-4">
          <Card title="About this Company" right={!canEditCompany ? <Tag>Locked</Tag> : undefined}>
            <dl className="divide-y divide-line-soft">
              <Prop label="Company Domain">{company.domain || "— (Missing)"}</Prop>
              <Prop label="Industry">{company.industry}</Prop>
              <Prop label="Primary Division">{primaryDiv}</Prop>
              <Prop label="Account Owner">{owner?.name ?? company.ownerId ?? "—"}</Prop>
              <Prop label="City / State">{`${company.city}, ${company.state}`}</Prop>
              <Prop label="Annual Revenue">{company.revenue ? money(company.revenue) : "—"}</Prop>
              <Prop label="ERP Integration">
                {company.erp ? `${company.erp.systemName ?? "ERP"} (${company.erp.accountNumber})` : "—"}
              </Prop>
            </dl>
          </Card>
        </div>

        <ActivitySection
          activities={activities}
          contactIds={contacts.map((c) => c.id)}
          companyIds={[company.id]}
          dealIds={deals.map((d) => d.id)}
        />

        <div className="space-y-4">
          {/* Parent / Child Hierarchy Card */}
          <Ext id="parent-child-hierarchy">
            <Card title="Related Companies (Parent / Child)" testId="related-companies-card">
              {!parentCompany && childCompanies.length === 0 ? (
                <p className="text-[12.5px] text-ink-muted">Standalone account (no parent or regional child branches linked).</p>
              ) : (
                <div className="space-y-2.5 text-[13px]">
                  {parentCompany ? (
                    <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Parent Corporate HQ</span>
                      <div className="mt-0.5">
                        <A to={`/companies/${parentCompany.id}`} className="hs-link font-semibold" data-testid={`parent-company-link-${parentCompany.id}`}>
                          {parentCompany.name}
                        </A>
                      </div>
                      <p className="text-[11.5px] text-ink-muted">
                        {parentCompany.city}, {parentCompany.state}
                      </p>
                    </div>
                  ) : null}
                  {childCompanies.map((ch) =>
                    ch ? (
                      <div key={ch.id} className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Child Branch / Jobsite Office</span>
                        <div className="mt-0.5">
                          <A to={`/companies/${ch.id}`} className="hs-link font-semibold" data-testid={`child-company-link-${ch.id}`}>
                            {ch.name}
                          </A>
                        </div>
                        <p className="text-[11.5px] text-ink-muted">
                          {ch.crossDivision?.primaryDivision ?? ch.industry} · {ch.city}, {ch.state}
                        </p>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </Card>
          </Ext>

          {/* Cross-Division Activity Summary Card */}
          {company.crossDivision ? (
            <Ext id="cross-division-card">
              <Card title="AMICO Cross-Division Account Summary" testId="cross-division-card">
                <p className="mb-2.5 text-[12px] text-ink-muted">
                  Check active division reps before calling so AMICO coordinates outreach across divisions.
                </p>
                <dl className="divide-y divide-line-soft text-[12.5px]">
                  <Prop label="Primary Account Division">{company.crossDivision.primaryDivision}</Prop>
                  <Prop label="Active Divisions">
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {company.crossDivision.divisionsActive.map((divName) => (
                        <Tag key={divName} tone="purple">
                          {divName}
                        </Tag>
                      ))}
                    </div>
                  </Prop>
                  <Prop label="Most Recent Active Division">{company.crossDivision.mostRecentActiveDivision}</Prop>
                  <Prop label="Last Cross-Division Activity">{date(company.crossDivision.lastDivisionActivity)}</Prop>
                  <Prop label="Division Point of Contact">{company.crossDivision.mostRecentDivisionContact}</Prop>
                </dl>
              </Card>
            </Ext>
          ) : null}

          <Card title={`Contacts (${contacts.length})`}>
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                  <A to={`/contacts/${c.id}`} className="hs-link font-semibold">
                    {c.firstName} {c.lastName}
                  </A>
                  <p className="text-[12px] text-ink-muted">{c.title}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Division Deals (${deals.length})`}>
            <div className="space-y-2">
              {deals.map((d) => (
                <div key={d.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                  <A to={`/deals/${d.id}`} className="hs-link font-semibold">
                    {d.name}
                  </A>
                  <p className="text-[12px] text-ink-muted">
                    {d.division} · {money(d.amount)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {epicorQuotes.length > 0 ? (
            <Card title={`Epicor Quotes (${epicorQuotes.length})`}>
              <div className="space-y-2">
                {epicorQuotes.map((eq) => (
                  <div key={eq.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                    <A to={`/epicor-quotes/${eq.id}`} className="hs-link font-semibold">
                      {eq.quoteNumber} · {eq.title}
                    </A>
                    <p className="text-[12px] text-ink-muted">
                      {eq.status} · {money2(eq.total)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {projects.length > 0 ? (
            <Card title={`Delivery Projects (${projects.length})`}>
              <div className="space-y-2">
                {projects.map((p) => (
                  <div key={p.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                    <A to={`/projects/${p.id}`} className="hs-link font-semibold">
                      {p.code} · {p.name}
                    </A>
                    <p className="text-[12px] text-ink-muted">{p.status}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── DEAL RECORD (MULTI-OWNER, STAGE GATES, WORKBOOK, ROLE LABELS) ─────────────────────────── */
export function DealRecord({ id }: { id: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const deal = world.deals.find((d) => d.id === id);
  useSeen(`seen.deal.${id}`, Boolean(deal));

  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);
  const [selectedSku, setSelectedSku] = useState(pack.products[0]?.sku ?? "");
  const [skuQty, setSkuQty] = useState("10");

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

  const primaryCompany = world.companies.find((c) => c.id === deal.companyId);
  const allCompanyIds = [...new Set([deal.companyId, ...(deal.additionalCompanyIds ?? []), ...Object.keys(deal.companyLabels ?? {})])];
  const associatedCompanies = allCompanyIds.map((cid) => world.companies.find((c) => c.id === cid)).filter(Boolean);
  const associatedContacts = world.contacts.filter((c) => deal.contactIds.includes(c.id));
  const epicorQuotes = world.epicorQuotes.filter((eq) => eq.dealId === deal.id);
  const nativeQuotes = world.quotes.filter((q) => q.dealId === deal.id);
  const linkedProjects = world.projects.filter((p) => p.dealId === deal.id);
  const activities = world.activities.filter((a) => a.dealIds?.includes(deal.id));
  const openTasks = world.tasks.filter((t) => t.dealId === deal.id && t.status !== "done");

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

  return (
    <div className="min-h-full" data-testid="deal-record">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <A to="/deals" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
              <Icon name="chevronLeft" size={14} /> Deals · {pipeline?.name ?? deal.division}
            </A>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-[20px] font-semibold">{deal.name}</h1>
              <span className="text-[18px] font-bold text-ink tabular-nums" data-testid="deal-amount">
                {money2(deal.amount)}
              </span>
              <Tag tone="blue">{deal.division}</Tag>
            </div>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              Close Date: {date(deal.closeDate)}
              {deal.bidDate ? ` · Bid Date: ${date(deal.bidDate)}` : ""}
              {primaryCompany ? ` · ${primaryCompany.name}` : ""}
            </p>
          </div>

          {isReadOnly ? (
            <Ext id="global-shadow-pipeline">
              <div
                className="flex items-center gap-2 rounded-[8px] border border-[#fdefc8] bg-[#fff9ec] px-3.5 py-2 text-[12.5px] font-semibold text-[#754c00]"
                data-testid="global-readonly-banner"
              >
                <Icon name="lock" size={15} />
                Read-only Global Shadow Deal · Synced automatically from {deal.sourceDivision ?? deal.division} source deal
              </div>
            </Ext>
          ) : null}
        </div>

        {/* Interactive Stage Progress Bar */}
        {pipeline ? (
          <Ext id="stage-gate-prompts" className="mt-4">
            <div className="flex flex-wrap gap-1" data-testid="deal-stage-bar">
              {pipeline.stages.map((st, idx) => {
                const activeIdx = pipeline.stages.findIndex((x) => x.id === deal.stage);
                const passed = idx <= activeIdx;
                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isReadOnly}
                    data-testid={`deal-stage-${st.id}`}
                    onClick={() => handleStageClick(st)}
                    className={cx(
                      "min-w-[95px] flex-1 rounded-[5px] px-2 py-1.5 text-center text-[11.5px] font-semibold transition",
                      st.id === deal.stage
                        ? "bg-hs-orange text-white"
                        : passed
                          ? "bg-[#ffe4d6] text-[#a03400]"
                          : "bg-[#efefef] text-ink-muted",
                      !isReadOnly && "hover:opacity-90",
                      isReadOnly && "cursor-default",
                    )}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </Ext>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[295px_1fr_325px]">
        <div className="space-y-4">
          <Card title="About this Deal">
            <dl className="divide-y divide-line-soft text-[13px]">
              <Prop label="Amount">
                {isReadOnly ? (
                  money2(deal.amount)
                ) : (
                  <input
                    type="number"
                    value={deal.amount}
                    data-testid="deal-amount-input"
                    onChange={(e) =>
                      dispatch({
                        t: "deal.updateFields",
                        dealId: deal.id,
                        patch: { amount: Number(e.target.value) || 0 },
                        at: nowMs(),
                      })
                    }
                    className="h-8 w-full rounded border border-line px-2 tabular-nums"
                  />
                )}
              </Prop>
              <Prop label="Close Date">
                {isReadOnly ? (
                  date(deal.closeDate)
                ) : (
                  <input
                    type="date"
                    value={deal.closeDate.slice(0, 10)}
                    data-testid="deal-closedate-input"
                    onChange={(e) =>
                      dispatch({
                        t: "deal.updateFields",
                        dealId: deal.id,
                        patch: { closeDate: e.target.value },
                        at: nowMs(),
                      })
                    }
                    className="h-8 w-full rounded border border-line px-2"
                  />
                )}
              </Prop>
              {deal.bidDate ? <Prop label="Bid Date">{date(deal.bidDate)}</Prop> : null}
              <Prop label="Pipeline">{pipeline?.name ?? deal.pipelineId}</Prop>
              <Prop label="Quoting Route">{pipeline?.quotingRoute ?? deal.externalQuoteSource ?? "HubSpot"}</Prop>
            </dl>
          </Card>

          {/* Multi-Owner Deal Team Card */}
          <Ext id="multi-owner-deal">
            <Card title="Deal Team (Multi-Owner)" testId="deal-owners-card">
              <div className="space-y-3 text-[12.5px]">
                <label className="block space-y-1">
                  <span className="font-semibold text-ink-muted">Outside Sales Owner</span>
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
                    className="h-8 w-full rounded border border-line bg-white px-2"
                  >
                    {pack.personas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.division})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-ink-muted">Inside Sales Coordinator</span>
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
                    className="h-8 w-full rounded border border-line bg-white px-2"
                  >
                    <option value="">Unassigned</option>
                    {pack.personas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.title})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-ink-muted">Assigned Estimator</span>
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
                    className="h-8 w-full rounded border border-line bg-white px-2"
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
            </Card>
          </Ext>

          <Card title="Project, Bid & Award Properties" testId="deal-pipedrive-card">
            <dl className="divide-y divide-line-soft">
              <Prop label="Drawings Received">{deal.drawingsReceived ?? "—"}</Prop>
              <Prop label="Engineering Required">{deal.engineeringRequired ?? "—"}</Prop>
              <Prop label="Project / PM Handoff Required">{deal.handoffRequired ?? "—"}</Prop>
              {deal.customerPo ? <Prop label="Customer PO #">{deal.customerPo}</Prop> : null}
              {deal.amicoOrderNumber ? <Prop label="AMICO Order #">{deal.amicoOrderNumber}</Prop> : null}
              {deal.lostReason ? <Prop label="Lost Reason">{deal.lostReason}</Prop> : null}
              {shippingSummary ? <Prop label="Jobsite Shipping Address">{shippingSummary}</Prop> : null}
            </dl>
          </Card>
        </div>

        {/* Center column: Workbook Ingestion / Oracle Line Items + Activity Timeline */}
        <div className="space-y-4">
          {(deal.workbookPresets && deal.workbookPresets.length > 0) || deal.pipelineId === "security-fence" ? (
            <Ext id="workbook-quote-sync">
              <Card
                title="Estimating Progress & Pricing Workbook Ingestion"
                right={<Tag tone="purple">{deal.quoteRevision ? `${deal.quoteNumber ?? "WB"} · ${deal.quoteRevision}` : "Awaiting Workbook"}</Tag>}
                testId="workbook-ingestion-card"
              >
                <p className="text-[12.5px] text-ink-muted">
                  Security Fence estimators build complex perimeter takeoffs in the Excel Pricing Workbook. Ingesting a revision updates Deal Amount, Quote Revision, Lead Time, and PDF attachment automatically.
                </p>

                {deal.workbookPresets && deal.workbookPresets.length > 0 && !isReadOnly ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {deal.workbookPresets.map((preset) => (
                      <Button
                        key={preset.id}
                        size="sm"
                        variant={deal.quoteRevision === preset.revision ? "secondary" : "primary"}
                        icon="sync"
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
                        Ingest {preset.revision}: {preset.summary} ({money2(preset.amount)})
                      </Button>
                    ))}
                  </div>
                ) : null}

                {deal.externalQuotePdf ? (
                  <p className="mt-2.5 text-[12px] font-medium text-[#0b5b2b]">
                    ✓ Attached Quote PDF: {deal.externalQuotePdf} · Lead Time: {deal.quotedLeadTimeWeeks} weeks
                  </p>
                ) : null}
              </Card>
            </Ext>
          ) : null}

          {!isReadOnly && pipeline?.quotingRoute.toLowerCase().includes("hubspot") ? (
            <Ext id="oracle-native-quotes">
              <Card title="Oracle Product Library & Native HubSpot Quote" testId="oracle-quote-builder-card">
                <div className="flex flex-wrap items-end gap-2 text-[13px]">
                  <label className="flex-1 space-y-1">
                    <span className="text-[11.5px] font-semibold text-ink-muted">Oracle SKU</span>
                    <select
                      value={selectedSku}
                      onChange={(e) => setSelectedSku(e.target.value)}
                      data-testid="oracle-sku-select"
                      className="h-8 w-full rounded border border-line bg-white px-2"
                    >
                      {pack.products.map((pr) => (
                        <option key={pr.sku} value={pr.sku}>
                          {pr.sku} · {pr.name} ({money2(pr.price)})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="w-24 space-y-1">
                    <span className="text-[11.5px] font-semibold text-ink-muted">Qty</span>
                    <input
                      type="number"
                      min={1}
                      value={skuQty}
                      onChange={(e) => setSkuQty(e.target.value)}
                      data-testid="oracle-qty-input"
                      className="h-8 w-full rounded border border-line px-2"
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
                  <div className="mt-3 overflow-x-auto rounded-[8px] border border-line-soft">
                    <table className="w-full border-collapse text-[12.5px]" data-testid="deal-lines-table">
                      <thead>
                        <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11px] uppercase text-ink-muted">
                          <th className="px-3 py-1.5">SKU</th>
                          <th className="px-3 py-1.5">Item</th>
                          <th className="px-3 py-1.5 text-right">Qty</th>
                          <th className="px-3 py-1.5 text-right">Unit</th>
                          <th className="px-3 py-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deal.lineItems.map((ln, idx) => (
                          <tr key={idx} className="border-b border-line-soft last:border-b-0">
                            <td className="px-3 py-1.5 font-mono text-[11.5px] font-semibold">{ln.sku}</td>
                            <td className="px-3 py-1.5">{ln.name}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{ln.qty}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{money2(ln.unitPrice)}</td>
                            <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
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

          {openTasks.length > 0 ? (
            <Card title={`Open Deal Tasks (${openTasks.length})`} testId="deal-open-tasks-card">
              <div className="space-y-2">
                {openTasks.map((tk) => (
                  <label key={tk.id} className="flex items-center justify-between gap-3 rounded border border-line-soft p-2.5 text-[13px]">
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={tk.status === "done"}
                        data-testid={`deal-task-check-${tk.id}`}
                        onChange={() => dispatch({ t: "task.toggle", id: tk.id })}
                      />
                      <span className="font-semibold">{tk.title}</span>
                    </span>
                    {tk.queue ? <Tag tone="purple">{tk.queue}</Tag> : null}
                  </label>
                ))}
              </div>
            </Card>
          ) : null}

          <ActivitySection
            activities={activities}
            contactIds={deal.contactIds}
            companyIds={[deal.companyId]}
            dealIds={[deal.id]}
            readOnly={isReadOnly}
          />
        </div>

        {/* Right column: Associations with Role Labels + Synced Quotes + Projects */}
        <div className="space-y-4">
          <Ext id="association-role-labels">
            <Card title="Companies (with Role Labels)" testId="deal-companies-card">
              <div className="space-y-2.5">
                {associatedCompanies.map((co) =>
                  co ? (
                    <div key={co.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                      <div className="flex items-center justify-between gap-2">
                        <A to={`/companies/${co.id}`} className="hs-link font-semibold">
                          {co.name}
                        </A>
                        {!isReadOnly ? (
                          <Menu
                            align="right"
                            width={200}
                            button={({ toggle }) => (
                              <button type="button" onClick={toggle} className="text-[11.5px] font-semibold text-link hover:underline">
                                + Role label
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
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(deal.companyLabels?.[co.id] ?? []).map((lb) => (
                          <Tag key={lb} tone="teal">
                            {lb}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </Card>
          </Ext>

          <Card title="Contacts (with Role Labels)" testId="deal-contacts-card">
            <div className="space-y-2.5">
              {associatedContacts.map((ct) => (
                <div key={ct.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <A to={`/contacts/${ct.id}`} className="hs-link font-semibold">
                      {ct.firstName} {ct.lastName}
                    </A>
                    {!isReadOnly ? (
                      <Menu
                        align="right"
                        width={200}
                        button={({ toggle }) => (
                          <button
                            type="button"
                            onClick={toggle}
                            data-testid={`add-contact-label-${ct.id}`}
                            className="text-[11.5px] font-semibold text-link hover:underline"
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
                  <p className="text-[11.5px] text-ink-muted">{ct.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(deal.contactLabels?.[ct.id] ?? []).map((lb) => (
                      <Tag key={lb} tone="blue">
                        {lb}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {deal.dealLinks && deal.dealLinks.length > 0 ? (
            <Card title="Associated Deals (Shadow / Cross-Sell)" testId="deal-links-card">
              <div className="space-y-2">
                {deal.dealLinks.map((lnk) => {
                  const other = world.deals.find((x) => x.id === lnk.dealId);
                  if (!other) return null;
                  return (
                    <div key={lnk.dealId} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                      <Tag tone="amber">{lnk.label}</Tag>
                      <div className="mt-1">
                        <A to={`/deals/${other.id}`} className="hs-link font-semibold" data-testid={`linked-deal-${other.id}`}>
                          {other.name}
                        </A>
                      </div>
                      <p className="text-[11.5px] text-ink-muted">
                        {other.pipelineId === "global" ? "Global Rollup Pipeline" : other.division} · {money(other.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          {epicorQuotes.length > 0 ? (
            <Card title="Epicor Quotes (Read-Only Sync)">
              <div className="space-y-2">
                {epicorQuotes.map((eq) => (
                  <div key={eq.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                    <A to={`/epicor-quotes/${eq.id}`} className="hs-link font-semibold" data-testid={`deal-epicor-quote-${eq.id}`}>
                      {eq.quoteNumber} · {eq.title}
                    </A>
                    <p className="text-[12px] text-ink-muted">
                      {eq.status} · {money2(eq.total)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {nativeQuotes.length > 0 ? (
            <Card title="HubSpot Quotes">
              <div className="space-y-2">
                {nativeQuotes.map((qt) => (
                  <div key={qt.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                    <A to={`/quotes/${qt.id}`} className="hs-link font-semibold" data-testid={`deal-native-quote-${qt.id}`}>
                      {qt.number}: {qt.title}
                    </A>
                    <p className="text-[12px] text-ink-muted">{qt.status}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {linkedProjects.length > 0 ? (
            <Card title="Post-Award Delivery Projects" testId="deal-projects-card">
              <div className="space-y-2">
                {linkedProjects.map((prj) => (
                  <div key={prj.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                    <A to={`/projects/${prj.id}`} className="hs-link font-semibold" data-testid={`deal-project-link-${prj.id}`}>
                      {prj.code} · {prj.name}
                    </A>
                    <p className="text-[12px] text-ink-muted">Status: {prj.status}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

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
    </div>
  );
}
