"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useSeen, useShell } from "@/store/store";
import type { Company, Contact, Deal, DealStage, Product, Quote, Task, Workflow } from "@/tenants/types";
import { Ext } from "../ext";
import { date, money, money2, shortDate } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, colorFor, cx, Drawer, Menu, MenuItem, Modal, statusTone, Tag } from "../ui";
import { IndexPage, type Column, type Filter, type View } from "./index-table";
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

  const isCreateOpen = createOpen || world.ui.quickCreate === "contact";
  const closeCreate = () => {
    setCreateOpen(false);
    if (world.ui.quickCreate === "contact") {
      dispatch({ t: "ui", k: "quickCreate", v: "" });
    }
  };

  const normalizedInput = email.trim().toLowerCase();
  const duplicateContact = normalizedInput
    ? world.contacts.find((c) => c.email.toLowerCase() === normalizedInput)
    : undefined;

  const views: View<Contact>[] = [
    { id: "all", label: "All contacts", filter: () => true },
    { id: "mine", label: "My contacts", filter: (c) => c.ownerId === persona.id },
    { id: "customers", label: "Active customers", filter: (c) => c.lifecycle === "Customer" || c.lifecycle === "Opportunity" },
  ];

  const filters: Filter<Contact>[] = [
    {
      id: "owner",
      label: "Contact owner",
      options: pack.personas.map((p) => ({ value: p.id, label: p.name })),
      test: (c, v) => c.ownerId === v,
    },
    {
      id: "lifecycle",
      label: "Lifecycle stage",
      options: ["Lead", "Marketing Qualified Lead", "Sales Qualified Lead", "Opportunity", "Customer"].map((v) => ({ value: v, label: v })),
      test: (c, v) => c.lifecycle === v,
    },
  ];

  const columns: Column<Contact>[] = [
    {
      id: "name",
      label: "Name",
      sort: (c) => `${c.firstName} ${c.lastName}`,
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={`${c.firstName} ${c.lastName}`} color={colorFor(c.id)} size={24} />
          <A to={`/contacts/${c.id}`} className="hs-link" data-testid={`contact-link-${c.id}`}>
            {c.firstName} {c.lastName}
          </A>
        </div>
      ),
    },
    { id: "email", label: "Email", cell: (c) => <span className="text-[#006162]">{c.email}</span> },
    { id: "phone", label: "Phone Number", cell: (c) => c.phone || "—" },
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
    { id: "status", label: "Lead Status", cell: (c) => <Tag tone={statusTone(c.leadStatus)}>{c.leadStatus}</Tag> },
    {
      id: "owner",
      label: "Contact Owner",
      cell: (c) => {
        const p = pack.personas.find((x) => x.id === c.ownerId);
        return p ? (
          <span className="inline-flex items-center gap-1.5">
            <Avatar name={p.name} color={p.color} size={20} />
            <span>{p.name}</span>
          </span>
        ) : (
          c.ownerId ?? "—"
        );
      },
    },
    { id: "stage", label: "Lifecycle Stage", cell: (c) => <Tag>{c.lifecycle}</Tag> },
  ];

  return (
    <>
      <IndexPage
        title="Contacts"
        objectSwitcherLabel="Contacts"
        noun="contact"
        rows={world.contacts}
        columns={columns}
        views={views}
        filters={filters}
        rowKey={(c) => c.id}
        isNew={(c) => Boolean(c.isNew)}
        searchText={(c) => `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.title}`}
        onPreviewRow={(c) => dispatch({ t: "ui", k: "preview", v: `contact:${c.id}` })}
        headerActions={
          <>
            <Button size="sm" icon="upload">
              Import
            </Button>
            <Button size="sm" icon="columns">
              Edit columns
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)} data-testid="add-contact-btn">
              Create contact
            </Button>
          </>
        }
      />

      {/* Authentic Right-Side HubSpot Create Contact Drawer */}
      {isCreateOpen ? (
        <Drawer
          title="Create Contact"
          subtitle="Contacts are deduplicated globally by Email across all AMICO divisions"
          onClose={closeCreate}
          testId="create-contact-modal"
          footer={
            <>
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
                  closeCreate();
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                }}
              >
                Create
              </Button>
              <Button onClick={closeCreate}>Cancel</Button>
            </>
          }
        >
          <div className="space-y-4 text-[13px]">
            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">Email *</span>
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
                placeholder="elena.rostova@gradingpacific.example"
                data-testid="contact-email-input"
                className="hs-input w-full"
              />
            </label>

            {duplicateContact ? (
              <div
                className="rounded-[4px] border border-[#f5c26b] bg-[#fef6e7] p-3.5 text-[12.5px] text-[#8a5300]"
                data-testid="duplicate-email-banner"
              >
                <p className="font-semibold">
                  {duplicateContact.email} already belongs to {duplicateContact.firstName} {duplicateContact.lastName}.
                </p>
                <p className="mt-1 text-[12px]">
                  HubSpot enforces unique email addresses on Contacts so divisions share one unified contact record.
                </p>
                <button
                  type="button"
                  data-testid="open-existing-contact-btn"
                  onClick={() => {
                    dispatch({ t: "contact.duplicateChecked", email: duplicateContact.email });
                    closeCreate();
                    navigate(`/contacts/${duplicateContact.id}`);
                  }}
                  className="mt-2 font-semibold text-[#006162] hover:underline"
                >
                  View existing contact ({duplicateContact.firstName} {duplicateContact.lastName}) →
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">First name *</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="contact-first-name"
                  className="hs-input w-full"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">Last name</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="contact-last-name"
                  className="hs-input w-full"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">Contact owner</span>
              <input readOnly value={persona.name} className="hs-input w-full !bg-[#eaf0f6]" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">Job title</span>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="hs-input w-full" />
              </label>
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">Phone number</span>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="hs-input w-full" />
              </label>
            </div>

            <div className="border-t border-[#dfe3eb] pt-4">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#516f90]">
                Associate Contact with
              </p>
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">Company</span>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="hs-input w-full">
                  {world.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.crossDivision?.primaryDivision ?? c.industry})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </Drawer>
      ) : null}
    </>
  );
}

function erpOracleCustomerId(c: Company) {
  if (!c.erp?.accountNumber) return "—";
  return c.erp.accountNumber.split("/")[0]?.trim() ?? "—";
}

function erpEpicorCompanyId(c: Company) {
  if (!c.erp?.accountNumber) return "—";
  const second = c.erp.accountNumber.split("/")[1]?.trim();
  if (!second) return "—";
  return second.replace(/^EPI-/i, "").slice(0, 6);
}

function erpEpicorCustomerId(c: Company) {
  if (!c.erp?.accountNumber) return "—";
  return c.erp.accountNumber.split("/").pop()?.trim() ?? "—";
}

/* ─────────────────────────── COMPANIES INDEX ─────────────────────────── */
export function CompaniesIndex() {
  const { pack, world, persona, dispatch, navigate } = useShell();
  const [createInfoOpen, setCreateInfoOpen] = useState(false);
  const [domainLookup, setDomainLookup] = useState("");

  const matchedCompany = domainLookup.trim()
    ? world.companies.find(
        (c) =>
          c.domain.toLowerCase().includes(domainLookup.trim().toLowerCase()) ||
          c.name.toLowerCase().includes(domainLookup.trim().toLowerCase()),
      )
    : undefined;

  const divisions = Array.from(
    new Set(world.companies.map((c) => c.crossDivision?.primaryDivision).filter(Boolean) as string[]),
  );

  const views: View<Company>[] = [
    { id: "all", label: "All companies", filter: () => true },
    {
      id: "my",
      label: "My companies",
      filter: (c) => c.ownerId === persona.id,
    },
    {
      id: "division",
      label: "My division",
      filter: (c) => c.crossDivision?.primaryDivision === persona.division || c.ownerId === persona.id,
    },
    {
      id: "multi",
      label: "Cross-Division",
      filter: (c) => (c.crossDivision?.divisionsActive.length ?? 0) > 1,
    },
    {
      id: "duplicates",
      label: "Missing Domain / Review",
      filter: (c) => !c.domain || Boolean(c.missingDomainDuplicateOf),
    },
  ];

  const filters: Filter<Company>[] = [
    {
      id: "owner",
      label: "Company owner",
      options: pack.personas.map((p) => ({ value: p.id, label: p.name })),
      test: (c, v) => c.ownerId === v,
    },
    {
      id: "division",
      label: "Division",
      options: divisions.map((d) => ({ value: d, label: d })),
      test: (c, v) => c.crossDivision?.primaryDivision === v || Boolean(c.crossDivision?.divisionsActive.includes(v)),
    },
    {
      id: "lifecycle",
      label: "Lead status",
      options: [
        { value: "Customer", label: "Customer" },
        { value: "Opportunity", label: "Opportunity" },
        { value: "Lead", label: "Lead" },
      ],
      test: (c, v) => c.lifecycle === v,
    },
  ];

  const columns: Column<Company>[] = [
    {
      id: "name",
      label: "Company name",
      sort: (c) => c.name,
      cell: (c) => (
        <div className="flex flex-wrap items-center gap-2">
          <Avatar name={c.name} color={colorFor(c.id)} size={24} />
          <A to={`/companies/${c.id}`} className="hs-link" data-testid={`company-link-${c.id}`}>
            {c.name}
          </A>
          {c.parentCompanyId ? <Tag tone="blue">Child Branch</Tag> : null}
          {c.childCompanyIds && c.childCompanyIds.length > 0 ? <Tag tone="teal">Parent HQ</Tag> : null}
          {c.missingDomainDuplicateOf ? <Tag tone="amber">Suspected Duplicate</Tag> : null}
        </div>
      ),
    },
    { id: "oracle", label: "Oracle Customer ID", cell: (c) => <span className="font-mono text-[12px]">{erpOracleCustomerId(c)}</span> },
    { id: "epicorCo", label: "Epicor Company ID", cell: (c) => <span className="font-mono text-[12px]">{erpEpicorCompanyId(c)}</span> },
    {
      id: "epicorCust",
      label: "Epicor Customer ID",
      cell: (c) => <span className="font-mono text-[12px] font-semibold">{erpEpicorCustomerId(c)}</span>,
    },
    {
      id: "owner",
      label: "Company owner",
      cell: (c) => {
        const p = pack.personas.find((x) => x.id === c.ownerId);
        return p ? (
          <span className="inline-flex items-center gap-1.5">
            <Avatar name={p.name} color={p.color} size={20} />
            <span>{p.name}</span>
          </span>
        ) : (
          c.ownerId ?? "—"
        );
      },
    },
    { id: "created", label: "Create Date", sort: (c) => c.createdAt, cell: (c) => <span className="text-[12px]">{date(c.createdAt)}</span> },
    { id: "phone", label: "Phone Number", cell: (c) => <span className="text-[#006162]">{c.phone || "—"}</span> },
    { id: "lastAct", label: "Last Activity Date", sort: (c) => c.lastActivityAt, cell: (c) => shortDate(c.lastActivityAt) },
    { id: "city", label: "City", cell: (c) => c.city },
    { id: "region", label: "Country/Region", cell: (c) => `United States / ${c.state}` },
    { id: "industry", label: "Industry", cell: (c) => c.industry },
  ];

  return (
    <>
      <IndexPage
        title="Companies"
        objectSwitcherLabel="Companies"
        noun="company"
        rows={world.companies}
        columns={columns}
        views={views}
        filters={filters}
        rowKey={(c) => c.id}
        searchText={(c) => `${c.name} ${c.domain} ${c.crossDivision?.primaryDivision ?? ""} ${c.city} ${c.erp?.accountNumber ?? ""}`}
        onPreviewRow={(c) => dispatch({ t: "ui", k: "preview", v: `company:${c.id}` })}
        headerActions={
          <>
            <Button size="sm" icon="upload">
              Import
            </Button>
            <Button size="sm" icon="columns">
              Edit columns
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateInfoOpen(true)} data-testid="create-company-btn">
              Create company
            </Button>
          </>
        }
      />

      {createInfoOpen ? (
        <Drawer
          title="Create Company"
          subtitle="HubSpot deduplicates Companies by Company Domain Name across all 9 AMICO divisions"
          onClose={() => setCreateInfoOpen(false)}
          testId="create-company-drawer"
          footer={<Button onClick={() => setCreateInfoOpen(false)}>Close</Button>}
        >
          <div className="space-y-4 text-[13px]">
            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">Company domain name *</span>
              <input
                value={domainLookup}
                onChange={(e) => setDomainLookup(e.target.value)}
                placeholder="gradingpacific.com"
                className="hs-input w-full"
              />
            </label>
            {matchedCompany ? (
              <div className="rounded-[4px] border border-[#99d6e2] bg-[#e6f7f7] p-3.5 text-[#00494b]">
                <p className="font-semibold">{matchedCompany.name} already exists in HubSpot!</p>
                <p className="mt-1 text-[12px]">
                  Primary division: {matchedCompany.crossDivision?.primaryDivision ?? matchedCompany.industry}. Open the shared Company record instead of creating a duplicate.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCreateInfoOpen(false);
                    navigate(`/companies/${matchedCompany.id}`);
                  }}
                  className="mt-2 font-semibold text-[#006162] underline"
                >
                  Open {matchedCompany.name} →
                </button>
              </div>
            ) : (
              <p className="rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3 text-[12.5px] text-[#516f90]">
                AMICO Governance Rule: Search by Company name or domain first. Most customer and GC accounts were migrated from Epicor &amp; Pipedrive.
              </p>
            )}
          </div>
        </Drawer>
      ) : null}
    </>
  );
}

/* ─────────────────────────── DEALS INDEX (SAVED VIEWS + KANBAN BOARD) ─────────────────────────── */
export function DealsIndex() {
  const { pack, world, persona, dispatch, navigate } = useShell();
  const selectedPipelineId = world.ui["deals.pipeline"] || pack.pipelines[0]?.id || "security-fence";
  const isBoard = world.ui["deals.layout"] === "board";
  const activeViewId = world.ui["deals.view"] || "all";

  const [pendingStageMove, setPendingStageMove] = useState<{ deal: Deal; targetStage: DealStage } | null>(null);
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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

  const isAddDealOpen = addDealOpen || world.ui.quickCreate === "deal";
  const closeAddDeal = () => {
    setAddDealOpen(false);
    if (world.ui.quickCreate === "deal") {
      dispatch({ t: "ui", k: "quickCreate", v: "" });
    }
  };

  const activePipeline = pack.pipelines.find((p) => p.id === selectedPipelineId);
  const isGlobalReadOnly = activePipeline?.readOnly === true;

  const pipelineFilteredDeals =
    selectedPipelineId === "all"
      ? world.deals.filter((d) => d.pipelineId !== "global")
      : world.deals.filter((d) => d.pipelineId === selectedPipelineId);

  const views: View<Deal>[] = [
    { id: "all", label: "All deals", filter: () => true, closable: false },
    {
      id: "mine",
      label: "My deals",
      filter: (d) =>
        d.ownerId === persona.id ||
        d.outsideSalesOwnerId === persona.id ||
        d.insideSalesOwnerId === persona.id ||
        d.estimatorOwnerId === persona.id,
    },
    {
      id: "stuck",
      label: "Stuck > 14 Days",
      filter: (d) => (d.daysInStage ?? 0) >= 14,
    },
    {
      id: "cross-div",
      label: "Cross-Division",
      filter: (d) => Boolean(d.dealLinks && d.dealLinks.length > 0) || Boolean(d.sourceDivision),
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

  const dealDivisions = Array.from(new Set(world.deals.map((d) => d.division)));

  const filters: Filter<Deal>[] = [
    {
      id: "owner",
      label: "Deal owner",
      options: pack.personas.map((p) => ({ value: p.id, label: p.name })),
      test: (d, v) => d.ownerId === v || d.outsideSalesOwnerId === v || d.insideSalesOwnerId === v,
    },
    {
      id: "division",
      label: "Division",
      options: dealDivisions.map((dv) => ({ value: dv, label: dv })),
      test: (d, v) => d.division === v,
    },
  ];

  function requestStageMove(deal: Deal, targetStageId: string) {
    if (deal.readOnly || deal.pipelineId === "global" || deal.stage === targetStageId) return;
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
          <A to={`/deals/${d.id}`} className="hs-link" data-testid={`deal-link-${d.id}`}>
            {d.name}
          </A>
          {d.readOnly ? <Tag tone="amber">Read-Only Shadow</Tag> : null}
          {(d.daysInStage ?? 0) >= 14 ? <Tag tone="red">{d.daysInStage}d in stage</Tag> : null}
        </div>
      ),
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
    { id: "close", label: "Close Date", sort: (d) => d.closeDate, cell: (d) => shortDate(d.closeDate) },
    {
      id: "owners",
      label: "Deal Owner",
      cell: (d) => {
        const ids = [...new Set([d.ownerId, d.outsideSalesOwnerId, d.insideSalesOwnerId, d.estimatorOwnerId].filter(Boolean) as string[])];
        const primary = pack.personas.find((x) => x.id === ids[0]);
        return (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {ids.map((oid) => {
                const p = pack.personas.find((x) => x.id === oid);
                return p ? <Avatar key={oid} name={p.name} color={p.color} size={21} /> : null;
              })}
            </div>
            {primary ? <span className="truncate text-[12.5px]">{primary.name}</span> : null}
          </div>
        );
      },
    },
    {
      id: "amount",
      label: "Amount",
      align: "right",
      sort: (d) => d.amount,
      cell: (d) => <span className="font-semibold">{money(d.amount)}</span>,
    },
    {
      id: "company",
      label: "Associated Company",
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
      id: "division",
      label: "Division",
      cell: (d) => <Tag tone="neutral">{d.division}</Tag>,
    },
  ];

  return (
    <>
      <IndexPage
        title="Deals"
        objectSwitcherLabel="Deals"
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
            className="inline-flex h-7 items-center gap-1 rounded-[3px] px-2.5 text-[12.5px] font-semibold text-[#006162] hover:bg-[#e6f7f7]"
          >
            <Icon name="plus" size={13} /> Add view
          </button>
        }
        filters={filters}
        rowKey={(d) => d.id}
        isNew={(d) => Boolean(d.isNew)}
        searchText={(d) => `${d.name} ${d.division} ${d.customerPo ?? ""} ${d.amicoOrderNumber ?? ""}`}
        onPreviewRow={(d) => dispatch({ t: "ui", k: "preview", v: `deal:${d.id}` })}
        headerActions={
          <>
            <Button size="sm" icon="upload">
              Import
            </Button>
            <Button size="sm" icon="columns">
              Edit columns
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isGlobalReadOnly}
              onClick={() => setAddDealOpen(true)}
              data-testid="add-deal-btn"
            >
              Create deal
            </Button>
          </>
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            {/* HubSpot List / Board View Icon Toggle */}
            <div className="inline-flex overflow-hidden rounded-[3px] border border-[#cbd6e2] bg-white">
              <button
                type="button"
                onClick={() => dispatch({ t: "deal.setLayout", board: false })}
                data-testid="layout-table"
                title="List view"
                className={cx(
                  "inline-flex h-8 items-center gap-1.5 border-r border-[#cbd6e2] px-2.5 text-[12.5px] font-semibold",
                  !isBoard ? "bg-[#eaf0f6] text-[#33475b]" : "text-[#516f90] hover:bg-[#f5f8fa]",
                )}
              >
                <Icon name="list" size={14} /> List
              </button>
              <button
                type="button"
                onClick={() => dispatch({ t: "deal.setLayout", board: true })}
                data-testid="layout-board"
                data-tour="layout-board"
                title="Board view"
                className={cx(
                  "inline-flex h-8 items-center gap-1.5 px-2.5 text-[12.5px] font-semibold",
                  isBoard ? "bg-[#eaf0f6] text-[#33475b]" : "text-[#516f90] hover:bg-[#f5f8fa]",
                )}
              >
                <Icon name="board" size={14} /> Board
              </button>
            </div>

            {/* HubSpot Pipeline Selector Dropdown right next to List/Board Toggle */}
            <Ext id="multi-pipeline-selector">
              <select
                value={selectedPipelineId}
                onChange={(e) => dispatch({ t: "deal.selectPipeline", pipelineId: e.target.value })}
                aria-label="Select deal pipeline"
                data-testid="pipeline-selector"
                data-tour="pipeline-selector"
                className="hs-input !h-8 !bg-white font-semibold text-[#006162]"
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
          </div>
        }
        alternate={
          isBoard && activePipeline
            ? (visible) => (
                <div className="hs-scroll flex flex-1 gap-3 overflow-x-auto px-6 py-4" data-testid="deals-board">
                  {activePipeline.stages.map((st) => {
                    const stageDeals = visible.filter((d) => d.stage === st.id);
                    const sum = stageDeals.reduce((acc, d) => acc + d.amount, 0);
                    const probPct =
                      st.probability > 0 && st.probability <= 1
                        ? Math.round(st.probability * 100)
                        : Math.round(st.probability);
                    const weighted = Math.round(sum * (probPct / 100));
                    const isDropTarget = dragOverStage === st.id;

                    return (
                      <div
                        key={st.id}
                        data-testid={`board-col-${st.id}`}
                        onDragOver={(e) => {
                          if (isGlobalReadOnly) return;
                          e.preventDefault();
                          if (dragOverStage !== st.id) setDragOverStage(st.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverStage === st.id) setDragOverStage(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverStage(null);
                          if (!dragDealId || isGlobalReadOnly) return;
                          const dragged = visible.find((d) => d.id === dragDealId) ?? world.deals.find((d) => d.id === dragDealId);
                          setDragDealId(null);
                          if (dragged) requestStageMove(dragged, st.id);
                        }}
                        className={cx(
                          "flex max-h-[calc(100vh-295px)] min-h-[420px] w-[285px] shrink-0 flex-col rounded-[4px] border bg-[#eaf0f6]/65 transition-colors",
                          isDropTarget ? "border-[#006162] bg-[#e6f7f7]" : "border-[#dfe3eb]",
                        )}
                      >
                        {/* Stage Column Header + Probability Bar */}
                        <div className="border-b border-[#dfe3eb] bg-white px-3 pb-2.5 pt-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-semibold text-[#33475b]">{st.label}</span>
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#eaf0f6] px-1.5 text-[11px] font-bold text-[#516f90]">
                              {stageDeals.length}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eaf0f6]">
                              <div
                                className={cx(
                                  "h-full rounded-full",
                                  st.closed === "lost" ? "bg-[#f2545b]" : st.wonRevenue || st.closed === "won" ? "bg-[#00bda5]" : "bg-[#006162]",
                                )}
                                style={{ width: `${Math.max(probPct, st.closed === "lost" ? 100 : 8)}%` }}
                              />
                            </div>
                            <span className="text-[10.5px] font-semibold tabular-nums text-[#516f90]">{probPct}%</span>
                          </div>
                        </div>

                        {/* Scrollable Cards List */}
                        <div className="hs-scroll flex-1 space-y-2.5 overflow-y-auto p-2.5">
                          {stageDeals.map((d) => {
                            const company = world.companies.find((c) => c.id === d.companyId);
                            const primaryContact = world.contacts.find((c) => d.contactIds.includes(c.id));
                            const nextTask = world.tasks.find((t) => t.dealId === d.id && t.status === "open");
                            const ownerIds = [
                              ...new Set([d.ownerId, d.outsideSalesOwnerId, d.insideSalesOwnerId, d.estimatorOwnerId].filter(Boolean) as string[]),
                            ];

                            return (
                              <div
                                key={d.id}
                                draggable={!d.readOnly && !isGlobalReadOnly}
                                onDragStart={() => setDragDealId(d.id)}
                                onDragEnd={() => {
                                  setDragDealId(null);
                                  setDragOverStage(null);
                                }}
                                data-testid={`board-card-${d.id}`}
                                className="group/card rounded-[4px] border border-[#cbd6e2] bg-white shadow-[0_1px_2px_rgba(51,71,91,0.06)] transition-shadow hover:border-[#99acc2] hover:shadow-[0_3px_10px_rgba(51,71,91,0.12)]"
                              >
                                <div className="p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <A to={`/deals/${d.id}`} className="hs-link text-[13px] leading-snug">
                                      {d.name}
                                    </A>
                                    <button
                                      type="button"
                                      onClick={() => dispatch({ t: "ui", k: "preview", v: `deal:${d.id}` })}
                                      title="Preview deal"
                                      className="rounded p-0.5 text-[#7c98b6] opacity-0 group-hover/card:opacity-100 hover:bg-[#eaf0f6] hover:text-[#33475b]"
                                    >
                                      <Icon name="eye" size={13} />
                                    </button>
                                  </div>

                                  <div className="mt-2 space-y-0.5 text-[12px] text-[#516f90]">
                                    <p>
                                      Amount: <strong className="font-semibold tabular-nums text-[#33475b]">{money(d.amount)}</strong>
                                    </p>
                                    <p>
                                      Create date: <span className="text-[#33475b]">{shortDate(d.createdAt ?? d.closeDate)}</span>
                                    </p>
                                    <p>
                                      Close date: <span className="text-[#33475b]">{shortDate(d.closeDate)}</span>
                                    </p>
                                  </div>

                                  {/* Associated Company / Contact Badges + Division Pill + Owner Avatars */}
                                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {company ? (
                                        <span className="inline-flex max-w-[165px] items-center gap-1 truncate rounded-[3px] bg-[#eaf0f6] px-1.5 py-0.5 text-[11px] font-medium text-[#33475b]">
                                          <Icon name="company" size={11} className="shrink-0 text-[#516f90]" />
                                          <span className="truncate">{company.name}</span>
                                        </span>
                                      ) : null}
                                      {primaryContact ? (
                                        <Avatar
                                          name={`${primaryContact.firstName} ${primaryContact.lastName}`}
                                          color={colorFor(primaryContact.id)}
                                          size={19}
                                        />
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {ownerIds.map((oid) => {
                                        const p = pack.personas.find((x) => x.id === oid);
                                        return p ? <Avatar key={oid} name={p.name} color={p.color} size={19} /> : null;
                                      })}
                                    </div>
                                  </div>

                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <Tag tone="neutral">{d.division}</Tag>
                                    {!d.readOnly && !isGlobalReadOnly ? (
                                      <Menu
                                        width={220}
                                        align="right"
                                        button={({ toggle }) => (
                                          <button
                                            type="button"
                                            onClick={toggle}
                                            data-testid={`card-move-stage-${d.id}`}
                                            className="inline-flex h-6 items-center gap-1 rounded-[3px] border border-[#cbd6e2] bg-[#f5f8fa] px-2 text-[11px] font-semibold text-[#33475b] hover:bg-[#eaf0f6]"
                                          >
                                            <span>Move stage</span>
                                            <Icon name="chevronDown" size={11} />
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
                                    ) : null}
                                  </div>
                                </div>

                                {/* AMICO live board activity chip: recent | upcoming */}
                                <div
                                  className="grid grid-cols-2 divide-x divide-[#dfe3eb] border-t border-[#dfe3eb] bg-[#f5f8fa] text-[11px] text-[#666666]"
                                  data-testid={`board-card-activity-${d.id}`}
                                >
                                  <span className="flex items-center gap-1 px-2 py-1.5">
                                    <span className="text-[#8a8a8a]">—</span>
                                    <span className="truncate">Recent empty</span>
                                  </span>
                                  <span className="flex items-center gap-1 px-2 py-1.5">
                                    {nextTask ? (
                                      <>
                                        <Icon name="task" size={11} className="shrink-0 text-[#006162]" />
                                        <span className="truncate">{nextTask.title}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Icon name="warning" size={11} className="shrink-0 text-[#d97706]" />
                                        <span>No upcoming</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Sticky HubSpot Stage Column Footer: Total & Weighted */}
                        <div
                          className="border-t border-[#dfe3eb] bg-white px-3 py-2 text-[11.5px] text-[#516f90]"
                          data-testid={`board-col-totals-${st.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Total amount:</span>
                            <strong className="font-semibold tabular-nums text-[#33475b]">{money(sum)}</strong>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>
                              Weighted amount ({probPct}%):
                            </span>
                            <span className="font-semibold tabular-nums text-[#33475b]">{money(weighted)}</span>
                          </div>
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
          title="Create new saved view"
          subtitle="Pin filtered pipeline tabs to your HubSpot Deals bar"
          onClose={() => setAddViewOpen(false)}
          testId="create-view-modal"
          footer={
            <>
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
              <Button onClick={() => setAddViewOpen(false)}>Cancel</Button>
            </>
          }
        >
          <div className="space-y-4 text-[13px]">
            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">View name *</span>
              <input
                type="text"
                value={viewLabel}
                onChange={(e) => setViewLabel(e.target.value)}
                data-testid="view-name-input"
                className="hs-input w-full"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">Shared with</span>
              <select
                value={viewVisibility}
                onChange={(e) => setViewVisibility(e.target.value as "Private" | "Team")}
                data-testid="view-visibility-select"
                className="hs-input w-full"
              >
                <option value="Private">Private (only me)</option>
                <option value="Team">My Division Team</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={viewMyDeals}
                onChange={(e) => setViewMyDeals(e.target.checked)}
                className="accent-[#006162]"
              />
              <span>Filter to deals where I am Owner / Inside Sales / Estimator</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={viewBidThisMonth}
                onChange={(e) => setViewBidThisMonth(e.target.checked)}
                className="accent-[#006162]"
              />
              <span>Bid Date or Close Date within next 30 days</span>
            </label>
          </div>
        </Modal>
      ) : null}

      {/* Authentic Right-Side HubSpot Create Deal Drawer */}
      {isAddDealOpen ? (
        <Drawer
          title="Create Deal"
          subtitle={`Pipeline: ${activePipeline && !activePipeline.readOnly ? activePipeline.name : pack.pipelines[0]?.name}`}
          onClose={closeAddDeal}
          testId="create-deal-modal"
          footer={
            <>
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
                  closeAddDeal();
                  setDealName("");
                  navigate("/deals");
                }}
              >
                Create
              </Button>
              <Button onClick={closeAddDeal}>Cancel</Button>
            </>
          }
        >
          <div className="space-y-4 text-[13px]">
            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">Deal name *</span>
              <input
                type="text"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="Vanguard GC — Substation Perimeter Fence"
                data-testid="deal-name-input"
                className="hs-input w-full"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">Pipeline *</span>
              <input
                readOnly
                value={(activePipeline && !activePipeline.readOnly ? activePipeline : pack.pipelines[0])?.name ?? ""}
                className="hs-input w-full !bg-[#eaf0f6]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">Amount</span>
                <input
                  type="number"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  className="hs-input w-full"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">Close date</span>
                <input
                  type="date"
                  value={dealCloseDate}
                  onChange={(e) => setDealCloseDate(e.target.value)}
                  className="hs-input w-full"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="font-medium text-[#516f90]">Deal owner</span>
              <input readOnly value={persona.name} className="hs-input w-full !bg-[#eaf0f6]" />
            </label>

            <div className="border-t border-[#dfe3eb] pt-4">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#516f90]">
                Associate Deal with
              </p>
              <label className="block space-y-1">
                <span className="font-medium text-[#516f90]">Company</span>
                <select value={dealCompanyId} onChange={(e) => setDealCompanyId(e.target.value)} className="hs-input w-full">
                  {world.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block space-y-1">
                <span className="font-medium text-[#516f90]">Association label</span>
                <select value={dealCompanyRole} onChange={(e) => setDealCompanyRole(e.target.value)} className="hs-input w-full">
                  <option value="General Contractor">General Contractor</option>
                  <option value="A/E Firm">A/E Firm</option>
                  <option value="Project Owner">Project Owner</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </label>
            </div>
          </div>
        </Drawer>
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
    { id: "mine", label: "My open tasks", filter: (t) => t.status !== "done" && t.ownerId === persona.id, closable: false },
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
      label: "Status",
      width: 72,
      cell: (t) => (
        <input
          type="checkbox"
          checked={t.status === "done"}
          data-testid={`task-check-${t.id}`}
          onChange={() => dispatch({ t: "task.toggle", id: t.id })}
          className="h-4 w-4 accent-[#006162]"
        />
      ),
    },
    {
      id: "title",
      label: "Title",
      sort: (t) => t.title,
      cell: (t) => (
        <span className={cx("font-semibold text-[#33475b]", t.status === "done" && "line-through text-[#7c98b6]")}>
          {t.title}
        </span>
      ),
    },
    { id: "type", label: "Type", cell: (t) => <Tag tone="blue">{t.type}</Tag> },
    { id: "queue", label: "Queue", cell: (t) => (t.queue ? <Tag tone="purple">{t.queue}</Tag> : "None") },
    {
      id: "priority",
      label: "Priority",
      cell: (t) => <Tag tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "neutral"}>{t.priority}</Tag>,
    },
    {
      id: "record",
      label: "Associated With",
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
        title="Tasks"
        objectSwitcherLabel="Tasks"
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

/* ─────────────────────────── HUBSPOT COMMERCE QUOTES INDEX ─────────────────────────── */
export function QuotesIndex() {
  const { pack, world } = useShell();
  const views: View<Quote>[] = [
    { id: "all", label: "All quotes", filter: () => true },
    { id: "draft", label: "Draft / Pending", filter: (q) => q.status !== "Accepted" && q.status !== "Sent" },
    { id: "published", label: "Published & Signed", filter: (q) => q.status === "Sent" || q.status === "Accepted" },
  ];
  const columns: Column<Quote>[] = [
    {
      id: "num",
      label: "Quote",
      cell: (q) => (
        <A to={`/quotes/${q.id}`} className="hs-link" data-testid={`quote-link-${q.id}`}>
          {q.number}: {q.title}
        </A>
      ),
    },
    {
      id: "amount",
      label: "Quote Amount",
      align: "right",
      cell: (q) => {
        const sub = q.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
        return <span className="font-semibold">{money(sub * (1 - q.discountPct / 100))}</span>;
      },
    },
    { id: "status", label: "Status", cell: (q) => <Tag tone={statusTone(q.status)}>{q.status}</Tag> },
    {
      id: "deal",
      label: "Associated Deal",
      cell: (q) => {
        const dl = world.deals.find((d) => d.id === q.dealId);
        return dl ? (
          <A to={`/deals/${dl.id}`} className="hs-link">
            {dl.name}
          </A>
        ) : (
          "—"
        );
      },
    },
    {
      id: "owner",
      label: "Quote Owner",
      cell: (q) => pack.personas.find((u) => u.id === q.ownerId)?.name ?? q.ownerId,
    },
    { id: "exp", label: "Expiration Date", cell: (q) => shortDate(q.validUntil) },
  ];

  return (
    <IndexPage
      title="Quotes"
      objectSwitcherLabel="Quotes"
      noun="quote"
      rows={world.quotes}
      columns={columns}
      views={views}
      rowKey={(q) => q.id}
      searchText={(q) => `${q.number} ${q.title} ${q.status}`}
      headerActions={
        <Tag tone="blue">Commerce Hub · Solar, Global &amp; Groenveld-BEKA Native Quotes</Tag>
      }
    />
  );
}

/* ─────────────────────────── PRODUCTS INDEX ─────────────────────────── */
export function ProductsIndex() {
  const { pack } = useShell();
  const views: View<Product>[] = [{ id: "all", label: "All products", filter: () => true }];
  const columns: Column<Product>[] = [
    { id: "name", label: "Name", cell: (p) => <span className="font-semibold text-[#33475b]">{p.name}</span> },
    { id: "sku", label: "SKU", cell: (p) => <span className="font-mono text-[12px] text-[#516f90]">{p.sku}</span> },
    { id: "cat", label: "Product Family", cell: (p) => p.family },
    { id: "div", label: "Division", cell: (p) => <Tag tone="neutral">{p.division ?? "All Divisions"}</Tag> },
    { id: "lead", label: "Lead Time", cell: (p) => `${p.leadDays} days` },
    { id: "price", label: "Unit Price (USD)", align: "right", cell: (p) => money2(p.price) },
  ];

  return (
    <IndexPage
      title="Products"
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
      label: "Name",
      cell: (w) => (
        <A to={`/workflows/${w.id}`} className="hs-link" data-testid={`workflow-link-${w.id}`}>
          {w.name}
        </A>
      ),
    },
    { id: "obj", label: "Object Type", cell: (w) => <Tag tone="blue">{w.object}</Tag> },
    { id: "desc", label: "Trigger & Action Summary", cell: (w) => w.description },
    { id: "status", label: "Status", cell: (w) => <Tag tone={statusTone(w.status)}>{w.status}</Tag> },
    { id: "enrolled", label: "Total Enrolled", align: "right", cell: (w) => w.enrolled },
  ];

  return (
    <IndexPage
      title="Workflows"
      noun="workflow"
      rows={pack.workflows}
      columns={columns}
      views={views}
      rowKey={(w) => w.id}
      searchText={(w) => `${w.name} ${w.description} ${w.object}`}
    />
  );
}

/* ─────────────────────────── TICKETS INDEX (SERVICE / DELIVERY ISSUES) ─────────────────────────── */
type TicketRow = {
  id: string;
  subject: string;
  pipeline: string;
  stage: string;
  priority: "High" | "Medium" | "Low";
  companyId: string;
  projectId?: string;
  createdAt: string;
};

export function TicketsIndex() {
  const { world } = useShell();

  const ticketRows: TicketRow[] = [
    {
      id: "tkt-901",
      subject: "Anchor bolt template revision — substation gate pier #4",
      pipeline: "Post-Award Engineering & Field Support",
      stage: "Waiting on Engineering",
      priority: "High",
      companyId: world.projects[0]?.companyId ?? world.companies[0]?.id ?? "",
      projectId: world.projects[0]?.id,
      createdAt: world.projects[0]?.startDate ?? new Date().toISOString(),
    },
    {
      id: "tkt-902",
      subject: "Freight carrier appointment confirmation — jobsite delivery",
      pipeline: "Post-Award Engineering & Field Support",
      stage: "In Progress",
      priority: "Medium",
      companyId: world.companies[0]?.id ?? "",
      createdAt: new Date().toISOString(),
    },
  ];

  const columns: Column<TicketRow>[] = [
    { id: "sub", label: "Ticket Name", cell: (t) => <span className="font-semibold text-[#006162]">{t.subject}</span> },
    { id: "pipe", label: "Pipeline", cell: (t) => t.pipeline },
    { id: "stage", label: "Ticket Status", cell: (t) => <Tag tone="amber">{t.stage}</Tag> },
    { id: "pri", label: "Priority", cell: (t) => <Tag tone={t.priority === "High" ? "red" : "neutral"}>{t.priority}</Tag> },
    {
      id: "co",
      label: "Associated Company",
      cell: (t) => {
        const co = world.companies.find((c) => c.id === t.companyId);
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
      id: "proj",
      label: "Associated Project",
      cell: (t) => {
        const prj = world.projects.find((p) => p.id === t.projectId);
        return prj ? (
          <A to={`/projects/${prj.id}`} className="hs-link">
            {prj.code}: {prj.name}
          </A>
        ) : (
          "—"
        );
      },
    },
  ];

  return (
    <IndexPage
      title="Tickets"
      objectSwitcherLabel="Tickets"
      noun="ticket"
      rows={ticketRows}
      columns={columns}
      views={[{ id: "all", label: "All tickets", filter: () => true }]}
      rowKey={(t) => t.id}
      searchText={(t) => `${t.subject} ${t.stage}`}
    />
  );
}

/* ─────────────────────────── REPORTING DASHBOARDS ─────────────────────────── */
export function ReportingDashboardPage() {
  const { pack, world } = useShell();
  const divisionDeals = world.deals.filter((d) => !d.readOnly);
  const totalPipeline = divisionDeals.reduce((s, d) => s + d.amount, 0);
  const stuckDeals = divisionDeals.filter((d) => (d.daysInStage ?? 0) >= 14);

  return (
    <div className="space-y-5 p-6" data-testid="reporting-dashboard">
      <div className="flex items-center justify-between border-b border-[#dfe3eb] pb-4">
        <div>
          <h1 className="hs-heading text-[20px] font-bold text-[#33475b]">AMICO Executive &amp; Division Pipeline Dashboard</h1>
          <p className="text-[12.5px] text-[#516f90]">
            Real-time Smart CRM rollup across {pack.pipelines.filter((p) => !p.readOnly).length} active division pipelines
          </p>
        </div>
        <Tag tone="teal">Live HubSpot Reporting</Tag>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card title="Open Division Pipeline">
          <p className="text-[24px] font-bold tabular-nums text-[#33475b]">{money(totalPipeline)}</p>
          <p className="mt-1 text-[12px] text-[#516f90]">{divisionDeals.length} active opportunities</p>
        </Card>
        <Card title="Synced Epicor Quotes">
          <p className="text-[24px] font-bold tabular-nums text-[#33475b]">{world.epicorQuotes.length}</p>
          <p className="mt-1 text-[12px] text-[#516f90]">Read-only ERP quote mirror</p>
        </Card>
        <Card title="Active Delivery Projects">
          <p className="text-[24px] font-bold tabular-nums text-[#33475b]">{world.projects.length}</p>
          <p className="mt-1 text-[12px] text-[#516f90]">Post-award PM execution</p>
        </Card>
        <Card title="Stuck Deals (> 14 Days)">
          <p className="text-[24px] font-bold tabular-nums text-[#b0232a]">{stuckDeals.length}</p>
          <p className="mt-1 text-[12px] text-[#516f90]">Auto-enrolled in Stuck Deal queue</p>
        </Card>
      </div>
    </div>
  );
}
