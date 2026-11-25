import type { TrainingTrackMeta } from "@/tenants/types";
import { COMMON_DOS, COMMON_DONTS } from "@/tenants/catalog-shared";

function quotingModule(
  id: string,
  code: string,
  division: string,
  summary: string,
  takeaways: string[],
): TrainingTrackMeta["modules"][number] {
  return {
    id,
    code,
    title: `${division} Quoting Workflow Walkthrough`,
    summary,
    objective: `Follow the Nov 2026 ${division} quoting guide end-to-end in the HubSpot simulator.`,
    minutes: 6,
    roleTags: ["Sales Rep", "Inside Sales Rep", "Estimator", "Sales Manager / NSM"],
    defaultPersonaId:
      division === "Security Fence"
        ? "inside-rep"
        : division === "Architecture"
          ? "estimator"
          : "ind-rep",
    takeaways,
    dos: COMMON_DOS,
    donts: COMMON_DONTS,
  };
}

export const AMICO_QUOTING_TRACKS: TrainingTrackMeta[] = [
  {
    id: "amico-quoting-amf",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "AMF",
    title: "AMF Division Quoting Guide",
    subtitle: "Paperless Parts → HubSpot Deal Sync",
    division: "AMF",
    summary:
      "Practice Paperless Parts mirrored deals: verify Quoted-stage sync, line items, PDF notes, follow-up tasks, and won/lost progression without editing quotes in HubSpot.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep", "Sales Manager / NSM"],
    modules: [
      quotingModule(
        "amf-quoting-workflow",
        "AMF-Q1",
        "AMF",
        "Open a Paperless Parts auto-created AMF deal, verify quote metadata, inspect read-only sync rules, and walk won/lost handling.",
        [
          "Paperless Parts Outstanding status creates/updates the AMF deal at Quoted.",
          "Revise quotes only in Paperless Parts — HubSpot mirrors revision and PDF.",
          "Set Follow-up Date on the Quoting card to drive follow-up tasks.",
        ],
      ),
    ],
  },
  {
    id: "amico-quoting-architecture",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "Architecture",
    title: "Architecture Division Quoting Guide",
    subtitle: "Workbook → Quote Ingestion → HubSpot Send",
    division: "Architecture",
    summary:
      "Walk Architecture ROM/budget fields, workbook quote ingestion onto one deal, and quote-send stage progression through Quote Submitted.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep", "Estimator"],
    modules: [
      quotingModule(
        "arch-quoting-workflow",
        "ARCH-Q1",
        "Architecture",
        "Advance an Architecture deal, push a workbook quote via ingestion, and verify associations and revision rules.",
        [
          "Budget Amount/Delivered Date precede formal quotes.",
          "Ingestion matches company, contact, deal, and Architecture division.",
          "Revisions re-ingest on the same deal — never duplicate for re-quotes.",
        ],
      ),
    ],
  },
  {
    id: "amico-quoting-building-products",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "Building Products",
    title: "Building Products & Stayform Quoting Guide",
    subtitle: "Native HubSpot Quote + Oracle + E-Sign",
    division: "Building Products",
    summary:
      "Create and publish a Building Products HubSpot quote with Oracle SKU pricing, e-signature, and Quote Pending task queues.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep"],
    modules: [
      quotingModule(
        "bp-quoting-workflow",
        "BP-Q1",
        "Building Products",
        "Move a Building Products deal to Quote Pending, build a native quote, and publish for e-signature.",
        [
          "Quote Pending triggers Prepare quote for Inside Sales.",
          "Oracle customer pricing fills SKU lines automatically.",
          "Verbal quotes can move to Quoted with Quote Date + Quoted Value instead of a formal quote.",
        ],
      ),
    ],
  },
  {
    id: "amico-quoting-frp",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "FRP",
    title: "FRP Division Quoting Guide",
    subtitle: "Fabrication Ingestion + Stock HubSpot Quotes",
    division: "FRP",
    summary:
      "Practice FRP RFQ stage gates, fabrication workbook ingestion, and optional native stock quoting on the same pipeline.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep", "Estimator"],
    modules: [
      quotingModule(
        "frp-quoting-workflow",
        "FRP-Q1",
        "FRP",
        "Advance FRP stages through RFQ Bidding, ingest a fabrication workbook quote, and inspect stock quote path.",
        [
          "Planning → Design → RFQ Bidding with automated drawing/engineering/prepare-quote tasks.",
          "Fabrication quotes ingest with division FRP from the workbook.",
          "Stock items use native HubSpot quotes with Oracle SKU pricing.",
        ],
      ),
    ],
  },
  {
    id: "amico-quoting-industrial",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "Industrials",
    title: "Industrial Division Quoting Guide",
    subtitle: "SKU, Custom & Cost-Accounting Quotes",
    division: "Industrials",
    summary:
      "Walk Industrial Quotes Pending → In Progress → Quoted with Oracle SKU lines, publish e-sign quotes, and inspect Epicor read-only records.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep"],
    modules: [
      quotingModule(
        "ind-quoting-workflow",
        "IND-Q1",
        "Industrials",
        "Start from Quotes Pending, publish a native HubSpot quote, and verify automatic move to Quoted.",
        [
          "Every inquiry is a deal; quoting happens in Quotes Pending / In Progress / Quoted.",
          "Special items request cost accounting while In Progress.",
          "Publishing a HubSpot quote moves the deal to Quoted automatically.",
        ],
      ),
    ],
  },
  {
    id: "amico-quoting-perforated",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "APC and Diamond",
    title: "Perforated (APC & Diamond) Quoting Guide",
    subtitle: "MS Access → Epicor Quotes (Read-Only)",
    division: "APC and Diamond",
    summary:
      "Inspect MS Access–synced Perforated deals at Quoted, read-only Epicor Quotes records, and APC Division filtering on the deal board.",
    roleFilterTags: ["Sales Rep", "Sales Manager / NSM"],
    modules: [
      quotingModule(
        "perf-quoting-workflow",
        "PERF-Q1",
        "APC and Diamond",
        "Open a Perforated pipeline deal created from MS Access Sent, verify Epicor Quotes sync, and practice won/lost handling.",
        [
          "Marking Sent in MS Access creates a new Perforated deal at Quoted (one deal per quote).",
          "CRM > Epicor Quotes is read-only — edit in MS Access / Epicor.",
          "Filter table views by APC Division for high-volume APC workflows.",
        ],
      ),
    ],
  },
  {
    id: "amico-quoting-security-fence",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "Security Fence",
    title: "Security Fence Division Quoting Guide",
    subtitle: "Estimating Workbook → Quote Ingestion",
    division: "Security Fence",
    summary:
      "Condensed quoting walkthrough: RFQ / Bidding, workbook ingestion revisions, Quote Recipient labels, and bid-date reminders on Security Fence deals.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep", "Estimator"],
    modules: [
      quotingModule(
        "sf-quoting-workflow",
        "SF-Q1",
        "Security Fence",
        "Advance to RFQ / Bidding, ingest workbook quote revisions on one deal, and tag Quote Recipients.",
        [
          "Quote Ingestion Tool pushes workbook quotes onto the same Security Fence deal.",
          "Tag bidding contacts with Quote Recipient on the deal record.",
          "Bid Date drives automatic 7-day-before reminders.",
        ],
      ),
    ],
  },
  {
    id: "amico-quoting-security-mesh",
    tenantSlug: "amico",
    category: "division-quoting",
    quotingGuideKey: "Security Mesh",
    title: "Security Mesh Division Quoting Guide",
    subtitle: "Transactional HubSpot Quote + E-Sign",
    division: "Security Mesh",
    summary:
      "Practice Security Mesh Quote Pending tasks, native HubSpot quote creation with Oracle pricing, publish/send, and Shipping-stage progression.",
    roleFilterTags: ["Sales Rep", "Inside Sales Rep"],
    modules: [
      quotingModule(
        "mesh-quoting-workflow",
        "MESH-Q1",
        "Security Mesh",
        "Build and publish a Security Mesh HubSpot quote and advance the deal through Quoted toward Shipping.",
        [
          "Security Mesh pipeline: Qualified → Quote Pending → Quoted → Shipping → Won/Lost.",
          "Oracle SKU customer pricing on HubSpot quote line items.",
          "E-signature publish moves deal to Quoted.",
        ],
      ),
    ],
  },
];