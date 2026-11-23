import type { TrainingModuleMeta, TrainingTrackMeta } from "./types";

export const AMICO_DIVISIONS = [
  "Security Fence",
  "Architecture",
  "FRP",
  "Industrials",
  "Security Mesh",
  "Building Products",
  "AMF",
  "APC and Diamond",
] as const;

export const AMICO_JOB_ROLES = [
  "Sales Rep",
  "Inside Sales Rep",
  "Estimator",
  "Sales Manager / NSM",
  "Project Manager",
  "Executive",
] as const;

const COMMON_DOS = [
  "Always search HubSpot first before creating a Contact, Company, or Deal.",
  "Open the Company and check the Cross-Division Activity Card and owner before calling a customer.",
  "Log every call, Outlook email, and meeting on the Deal timeline with Contact + Company + Deal associations.",
  "Keep Deal stage, amount, and close date current so forecasts stay accurate.",
];

const COMMON_DONTS = [
  "Never merge or delete duplicate Contacts or Companies by hand — escalate to your NSM or Penguin Strategies.",
  "Never edit Epicor Quotes, Paperless Parts quotes, MS Access quotes, or Workbook quotes directly in HubSpot.",
  "Never modify another division's records or edit the read-only Global shadow pipeline.",
];

export const AMICO_TRACKS: TrainingTrackMeta[] = [
  {
    id: "amico-hubspot-101",
    tenantSlug: "amico",
    title: "AMICO HubSpot 101: Core CRM & Cross-Division Selling",
    subtitle: "Required Go-Live Foundation · All 8 Divisions",
    division: "All Divisions",
    summary:
      "Navigate AMICO's six bookmarked CRM areas, configure your profile and Outlook sync, respect cross-division account rules, work deals, check Oracle & Epicor quotes, and inspect post-award Projects.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep", "Estimator", "Sales Manager / NSM", "Project Manager", "Executive"],
    modules: [
      {
        id: "orientation-navigation",
        code: "101-M1",
        title: "Getting Oriented: Profile, Global Search & Pipeline Views",
        summary: "Set up your HubSpot profile & notifications, search ~12,000 migrated records first, verify unique-email contact protection, and toggle pipeline Table/Board views.",
        objective: "Configure your profile, search before creating, and filter deals by division pipeline.",
        minutes: 4,
        roleTags: ["Sales Rep", "Inside Sales Rep", "Estimator", "Sales Manager / NSM"],
        defaultPersonaId: "ind-rep",
        takeaways: [
          "Configure Timezone, Working Hours, Task/@mention alerts, and Connected Outlook under Profile & Preferences.",
          "Use Find in HubSpot global search before creating any record migrated from Pipedrive or Epicor.",
          "Email address is the unique key on Contacts — open the existing contact instead of creating a duplicate.",
          "Switch from All Pipelines to your division pipeline and toggle My deals + Board view.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "cross-division-accounts",
        code: "101-M2",
        title: "One Customer, Many Divisions: Parent/Child Sites & Etiquette",
        summary: "Read Parent/Child company hierarchies (Grading Pacific), inspect the Cross-Division Activity Card before outreach, and flag missing-domain duplicates safely.",
        objective: "Check cross-division activity on shared accounts and coordinate before calling.",
        minutes: 5,
        roleTags: ["Sales Rep", "Inside Sales Rep", "Sales Manager / NSM", "Executive"],
        defaultPersonaId: "outside-rep",
        takeaways: [
          "Every AMICO user can view every Company, but you can only edit/email records owned by you or your division team.",
          "Check the Cross-Division Activity Card first — if another division logged recent activity, coordinate internally before calling.",
          "Multi-site customers link regional Child Companies under one Parent Company.",
          "Flag missing-domain legacy duplicates to your NSM or Penguin Strategies rather than merging manually.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "working-deals-logging",
        code: "101-M3",
        title: "Working a Deal & Logging Calls, Outlook Emails & Tasks",
        summary: "Verify the 5 deal hygiene basics, distinguish legacy Pipedrive notes from live Outlook emails, log calls/emails from the Deal, and schedule follow-up tasks.",
        objective: "Keep deal stage, amount, and close date current while logging 3-way associated activities.",
        minutes: 5,
        roleTags: ["Sales Rep", "Inside Sales Rep", "Sales Manager / NSM"],
        defaultPersonaId: "ind-rep",
        takeaways: [
          "Send and log emails from the Deal record so Contact, Company, and Deal timelines all stay complete.",
          "Legacy Pipedrive correspondence appears as Notes (excluded from live email analytics).",
          "Always schedule a follow-up task after sending a quote or key update.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "quoting-routes-epicor",
        code: "101-M4",
        title: "Quoting Across Divisions: Oracle CPQ & Synced Epicor Quotes",
        summary: "Build a native HubSpot quote with Oracle customer SKU pricing for transactional divisions, then inspect read-only Epicor Quotes and Paperless Parts records.",
        objective: "Use the right divisional quoting route and never edit synced ERP quotes in HubSpot.",
        minutes: 6,
        roleTags: ["Sales Rep", "Inside Sales Rep", "Estimator"],
        defaultPersonaId: "ind-rep",
        takeaways: [
          "Transactional divisions (Industrials, Building Products, Security Mesh, FRP stock) create native HubSpot Quotes with Oracle SKU pricing and e-signature.",
          "CRM > Epicor Quotes is a read-only synced custom object showing Quote #, Total, Status, Customer PO, and Division.",
          "Revisions to Epicor, MS Access, Paperless Parts, or Estimating Workbook quotes always happen in the source system.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "projects-post-award",
        code: "101-M5",
        title: "Post-Award Visibility: Reading & Managing HubSpot Projects",
        summary: "Open a linked Project from a Sales Deal before calling a customer, then switch to Security PM to resolve a Blocked project and advance phases.",
        objective: "Check post-award delivery status in CRM > Projects and run the PM daily routine.",
        minutes: 4,
        roleTags: ["Sales Rep", "Project Manager", "Sales Manager / NSM"],
        defaultPersonaId: "outside-rep",
        takeaways: [
          "Sales reps check the linked Project from the Deal before calling customers instead of chasing PMs by email.",
          "Project Managers work My projects daily, document Blocked reasons in notes, check off phase tasks, and advance stages.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
    ],
  },
  {
    id: "amico-security-fence",
    tenantSlug: "amico",
    title: "AMICO Security Fence: Pipeline, Estimating & PM Handoff",
    subtitle: "Division Track · Security Fence Team & Security PM",
    division: "Security Fence",
    summary:
      "Master Security Fence web lead qualification, multi-party GC/A&E association labels, automated estimator & inside-sales stage task queues, workbook quote ingestion, Awarded PM handoff, and custom board views.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep", "Estimator", "Sales Manager / NSM", "Project Manager"],
    modules: [
      {
        id: "sf-lead-to-deal",
        code: "SF-M1",
        title: "Web Lead Qualification & Multi-Party Job Associations",
        summary: "Qualify an inbound Security Fence web Lead as NSM into Planning (10%) and inspect Primary, General Contractor, A/E Firm, and Project Owner association labels.",
        objective: "Convert qualified NSM Leads into Security Fence deals with multi-company role labels.",
        minutes: 5,
        roleTags: ["Sales Manager / NSM", "Sales Rep", "Inside Sales Rep"],
        defaultPersonaId: "nsm",
        takeaways: [
          "Website Security Fence inquiries land in CRM > Leads owned by the National Sales Manager so unqualified inquiries never clutter the deal board.",
          "Qualifying a Lead creates a Security Fence Project deal, stamps Division = Security Fence, updates Cross-Division Activity, and creates a read-only Global shadow deal.",
          "Use Deal-to-Company association labels (Primary, General Contractor, A/E Firm, Project Owner) to model multi-party construction jobs.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "sf-estimating-bidding",
        code: "SF-M2",
        title: "Design to RFQ / Bidding: Stage Prompts & Task Queues",
        summary: "Advance a job through Design, Engineering, Budgeting, and RFQ / Bidding while working automated tasks across Outside Rep, Estimator, and Inside Sales queues.",
        objective: "Complete stage prompts and work the Estimating and Prepare quotes task queues.",
        minutes: 6,
        roleTags: ["Sales Rep", "Estimator", "Inside Sales Rep"],
        defaultPersonaId: "outside-rep",
        takeaways: [
          "Design prompts for Drawings Received (!= Yes triggers Request drawings task); Engineering prompts for Engineering Required (!= No triggers Engineering review for Estimator).",
          "Budgeting creates Prepare budget for Estimator; setting Budget Delivered Date schedules a 5-day follow-up for the Deal owner.",
          "RFQ / Bidding creates Prepare quote (3-day SLA) in the Prepare quotes queue for Inside Sales.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "sf-quote-ingestion-bid",
        code: "SF-M3",
        title: "Workbook Quote Ingestion, Quote Recipients & Bid Reminders",
        summary: "Push an estimating workbook quote and revision onto the same Deal, tag GC estimators as Quote Recipients, and act on 7-day Bid Date reminders.",
        objective: "Keep quote revisions on one Deal and replace legacy Quote to #1-#6 fields with association labels.",
        minutes: 5,
        roleTags: ["Inside Sales Rep", "Sales Rep", "Estimator"],
        defaultPersonaId: "inside-rep",
        takeaways: [
          "Estimating workbook revisions push onto the same Deal via the Quote Ingestion Tool — never clone a duplicate deal for a re-quote.",
          "Tag bidding contractors with the Quote Recipient contact association label.",
          "Bid Date drives an automatic reminder task 7 days before bid due.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "sf-award-pm-handoff",
        code: "SF-M4",
        title: "Awarded to Closed: Security PM Handoff, Stage Sync & Global Rollup",
        summary: "Move a won job to Awarded (100% Won), trigger Projects | Won handoff, advance Security PM delivery stages, and watch automatic Deal & Global pipeline sync.",
        objective: "Trigger post-award PM handoff and verify automatic Project-to-Deal delivery stage sync.",
        minutes: 6,
        roleTags: ["Sales Rep", "Project Manager", "Sales Manager / NSM", "Executive"],
        defaultPersonaId: "outside-rep",
        takeaways: [
          "Every stage from Awarded through Submittals, In Production, Shipping, Installation, and Closed counts as 100% Won revenue.",
          "Moving to Awarded requires answering Project / Handoff Required; Yes creates the linked Project and handoff task for Project Management - Security.",
          "Advancing the Project on the Delivery Board automatically syncs the Deal's post-award stage.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
      {
        id: "sf-views-stuck-deals",
        code: "SF-M5",
        title: "Pipeline Hygiene: Saved Board Views, Stuck Deals & Closed-Lost",
        summary: "Create a custom filtered Deal Board view, clear Stuck deal reminders, move a re-quoted deal backward without duplicating it, and record required Lost Reason details.",
        objective: "Maintain clean pipeline views, act on 30/40/15-day stuck alerts, and log structured Lost Reasons.",
        minutes: 5,
        roleTags: ["Sales Rep", "Sales Manager / NSM", "Estimator"],
        defaultPersonaId: "outside-rep",
        takeaways: [
          "Save custom Deal Board views (+ Add view) for daily focus like 'Fence bids due this month'.",
          "Stale reminders fire at 30d (Planning/Design/RFQ/Awarded), 40d (Engineering/Budgeting -> Estimator), and 15d (Submittals).",
          "Closed - Lost requires selecting one of AMICO's 11 standardized Lost Reasons plus detail/notes.",
        ],
        dos: COMMON_DOS,
        donts: COMMON_DONTS,
      },
    ],
  },
];

/** Fallback scaffold track for non-AMICO tenants created dynamically via Penguin Super-Admin. */
export function buildGenericTenantTrack(tenantSlug: string, tenantName: string, trackId = `${tenantSlug}-hubspot-101`): TrainingTrackMeta {
  return {
    id: trackId,
    tenantSlug,
    title: `${tenantName} HubSpot 101: CRM Foundations`,
    subtitle: "Core Sales Hub Onboarding",
    division: "All Divisions",
    summary: `Core HubSpot navigation, contacts, companies, deals, and task hygiene for ${tenantName}.`,
    roleFilterTags: ["Sales Rep", "Sales Manager"],
    modules: [
      {
        id: "orientation-navigation",
        code: "101-M1",
        title: "Getting Oriented: CRM Navigation & Pipeline Views",
        summary: "Configure profile settings, search existing CRM records, and switch between Deal Table and Board views.",
        objective: "Navigate CRM records and pipeline views cleanly.",
        minutes: 4,
        roleTags: ["Sales Rep", "Sales Manager"],
        defaultPersonaId: "outside-rep",
        takeaways: ["Search before creating records.", "Keep deal stages and close dates accurate."],
        dos: ["Search HubSpot before adding records.", "Log calls and emails on Deal timelines."],
        donts: ["Do not create duplicate contacts or deals."],
      },
    ],
  };
}

export function getTenantTracks(tenantSlug: string, tenantName = tenantSlug.toUpperCase(), defaultTrackIds: string[] = []): TrainingTrackMeta[] {
  if (tenantSlug === "amico") return AMICO_TRACKS;
  const ids = defaultTrackIds.length > 0 ? defaultTrackIds : [`${tenantSlug}-hubspot-101`];
  return ids.map((id) => buildGenericTenantTrack(tenantSlug, tenantName, id));
}

export function getTrackMeta(tenantSlug: string, trackId: string, tenantName?: string): TrainingTrackMeta | undefined {
  if (tenantSlug === "amico") {
    return AMICO_TRACKS.find((t) => t.id === trackId);
  }
  return buildGenericTenantTrack(tenantSlug, tenantName ?? tenantSlug.toUpperCase(), trackId);
}

export function getModuleMeta(tenantSlug: string, trackId: string, moduleId: string): TrainingModuleMeta | undefined {
  const track = getTrackMeta(tenantSlug, trackId);
  return track?.modules.find((m) => m.id === moduleId);
}
