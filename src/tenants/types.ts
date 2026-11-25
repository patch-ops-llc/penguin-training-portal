/**
 * Typed training pack & CRM domain contracts for Penguin Training Portal.
 * Dates written as relative offsets ("@-3d", "@+2w", "@-90mi") are resolved when the pack loads in the browser.
 */

export type PermissionSet = "sales-rep" | "sales-manager" | "project-manager" | "executive";

export type Persona = {
  id: string;
  name: string;
  title: string;
  email: string;
  /** Label shown in the TrainingBar "View as" role switcher. */
  viewAs: string;
  color: string;
  division: string;
  team: string;
  permissionSet: PermissionSet;
  /** Pipelines whose deals/quotes this persona can view. Empty/undefined means all pipelines (e.g. manager/executive). */
  allowedPipelineIds?: string[];
};

export type UserProfilePrefs = {
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  taskReminders: boolean;
  mentionAlerts: boolean;
  noisyPropertyAlerts: boolean;
  outlookConnected: boolean;
  outlookEmail: string;
  outlookAddInInstalled: boolean;
};

export type ErpSummary = {
  systemName?: string;
  accountNumber: string;
  lastOrderDate: string;
  openBalance: number;
  creditStatus: string;
  creditLimit: number;
};

export type CrossDivisionSummary = {
  primaryDivision: string;
  divisionsActive: string[];
  mostRecentActiveDivision: string;
  lastDivisionActivity: string;
  mostRecentDivisionContact: string;
};

export type ExtraProp = { label: string; value: string };

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  type: string;
  customerType?: string;
  companyLabels?: string[];
  city: string;
  state: string;
  employees: number | null;
  revenue: number | null;
  phone: string;
  ownerId: string | null;
  coOwnerIds?: string[];
  parentCompanyId?: string;
  childCompanyIds?: string[];
  crossDivision?: CrossDivisionSummary;
  /** Marks a legacy imported record missing a website domain so reps practice flagging duplicates instead of merging. */
  missingDomainDuplicateOf?: string;
  flaggedDuplicate?: boolean;
  lifecycle: string;
  createdAt: string;
  lastActivityAt: string;
  description?: string;
  territory?: string;
  erp?: ErpSummary;
  extra?: ExtraProp[];
  isNew?: boolean;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  companyId: string | null;
  ownerId: string | null;
  contactLabels?: string[];
  lifecycle: string;
  leadStatus: string;
  createdAt: string;
  lastActivityAt: string;
  source?: string;
  score?: number;
  extra?: ExtraProp[];
  isNew?: boolean;
};

export type LineItem = {
  sku: string;
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  leadDays: number;
  oracleContractPrice?: boolean;
  timing?: string;
  recurring?: boolean;
  discountPct?: number;
};

export type StagePromptField = "drawingsReceived" | "engineeringRequired" | "handoffRequired" | "lostReason";

export type StagePromptSpec = {
  field: StagePromptField;
  label: string;
  required: boolean;
  options: string[];
  helperText?: string;
  includePoFields?: boolean;
  includeLossDetails?: boolean;
};

export type DealStage = {
  id: string;
  label: string;
  probability: number;
  closed?: "won" | "lost";
  /** True when the stage counts as 100% Won revenue while still active in post-award delivery (AMICO Security Fence). */
  wonRevenue?: boolean;
  globalStageLabel?: string;
  staleDays?: number;
  staleAssignee?: "owner" | "estimator";
  prompt?: StagePromptSpec;
};

export type PipelineArchetype = "project" | "transactional" | "quote-driven" | "global";

export type Pipeline = {
  id: string;
  name: string;
  division: string;
  archetype: PipelineArchetype;
  quotingRoute: string;
  readOnly?: boolean;
  stages: DealStage[];
};

export type DealAssociationLink = {
  dealId: string;
  label: "Cross-sell To" | "Cross-sell From" | "Shadow Deal" | "Source Deal";
};

export type WorkbookQuotePreset = {
  id: string;
  quoteNumber: string;
  revision: string;
  amount: number;
  leadTimeWeeks: number;
  quoteDate: string;
  summary: string;
  pdfName: string;
};

export type Deal = {
  id: string;
  name: string;
  pipelineId: string;
  division: string;
  companyId: string;
  additionalCompanyIds?: string[];
  contactIds: string[];
  ownerId: string | null;
  outsideSalesOwnerId?: string | null;
  insideSalesOwnerId?: string | null;
  estimatorOwnerId?: string | null;
  stage: string;
  amount: number;
  closeDate: string;
  createdAt: string;
  lastActivityAt: string;
  daysInStage?: number;
  type: string;
  sourceDivision?: string;
  marketSegment?: string;
  productType?: string;
  sourceOfProject?: string;
  dodgeProjectId?: string;
  bidDate?: string;
  drawingsReceived?: "Yes" | "No" | "In Progress";
  engineeringRequired?: "In-house" | "Third-party" | "No" | "Pending";
  budgetDeliveredDate?: string;
  handoffRequired?: "Yes" | "No";
  quoteNumber?: string;
  quoteRevision?: string;
  quoteDate?: string;
  quotedLeadTimeWeeks?: number;
  externalQuoteSource?: string;
  externalQuotePdf?: string;
  customerPo?: string;
  amicoOrderNumber?: string;
  expectedPoDate?: string;
  poReceivedDate?: string;
  lostReason?: string;
  lostReasonDetail?: string;
  lostNotes?: string;
  shippingStreet?: string;
  shippingCity?: string;
  projectAddress?: string;
  projectCity?: string;
  projectState?: string;
  projectDueDate?: string;
  /** Keyed by companyId -> association role labels (e.g. ["Primary", "General Contractor"]). */
  companyLabels?: Record<string, string[]>;
  /** Keyed by contactId -> association role labels (e.g. ["GC Contact", "Quote Recipient"]). */
  contactLabels?: Record<string, string[]>;
  dealLinks?: DealAssociationLink[];
  projectId?: string;
  epicorQuoteIds?: string[];
  workbookPresets?: WorkbookQuotePreset[];
  lineItems: LineItem[];
  source?: string;
  readOnly?: boolean;
  isNew?: boolean;
};

export type SavedDealView = {
  id: string;
  label: string;
  visibility: "Private" | "Team";
  ownerId?: string;
  pipelineId?: string;
  bidDueThisMonth?: boolean;
  myDealsOnly?: boolean;
  isCustom?: boolean;
};

export type Product = {
  sku: string;
  name: string;
  family: string;
  division?: string;
  price: number;
  oracleContractPrice?: number;
  cost: number;
  leadDays: number;
  onHand: number;
  timing?: string;
};

export type QuoteStatus = "Draft" | "Pending approval" | "Changes requested" | "Approved" | "Sent" | "Accepted";

export type Quote = {
  id: string;
  number: string;
  title: string;
  dealId: string;
  companyId: string;
  contactId: string;
  ownerId: string;
  status: QuoteStatus;
  esignEnabled?: boolean;
  lineItems: LineItem[];
  discountPct: number;
  createdAt: string;
  validUntil: string;
  sentAt?: string;
  acceptedAt?: string;
  origin?: string;
  readOnlyExternal?: boolean;
  externalSystem?: string;
  isNew?: boolean;
};

export type EpicorQuote = {
  id: string;
  quoteNumber: string;
  title: string;
  total: number;
  status: "Sent" | "Accepted" | "Expired" | "Pending SO";
  currency: string;
  customerPo: string;
  division: string;
  sourceSystem: "Epicor" | "MS Access & Epicor" | "Paperless Parts";
  expirationDate: string;
  createdAt: string;
  epicorQuoteId: string;
  epicorCustomerId: string;
  salesOrderNumber?: string;
  companyId: string;
  contactId: string;
  dealId: string;
};

export type ProjectTaskItem = {
  id: string;
  title: string;
  done: boolean;
  assigneeId: string;
  startDate: string;
  durationDays: number;
  dueDate: string;
  late?: boolean;
};

export type ProjectPhase = {
  id: string;
  name: string;
  tasks: ProjectTaskItem[];
};

export type ProjectStage = {
  id: string;
  label: string;
  /** When set, advancing a Project to this stage automatically moves the linked Sales Deal to this Deal stage! */
  dealStageSync?: string;
};

export type ProjectPipelineSpec = {
  id: "project-pipeline" | "delivery-board";
  name: string;
  stages: ProjectStage[];
};

export type Project = {
  id: string;
  code: string;
  name: string;
  pipelineId: "project-pipeline" | "delivery-board";
  stage: string;
  /** Mapped stage on the alternate board so Project Pipeline and Delivery Board both work seamlessly. */
  deliveryStage: string;
  status: "On Track" | "Blocked" | "Completed" | "Cancelled";
  blockerNote?: string;
  ownerId: string;
  companyId: string;
  contactIds: string[];
  dealId: string;
  ticketSummary?: string;
  startDate: string;
  targetDueDate: string;
  totalTasksCount: number;
  completedTasksBaseline: number;
  phases: ProjectPhase[];
  isNew?: boolean;
};

export type TaskQueueName = "Prepare quotes" | "Quote follow-ups" | "Stuck deal" | "Estimating";

export type Task = {
  id: string;
  title: string;
  type: "Call" | "Email" | "To-do";
  priority: "High" | "Medium" | "Low";
  dueAt: string;
  ownerId: string;
  status: "open" | "done";
  queue?: TaskQueueName;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  projectId?: string;
  notes?: string;
  isNew?: boolean;
};

export type Segment = {
  id: string;
  name: string;
  objectType: "Contacts" | "Companies";
  kind: "Active" | "Static";
  division: string;
  filterSummary: string;
  updatedAt: string;
  createdBy: string;
  memberIds: string[];
};

export type LeadItem = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  title: string;
  companyName: string;
  domain: string;
  companyId?: string;
  ownerId: string;
  status: "New" | "Attempting" | "Qualified" | "Disqualified";
  division: string;
  marketSegment: string;
  inquirySummary: string;
  estimatedAmount: number;
  createdAt: string;
  convertedDealId?: string;
  isNew?: boolean;
};

export type Notification = {
  id: string;
  personaId: string;
  at: string;
  kind: "lead" | "task" | "mention" | "handoff" | "quote";
  title: string;
  body: string;
  path: string;
  read: boolean;
};

export type ActivityType = "note" | "email" | "call" | "meeting" | "task" | "form" | "quote" | "deal" | "workflow" | "lifecycle" | "sync" | "project";

export type Activity = {
  id: string;
  at: string;
  type: ActivityType;
  title: string;
  body?: string;
  byId?: string | null;
  legacyPipedrive?: boolean;
  contactIds?: string[];
  companyIds?: string[];
  dealIds?: string[];
  projectIds?: string[];
  linkPath?: string;
  linkLabel?: string;
  attachment?: string;
};

export type WorkflowNode = {
  id: string;
  kind: "trigger" | "branch" | "action";
  label: string;
  detail?: string;
  extId?: string;
};

export type WorkflowBranch = {
  id: string;
  label: string;
  rule: string;
  nodes: WorkflowNode[];
};

export type Workflow = {
  id: string;
  name: string;
  object: "Contact" | "Company" | "Deal" | "Project" | "Lead";
  status: "On" | "Off";
  enrolled: number;
  description: string;
  updatedAt: string;
  trunk?: WorkflowNode[];
  branches?: WorkflowBranch[];
};

export type Extension = {
  id: string;
  name: string;
  /** "penguin" = custom Penguin build/automation, "amico-rule" = AMICO HubSpot governance rule, "native" = standard HubSpot. */
  by: "penguin" | "amico-rule" | "native";
  note?: string;
};

export type NavConfig = {
  contacts: boolean;
  companies: boolean;
  deals: boolean;
  projects: boolean;
  epicorQuotes: boolean;
  segments: boolean;
  tasks: boolean;
  leads: boolean;
  quotes: boolean;
  workflows: boolean;
};

export type TrainingModuleMeta = {
  id: string;
  code: string;
  title: string;
  summary: string;
  objective: string;
  minutes: number;
  roleTags: string[];
  defaultPersonaId: string;
  takeaways: string[];
  dos: string[];
  donts: string[];
};

export type TrainingTrackCategory = "core" | "division-handover" | "division-quoting";

export type TrainingTrackMeta = {
  id: string;
  tenantSlug: string;
  title: string;
  subtitle: string;
  division: string;
  summary: string;
  /** Launchpad grouping: core HubSpot 101, division handover tracks, or division quoting guides. */
  category?: TrainingTrackCategory;
  /** Division key for the Quoting Guide Reference drawer (defaults to `division`). */
  quotingGuideKey?: string;
  restricted?: boolean;
  roleFilterTags: string[];
  modules: TrainingModuleMeta[];
};

export type Pack = {
  tenantSlug: string;
  tenantName: string;
  track: TrainingTrackMeta;
  portal: {
    company: string;
    domain: string;
    hubId: string;
    currency: string;
    address: string[];
  };
  terms: {
    backOffice: string;
  };
  navConfig: NavConfig;
  defaultPersonaId: string;
  personas: Persona[];
  defaultProfile: UserProfilePrefs;
  pipelines: Pipeline[];
  savedDealViews: SavedDealView[];
  projectPipelines: ProjectPipelineSpec[];
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  products: Product[];
  quotes: Quote[];
  epicorQuotes: EpicorQuote[];
  projects: Project[];
  tasks: Task[];
  segments: Segment[];
  leads: LeadItem[];
  notifications: Notification[];
  activities: Activity[];
  workflows: Workflow[];
  /** Keyed by moduleId (or "global" for shared callouts across all modules in the track). */
  extensions: Record<string, Extension[]>;
};
