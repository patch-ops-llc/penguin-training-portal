"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useSeen, useShell } from "@/store/store";
import type { Company, Contact, Deal, DealStage, Product, Quote, Task, Workflow } from "@/tenants/types";
import { Ext } from "../ext";
import { date, money, money2 } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, cx, Menu, MenuItem, Modal, Prop, statusTone, Tag } from "../ui";
import { IndexPage, PreviewShell, type Column, type Filter, type View } from "./index-table";
import { StagePromptModal } from "./stage-prompt-modal";

/* ─────────────────────────── CONTACTS INDEX ─────────────────────────── */
export function ContactsIndex() {
  const { pack, world, persona, dispatch, navigate } = useShell();
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState(world.companies[0]?.id ?? "");

  const normalizedInput = email.trim().toLowerCase();
  const duplicateContact = normalizedInput
    ? world.contacts.find((c) => c.email.toLowerCase() === normalizedInput)
    : undefined;

  const views: View<Contact>[] = [
    { id: "all", label: "All contacts", filter: () => true },
    { id: "mine", label: "My contacts", filter: (c) => c.ownerId === persona.id },
  ];

  const columns: Column<Contact>[] = [
    {
      id: "name",
      label: "Name",
      sort: (c) => `${c.firstName} ${c.lastName}`,
      cell: (c) => (
        <A to={`/contacts/${c.id}`} className="hs-link font-semibold" data-testid={`contact-link-${c.id}`}>
          {c.firstName} {c.lastName}
        </A>
      ),
    },
    { id: "email", label: "Email (Unique Key)", cell: (c) => c.email },
    { id: "title", label: "Job Title", cell: (c) => c.title },
    {
      id: "company",
      label: "Primary Company",
      cell: (c) => {
        const co = world.companies.find((x) => x.id === c.companyId);
        return co ? (
          <A to={`/companies/${co.id}`} className="hs-link">
            {co.name}
          </A>
        ) : (
          "—"
        );
      },
    },
    { id: "status", label: "Lead Status", cell: (c) => c.leadStatus },
    {
      id: "owner",
      label: "Contact Owner",
      cell: (c) => pack.personas.find((p) => p.id === c.ownerId)?.name ?? c.ownerId ?? "—",
    },
    { id: "stage", label: "Lifecycle Stage", cell: (c) => <Tag>{c.lifecycle}</Tag> },
  ];

  return (
    <>
      <IndexPage
        title="Contacts"
        noun="contact"
        rows={world.contacts}
        columns={columns}
        views={views}
        rowKey={(c) => c.id}
        searchText={(c) => `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.title}`}
        toolbar={
          <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)} data-testid="add-contact-btn">
            Add contact
          </Button>
        }
        preview={(c, close) => (
          <PreviewShell title={`${c.firstName} ${c.lastName}`} subtitle={`${c.title} · ${c.email}`} to={`/contacts/${c.id}`} onClose={close}>
            <dl>
              <Prop label="Email">{c.email}</Prop>
              <Prop label="Phone">{c.phone}</Prop>
              <Prop label="Lead status">{c.leadStatus}</Prop>
              <Prop label="Lifecycle stage">{c.lifecycle}</Prop>
            </dl>
          </PreviewShell>
        )}
      />

      {createOpen ? (
        <Modal
          title="Create Contact"
          onClose={() => setCreateOpen(false)}
          testId="create-contact-modal"
          footer={
            <>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!email.trim() || !firstName.trim() || Boolean(duplicateContact)}
                data-testid="create-contact-submit"
                onClick={() => {
                  dispatch({
                    t: "contact.create",
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    title: title.trim(),
                    companyId: companyId || null,
                    at: nowMs(),
                  });
                  setCreateOpen(false);
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                }}
              >
                Create contact
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-[13.5px]">
            <label className="block space-y-1">
              <span className="font-semibold">Email * (Unique key across HubSpot)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  const hit = world.contacts.find((c) => c.email.toLowerCase() === val.trim().toLowerCase());
                  if (hit) {
                    dispatch({ t: "contact.duplicateChecked", email: val.trim() });
                  }
                }}
                placeholder="m.mercer@gradingpacific.example"
                data-testid="contact-email-input"
                className="h-9 w-full rounded-[6px] border border-line px-3"
              />
            </label>

            {duplicateContact ? (
              <div
                className="rounded-[8px] border border-[#fdefc8] bg-[#fff9ec] p-3 text-[13px] text-[#754c00]"
                data-testid="duplicate-email-banner"
              >
                <p className="font-semibold">
                  A contact with email {duplicateContact.email} already exists ({duplicateContact.firstName} {duplicateContact.lastName}).
                </p>
                <p className="mt-1 text-[12px]">
                  HubSpot enforces unique email addresses on Contacts so divisions never create split timelines.
                </p>
                <button
                  type="button"
                  data-testid="open-existing-contact-btn"
                  onClick={() => {
                    dispatch({ t: "contact.duplicateChecked", email: duplicateContact.email });
                    setCreateOpen(false);
                    navigate(`/contacts/${duplicateContact.id}`);
                  }}
                  className="mt-2 font-semibold text-link underline"
                >
                  Open existing contact ({duplicateContact.firstName} {duplicateContact.lastName}) →
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold">First name *</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="contact-first-name"
                  className="h-9 w-full rounded-[6px] border border-line px-3"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold">Last name</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="contact-last-name"
                  className="h-9 w-full rounded-[6px] border border-line px-3"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold">Job title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 w-full rounded-[6px] border border-line px-3"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold">Phone</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 w-full rounded-[6px] border border-line px-3"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="font-semibold">Associated Company</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
              >
                {world.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.crossDivision?.primaryDivision ?? c.industry})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

/* ─────────────────────────── COMPANIES INDEX ─────────────────────────── */
export function CompaniesIndex() {
  const { pack, world, persona } = useShell();

  const views: View<Company>[] = [
    { id: "all", label: "All companies", filter: () => true },
    {
      id: "division",
      label: "My division",
      filter: (c) => c.crossDivision?.primaryDivision === persona.division || c.ownerId === persona.id,
    },
    {
      id: "multi",
      label: "Multi-division accounts",
      filter: (c) => (c.crossDivision?.divisionsActive.length ?? 0) > 1,
    },
  ];

  const columns: Column<Company>[] = [
    {
      id: "name",
      label: "Company Name",
      sort: (c) => c.name,
      cell: (c) => (
        <div className="flex flex-wrap items-center gap-2">
          <A to={`/companies/${c.id}`} className="hs-link font-semibold" data-testid={`company-link-${c.id}`}>
            {c.name}
          </A>
          {c.parentCompanyId ? <Tag tone="blue">Child Branch</Tag> : null}
          {c.childCompanyIds && c.childCompanyIds.length > 0 ? <Tag tone="teal">Parent HQ</Tag> : null}
          {c.missingDomainDuplicateOf ? <Tag tone="amber">Suspected Duplicate</Tag> : null}
        </div>
      ),
    },
    { id: "domain", label: "Company Domain", cell: (c) => c.domain || <span className="text-[#99201a]">Missing domain</span> },
    { id: "division", label: "Primary Division", cell: (c) => c.crossDivision?.primaryDivision ?? "—" },
    {
      id: "cross",
      label: "Divisions Active",
      cell: (c) =>
        c.crossDivision && c.crossDivision.divisionsActive.length > 1 ? (
          <Tag tone="purple">{c.crossDivision.divisionsActive.length} divisions</Tag>
        ) : (
          "1 division"
        ),
    },
    {
      id: "owner",
      label: "Account Owner",
      cell: (c) => pack.personas.find((p) => p.id === c.ownerId)?.name ?? c.ownerId ?? "—",
    },
    { id: "city", label: "Location", cell: (c) => `${c.city}, ${c.state}` },
    {
      id: "erp",
      label: "ERP Account",
      cell: (c) => (c.erp ? `${c.erp.systemName ?? "ERP"} · ${c.erp.accountNumber}` : "—"),
    },
  ];

  return (
    <IndexPage
      title="Companies"
      noun="company"
      rows={world.companies}
      columns={columns}
      views={views}
      rowKey={(c) => c.id}
      searchText={(c) => `${c.name} ${c.domain} ${c.crossDivision?.primaryDivision ?? ""} ${c.city} ${c.erp?.accountNumber ?? ""}`}
      preview={(c, close) => (
        <PreviewShell title={c.name} subtitle={`${c.crossDivision?.primaryDivision ?? c.industry} · ${c.city}, ${c.state}`} to={`/companies/${c.id}`} onClose={close}>
          <dl>
            <Prop label="Domain">{c.domain || "None (Suspected ERP duplicate)"}</Prop>
            <Prop label="Industry">{c.industry}</Prop>
            <Prop label="Active divisions">{c.crossDivision?.divisionsActive.join(", ") || "—"}</Prop>
            <Prop label="ERP Account">{c.erp?.accountNumber ?? "—"}</Prop>
          </dl>
        </PreviewShell>
      )}
    />
  );
}

/* ─────────────────────────── DEALS INDEX (MULTI-PIPELINE + BOARD) ─────────────────────────── */
export function DealsIndex() {
  const { pack, world, persona, dispatch, navigate } = useShell();
  const selectedPipelineId = world.ui["deals.pipeline"] || pack.pipelines[0]?.id || "security-fence";
  const isBoard = world.ui["deals.layout"] === "board";
  const activeViewId = world.ui["deals.view"] || "all";

  const [pendingStageMove, setPendingStageMove] = useState<{ deal: Deal; targetStage: DealStage } | null>(null);
  const [addViewOpen, setAddViewOpen] = useState(false);
  const [viewLabel, setViewLabel] = useState("My Open Bids Due This Month");
  const [viewVisibility, setViewVisibility] = useState<"Private" | "Team">("Private");
  const [viewMyDeals, setViewMyDeals] = useState(true);
  const [viewBidThisMonth, setViewBidThisMonth] = useState(true);

  const [addDealOpen, setAddDealOpen] = useState(false);
  const [dealName, setDealName] = useState("");
  const [dealAmount, setDealAmount] = useState("45000");
  const [dealCloseDate, setDealCloseDate] = useState(() => new Date(nowMs() + 30 * 86_400_000).toISOString().slice(0, 10));
  const [dealCompanyId, setDealCompanyId] = useState(world.companies[0]?.id ?? "");
  const [dealCompanyRole, setDealCompanyRole] = useState("General Contractor");

  const activePipeline = pack.pipelines.find((p) => p.id === selectedPipelineId);
  const isGlobalReadOnly = activePipeline?.readOnly === true;

  const pipelineFilteredDeals =
    selectedPipelineId === "all"
      ? world.deals.filter((d) => d.pipelineId !== "global")
      : world.deals.filter((d) => d.pipelineId === selectedPipelineId);

  const views: View<Deal>[] = [
    { id: "all", label: "All deals", filter: () => true },
    {
      id: "mine",
      label: "My deals",
      filter: (d) =>
        d.ownerId === persona.id ||
        d.outsideSalesOwnerId === persona.id ||
        d.insideSalesOwnerId === persona.id ||
        d.estimatorOwnerId === persona.id,
    },
    ...world.savedDealViews.map((sv) => ({
      id: sv.id,
      label: `${sv.label} (${sv.visibility})`,
      filter: (d: Deal) => {
        if (sv.myDealsOnly) {
          const isMine =
            d.ownerId === persona.id ||
            d.outsideSalesOwnerId === persona.id ||
            d.insideSalesOwnerId === persona.id ||
            d.estimatorOwnerId === persona.id;
          if (!isMine) return false;
        }
        return true;
      },
    })),
  ];

  const filters: Filter<Deal>[] = [
    {
      id: "owner",
      label: "Deal Owner",
      options: pack.personas.map((p) => ({ value: p.id, label: p.name })),
      test: (d, v) => d.ownerId === v || d.outsideSalesOwnerId === v || d.insideSalesOwnerId === v,
    },
  ];

  function requestStageMove(deal: Deal, targetStageId: string) {
    if (deal.readOnly || deal.pipelineId === "global") return;
    const pl = pack.pipelines.find((p) => p.id === deal.pipelineId);
    const st = pl?.stages.find((s) => s.id === targetStageId);
    if (!st) return;
    if (st.prompt) {
      setPendingStageMove({ deal, targetStage: st });
      return;
    }
    dispatch({ t: "deal.setStage", dealId: deal.id, stage: st.id, at: nowMs() });
  }

  const columns: Column<Deal>[] = [
    {
      id: "name",
      label: "Deal Name",
      sort: (d) => d.name,
      cell: (d) => (
        <div className="flex flex-wrap items-center gap-2">
          <A to={`/deals/${d.id}`} className="hs-link font-semibold" data-testid={`deal-link-${d.id}`}>
            {d.name}
          </A>
          {d.readOnly ? <Tag tone="amber">Read-Only Shadow</Tag> : null}
        </div>
      ),
    },
    {
      id: "pipeline",
      label: "Pipeline",
      cell: (d) => pack.pipelines.find((p) => p.id === d.pipelineId)?.name ?? d.division,
    },
    {
      id: "stage",
      label: "Deal Stage",
      cell: (d) => {
        const pl = pack.pipelines.find((p) => p.id === d.pipelineId);
        const label = pl?.stages.find((s) => s.id === d.stage)?.label ?? d.stage;
        return <Tag tone={statusTone(label)}>{label}</Tag>;
      },
    },
    {
      id: "company",
      label: "Primary Company",
      cell: (d) => {
        const co = world.companies.find((c) => c.id === d.companyId);
        return co ? (
          <A to={`/companies/${co.id}`} className="hs-link">
            {co.name}
          </A>
        ) : (
          "—"
        );
      },
    },
    {
      id: "owners",
      label: "Deal Team",
      cell: (d) => {
        const ids = [...new Set([d.ownerId, d.outsideSalesOwnerId, d.insideSalesOwnerId, d.estimatorOwnerId].filter(Boolean) as string[])];
        return (
          <div className="flex items-center gap-1">
            {ids.map((oid) => {
              const p = pack.personas.find((x) => x.id === oid);
              return p ? <Avatar key={oid} name={p.name} color={p.color} size={22} /> : null;
            })}
          </div>
        );
      },
    },
    { id: "close", label: "Close Date", sort: (d) => d.closeDate, cell: (d) => date(d.closeDate) },
    { id: "amount", label: "Amount", align: "right", sort: (d) => d.amount, cell: (d) => money(d.amount) },
  ];

  return (
    <>
      <IndexPage
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            <span>Deals</span>
            <Ext id="multi-pipeline-selector">
              <select
                value={selectedPipelineId}
                onChange={(e) => dispatch({ t: "deal.selectPipeline", pipelineId: e.target.value })}
                aria-label="Select deal pipeline"
                data-testid="pipeline-selector"
                className="h-9 rounded-[6px] border border-line bg-white px-3 text-[14px] font-semibold text-ink"
              >
                {pack.pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.readOnly ? "(Read-Only Rollup)" : ""}
                  </option>
                ))}
                <option value="all">All Division Pipelines</option>
              </select>
            </Ext>
            {isGlobalReadOnly ? (
              <Ext id="global-shadow-pipeline">
                <Tag tone="amber">Global Shadow Pipeline · Read-Only Executive Rollup</Tag>
              </Ext>
            ) : null}
          </span>
        }
        noun="deal"
        rows={pipelineFilteredDeals}
        columns={columns}
        views={views}
        activeViewId={activeViewId}
        onViewChange={(id) => dispatch({ t: "ui", k: "deals.view", v: id })}
        extraTabsRight={
          <button
            type="button"
            onClick={() => setAddViewOpen(true)}
            data-testid="add-view-btn"
            className="inline-flex h-8 items-center gap-1 rounded-[6px] px-2.5 text-[12.5px] font-semibold text-link hover:bg-[#eef5f5]"
          >
            <Icon name="plus" size={13} /> Add view
          </button>
        }
        filters={filters}
        rowKey={(d) => d.id}
        searchText={(d) => `${d.name} ${d.division} ${d.customerPo ?? ""} ${d.amicoOrderNumber ?? ""}`}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white">
              <button
                type="button"
                onClick={() => dispatch({ t: "deal.setLayout", board: false })}
                data-testid="layout-table"
                className={cx("inline-flex h-9 items-center gap-1.5 px-3 text-[13px] font-semibold", !isBoard ? "bg-nav text-white" : "text-ink")}
              >
                <Icon name="list" size={14} /> Table
              </button>
              <button
                type="button"
                onClick={() => dispatch({ t: "deal.setLayout", board: true })}
                data-testid="layout-board"
                className={cx("inline-flex h-9 items-center gap-1.5 px-3 text-[13px] font-semibold", isBoard ? "bg-nav text-white" : "text-ink")}
              >
                <Icon name="board" size={14} /> Board
              </button>
            </div>
            <Button
              variant="primary"
              icon="plus"
              disabled={isGlobalReadOnly}
              onClick={() => setAddDealOpen(true)}
              data-testid="add-deal-btn"
            >
              Add deal
            </Button>
          </div>
        }
        alternate={
          isBoard && activePipeline
            ? (visible) => (
                <div className="hs-scroll flex gap-3 overflow-x-auto p-4" data-testid="deals-board">
                  {activePipeline.stages.map((st) => {
                    const stageDeals = visible.filter((d) => d.stage === st.id);
                    const sum = stageDeals.reduce((acc, d) => acc + d.amount, 0);
                    return (
                      <div
                        key={st.id}
                        data-testid={`board-col-${st.id}`}
                        className="flex w-[265px] shrink-0 flex-col rounded-[8px] bg-[#f4f5f7] p-2.5"
                      >
                        <div className="mb-2 px-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-[12.5px] font-semibold">{st.label}</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold">{stageDeals.length}</span>
                          </div>
                          <div className="mt-0.5 text-[11.5px] text-ink-muted tabular-nums">
                            {money(sum)} · {Math.round(st.probability * 100)}%
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {stageDeals.map((d) => {
                            const company = world.companies.find((c) => c.id === d.companyId);
                            const ownerIds = [
                              ...new Set([d.ownerId, d.outsideSalesOwnerId, d.insideSalesOwnerId, d.estimatorOwnerId].filter(Boolean) as string[]),
                            ];
                            return (
                              <div
                                key={d.id}
                                data-testid={`board-card-${d.id}`}
                                className="rounded-[8px] border border-line bg-white p-3 shadow-xs"
                              >
                                <A to={`/deals/${d.id}`} className="hs-link block text-[13.5px] font-semibold leading-snug">
                                  {d.name}
                                </A>
                                {company ? <p className="mt-0.5 text-[12px] text-ink-muted">{company.name}</p> : null}
                                <div className="mt-2 flex items-center justify-between text-[12.5px]">
                                  <span className="font-semibold tabular-nums">{money(d.amount)}</span>
                                  <div className="flex items-center gap-1">
                                    {ownerIds.map((oid) => {
                                      const p = pack.personas.find((x) => x.id === oid);
                                      return p ? <Avatar key={oid} name={p.name} color={p.color} size={20} /> : null;
                                    })}
                                  </div>
                                </div>
                                {d.bidDate ? <p className="mt-1 text-[11px] text-ink-muted">Bid date: {date(d.bidDate)}</p> : null}

                                {!d.readOnly && !isGlobalReadOnly ? (
                                  <Menu
                                    width={220}
                                    className="mt-2"
                                    button={({ toggle }) => (
                                      <button
                                        type="button"
                                        onClick={toggle}
                                        data-testid={`card-move-stage-${d.id}`}
                                        className="flex h-7 w-full items-center justify-between rounded border border-line bg-[#fafafa] px-2 text-[11.5px] font-medium hover:bg-[#efefef]"
                                      >
                                        <span>Move stage…</span>
                                        <Icon name="chevronDown" size={12} />
                                      </button>
                                    )}
                                  >
                                    {(close) =>
                                      activePipeline.stages.map((opt) => (
                                        <MenuItem
                                          key={opt.id}
                                          active={opt.id === d.stage}
                                          testId={`move-${d.id}-to-${opt.id}`}
                                          onClick={() => {
                                            close();
                                            requestStageMove(d, opt.id);
                                          }}
                                        >
                                          {opt.label}
                                        </MenuItem>
                                      ))
                                    }
                                  </Menu>
                                ) : (
                                  <div className="mt-2 text-[11px] font-medium text-ink-muted">Read-only shadow card</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            : undefined
        }
      />

      {pendingStageMove ? (
        <StagePromptModal
          deal={pendingStageMove.deal}
          targetStage={pendingStageMove.targetStage}
          onCancel={() => setPendingStageMove(null)}
          onConfirm={(values) => {
            dispatch({
              t: "deal.setStage",
              dealId: pendingStageMove.deal.id,
              stage: pendingStageMove.targetStage.id,
              promptValues: values,
              at: nowMs(),
            });
            setPendingStageMove(null);
          }}
        />
      ) : null}

      {addViewOpen ? (
        <Modal
          title="Create Saved Deal View"
          onClose={() => setAddViewOpen(false)}
          testId="create-view-modal"
          footer={
            <>
              <Button onClick={() => setAddViewOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!viewLabel.trim()}
                data-testid="save-view-btn"
                onClick={() => {
                  dispatch({
                    t: "dealView.create",
                    label: viewLabel.trim(),
                    visibility: viewVisibility,
                    pipelineId: selectedPipelineId,
                    myDealsOnly: viewMyDeals,
                    bidDueThisMonth: viewBidThisMonth,
                  });
                  setAddViewOpen(false);
                }}
              >
                Save view tab
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-[13.5px]">
            <label className="block space-y-1">
              <span className="font-semibold">View name *</span>
              <input
                type="text"
                value={viewLabel}
                onChange={(e) => setViewLabel(e.target.value)}
                data-testid="view-name-input"
                className="h-9 w-full rounded-[6px] border border-line px-3"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Sharing visibility</span>
              <select
                value={viewVisibility}
                onChange={(e) => setViewVisibility(e.target.value as "Private" | "Team")}
                data-testid="view-visibility-select"
                className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
              >
                <option value="Private">Private (only me)</option>
                <option value="Team">My Division Team</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={viewMyDeals} onChange={(e) => setViewMyDeals(e.target.checked)} />
              <span>Filter to deals where I am Owner / Inside Sales / Estimator</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={viewBidThisMonth} onChange={(e) => setViewBidThisMonth(e.target.checked)} />
              <span>Bid Date or Close Date within next 30 days</span>
            </label>
          </div>
        </Modal>
      ) : null}

      {addDealOpen ? (
        <Modal
          title="Create Deal"
          onClose={() => setAddDealOpen(false)}
          testId="create-deal-modal"
          footer={
            <>
              <Button onClick={() => setAddDealOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!dealName.trim()}
                data-testid="create-deal-submit"
                onClick={() => {
                  const targetPl = activePipeline && !activePipeline.readOnly ? activePipeline : pack.pipelines[0];
                  dispatch({
                    t: "deal.create",
                    name: dealName.trim(),
                    pipelineId: targetPl.id,
                    stage: targetPl.stages[0].id,
                    amount: Number(dealAmount) || 0,
                    closeDate: dealCloseDate,
                    companyId: dealCompanyId,
                    contactIds: world.contacts.filter((c) => c.companyId === dealCompanyId).map((c) => c.id),
                    companyLabels: { [dealCompanyId]: [dealCompanyRole] },
                    at: nowMs(),
                  });
                  setAddDealOpen(false);
                  setDealName("");
                  navigate("/deals");
                }}
              >
                Create deal
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-[13.5px]">
            <label className="block space-y-1">
              <span className="font-semibold">Deal Name *</span>
              <input
                type="text"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="Vanguard GC — Substation Perimeter Fence"
                data-testid="deal-name-input"
                className="h-9 w-full rounded-[6px] border border-line px-3"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold">Amount ($)</span>
                <input
                  type="number"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  className="h-9 w-full rounded-[6px] border border-line px-3"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold">Expected Close Date</span>
                <input
                  type="date"
                  value={dealCloseDate}
                  onChange={(e) => setDealCloseDate(e.target.value)}
                  className="h-9 w-full rounded-[6px] border border-line px-3"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold">Associated Company</span>
                <select
                  value={dealCompanyId}
                  onChange={(e) => setDealCompanyId(e.target.value)}
                  className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
                >
                  {world.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="font-semibold">Company Association Label</span>
                <select
                  value={dealCompanyRole}
                  onChange={(e) => setDealCompanyRole(e.target.value)}
                  className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
                >
                  <option value="General Contractor">General Contractor</option>
                  <option value="A/E Firm">A/E Firm</option>
                  <option value="Project Owner">Project Owner</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </label>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

/* ─────────────────────────── TASKS INDEX (SHARED QUEUES) ─────────────────────────── */
export function TasksIndex() {
  const { pack, world, persona, dispatch } = useShell();
  useSeen("seen.tasks", true);

  const activeQueue = world.ui["tasks.view"] || "mine";

  const views: View<Task>[] = [
    { id: "mine", label: "My open tasks", filter: (t) => t.status !== "done" && t.ownerId === persona.id },
    { id: "Prepare quotes", label: "Queue: Prepare quotes", filter: (t) => t.status !== "done" && t.queue === "Prepare quotes" },
    { id: "Quote follow-ups", label: "Queue: Quote follow-ups", filter: (t) => t.status !== "done" && t.queue === "Quote follow-ups" },
    { id: "Stuck deal", label: "Queue: Stuck deal", filter: (t) => t.status !== "done" && t.queue === "Stuck deal" },
    { id: "Estimating", label: "Queue: Estimating", filter: (t) => t.status !== "done" && t.queue === "Estimating" },
    { id: "all", label: "All open", filter: (t) => t.status !== "done" },
    { id: "done", label: "Completed", filter: (t) => t.status === "done" },
  ];

  const columns: Column<Task>[] = [
    {
      id: "done",
      label: "Done",
      width: 60,
      cell: (t) => (
        <input
          type="checkbox"
          checked={t.status === "done"}
          data-testid={`task-check-${t.id}`}
          onChange={() => dispatch({ t: "task.toggle", id: t.id })}
        />
      ),
    },
    {
      id: "title",
      label: "Task Title",
      sort: (t) => t.title,
      cell: (t) => <span className={cx("font-semibold", t.status === "done" && "line-through text-ink-muted")}>{t.title}</span>,
    },
    { id: "queue", label: "Queue", cell: (t) => (t.queue ? <Tag tone="purple">{t.queue}</Tag> : "General") },
    {
      id: "priority",
      label: "Priority",
      cell: (t) => <Tag tone={t.priority === "High" ? "red" : "neutral"}>{t.priority}</Tag>,
    },
    {
      id: "record",
      label: "Associated Record",
      cell: (t) => {
        if (t.dealId) {
          const d = world.deals.find((x) => x.id === t.dealId);
          if (d)
            return (
              <A to={`/deals/${d.id}`} className="hs-link">
                {d.name}
              </A>
            );
        }
        if (t.companyId) {
          const c = world.companies.find((x) => x.id === t.companyId);
          if (c)
            return (
              <A to={`/companies/${c.id}`} className="hs-link">
                {c.name}
              </A>
            );
        }
        return "—";
      },
    },
    {
      id: "owner",
      label: "Assigned To",
      cell: (t) => pack.personas.find((p) => p.id === t.ownerId)?.name ?? t.ownerId,
    },
    { id: "due", label: "Due Date", sort: (t) => t.dueAt, cell: (t) => date(t.dueAt) },
  ];

  return (
    <Ext id="shared-task-queues">
      <IndexPage
        title="Tasks & Shared Queues"
        noun="task"
        rows={world.tasks}
        columns={columns}
        views={views}
        activeViewId={activeQueue}
        onViewChange={(id) => {
          dispatch([
            { t: "ui", k: "tasks.view", v: id },
            ...(id === "Stuck deal" ? [{ t: "flag" as const, k: "seen.stuckQueue" }] : []),
          ]);
        }}
        rowKey={(t) => t.id}
        searchText={(t) => `${t.title} ${t.queue ?? ""} ${t.type}`}
      />
    </Ext>
  );
}

/* ─────────────────────────── NATIVE QUOTES INDEX ─────────────────────────── */
export function QuotesIndex() {
  const { world } = useShell();
  const views: View<Quote>[] = [{ id: "all", label: "All native HubSpot quotes", filter: () => true }];
  const columns: Column<Quote>[] = [
    {
      id: "num",
      label: "Quote #",
      cell: (q) => (
        <A to={`/quotes/${q.id}`} className="hs-link font-semibold" data-testid={`quote-link-${q.id}`}>
          {q.number}: {q.title}
        </A>
      ),
    },
    { id: "status", label: "Status", cell: (q) => <Tag tone={statusTone(q.status)}>{q.status}</Tag> },
    { id: "exp", label: "Valid Until", cell: (q) => date(q.validUntil) },
    {
      id: "lines",
      label: "Line Items",
      cell: (q) => `${q.lineItems.length} SKU${q.lineItems.length === 1 ? "" : "s"}`,
    },
  ];

  return (
    <IndexPage
      title="Quotes (Oracle-Migrated Native HubSpot Quotes)"
      noun="quote"
      rows={world.quotes}
      columns={columns}
      views={views}
      rowKey={(q) => q.id}
      searchText={(q) => `${q.number} ${q.title} ${q.status}`}
    />
  );
}

/* ─────────────────────────── PRODUCTS INDEX ─────────────────────────── */
export function ProductsIndex() {
  const { pack } = useShell();
  const views: View<Product>[] = [{ id: "all", label: "Oracle & AMICO Product Library", filter: () => true }];
  const columns: Column<Product>[] = [
    { id: "sku", label: "SKU", cell: (p) => <span className="font-mono text-[12.5px] font-semibold">{p.sku}</span> },
    { id: "name", label: "Product Name", cell: (p) => p.name },
    { id: "cat", label: "Family", cell: (p) => p.family },
    { id: "div", label: "Division", cell: (p) => p.division ?? "All Divisions" },
    { id: "lead", label: "Lead Days", cell: (p) => `${p.leadDays}d` },
    { id: "price", label: "List Price", align: "right", cell: (p) => money2(p.price) },
  ];

  return (
    <IndexPage
      title="Products · Oracle-Migrated SKU Catalog"
      noun="product"
      rows={pack.products}
      columns={columns}
      views={views}
      rowKey={(p) => p.sku}
      searchText={(p) => `${p.sku} ${p.name} ${p.family}`}
    />
  );
}

/* ─────────────────────────── WORKFLOWS INDEX ─────────────────────────── */
export function WorkflowsIndex() {
  const { pack } = useShell();
  const views: View<Workflow>[] = [{ id: "all", label: "All workflows", filter: () => true }];
  const columns: Column<Workflow>[] = [
    {
      id: "name",
      label: "Workflow Name",
      cell: (w) => (
        <A to={`/workflows/${w.id}`} className="hs-link font-semibold" data-testid={`workflow-link-${w.id}`}>
          {w.name}
        </A>
      ),
    },
    { id: "obj", label: "Object", cell: (w) => w.object },
    { id: "desc", label: "Summary", cell: (w) => w.description },
    { id: "status", label: "Status", cell: (w) => <Tag tone={statusTone(w.status)}>{w.status}</Tag> },
    { id: "enrolled", label: "Total Enrolled", align: "right", cell: (w) => w.enrolled },
  ];

  return (
    <IndexPage
      title="Workflows · AMICO Automation"
      noun="workflow"
      rows={pack.workflows}
      columns={columns}
      views={views}
      rowKey={(w) => w.id}
      searchText={(w) => `${w.name} ${w.description} ${w.object}`}
    />
  );
}
