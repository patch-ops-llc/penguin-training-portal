export type QuotingGuideSection = {
  title: string;
  bullets: string[];
};

export type DivisionQuotingGuide = {
  division: string;
  pipeline: string;
  quotingSystem: string;
  sourceNote: string;
  beforeYouQuote: string[];
  createQuote: string[];
  viewAndManage: string[];
  automationAndTasks: string[];
  quickReference: QuotingGuideSection[];
};

export const DIVISION_QUOTING_GUIDES: Record<string, DivisionQuotingGuide> = {
  AMF: {
    division: "AMF",
    pipeline: "AMF",
    quotingSystem: "Paperless Parts (source) → HubSpot Deal mirror at Quoted",
    sourceNote: "AMICO Penguin AMF Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "HubSpot account active; Paperless Parts salesperson matches Deal owner.",
      "Search CRM > Companies before quoting a new customer in Paperless Parts.",
      "Buyer email on the Paperless Parts quote matches the HubSpot contact.",
      "Estimator / Technical Owner set on manually created deals for engineering quotes.",
    ],
    createQuote: [
      "Build quote in Paperless Parts; set status Outstanding.",
      "New deal appears in AMF pipeline at Quoted with line items, quote #, revision, PDF note.",
      "Verify company, contact, owner, and Quoting card Follow-up Date.",
      "Engineering quotes: deal may sit at Quote Pending Engineering until Paperless releases.",
    ],
    viewAndManage: [
      "Revise only in Paperless Parts — same deal updates, revision increments, new PDF note.",
      "Accepted → Awarded - Won; lost/expired/cancelled → Closed - Lost.",
      "Manual HubSpot stage changes hold until Paperless status changes again.",
    ],
    automationAndTasks: [
      "Follow-up Date on Quoting card drives Prepare quote follow-up task (default +3 business days).",
      "Engineering quote task routes to Estimator / Technical Owner when required.",
    ],
    quickReference: [
      {
        title: "Never edit in HubSpot",
        bullets: ["Line items, revision, total, and PDF — change only in Paperless Parts."],
      },
      {
        title: "Required deal checks",
        bullets: ["Quote number", "Revision", "Owner", "Primary company", "Buyer contact", "Follow-up Date"],
      },
    ],
  },
  Architecture: {
    division: "Architecture",
    pipeline: "Architecture Project",
    quotingSystem: "Estimating workbook → Quote Ingestion Tool → HubSpot quote send",
    sourceNote: "AMICO Penguin Architecture Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "Quote ingestion tool bookmarked and Architecture estimating workbook current.",
      "Deal in Architecture Project pipeline with Primary, GC, A/E associations.",
      "Deal owner, Inside Sales Owner, Estimator / Technical Owner populated.",
      "Bid Date on Key Dates card.",
    ],
    createQuote: [
      "Budget/ROM: Budget Amount + Budget Delivered Date on deal; budget follow-up task.",
      "Formal quote: deal at Quote Pending / In Progress + Prepare quote task.",
      "Push workbook via Quote Ingestion Tool — match company, contact, deal, division Architecture.",
      "Send HubSpot quote (Share) → Quote Submitted.",
    ],
    viewAndManage: [
      "Revisions: workbook → ingestion again on same deal (no duplicate deals).",
      "Awarded - Won → Project / Handoff Required prompt.",
      "Closed - Lost → Lost Reason required.",
    ],
    automationAndTasks: [
      "Prepare quote (Inside Sales), Engineering review, Budget follow-up, Bid date reminder.",
    ],
    quickReference: [
      { title: "Source of truth", bullets: ["Estimating workbook — do not edit ingested quote fields in HubSpot."] },
      { title: "Stage gates", bullets: ["Quote Submitted after send", "Handoff Required at won"] },
    ],
  },
  "Building Products": {
    division: "Building Products",
    pipeline: "Building Products",
    quotingSystem: "Native HubSpot Quote + Oracle SKU pricing + e-signature",
    sourceNote: "AMICO Penguin Building Products Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "Revenue Hub quoting seat.",
      "Deal in Building Products pipeline; Primary company, distributor/contractor, buyer contact.",
      "Buyer contact has email (required for e-sign).",
      "Outside + Inside Sales Owners set.",
    ],
    createQuote: [
      "Quote Pending → Prepare quote task to Inside Sales (Prepare quotes queue).",
      "Quotes card → Create quote → Building Products or Stayform template.",
      "Add SKU line items (Oracle customer price); review terms; publish & send for e-sign.",
      "Verbal/email price only: move to Quoted and enter Quote Date + Quoted Value.",
    ],
    viewAndManage: [
      "Distributor PO with no quote: log PO fields and close won.",
      "Recall & edit draft quotes in HubSpot; sent quotes follow revision policy.",
    ],
    automationAndTasks: ["Prepare quote SLA", "Quote follow-up queue after send."],
    quickReference: [
      { title: "Three pricing paths", bullets: ["Formal HubSpot quote", "Verbal → Quoted fields", "PO-only deal"] },
    ],
  },
  FRP: {
    division: "FRP",
    pipeline: "FRP Project / Fabrication",
    quotingSystem: "Fabrication: workbook + ingestion · Stock: native HubSpot Quote + Oracle",
    sourceNote: "AMICO Penguin FRP Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "Ingestion tool access; Revenue seat for stock quotes.",
      "Deal in FRP pipeline; Primary company + buyer; owners set; Bid Date on Key Dates.",
    ],
    createQuote: [
      "Planning & Engineering → Design (drawings task) → RFQ Bidding (Prepare quote).",
      "Fabrication: workbook → ingestion with division FRP.",
      "Stock: Create HubSpot quote on deal with Oracle SKUs; publish & send.",
    ],
    viewAndManage: [
      "Fabrication revisions via workbook re-ingest; stock via HubSpot recall/edit.",
      "Awarded - Won or Closed - Lost with Lost Reason.",
    ],
    automationAndTasks: ["Engineering review", "Request drawings", "Prepare quote", "Bid date reminder"],
    quickReference: [
      { title: "Pick the route", bullets: ["Custom fabrication = ingestion", "Catalog stock = HubSpot quote"] },
    ],
  },
  Industrials: {
    division: "Industrials",
    pipeline: "Industrial",
    quotingSystem: "Native HubSpot Quote + Oracle (stock/custom) + cost accounting handoff",
    sourceNote: "AMICO Penguin Industrial Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "Revenue Hub seat; deal in Industrial pipeline; ship-to where relevant.",
      "Buyer email; Outside + Inside Sales Owners.",
    ],
    createQuote: [
      "RFQ → Quotes Pending (Prepare quote).",
      "In Progress: build quote — SKU Oracle pricing, custom lines, or cost accounting request.",
      "Publish HubSpot quote → auto Quoted; Follow Up until PO.",
    ],
    viewAndManage: ["Special-item cost requests complete in In Progress", "PO → Awarded - Won"],
    automationAndTasks: ["Prepare quote", "Cost accounting task", "Quote follow-ups"],
    quickReference: [
      { title: "Quote types", bullets: ["Stock SKU", "Custom cut-to-size", "Special → cost accounting"] },
    ],
  },
  "APC and Diamond": {
    division: "APC and Diamond",
    pipeline: "Perforated",
    quotingSystem: "APC: MS Access Sent → Deal · Epicor SO → Won · Diamond: workbook (handoff TBC)",
    sourceNote: "AMICO Penguin Perforated Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "HubSpot invitation accepted; Epicor Quotes bookmarked.",
      "Filter Perforated table by stage and APC Division.",
      "Company exists before MS Access Sent.",
    ],
    createQuote: [
      "APC: build in MS Access → mark Sent → new Perforated deal at Quoted with quote #.",
      "Inspect CRM > Epicor Quotes read-only record linked to deal.",
      "Won: Epicor sales order sync (or manual Awarded - Won); lost: Closed - Lost + reason.",
    ],
    viewAndManage: [
      "One deal per quote — second quote = second deal.",
      "Edit APC quotes in MS Access only.",
    ],
    automationAndTasks: ["High-volume table workflow", "Epicor Quotes sync display"],
    quickReference: [{ title: "APC Division field", bullets: ["APC vs Diamond on each Perforated deal"] }],
  },
  "Security Fence": {
    division: "Security Fence",
    pipeline: "Security Fence Project",
    quotingSystem: "External quoting tool (PDF) → Attachments + Security Fence Pipedrive Fields (not Revenue > Quotes)",
    sourceNote: "AMICO Penguin Security Fence Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "Deal in Security Fence Project pipeline; use saved view to hide ~3,500 historical Awarded deals.",
      "Primary, GC, Installer/Customer, A/E firm associations and contacts.",
      "Deal owner, Inside Sales Owner, Estimator / Technical Owner set.",
      "Bid Date, Project Address, Market Segment on Security Fence Pipedrive Fields card.",
      "Quote # format matches your quoting tool PDF.",
    ],
    createQuote: [
      "Design: Drawings Received prompt → Request drawings task if not Yes.",
      "Engineering: Engineering Required prompt → Engineering review task.",
      "Budgeting: Prepare budget → attach budget PDF → Budget Delivered Date (5-day follow-up).",
      "RFQ / Bidding: Prepare quote (3-day, Prepare quotes queue) → build bid in quoting tool.",
      "Attach bid PDF via Attachments Add → Upload; fill Quote Date, Quote #, Quoted Lead Time, Expected PO Date, Amount.",
      "Tag Quote Recipient on each bidding contact (replaces Quote to #1–#6).",
    ],
    viewAndManage: [
      "PDFs on deal Attachments — not listed under Revenue > Quotes.",
      "Revisions: new PDF on same deal + updated fields; move back to RFQ / Bidding after gaps if needed.",
      "30-day Stuck deal in RFQ / Bidding; log calls/emails on deal timeline.",
      "Awarded: Customer PO, PO Received Date, Amico Order Number, Handoff Required.",
      "Closed - Lost: Lost Reason (+ detail/competitor when required).",
    ],
    automationAndTasks: [
      "Request drawings, Engineering review, Prepare budget, Budget follow-up (+5 biz days).",
      "Bid date reminder (-7 days), Prepare quote at RFQ (+3 biz days).",
      "Stuck deal: 40d Engineering/Budgeting (estimator), 30d RFQ (owner).",
    ],
    quickReference: [
      { title: "Record a new bid", bullets: ["RFQ / Bidding → attach PDF → Pipedrive Fields + Amount + Quote Recipients"] },
      { title: "No line items in HubSpot", bullets: ["Product Type and Market Segment on deal carry reporting detail"] },
    ],
  },
  "Security Mesh": {
    division: "Security Mesh",
    pipeline: "Security Mesh",
    quotingSystem: "Native HubSpot Quote (Security Mesh template) + Oracle SKU + e-signature",
    sourceNote: "AMICO Penguin Security Mesh Quoting Guide — Nov 2026",
    beforeYouQuote: [
      "Revenue Hub quoting seat.",
      "Deal in Security Mesh pipeline with Primary company + buyer contact email.",
      "Deal owner and Inside Sales Owner set.",
    ],
    createQuote: [
      "Quote Pending → Quotes card → Create quote → Security Mesh template.",
      "Add line items from product library (Oracle Security Mesh pricing).",
      "Set expiration, e-signature buyers, Preview, then Share (email/link/PDF).",
      "Move to Quoted; enter Quote Date, Quote #, Quoted Lead Time (weeks), Amount on Pipedrive Fields card.",
      "Quote Recipient labels on contacts who received the quote.",
    ],
    viewAndManage: [
      "Quotes card, Revenue > Quotes list, Security Mesh board, company record.",
      "Recall & edit sent quotes; Clone for parallel versions; Void/Archive when invalid.",
      "Awarded - Won with Customer PO / PO Received Date; Closed - Lost with Lost Reason.",
      "Shipping stage for order fulfillment path.",
    ],
    automationAndTasks: [
      "[To confirm] stage tasks & stuck thresholds — set manual follow-up tasks until confirmed.",
    ],
    quickReference: [
      { title: "Shared layout", bullets: ["Security Fence & Mesh deal record layout (Pipedrive Fields card)"] },
      { title: "Pricing errors", bullets: ["Never type over missing Oracle price — report SKU to NSM"] },
    ],
  },
};

export function quotingGuideForDivision(key: string): DivisionQuotingGuide | undefined {
  return DIVISION_QUOTING_GUIDES[key];
}

export function quotingGuideForTrack(track: { quotingGuideKey?: string; division: string }): DivisionQuotingGuide | undefined {
  const key = track.quotingGuideKey ?? track.division;
  return quotingGuideForDivision(key);
}