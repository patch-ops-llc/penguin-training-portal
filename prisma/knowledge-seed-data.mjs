/** Canonical AMICO Knowledge Library seed definitions (idempotent by slug). */
export const AMICO_KNOWLEDGE_SEEDS = [
  {
    slug: "amico-hubspot-101-training-guide",
    title: "AMICO HubSpot 101 Go-Live Training Guide",
    category: "CORE_GUIDE",
    division: null,
    publicFile: "AMICO-HubSpot-101-Training-Guide.docx",
    sortOrder: 10,
    summary:
      "Step-by-step HubSpot Sales Hub orientation for all AMICO divisions: navigation, records, pipelines, and daily workflows before go-live.",
  },
  {
    slug: "security-fence-hubspot-handover",
    title: "Security Fence HubSpot Handover",
    category: "DIVISION_HANDOVER",
    division: "Security Fence",
    publicFile: "AMICO-Security-Fence-HubSpot-Handover.docx",
    sortOrder: 20,
    summary: "Security Fence division handover: configured objects, pipelines, quoting paths, and post-go-live support expectations.",
  },
  {
    slug: "amf-quoting-guide",
    title: "AMF Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "AMF",
    publicFile: "AMICO-AMF-Quoting-Guide.docx",
    sortOrder: 30,
    summary: "AMF quoting workflows in HubSpot and Epicor: opportunity stages, quote assembly, and division-specific pricing rules.",
  },
  {
    slug: "architecture-quoting-guide",
    title: "Architecture Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "Architecture",
    publicFile: "AMICO-Architecture-Quoting-Guide.docx",
    sortOrder: 40,
    summary: "Architecture division quoting guide covering HubSpot deal steps, BOM conventions, and estimator handoffs.",
  },
  {
    slug: "building-products-quoting-guide",
    title: "Building Products Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "Building Products",
    publicFile: "AMICO-Building-Products-Quoting-Guide.docx",
    sortOrder: 50,
    summary: "Building Products quoting paths, product families, and HubSpot–Epicor alignment for inside sales and estimators.",
  },
  {
    slug: "frp-quoting-guide",
    title: "FRP Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "FRP",
    publicFile: "AMICO-FRP-Quoting-Guide.docx",
    sortOrder: 60,
    summary: "FRP division quoting stages, technical qualifiers, and quote document standards in the training sandbox.",
  },
  {
    slug: "industrials-quoting-guide",
    title: "Industrials Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "Industrials",
    publicFile: "AMICO-Industrials-Quoting-Guide.docx",
    sortOrder: 70,
    summary: "Industrials quoting guide: lead-to-quote motion, Epicor quote creation, and HubSpot pipeline checkpoints.",
  },
  {
    slug: "apc-perforated-quoting-guide",
    title: "APC & Perforated Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "APC and Diamond",
    publicFile: "AMICO-APC-Perforated-Quoting-Guide.docx",
    sortOrder: 80,
    summary: "APC and Diamond (perforated) quoting workflows, SKU patterns, and division-specific approval gates.",
  },
  {
    slug: "security-fence-quoting-guide",
    title: "Security Fence Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "Security Fence",
    publicFile: "AMICO-Security-Fence-Quoting-Guide.docx",
    sortOrder: 90,
    summary: "Security Fence quoting guide aligned to the division handover: quotes, revisions, and HubSpot record hygiene.",
  },
  {
    slug: "security-mesh-quoting-guide",
    title: "Security Mesh Quoting Guide",
    category: "QUOTING_GUIDE",
    division: "Security Mesh",
    publicFile: "AMICO-Security-Mesh-Quoting-Guide.docx",
    sortOrder: 100,
    summary: "Security Mesh quoting procedures, product configuration notes, and Epicor integration touchpoints.",
  },
];

/** Training recording slots (links attached by admins after live sessions). */
export const AMICO_KNOWLEDGE_RECORDING_SEEDS = [
  {
    slug: "training-recording-hubspot-101-monday",
    title: "Go-Live Training Call — Monday (HubSpot 101)",
    category: "RECORDING",
    division: null,
    sortOrder: 210,
    summary:
      "Placeholder for the Monday HubSpot 101 live training replay. After the session, a Penguin or AMICO admin will publish the recording link here.",
  },
  {
    slug: "training-recording-hubspot-101-tuesday",
    title: "Go-Live Training Call — Tuesday (HubSpot 101)",
    category: "RECORDING",
    division: null,
    sortOrder: 220,
    summary:
      "Placeholder for the Tuesday HubSpot 101 live training replay. Recording URL will appear once the facilitator uploads it.",
  },
  {
    slug: "training-recording-division-handover-monday",
    title: "Division Handover Q&A — Monday",
    category: "RECORDING",
    division: null,
    sortOrder: 230,
    summary:
      "Placeholder for the Monday division handover Q&A session. No link is available until admins attach the Teams/Zoom replay.",
  },
  {
    slug: "training-recording-division-handover-tuesday",
    title: "Division Handover Q&A — Tuesday",
    category: "RECORDING",
    division: null,
    sortOrder: 240,
    summary:
      "Placeholder for the Tuesday division handover Q&A session. Check back after go-live week for the published recording.",
  },
];

export const AMICO_KNOWLEDGE_ALL_SLUGS = [
  ...AMICO_KNOWLEDGE_SEEDS.map((s) => s.slug),
  ...AMICO_KNOWLEDGE_RECORDING_SEEDS.map((s) => s.slug),
];