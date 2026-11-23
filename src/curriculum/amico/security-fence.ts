import { flag, has, type TrainingScript } from "@/curriculum/types";

export const AMICO_SECURITY_FENCE_SCRIPTS: Record<string, TrainingScript> = {
  "sf-lead-to-deal": {
    moduleId: "sf-lead-to-deal",
    steps: [
      {
        id: "open-nsm-leads",
        title: "Review inbound Security Fence Web Lead as NSM (Rachel Sterling)",
        hint: "Open CRM > Leads as Rachel Sterling (NSM) to triage Summit Grid & Substation.",
        path: () => "/leads",
        done: (c) => has(c, "seen.leads"),
        script: () => [{ t: "persona", id: "nsm" }, flag("seen.leads")],
      },
      {
        id: "qualify-web-lead",
        title: "Qualify Lead into Security Fence Project Deal (Planning 10%)",
        hint: "Click 'Qualify & Create Deal' on Summit Grid & Substation, assigning Jordan Vance (Outside) and Casey Morales (Inside).",
        path: () => "/leads",
        after: () => "/deals/dl-qual-ld-summit-grid",
        done: (c) => Boolean(c.w.leads.find((l) => l.id === "ld-summit-grid")?.convertedDealId),
        script: (_c, now) => [
          {
            t: "lead.qualify",
            leadId: "ld-summit-grid",
            outsideSalesOwnerId: "outside-rep",
            insideSalesOwnerId: "inside-rep",
            stage: "planning",
            at: now,
          },
        ],
      },
      {
        id: "inspect-multiparty-deal",
        title: "Inspect Multi-Party GC, A/E & Project Owner Association Labels",
        hint: "Open IronPeak Ashburn Campus ($485,000) to review Primary, General Contractor, A/E Firm, and Project Owner labels.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "seen.deal.dl-ironpeak-perim"),
        script: () => [{ t: "persona", id: "outside-rep" }, flag("seen.deal.dl-ironpeak-perim")],
      },
    ],
  },

  "sf-estimating-bidding": {
    moduleId: "sf-estimating-bidding",
    steps: [
      {
        id: "move-to-design",
        title: "Move IronPeak Deal to Design (Drawings Received = In Progress)",
        hint: "Click Design (Project Specification) on the Deal stage bar and select Drawings Received = In Progress.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "stage.dl-ironpeak-perim.design"),
        script: (_c, now) => [
          {
            t: "deal.setStage",
            dealId: "dl-ironpeak-perim",
            stage: "design",
            promptValues: { drawingsReceived: "In Progress" },
            at: now,
          },
        ],
      },
      {
        id: "move-to-engineering",
        title: "Advance to Engineering (Engineering Required = In-house)",
        hint: "Move IronPeak Deal to Engineering and select Engineering Required = In-house to route a task to Estimator Devon Park.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "stage.dl-ironpeak-perim.engineering"),
        script: (_c, now) => [
          { t: "deal.updateFields", dealId: "dl-ironpeak-perim", patch: { drawingsReceived: "Yes" }, at: now },
          {
            t: "deal.setStage",
            dealId: "dl-ironpeak-perim",
            stage: "engineering",
            promptValues: { engineeringRequired: "In-house" },
            at: now,
          },
        ],
      },
      {
        id: "estimator-queue",
        title: "Switch to Estimator (Devon Park) & work the Estimating queue",
        hint: "Switch 'View as' to Estimator / Technical Owner, open CRM > Tasks > Estimating, and complete Engineering review.",
        path: () => "/tasks",
        done: (c) => has(c, "task.done.tk-wf-dl-ironpeak-perim-engineering-review"),
        script: () => [
          { t: "persona", id: "estimator" },
          { t: "task.toggle", id: "tk-wf-dl-ironpeak-perim-engineering-review" },
        ],
      },
      {
        id: "move-to-rfq",
        title: "Advance to RFQ / Bidding (3-day Prepare quotes queue for Inside Sales)",
        hint: "Open IronPeak Deal and move stage to RFQ / Bidding so Casey Morales receives 'Prepare quote' in the Prepare quotes queue.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "stage.dl-ironpeak-perim.rfq-bidding"),
        script: (_c, now) => [
          { t: "deal.setStage", dealId: "dl-ironpeak-perim", stage: "rfq-bidding", at: now },
          { t: "persona", id: "inside-rep" },
        ],
      },
      {
        id: "inspect-workflow",
        title: "Inspect the Security Fence | Stage tasks workflow diagram",
        hint: "Open Automation > Workflows > Security Fence | Stage tasks to review automated fallback routing.",
        path: () => "/workflows/wf-sf-stage-tasks",
        done: (c) => has(c, "seen.workflow.wf-sf-stage-tasks"),
        script: () => [flag("seen.workflow.wf-sf-stage-tasks")],
      },
    ],
  },

  "sf-quote-ingestion-bid": {
    moduleId: "sf-quote-ingestion-bid",
    steps: [
      {
        id: "ingest-rev1",
        title: "Push Estimating Workbook Quote Rev 1 via Quote Ingestion Tool",
        hint: "On IronPeak Deal, click 'Ingest Workbook Rev 1 ($468,000)' in the Estimating & Quote Ingestion card.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "wb.dl-ironpeak-perim.wb-rev1"),
        script: (_c, now) => [
          { t: "persona", id: "inside-rep" },
          { t: "deal.ingestWorkbookQuote", dealId: "dl-ironpeak-perim", presetId: "wb-rev1", at: now },
        ],
      },
      {
        id: "tag-quote-recipient",
        title: "Tag bidding GC contact with 'Quote Recipient' label",
        hint: "Click '+ Quote Recipient' on Marcus Hale in the Deal's Contacts card (replacing legacy Quote to #1-#6 fields).",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => Boolean(c.w.deals.find((d) => d.id === "dl-ironpeak-perim")?.contactLabels?.["ct-marcus-hale"]?.includes("Quote Recipient")),
        script: () => [{ t: "deal.addContactLabel", dealId: "dl-ironpeak-perim", contactId: "ct-marcus-hale", label: "Quote Recipient" }],
      },
      {
        id: "ingest-rev2",
        title: "Ingest Scope Add-On Revision (Rev 2 — $485,000) onto the SAME Deal",
        hint: "Click 'Ingest Workbook Rev 2 ($485,000)' so revision history stays on one single Deal.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "wb.dl-ironpeak-perim.wb-rev2"),
        script: (_c, now) => [{ t: "deal.ingestWorkbookQuote", dealId: "dl-ironpeak-perim", presetId: "wb-rev2", at: now }],
      },
    ],
  },

  "sf-award-pm-handoff": {
    moduleId: "sf-award-pm-handoff",
    steps: [
      {
        id: "move-to-awarded",
        title: "Move IronPeak Deal to Awarded (100% Won) & trigger PM Handoff",
        hint: "Move IronPeak Deal to Awarded and select required prompt 'Project / Handoff Required = Yes'.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => c.w.deals.find((d) => d.id === "dl-ironpeak-perim")?.stage === "awarded" || Boolean(c.w.deals.find((d) => d.id === "dl-ironpeak-perim")?.projectId),
        script: (_c, now) => [
          {
            t: "deal.setStage",
            dealId: "dl-ironpeak-perim",
            stage: "awarded",
            promptValues: {
              handoffRequired: "Yes",
              customerPo: "PO-VCC-44910",
              amicoOrderNumber: "SO-98214",
            },
            at: now,
          },
        ],
      },
      {
        id: "pm-advance-delivery",
        title: "Switch to Security PM & advance Project PRJ-209 to Shipping",
        hint: "Open PRJ-209 as Marcus Alvarez (Security PM) and move Delivery Board stage to Shipping.",
        path: () => "/projects/prj-ironpeak",
        done: (c) => c.w.deals.find((d) => d.id === "dl-ironpeak-perim")?.stage === "shipping",
        script: (_c, now) => [
          { t: "persona", id: "pm-security" },
          { t: "project.setStage", projectId: "prj-ironpeak", pipelineId: "delivery-board", stage: "shipping", at: now },
        ],
      },
      {
        id: "verify-global-shadow",
        title: "Inspect Read-Only Global Shadow Deal as NSM",
        hint: "Open [Global Shadow] IronPeak Ashburn Campus to verify Closed Won executive rollup.",
        path: () => "/deals/dl-global-ironpeak",
        done: (c) => has(c, "seen.deal.dl-global-ironpeak"),
        script: () => [{ t: "persona", id: "nsm" }, flag("seen.deal.dl-global-ironpeak")],
      },
    ],
  },

  "sf-views-stuck-deals": {
    moduleId: "sf-views-stuck-deals",
    steps: [
      {
        id: "create-saved-view",
        title: 'Create saved Deal Board View ("Fence bids due this month")',
        hint: "On CRM > Deals, click '+ Add view', name it 'Fence bids due this month', and click Save view.",
        path: () => "/deals",
        done: (c) => has(c, "dealView.created"),
        script: () => [
          { t: "deal.selectPipeline", pipelineId: "security-fence" },
          { t: "deal.setLayout", board: true },
          {
            t: "dealView.create",
            label: "Fence bids due this month",
            visibility: "Private",
            pipelineId: "security-fence",
            bidDueThisMonth: true,
          },
        ],
      },
      {
        id: "review-stuck-queue",
        title: "Inspect Stuck deal reminders in CRM > Tasks",
        hint: "Open CRM > Tasks and select the 'Stuck deal' queue tab (30d/40d/15d stage thresholds).",
        path: () => "/tasks",
        done: (c) => c.w.ui["tasks.view"] === "Stuck deal" || has(c, "seen.stuckQueue"),
        script: () => [{ t: "ui", k: "tasks.view", v: "Stuck deal" }, flag("seen.stuckQueue")],
      },
      {
        id: "close-lost-reason",
        title: "Mark Bluegrass Correctional Closed - Lost with required Lost Reason",
        hint: "Open Bluegrass Correctional Deal, move stage to Closed - Lost, and select Lost Reason = Bidder Lost.",
        path: () => "/deals/dl-bluegrass-corr",
        done: (c) => c.w.deals.find((d) => d.id === "dl-bluegrass-corr")?.stage === "closed-lost",
        script: (_c, now) => [
          {
            t: "deal.setStage",
            dealId: "dl-bluegrass-corr",
            stage: "closed-lost",
            promptValues: {
              lostReason: "Bidder Lost",
              lostReasonDetail: "Incumbent regional GC lost prime bid to alternate contractor",
              lostNotes: "Maintain relationship with estimator for Q2 annex bid.",
            },
            at: now,
          },
        ],
      },
    ],
  },
};
