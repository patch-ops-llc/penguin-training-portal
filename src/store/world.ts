import { quoteTotals } from "./quote-math";
import type {
  Activity,
  Company,
  Contact,
  Deal,
  EpicorQuote,
  LeadItem,
  Notification,
  Pack,
  Project,
  Quote,
  SavedDealView,
  Segment,
  Task,
  UserProfilePrefs,
} from "@/tenants/types";

export const DAY_MS = 86_400_000;
export const iso = (ms: number) => new Date(ms).toISOString();

export type StagePromptValues = {
  drawingsReceived?: Deal["drawingsReceived"];
  engineeringRequired?: Deal["engineeringRequired"];
  handoffRequired?: Deal["handoffRequired"];
  customerPo?: string;
  amicoOrderNumber?: string;
  poReceivedDate?: string;
  lostReason?: string;
  lostReasonDetail?: string;
  lostNotes?: string;
};

export type World = {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  savedDealViews: SavedDealView[];
  quotes: Quote[];
  epicorQuotes: EpicorQuote[];
  projects: Project[];
  tasks: Task[];
  segments: Segment[];
  leads: LeadItem[];
  notifications: Notification[];
  activities: Activity[];
  persona: string;
  profile: UserProfilePrefs;
  ui: Record<string, string>;
  flags: Record<string, true>;
  lastSearch: string;
  seq: number;
};

export type Action =
  | { t: "flag"; k: string }
  | { t: "ui"; k: string; v: string }
  | { t: "persona"; id: string }
  | { t: "profile.update"; patch: Partial<UserProfilePrefs> }
  | { t: "search.query"; q: string }
  | { t: "notif.read"; id: string }
  | { t: "task.toggle"; id: string }
  | {
      t: "log";
      kind: "note" | "email" | "call" | "meeting" | "task";
      text: string;
      contactIds: string[];
      companyIds: string[];
      dealIds: string[];
      projectIds?: string[];
      at: number;
    }
  | {
      t: "contact.create";
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      title?: string;
      companyId: string | null;
      at: number;
    }
  | { t: "contact.duplicateChecked"; email: string }
  | { t: "company.flagDuplicate"; companyId: string; note?: string; at: number }
  | { t: "deal.selectPipeline"; pipelineId: string }
  | { t: "deal.setLayout"; board: boolean }
  | {
      t: "dealView.create";
      label: string;
      visibility: "Private" | "Team";
      ownerId?: string;
      pipelineId?: string;
      bidDueThisMonth?: boolean;
      myDealsOnly?: boolean;
    }
  | {
      t: "deal.create";
      name: string;
      pipelineId: string;
      stage: string;
      amount: number;
      closeDate: string;
      companyId: string;
      contactIds: string[];
      companyLabels?: Record<string, string[]>;
      contactLabels?: Record<string, string[]>;
      at: number;
    }
  | {
      t: "deal.updateFields";
      dealId: string;
      patch: Partial<
        Pick<
          Deal,
          | "amount"
          | "closeDate"
          | "bidDate"
          | "outsideSalesOwnerId"
          | "insideSalesOwnerId"
          | "estimatorOwnerId"
          | "drawingsReceived"
          | "engineeringRequired"
          | "budgetDeliveredDate"
          | "handoffRequired"
          | "customerPo"
          | "amicoOrderNumber"
          | "poReceivedDate"
        >
      >;
      at: number;
    }
  | { t: "deal.setStage"; dealId: string; stage: string; promptValues?: StagePromptValues; at: number }
  | { t: "deal.addContactLabel"; dealId: string; contactId: string; label: string }
  | { t: "deal.addCompanyLabel"; dealId: string; companyId: string; label: string }
  | { t: "deal.ingestWorkbookQuote"; dealId: string; presetId: string; at: number }
  | { t: "deal.addOracleLine"; dealId: string; sku: string; qty: number; at: number }
  | { t: "quote.create"; dealId: string; at: number }
  | { t: "quote.send"; id: string; at: number }
  | { t: "quote.accept"; id: string; at: number }
  | {
      t: "project.setStatus";
      projectId: string;
      status: Project["status"];
      blockerNote?: string;
      targetDueDate?: string;
      at: number;
    }
  | { t: "project.toggleTask"; projectId: string; taskId: string; at: number }
  | { t: "project.setStage"; projectId: string; pipelineId: "project-pipeline" | "delivery-board"; stage: string; at: number }
  | {
      t: "lead.qualify";
      leadId: string;
      outsideSalesOwnerId: string;
      insideSalesOwnerId: string;
      stage?: string;
      at: number;
    }
  | {
      t: "email.send";
      subject: string;
      body: string;
      to: string;
      templateId?: string;
      snippetId?: string;
      sequenceEnroll?: boolean;
      trackOpens: boolean;
      trackClicks: boolean;
      logToCrm: boolean;
      attachQuoteId?: string;
      contactIds: string[];
      companyIds: string[];
      dealIds: string[];
      at: number;
    }
  | { t: "marketing.email.createDraft"; name: string };

export function seedWorld(pack: Pack, defaultPersonaOverride?: string): World {
  return {
    companies: pack.companies,
    contacts: pack.contacts,
    deals: pack.deals,
    savedDealViews: pack.savedDealViews,
    quotes: pack.quotes,
    epicorQuotes: pack.epicorQuotes,
    projects: pack.projects,
    tasks: pack.tasks,
    segments: pack.segments,
    leads: pack.leads,
    notifications: pack.notifications,
    activities: pack.activities,
    persona: defaultPersonaOverride && pack.personas.some((p) => p.id === defaultPersonaOverride) ? defaultPersonaOverride : pack.defaultPersonaId,
    profile: pack.defaultProfile,
    ui: {},
    flags: {},
    lastSearch: "",
    seq: 0,
  };
}

function nextSeq(w: World): number {
  w.seq += 1;
  return w.seq;
}

function addActivity(w: World, activity: Omit<Activity, "id">): void {
  w.activities.unshift({ id: `ac-new-${nextSeq(w)}`, ...activity });
}

function touch(w: World, at: string, ids: { companyIds?: string[]; contactIds?: string[]; dealIds?: string[] }): void {
  for (const id of ids.companyIds ?? []) {
    const company = w.companies.find((c) => c.id === id);
    if (company) company.lastActivityAt = at;
  }
  for (const id of ids.contactIds ?? []) {
    const contact = w.contacts.find((c) => c.id === id);
    if (contact) contact.lastActivityAt = at;
  }
  for (const id of ids.dealIds ?? []) {
    const deal = w.deals.find((d) => d.id === id);
    if (deal) deal.lastActivityAt = at;
  }
}

function mapToGlobalStageId(pack: Pack, pipelineId: string, stageId: string): string {
  const pipeline = pack.pipelines.find((p) => p.id === pipelineId);
  const stage = pipeline?.stages.find((s) => s.id === stageId);
  if (!stage) return "global-qualified";
  if (stage.closed === "lost") return "global-lost";
  if (stage.closed === "won" || stage.wonRevenue) return "global-won";
  if (stage.globalStageLabel === "Quote Pending / In Progress" || stageId.includes("quote") || stageId.includes("rfq")) {
    return "global-quote-pending";
  }
  if (stage.globalStageLabel === "Developing" || stage.probability >= 15) {
    return "global-developing";
  }
  return "global-qualified";
}

function syncShadowDeal(w: World, pack: Pack, sourceDeal: Deal, at: string): void {
  const link = sourceDeal.dealLinks?.find((l) => l.label === "Shadow Deal");
  if (!link) return;
  const shadow = w.deals.find((d) => d.id === link.dealId);
  if (!shadow) return;
  shadow.amount = sourceDeal.amount;
  shadow.closeDate = sourceDeal.closeDate;
  shadow.stage = mapToGlobalStageId(pack, sourceDeal.pipelineId, sourceDeal.stage);
  shadow.lastActivityAt = at;
}

function stampCrossDivisionOnCompany(w: World, pack: Pack, companyId: string, division: string, actorId: string | null, at: string): void {
  const company = w.companies.find((c) => c.id === companyId);
  if (!company) return;
  const actorName = pack.personas.find((p) => p.id === actorId)?.name ?? "AMICO Rep";
  const current = company.crossDivision ?? {
    primaryDivision: division,
    divisionsActive: [division],
    mostRecentActiveDivision: division,
    lastDivisionActivity: at,
    mostRecentDivisionContact: actorName,
  };
  const divisionsActive = current.divisionsActive.includes(division) ? current.divisionsActive : [...current.divisionsActive, division];
  company.crossDivision = {
    ...current,
    divisionsActive,
    mostRecentActiveDivision: division,
    lastDivisionActivity: at,
    mostRecentDivisionContact: actorName,
  };
}

function ensureStageWorkflowTask(
  w: World,
  input: {
    keySuffix: string;
    deal: Deal;
    title: string;
    ownerId: string;
    dueAt: string;
    queue?: Task["queue"];
    notes: string;
    at: string;
  },
): void {
  const taskId = `tk-wf-${input.deal.id}-${input.keySuffix}`;
  if (w.tasks.some((t) => t.id === taskId && t.status === "open")) return;
  w.tasks.unshift({
    id: taskId,
    title: input.title,
    type: "To-do",
    priority: "High",
    dueAt: input.dueAt,
    ownerId: input.ownerId,
    status: "open",
    queue: input.queue,
    companyId: input.deal.companyId,
    contactId: input.deal.contactIds[0],
    dealId: input.deal.id,
    notes: input.notes,
    isNew: true,
  });
  addActivity(w, {
    at: input.at,
    type: "workflow",
    title: `Workflow task created: ${input.title}`,
    body: input.notes,
    byId: null,
    contactIds: input.deal.contactIds,
    companyIds: [input.deal.companyId],
    dealIds: [input.deal.id],
    linkPath: "/tasks",
    linkLabel: input.queue ? `Open ${input.queue} queue` : "Open Tasks",
  });
}

function createWonHandoffProject(w: World, deal: Deal, at: string, nowMs: number): Project {
  const projectId = deal.id === "dl-ironpeak-perim" ? "prj-ironpeak" : `prj-${deal.id}`;
  const existing = w.projects.find((p) => p.id === projectId);
  if (existing) return existing;
  const code = deal.id === "dl-ironpeak-perim" ? "PRJ-209" : `PRJ-${210 + nextSeq(w)}`;
  const project: Project = {
    id: projectId,
    code,
    name: `${code}: ${deal.name}`,
    pipelineId: "delivery-board",
    stage: "submittals",
    deliveryStage: "submittals",
    status: "On Track",
    ownerId: "pm-security",
    companyId: deal.companyId,
    contactIds: [...deal.contactIds],
    dealId: deal.id,
    startDate: at,
    targetDueDate: iso(nowMs + 56 * DAY_MS),
    totalTasksCount: 27,
    completedTasksBaseline: 2,
    isNew: true,
    phases: [
      {
        id: "ph-kickoff",
        name: "Kick-off / Initiating",
        tasks: [
          {
            id: `${projectId}-t1`,
            title: `Verify Customer PO (${deal.customerPo ?? "Received"}) & Sales Handoff Packet`,
            done: true,
            assigneeId: "pm-security",
            startDate: at,
            durationDays: 2,
            dueDate: iso(nowMs + 2 * DAY_MS),
          },
          {
            id: `${projectId}-t2`,
            title: "Confirm GC & A/E submittal contacts from Deal associations",
            done: true,
            assigneeId: "pm-security",
            startDate: at,
            durationDays: 2,
            dueDate: iso(nowMs + 3 * DAY_MS),
          },
        ],
      },
      {
        id: "ph-submittals",
        name: "Planning / Reviewing (Submittals)",
        tasks: [
          {
            id: `${projectId}-t3`,
            title: "Issue shop drawings & post embedment submittal package",
            done: false,
            assigneeId: "pm-security",
            startDate: iso(nowMs + 3 * DAY_MS),
            durationDays: 7,
            dueDate: iso(nowMs + 10 * DAY_MS),
          },
          {
            id: `${projectId}-t4`,
            title: "Receive approved submittals & release BOM to fabrication",
            done: false,
            assigneeId: "pm-security",
            startDate: iso(nowMs + 10 * DAY_MS),
            durationDays: 5,
            dueDate: iso(nowMs + 15 * DAY_MS),
          },
        ],
      },
      {
        id: "ph-delivery",
        name: "In Production & Shipping",
        tasks: [
          {
            id: `${projectId}-t5`,
            title: "Complete ANC panel fabrication & QC inspection",
            done: false,
            assigneeId: "pm-security",
            startDate: iso(nowMs + 16 * DAY_MS),
            durationDays: 21,
            dueDate: iso(nowMs + 37 * DAY_MS),
          },
        ],
      },
    ],
  };
  w.projects.unshift(project);
  deal.projectId = project.id;

  w.tasks.unshift({
    id: `tk-handoff-${deal.id}`,
    title: `Project handoff: ${deal.name}`,
    type: "To-do",
    priority: "High",
    dueAt: iso(nowMs + 2 * DAY_MS),
    ownerId: "pm-security",
    status: "open",
    companyId: deal.companyId,
    contactId: deal.contactIds[0],
    dealId: deal.id,
    projectId: project.id,
    notes: "Created automatically by 'Projects | Won handoff' upon Deal entering Awarded with Handoff Required = Yes.",
    isNew: true,
  });

  w.notifications.unshift({
    id: `nt-handoff-${deal.id}`,
    personaId: "pm-security",
    at,
    kind: "handoff",
    title: `New Awarded Handoff: ${project.code}`,
    body: `${deal.name} entered Awarded (100% Won). Project and handoff task created.`,
    path: `/projects/${project.id}`,
    read: false,
  });

  addActivity(w, {
    at,
    type: "project",
    title: `Workflow 'Projects | Won handoff' created ${project.code}`,
    body: "Copied associated Companies, Contacts, and Deal timeline to Project Management - Security.",
    byId: null,
    contactIds: deal.contactIds,
    companyIds: [deal.companyId, ...(deal.additionalCompanyIds ?? [])],
    dealIds: [deal.id],
    projectIds: [project.id],
    linkPath: `/projects/${project.id}`,
    linkLabel: `Open ${project.code}`,
  });

  return project;
}

export function mutate(w: World, a: Action, pack: Pack): void {
  switch (a.t) {
    case "flag":
      w.flags[a.k] = true;
      return;

    case "ui":
      w.ui[a.k] = a.v;
      return;

    case "persona":
      if (pack.personas.some((p) => p.id === a.id)) {
        w.persona = a.id;
        w.flags[`persona.${a.id}`] = true;
      }
      return;

    case "profile.update":
      w.profile = { ...w.profile, ...a.patch };
      w.flags["profile.saved"] = true;
      return;

    case "search.query":
      w.lastSearch = a.q;
      if (a.q.trim().length >= 2) {
        w.flags["search.used"] = true;
        w.flags[`search.${a.q.trim().toLowerCase()}`] = true;
      }
      return;

    case "notif.read": {
      const n = w.notifications.find((x) => x.id === a.id);
      if (n) n.read = true;
      w.flags["notif.opened"] = true;
      return;
    }

    case "task.toggle": {
      const task = w.tasks.find((x) => x.id === a.id);
      if (task) {
        task.status = task.status === "open" ? "done" : "open";
        w.flags[`task.done.${task.id}`] = true;
        w.flags["task.toggled"] = true;
      }
      return;
    }

    case "email.send": {
      const at = iso(a.at);
      const tracking =
        a.trackOpens || a.trackClicks
          ? ` · Tracking: ${[a.trackOpens && "opens", a.trackClicks && "clicks"].filter(Boolean).join(" & ")}`
          : "";
      const quoteBit = a.attachQuoteId ? ` · Quote link: ${a.attachQuoteId}` : "";
      addActivity(w, {
        at,
        type: "email",
        title: `Tracked email · ${a.subject}`,
        body: `To: ${a.to}\n\n${a.body}${quoteBit}${tracking}`,
        byId: w.persona,
        contactIds: a.contactIds,
        companyIds: a.companyIds,
        dealIds: a.dealIds,
      });
      touch(w, at, { companyIds: a.companyIds, contactIds: a.contactIds, dealIds: a.dealIds });
      w.flags["email.sent"] = true;
      w.flags["logged.email"] = true;
      if (a.trackOpens && a.trackClicks) w.flags["email.track.enabled"] = true;
      if (a.trackOpens) w.flags["email.track.opens"] = true;
      if (a.trackClicks) w.flags["email.track.clicks"] = true;
      if (a.logToCrm) w.flags["email.logged.crm"] = true;
      if (a.templateId) w.flags[`email.template.${a.templateId}`] = true;
      if (a.snippetId) {
        w.flags["email.snippet.used"] = true;
        w.flags[`email.snippet.${a.snippetId}`] = true;
      }
      if (a.sequenceEnroll) w.flags["email.sequence.enrolled"] = true;
      if (a.attachQuoteId) w.flags["email.quote.attached"] = true;
      if (a.dealIds[0]) {
        w.flags[`email.sent.${a.dealIds[0]}`] = true;
        w.flags[`logged.email.${a.dealIds[0]}`] = true;
      }
      if (a.contactIds[0]) w.flags[`email.sent.contact.${a.contactIds[0]}`] = true;
      return;
    }

    case "marketing.email.createDraft": {
      w.flags["marketing.email.draftCreated"] = true;
      w.ui["marketing.email.lastDraft"] = a.name;
      return;
    }

    case "log": {
      const labels = {
        note: "Note",
        email: "Connected Outlook Email logged",
        call: "Call logged",
        meeting: "Meeting logged",
        task: "Follow-up task created",
      };
      const at = iso(a.at);
      addActivity(w, {
        at,
        type: a.kind,
        title: labels[a.kind],
        body: a.text,
        byId: w.persona,
        contactIds: a.contactIds,
        companyIds: a.companyIds,
        dealIds: a.dealIds,
        projectIds: a.projectIds,
      });
      if (a.kind === "task") {
        w.tasks.unshift({
          id: `tk-log-${nextSeq(w)}`,
          title: a.text,
          type: "To-do",
          priority: "High",
          dueAt: iso(a.at + 3 * DAY_MS),
          ownerId: w.persona,
          status: "open",
          queue: a.dealIds.length > 0 ? "Quote follow-ups" : undefined,
          contactId: a.contactIds[0],
          companyId: a.companyIds[0],
          dealId: a.dealIds[0],
          projectId: a.projectIds?.[0],
          isNew: true,
        });
      }
      touch(w, at, { companyIds: a.companyIds, contactIds: a.contactIds, dealIds: a.dealIds });
      w.flags[`logged.${a.kind}`] = true;
      if (a.dealIds[0]) w.flags[`logged.${a.kind}.${a.dealIds[0]}`] = true;
      if (a.companyIds[0]) w.flags[`logged.${a.kind}.${a.companyIds[0]}`] = true;
      return;
    }

    case "contact.duplicateChecked":
      w.flags["contact.duplicateBlocked"] = true;
      return;

    case "contact.create": {
      const normalized = a.email.trim().toLowerCase();
      if (!normalized || w.contacts.some((c) => c.email.toLowerCase() === normalized)) {
        w.flags["contact.duplicateBlocked"] = true;
        return;
      }
      const at = iso(a.at);
      const id = `ct-new-${nextSeq(w)}`;
      w.contacts.unshift({
        id,
        firstName: a.firstName.trim(),
        lastName: a.lastName.trim(),
        email: normalized,
        phone: a.phone?.trim() ?? "",
        title: a.title?.trim() ?? "Buyer",
        companyId: a.companyId,
        ownerId: w.persona,
        lifecycle: "Lead",
        leadStatus: "New",
        createdAt: at,
        lastActivityAt: at,
        source: "CRM Manual Entry",
        isNew: true,
      });
      return;
    }

    case "company.flagDuplicate": {
      const company = w.companies.find((c) => c.id === a.companyId);
      if (!company) return;
      const at = iso(a.at);
      company.flaggedDuplicate = true;
      addActivity(w, {
        at,
        type: "note",
        title: "Flagged potential duplicate to NSM & Penguin Strategies",
        body: a.note?.trim() || `Flagged ${company.name} (missing website domain) for NSM / Penguin Strategies bulk review rather than merging manually.`,
        byId: w.persona,
        companyIds: [company.id, ...(company.missingDomainDuplicateOf ? [company.missingDomainDuplicateOf] : [])],
      });
      w.notifications.unshift({
        id: `nt-dup-${company.id}`,
        personaId: "nsm",
        at,
        kind: "mention",
        title: `Duplicate review requested: ${company.name}`,
        body: "Missing-domain legacy import flagged for admin merge review.",
        path: `/companies/${company.id}`,
        read: false,
      });
      w.flags[`company.flagged.${company.id}`] = true;
      w.flags["company.duplicateFlagged"] = true;
      return;
    }

    case "deal.selectPipeline":
      w.ui["deals.pipeline"] = a.pipelineId;
      w.flags[`pipeline.${a.pipelineId}`] = true;
      return;

    case "deal.setLayout":
      w.ui["deals.layout"] = a.board ? "board" : "table";
      if (a.board) w.flags["deals.boardView"] = true;
      return;

    case "dealView.create": {
      const id = `view-custom-${nextSeq(w)}`;
      w.savedDealViews.push({
        id,
        label: a.label.trim(),
        visibility: a.visibility,
        ownerId: a.ownerId,
        pipelineId: a.pipelineId,
        bidDueThisMonth: a.bidDueThisMonth,
        myDealsOnly: a.myDealsOnly,
        isCustom: true,
      });
      w.ui["deals.view"] = id;
      w.flags["dealView.created"] = true;
      return;
    }

    case "deal.create": {
      const pipeline = pack.pipelines.find((p) => p.id === a.pipelineId) ?? pack.pipelines[0];
      if (!pipeline || pipeline.readOnly) return;
      const at = iso(a.at);
      const id = `dl-new-${nextSeq(w)}`;
      const shadowId = `dl-global-${id}`;
      const hasGlobal = pack.pipelines.some((p) => p.id === "global");

      const deal: Deal = {
        id,
        name: a.name.trim(),
        pipelineId: pipeline.id,
        division: pipeline.division,
        companyId: a.companyId,
        contactIds: a.contactIds,
        ownerId: w.persona,
        outsideSalesOwnerId: w.persona,
        stage: a.stage || pipeline.stages[0].id,
        amount: Math.max(0, Number(a.amount) || 0),
        closeDate: a.closeDate || iso(a.at + 30 * DAY_MS),
        createdAt: at,
        lastActivityAt: at,
        daysInStage: 0,
        type: "New Business",
        companyLabels: a.companyLabels ?? { [a.companyId]: ["Primary"] },
        contactLabels: a.contactLabels,
        dealLinks: hasGlobal ? [{ dealId: shadowId, label: "Shadow Deal" }] : undefined,
        lineItems: [],
        source: "CRM Deal Creation",
        isNew: true,
      };
      w.deals.unshift(deal);

      if (hasGlobal) {
        w.deals.push({
          id: shadowId,
          name: `[Global Shadow] ${deal.name}`,
          pipelineId: "global",
          division: deal.division,
          companyId: deal.companyId,
          contactIds: deal.contactIds,
          ownerId: deal.ownerId,
          stage: mapToGlobalStageId(pack, deal.pipelineId, deal.stage),
          amount: deal.amount,
          closeDate: deal.closeDate,
          createdAt: at,
          lastActivityAt: at,
          type: deal.type,
          dealLinks: [{ dealId: deal.id, label: "Source Deal" }],
          lineItems: [],
          readOnly: true,
          source: "Global | Create shadow deal workflow",
        });
      }

      stampCrossDivisionOnCompany(w, pack, deal.companyId, deal.division, w.persona, at);
      addActivity(w, {
        at,
        type: "deal",
        title: `Deal created in ${pipeline.name} (Division = ${deal.division})`,
        body: hasGlobal ? "Stamped Division from pipeline, updated Cross-Division Activity Card, and synced Global shadow deal." : "Deal created.",
        byId: w.persona,
        contactIds: deal.contactIds,
        companyIds: [deal.companyId],
        dealIds: [deal.id],
      });
      w.flags["deal.created"] = true;
      return;
    }

    case "deal.updateFields": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      if (!deal || deal.readOnly) return;
      const at = iso(a.at);
      const prevBudgetDate = deal.budgetDeliveredDate;
      Object.assign(deal, a.patch);
      deal.lastActivityAt = at;

      if (a.patch.budgetDeliveredDate && a.patch.budgetDeliveredDate !== prevBudgetDate) {
        ensureStageWorkflowTask(w, {
          keySuffix: "budget-followup",
          deal,
          title: `Budget follow-up: ${deal.name}`,
          ownerId: deal.ownerId ?? w.persona,
          dueAt: iso(a.at + 5 * DAY_MS),
          queue: "Quote follow-ups",
          notes: "Created automatically by 'Projects | Budget follow-up' (due in 5 business days after Budget Delivered Date is set).",
          at,
        });
      }
      syncShadowDeal(w, pack, deal, at);
      w.flags[`deal.updated.${deal.id}`] = true;
      return;
    }

    case "deal.setStage": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      if (!deal || deal.readOnly) return;
      const pipeline = pack.pipelines.find((p) => p.id === deal.pipelineId);
      const stageSpec = pipeline?.stages.find((s) => s.id === a.stage);
      if (!stageSpec) return;

      // Enforce required stage prompts at the reducer boundary as well.
      if (stageSpec.prompt?.required) {
        const val = a.promptValues?.[stageSpec.prompt.field] ?? deal[stageSpec.prompt.field];
        if (!val) return;
      }

      const at = iso(a.at);
      const prevStage = deal.stage;
      deal.stage = a.stage;
      deal.daysInStage = 0;
      deal.lastActivityAt = at;

      if (a.promptValues) {
        if (a.promptValues.drawingsReceived) deal.drawingsReceived = a.promptValues.drawingsReceived;
        if (a.promptValues.engineeringRequired) deal.engineeringRequired = a.promptValues.engineeringRequired;
        if (a.promptValues.handoffRequired) deal.handoffRequired = a.promptValues.handoffRequired;
        if (a.promptValues.customerPo) deal.customerPo = a.promptValues.customerPo;
        if (a.promptValues.amicoOrderNumber) deal.amicoOrderNumber = a.promptValues.amicoOrderNumber;
        if (a.promptValues.poReceivedDate) deal.poReceivedDate = a.promptValues.poReceivedDate;
        if (a.promptValues.lostReason) deal.lostReason = a.promptValues.lostReason;
        if (a.promptValues.lostReasonDetail) deal.lostReasonDetail = a.promptValues.lostReasonDetail;
        if (a.promptValues.lostNotes) deal.lostNotes = a.promptValues.lostNotes;
      }

      addActivity(w, {
        at,
        type: "deal",
        title: `Deal stage moved to ${stageSpec.label}`,
        body:
          a.stage === "closed-lost" || stageSpec.closed === "lost"
            ? `Lost Reason: ${deal.lostReason ?? "Unspecified"}${deal.lostReasonDetail ? ` — ${deal.lostReasonDetail}` : ""}`
            : `Moved from ${pipeline?.stages.find((s) => s.id === prevStage)?.label ?? prevStage} to ${stageSpec.label}.`,
        byId: w.persona,
        contactIds: deal.contactIds,
        companyIds: [deal.companyId],
        dealIds: [deal.id],
      });

      // Security Fence automated stage workflows
      if (deal.pipelineId === "security-fence") {
        if (a.stage === "design" && deal.drawingsReceived !== "Yes") {
          ensureStageWorkflowTask(w, {
            keySuffix: "request-drawings",
            deal,
            title: `Request drawings: ${deal.name}`,
            ownerId: deal.ownerId ?? w.persona,
            dueAt: iso(a.at + 2 * DAY_MS),
            notes: "Security Fence | Stage tasks (Branch 1): Deal entered Design with Drawings Received != Yes.",
            at,
          });
        }
        if (a.stage === "engineering" && deal.engineeringRequired !== "No") {
          ensureStageWorkflowTask(w, {
            keySuffix: "engineering-review",
            deal,
            title: `Engineering review: ${deal.name}`,
            ownerId: deal.estimatorOwnerId ?? deal.ownerId ?? w.persona,
            dueAt: iso(a.at + 3 * DAY_MS),
            queue: "Estimating",
            notes: `Security Fence | Stage tasks (Branch 2): Engineering Required = ${deal.engineeringRequired ?? "In-house"}. Assigned to Estimator / Technical Owner.`,
            at,
          });
        }
        if (a.stage === "budgeting") {
          ensureStageWorkflowTask(w, {
            keySuffix: "prepare-budget",
            deal,
            title: `Prepare budget: ${deal.name}`,
            ownerId: deal.estimatorOwnerId ?? deal.ownerId ?? w.persona,
            dueAt: iso(a.at + 4 * DAY_MS),
            queue: "Estimating",
            notes: "Security Fence | Stage tasks (Branch 3): Deal entered Budgeting / Budgetary Quote.",
            at,
          });
        }
        if (a.stage === "rfq-bidding") {
          ensureStageWorkflowTask(w, {
            keySuffix: "prepare-quote",
            deal,
            title: `Prepare quote: ${deal.name}`,
            ownerId: deal.insideSalesOwnerId ?? deal.ownerId ?? w.persona,
            dueAt: iso(a.at + 3 * DAY_MS),
            queue: "Prepare quotes",
            notes: "Security Fence | Stage tasks (Branch 4): Deal entered RFQ / Bidding (due in 3 business days in 'Prepare quotes' queue).",
            at,
          });
        }
        if (a.stage === "awarded" && deal.handoffRequired === "Yes") {
          createWonHandoffProject(w, deal, at, a.at);
        }
      }

      syncShadowDeal(w, pack, deal, at);
      stampCrossDivisionOnCompany(w, pack, deal.companyId, deal.division, w.persona, at);
      w.flags[`stage.${deal.id}.${a.stage}`] = true;
      w.flags["deal.stageMoved"] = true;
      return;
    }

    case "deal.addContactLabel": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      if (!deal || deal.readOnly) return;
      if (!deal.contactIds.includes(a.contactId)) deal.contactIds.push(a.contactId);
      const map = { ...(deal.contactLabels ?? {}) };
      const existing = map[a.contactId] ?? [];
      if (!existing.includes(a.label)) {
        map[a.contactId] = [...existing, a.label];
      }
      deal.contactLabels = map;
      w.flags[`deal.contactLabel.${deal.id}.${a.label}`] = true;
      return;
    }

    case "deal.addCompanyLabel": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      if (!deal || deal.readOnly) return;
      if (a.companyId !== deal.companyId && !deal.additionalCompanyIds?.includes(a.companyId)) {
        deal.additionalCompanyIds = [...(deal.additionalCompanyIds ?? []), a.companyId];
      }
      const map = { ...(deal.companyLabels ?? {}) };
      const existing = map[a.companyId] ?? [];
      if (!existing.includes(a.label)) {
        map[a.companyId] = [...existing, a.label];
      }
      deal.companyLabels = map;
      return;
    }

    case "deal.ingestWorkbookQuote": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      if (!deal || deal.readOnly) return;
      const preset = deal.workbookPresets?.find((p) => p.id === a.presetId);
      if (!preset) return;
      const at = iso(a.at);
      deal.quoteNumber = preset.quoteNumber;
      deal.quoteRevision = preset.revision;
      deal.quoteDate = at;
      deal.quotedLeadTimeWeeks = preset.leadTimeWeeks;
      deal.amount = preset.amount;
      deal.externalQuoteSource = "Penguin Quote Ingestion Tool";
      deal.externalQuotePdf = preset.pdfName;
      deal.lastActivityAt = at;

      addActivity(w, {
        at,
        type: "quote",
        title: `Workbook quote ingested: ${preset.quoteNumber} ${preset.revision} ($${preset.amount.toLocaleString("en-US")})`,
        body: `${preset.summary}. Lead time: ${preset.leadTimeWeeks} weeks. Kept on the same Deal so revision history stays intact.`,
        byId: w.persona,
        contactIds: deal.contactIds,
        companyIds: [deal.companyId],
        dealIds: [deal.id],
        attachment: preset.pdfName,
      });
      syncShadowDeal(w, pack, deal, at);
      w.flags[`wb.${deal.id}.${preset.id}`] = true;
      return;
    }

    case "deal.addOracleLine": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      const product = pack.products.find((p) => p.sku === a.sku);
      if (!deal || !product || deal.readOnly) return;
      const at = iso(a.at);
      const qty = Math.max(1, Math.round(a.qty));
      const unitPrice = product.oracleContractPrice ?? product.price;
      const existing = deal.lineItems.find((l) => l.sku === product.sku);
      if (existing) {
        existing.qty += qty;
      } else {
        deal.lineItems.push({
          sku: product.sku,
          name: product.name,
          qty,
          unitPrice,
          unitCost: product.cost,
          leadDays: product.leadDays,
          oracleContractPrice: Boolean(product.oracleContractPrice),
        });
      }
      deal.amount = Math.round(deal.lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0) * 100) / 100;
      deal.lastActivityAt = at;
      w.flags[`oracle.added.${deal.id}`] = true;
      return;
    }

    case "quote.create": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      if (!deal || deal.readOnly) return;
      const at = iso(a.at);
      const num = 402 + nextSeq(w);
      const quote: Quote = {
        id: `q-${deal.id}-${num}`,
        number: `HSQ-2026-${num}`,
        title: deal.name,
        dealId: deal.id,
        companyId: deal.companyId,
        contactId: deal.contactIds[0] ?? "",
        ownerId: w.persona,
        status: "Draft",
        esignEnabled: true,
        lineItems: deal.lineItems.map((l) => ({ ...l })),
        discountPct: 0,
        createdAt: at,
        validUntil: iso(a.at + 30 * DAY_MS),
        origin: "Native HubSpot Quote (Oracle SKU Pricing)",
        isNew: true,
      };
      w.quotes.unshift(quote);
      addActivity(w, {
        at,
        type: "quote",
        title: `Native Quote ${quote.number} created`,
        body: `${quote.lineItems.length} Oracle-priced SKU line items.`,
        byId: w.persona,
        contactIds: deal.contactIds,
        companyIds: [deal.companyId],
        dealIds: [deal.id],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "Open Quote",
      });
      w.flags["quote.created"] = true;
      return;
    }

    case "quote.send": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.readOnlyExternal) return;
      const at = iso(a.at);
      quote.status = "Sent";
      quote.sentAt = at;
      const deal = w.deals.find((d) => d.id === quote.dealId);
      if (deal && deal.pipelineId === "industrials" && deal.stage === "ind-in-progress") {
        deal.stage = "ind-quoted";
      }
      addActivity(w, {
        at,
        type: "quote",
        title: `Quote ${quote.number} published & sent for e-signature`,
        body: `Total ${quoteTotals(quote).total.toLocaleString("en-US", { style: "currency", currency: "USD" })}.`,
        byId: w.persona,
        contactIds: [quote.contactId],
        companyIds: [quote.companyId],
        dealIds: [quote.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "View quote",
      });
      w.flags[`quote.sent.${quote.id}`] = true;
      w.flags["quote.sent"] = true;
      return;
    }

    case "quote.accept": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.readOnlyExternal) return;
      const at = iso(a.at);
      quote.status = "Accepted";
      quote.acceptedAt = at;
      addActivity(w, {
        at,
        type: "quote",
        title: `Quote ${quote.number} e-signed by buyer`,
        body: "Signed PDF saved automatically to the Deal record.",
        byId: null,
        contactIds: [quote.contactId],
        companyIds: [quote.companyId],
        dealIds: [quote.dealId],
        attachment: `${quote.number}-Signed.pdf`,
      });
      w.flags[`quote.accepted.${quote.id}`] = true;
      w.flags["quote.accepted"] = true;
      return;
    }

    case "project.setStatus": {
      const project = w.projects.find((p) => p.id === a.projectId);
      if (!project) return;
      const at = iso(a.at);
      project.status = a.status;
      if (a.blockerNote !== undefined) project.blockerNote = a.blockerNote;
      if (a.targetDueDate) project.targetDueDate = a.targetDueDate;

      addActivity(w, {
        at,
        type: "project",
        title: `Project ${project.code} status updated to ${a.status}`,
        body: a.blockerNote ? `PM Note: ${a.blockerNote}` : `Status set to ${a.status}.`,
        byId: w.persona,
        contactIds: project.contactIds,
        companyIds: [project.companyId],
        dealIds: [project.dealId],
        projectIds: [project.id],
      });
      w.flags[`project.status.${project.id}.${a.status}`] = true;
      return;
    }

    case "project.toggleTask": {
      const project = w.projects.find((p) => p.id === a.projectId);
      if (!project) return;
      for (const phase of project.phases) {
        const task = phase.tasks.find((t) => t.id === a.taskId);
        if (task) {
          task.done = !task.done;
          if (task.done) task.late = false;
          w.flags[`project.task.${project.id}`] = true;
          return;
        }
      }
      return;
    }

    case "project.setStage": {
      const project = w.projects.find((p) => p.id === a.projectId);
      if (!project) return;
      const pipeline = pack.projectPipelines.find((p) => p.id === a.pipelineId);
      const stageSpec = pipeline?.stages.find((s) => s.id === a.stage);
      if (!stageSpec) return;

      const at = iso(a.at);
      project.pipelineId = a.pipelineId;
      if (a.pipelineId === "delivery-board") {
        project.deliveryStage = a.stage;
        project.stage = a.stage === "submittals" ? "planning" : a.stage === "closed" ? "completed-stage" : "execution";
      } else {
        project.stage = a.stage;
        if (stageSpec.dealStageSync) project.deliveryStage = stageSpec.dealStageSync;
      }
      if (a.stage === "closed" || a.stage === "completed-stage") {
        project.status = "Completed";
      }

      // Automatic Project Stage > Deal Stage | Division Based sync!
      const deal = w.deals.find((d) => d.id === project.dealId);
      if (deal && stageSpec.dealStageSync && deal.pipelineId === "security-fence") {
        deal.stage = stageSpec.dealStageSync;
        deal.daysInStage = 0;
        deal.lastActivityAt = at;
        syncShadowDeal(w, pack, deal, at);
        addActivity(w, {
          at,
          type: "sync",
          title: `Workflow 'Project Stage > Deal Stage' moved Deal to ${stageSpec.label}`,
          body: `${project.code} advanced to ${stageSpec.label}; linked Sales Deal stage synced automatically.`,
          byId: null,
          contactIds: deal.contactIds,
          companyIds: [deal.companyId],
          dealIds: [deal.id],
          projectIds: [project.id],
        });
      }
      w.flags[`project.stage.${project.id}.${a.stage}`] = true;
      w.flags["project.stageMoved"] = true;
      return;
    }

    case "lead.qualify": {
      const lead = w.leads.find((l) => l.id === a.leadId);
      if (!lead || lead.convertedDealId) return;
      const at = iso(a.at);
      lead.status = "Qualified";

      let companyId = lead.companyId;
      if (!companyId) {
        companyId = `co-lead-${nextSeq(w)}`;
        w.companies.unshift({
          id: companyId,
          name: lead.companyName,
          domain: lead.domain,
          industry: lead.marketSegment,
          type: "Prospect",
          customerType: "End User",
          city: "Charlotte",
          state: "NC",
          employees: 250,
          revenue: null,
          phone: lead.phone,
          ownerId: a.outsideSalesOwnerId,
          lifecycle: "Opportunity",
          createdAt: at,
          lastActivityAt: at,
          isNew: true,
        });
      }

      let contact = w.contacts.find((c) => c.email.toLowerCase() === lead.email.toLowerCase());
      if (!contact) {
        const [firstName, ...rest] = lead.contactName.split(" ");
        contact = {
          id: `ct-lead-${nextSeq(w)}`,
          firstName,
          lastName: rest.join(" ") || "Contact",
          email: lead.email,
          phone: lead.phone,
          title: lead.title,
          companyId,
          ownerId: a.outsideSalesOwnerId,
          lifecycle: "Opportunity",
          leadStatus: "Qualified",
          createdAt: at,
          lastActivityAt: at,
          source: "Qualified Web Lead",
          isNew: true,
        };
        w.contacts.unshift(contact);
      } else {
        contact.lifecycle = "Opportunity";
        contact.leadStatus = "Qualified";
      }

      const dealId = `dl-qual-${lead.id}`;
      const shadowId = `dl-global-${dealId}`;
      const deal: Deal = {
        id: dealId,
        name: lead.name,
        pipelineId: "security-fence",
        division: "Security Fence",
        companyId,
        contactIds: [contact.id],
        ownerId: a.outsideSalesOwnerId,
        outsideSalesOwnerId: a.outsideSalesOwnerId,
        insideSalesOwnerId: a.insideSalesOwnerId,
        estimatorOwnerId: "estimator",
        stage: a.stage ?? "planning",
        amount: lead.estimatedAmount,
        closeDate: iso(a.at + 45 * DAY_MS),
        createdAt: at,
        lastActivityAt: at,
        daysInStage: 0,
        type: "New Business",
        marketSegment: lead.marketSegment,
        companyLabels: { [companyId]: ["Primary", "Project Owner"] },
        contactLabels: { [contact.id]: ["Quote Recipient"] },
        dealLinks: [{ dealId: shadowId, label: "Shadow Deal" }],
        lineItems: [],
        source: "NSM Qualified Web Inquiry",
        isNew: true,
      };
      w.deals.unshift(deal);
      lead.convertedDealId = dealId;

      w.deals.push({
        id: shadowId,
        name: `[Global Shadow] ${deal.name}`,
        pipelineId: "global",
        division: "Security Fence",
        companyId,
        contactIds: [contact.id],
        ownerId: a.outsideSalesOwnerId,
        stage: "global-qualified",
        amount: deal.amount,
        closeDate: deal.closeDate,
        createdAt: at,
        lastActivityAt: at,
        type: "New Business",
        dealLinks: [{ dealId, label: "Source Deal" }],
        lineItems: [],
        readOnly: true,
        source: "Global | Create shadow deal workflow",
      });

      stampCrossDivisionOnCompany(w, pack, companyId, "Security Fence", a.outsideSalesOwnerId, at);

      addActivity(w, {
        at,
        type: "workflow",
        title: "Web Lead qualified into Security Fence Project Deal",
        body: "Workflows executed: 'Deal | Set Division from pipeline', 'Cross-division activity: stamp company from deal', and 'Global | Create shadow deal'.",
        byId: w.persona,
        contactIds: [contact.id],
        companyIds: [companyId],
        dealIds: [dealId],
        linkPath: `/deals/${dealId}`,
        linkLabel: "Open Deal",
      });
      w.flags[`lead.qualified.${lead.id}`] = true;
      w.flags["lead.qualified"] = true;
      return;
    }
  }
}

export function replay(seed: World, actions: Action[], pack: Pack): World {
  const world = structuredClone(seed);
  for (const action of actions) mutate(world, action, pack);
  return world;
}
