import { flag, has, type TrainingScript } from "@/curriculum/types";

export const AMICO_QUOTING_SCRIPTS: Record<string, TrainingScript> = {
  "amf-quoting-workflow": {
    moduleId: "amf-quoting-workflow",
    steps: [
      {
        id: "amf-select-pipeline",
        title: "Open AMF pipeline deals at Quoted",
        hint: "CRM > Deals → select AMF pipeline and open Apex Power — Precision Louvered GenSet Enclosures (PP-9041).",
        path: () => "/deals/dl-amf-enclosure",
        done: (c) => has(c, "seen.deal.dl-amf-enclosure"),
        script: () => [{ t: "deal.selectPipeline", pipelineId: "amf" }, { t: "persona", id: "ind-rep" }, flag("seen.deal.dl-amf-enclosure")],
      },
      {
        id: "amf-verify-sync",
        title: "Verify Paperless Parts mirror fields (read-only)",
        hint: "Confirm quote number PP-9041 Rev B, external source Paperless Parts, and attached PDF note — do not edit line items in HubSpot.",
        path: () => "/deals/dl-amf-enclosure",
        done: (c) => has(c, "quoting.ref.opened.amf") || has(c, "seen.deal.dl-amf-enclosure"),
        script: () => [flag("quoting.ref.opened.amf")],
      },
      {
        id: "amf-epicor-readonly",
        title: "Inspect linked Epicor Quote EQ-80112 (read-only)",
        hint: "Open CRM > Epicor Quotes and view EQ-80112 linked to the AMF deal.",
        path: () => "/epicor-quotes/eq-80112",
        done: (c) => has(c, "seen.epicor.eq-80112"),
        script: () => [flag("seen.epicor.eq-80112")],
      },
      {
        id: "amf-won-path",
        title: "Review won/lost rules (Paperless drives stage)",
        hint: "Note: Accepted in Paperless → Awarded - Won; lost/expired → Closed - Lost. Manual stages hold until Paperless status changes.",
        path: () => "/deals/dl-amf-enclosure",
        done: (c) => has(c, "amf.quoting.complete"),
        script: () => [flag("amf.quoting.complete")],
      },
    ],
  },

  "arch-quoting-workflow": {
    moduleId: "arch-quoting-workflow",
    steps: [
      {
        id: "arch-open-deal",
        title: "Open Architecture deal in Quote Submitted path",
        hint: "CRM > Deals → Architecture pipeline → Meridian Civic Center sunshade deal.",
        path: () => "/deals/dl-arch-louver",
        done: (c) => has(c, "seen.deal.dl-arch-louver"),
        script: () => [{ t: "deal.selectPipeline", pipelineId: "architecture" }, { t: "persona", id: "estimator" }, flag("seen.deal.dl-arch-louver")],
      },
      {
        id: "arch-pending-stage",
        title: "Move to Quote Pending / In Progress (Prepare quote)",
        hint: "Advance stage to Pending/In Progress so Inside Sales receives Prepare quote in the queue.",
        path: () => "/deals/dl-arch-louver",
        done: (c) => has(c, "stage.dl-arch-louver.arch-pending"),
        script: (_c, now) => [{ t: "deal.setStage", dealId: "dl-arch-louver", stage: "arch-pending", at: now }],
      },
      {
        id: "arch-ingest",
        title: "Push Architecture workbook via Quote Ingestion Tool",
        hint: "On the deal right sidebar, click Ingest Rev 1 in the Epicor & Quote Ingestion card.",
        path: () => "/deals/dl-arch-louver",
        done: (c) => has(c, "wb.dl-arch-louver.arch-wb-rev1"),
        script: (_c, now) => [{ t: "deal.ingestWorkbookQuote", dealId: "dl-arch-louver", presetId: "arch-wb-rev1", at: now }],
      },
      {
        id: "arch-quote-submitted",
        title: "Advance to Quote Submitted after send",
        hint: "Move the deal to Quote Submitted once the HubSpot quote is shared with the customer.",
        path: () => "/deals/dl-arch-louver",
        done: (c) => has(c, "stage.dl-arch-louver.arch-quoted"),
        script: (_c, now) => [{ t: "deal.setStage", dealId: "dl-arch-louver", stage: "arch-quoted", at: now }],
      },
    ],
  },

  "bp-quoting-workflow": {
    moduleId: "bp-quoting-workflow",
    steps: [
      {
        id: "bp-quote-pending",
        title: "Move Building Products deal to Quote Pending",
        hint: "Open Mallory Interiors — Stayform partition package and move to Quote Pending.",
        path: () => "/deals/dl-bp-partition",
        done: (c) => has(c, "stage.dl-bp-partition.bp-quote-pending"),
        script: (_c, now) => [
          { t: "deal.selectPipeline", pipelineId: "building-products" },
          { t: "persona", id: "ind-rep" },
          { t: "deal.setStage", dealId: "dl-bp-partition", stage: "bp-quote-pending", at: now },
        ],
      },
      {
        id: "bp-create-quote",
        title: "Create native HubSpot quote from the deal",
        hint: "Open quote HSQ-2026-BP-112 (draft) from Revenue > Quotes or the deal Quotes card.",
        path: () => "/quotes/q-bp-partition-1",
        done: (c) => Boolean(c.w.quotes.find((q) => q.id === "q-bp-partition-1")),
        script: () => [flag("seen.quote.q-bp-partition-1")],
      },
      {
        id: "bp-publish",
        title: "Publish & send for e-signature",
        hint: "Click Publish & Send for E-Sign on the Building Products quote.",
        path: () => "/quotes/q-bp-partition-1",
        done: (c) => c.w.quotes.find((q) => q.id === "q-bp-partition-1")?.status !== "Draft",
        script: (_c, now) => [{ t: "quote.send", id: "q-bp-partition-1", at: now }],
      },
      {
        id: "bp-quoted-stage",
        title: "Confirm deal at Quoted after publish",
        hint: "Return to the deal and verify stage Quoted with quote date populated.",
        path: () => "/deals/dl-bp-partition",
        done: (c) => c.w.deals.find((d) => d.id === "dl-bp-partition")?.stage === "bp-quoted" || has(c, "quote.sent.q-bp-partition-1"),
        script: (_c, now) => [{ t: "deal.setStage", dealId: "dl-bp-partition", stage: "bp-quoted", at: now }],
      },
    ],
  },

  "frp-quoting-workflow": {
    moduleId: "frp-quoting-workflow",
    steps: [
      {
        id: "frp-rfq",
        title: "Advance FRP deal to RFQ Bidding",
        hint: "Open Coastal Utility — FRP equipment platform and move to RFQ Bidding (Prepare quote task).",
        path: () => "/deals/dl-frp-platform",
        done: (c) => has(c, "stage.dl-frp-platform.frp-rfq"),
        script: (_c, now) => [
          { t: "deal.selectPipeline", pipelineId: "frp" },
          { t: "persona", id: "inside-rep" },
          { t: "deal.setStage", dealId: "dl-frp-platform", stage: "frp-rfq", at: now },
        ],
      },
      {
        id: "frp-ingest",
        title: "Ingest fabrication workbook quote (division FRP)",
        hint: "Click Ingest Rev 1 on the Quote Ingestion card after verifying division = FRP.",
        path: () => "/deals/dl-frp-platform",
        done: (c) => has(c, "wb.dl-frp-platform.frp-wb-rev1"),
        script: (_c, now) => [{ t: "deal.ingestWorkbookQuote", dealId: "dl-frp-platform", presetId: "frp-wb-rev1", at: now }],
      },
      {
        id: "frp-stock-note",
        title: "Review stock quote path (native HubSpot + Oracle)",
        hint: "Open CRM > Deals filtered to FRP and note stock jobs can use Create quote on deal with Oracle SKUs.",
        path: () => "/deals",
        done: (c) => has(c, "frp.stock.path"),
        script: () => [{ t: "deal.selectPipeline", pipelineId: "frp" }, flag("frp.stock.path")],
      },
    ],
  },

  "ind-quoting-workflow": {
    moduleId: "ind-quoting-workflow",
    steps: [
      {
        id: "ind-quotes-pending",
        title: "Move Industrial deal to Quotes Pending on RFQ",
        hint: "Open Redstone Supply Q4 grating deal and move to Quotes Pending.",
        path: () => "/deals/dl-redstone-grating",
        done: (c) => has(c, "stage.dl-redstone-grating.ind-quotes-pending"),
        script: (_c, now) => [
          { t: "deal.selectPipeline", pipelineId: "industrials" },
          { t: "persona", id: "ind-rep" },
          { t: "deal.setStage", dealId: "dl-redstone-grating", stage: "ind-quotes-pending", at: now },
        ],
      },
      {
        id: "ind-in-progress",
        title: "Build quote at In Progress",
        hint: "Move to In Progress while adding Oracle SKU lines or requesting cost accounting for special items.",
        path: () => "/deals/dl-redstone-grating",
        done: (c) => has(c, "stage.dl-redstone-grating.ind-in-progress"),
        script: (_c, now) => [{ t: "deal.setStage", dealId: "dl-redstone-grating", stage: "ind-in-progress", at: now }],
      },
      {
        id: "ind-publish",
        title: "Publish HubSpot quote HSQ-2026-401",
        hint: "Open the draft quote and Publish & Send — deal should move to Quoted automatically in production.",
        path: () => "/quotes/q-redstone-1",
        done: (c) => c.w.quotes.find((q) => q.id === "q-redstone-1")?.status !== "Draft",
        script: (_c, now) => [{ t: "quote.send", id: "q-redstone-1", at: now }],
      },
      {
        id: "ind-quoted",
        title: "Confirm Quoted stage & Epicor read-only lookup",
        hint: "Move deal to Quoted and open Epicor Quote EQ-77419 (read-only APC reference).",
        path: () => "/epicor-quotes/eq-77419",
        done: (c) => has(c, "seen.epicor.eq-77419"),
        script: (_c, now) => [
          { t: "deal.setStage", dealId: "dl-redstone-grating", stage: "ind-quoted", at: now },
          flag("seen.epicor.eq-77419"),
        ],
      },
    ],
  },

  "perf-quoting-workflow": {
    moduleId: "perf-quoting-workflow",
    steps: [
      {
        id: "perf-filter",
        title: "Filter Perforated table by APC Division",
        hint: "CRM > Deals → Perforated pipeline → table view; filter APC Division = APC.",
        path: () => "/deals",
        done: (c) => c.w.ui["deals.pipeline"] === "apc-diamond" || has(c, "perf.table"),
        script: () => [{ t: "deal.selectPipeline", pipelineId: "apc-diamond" }, flag("perf.table")],
      },
      {
        id: "perf-quoted-deal",
        title: "Open MS Access–synced deal at Quoted",
        hint: "Open Redstone Supply — APC Perforated Coil Lot (Access quote MA-44821).",
        path: () => "/deals/dl-apc-perforated",
        done: (c) => has(c, "seen.deal.dl-apc-perforated"),
        script: () => [flag("seen.deal.dl-apc-perforated")],
      },
      {
        id: "perf-epicor",
        title: "Verify Epicor Quote EQ-77419 sync (read-only)",
        hint: "Open CRM > Epicor Quotes EQ-77419 — edit only in MS Access/Epicor.",
        path: () => "/epicor-quotes/eq-77419",
        done: (c) => has(c, "seen.epicor.eq-77419"),
        script: () => [flag("seen.epicor.eq-77419")],
      },
      {
        id: "perf-won",
        title: "Practice Epicor SO → Awarded - Won handoff",
        hint: "Note: entering sales order in Epicor moves matching deal to Awarded - Won when sync is live.",
        path: () => "/deals/dl-apc-perforated",
        done: (c) => has(c, "perf.quoting.complete"),
        script: () => [flag("perf.quoting.complete")],
      },
    ],
  },

  "sf-quoting-workflow": {
    moduleId: "sf-quoting-workflow",
    steps: [
      {
        id: "sf-rfq",
        title: "Move Security Fence deal to RFQ / Bidding",
        hint: "Open IronPeak Ashburn Campus and advance to RFQ / Bidding (3-day Prepare quote for Inside Sales).",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "stage.dl-ironpeak-perim.rfq-bidding"),
        script: (_c, now) => [
          { t: "deal.selectPipeline", pipelineId: "security-fence" },
          { t: "persona", id: "inside-rep" },
          { t: "deal.setStage", dealId: "dl-ironpeak-perim", stage: "rfq-bidding", at: now },
        ],
      },
      {
        id: "sf-ingest-rev1",
        title: "Ingest workbook Rev 1 via Quote Ingestion",
        hint: "Click Ingest Rev 1 ($468,000) on Epicor & Quote Ingestion card.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "wb.dl-ironpeak-perim.wb-rev1"),
        script: (_c, now) => [{ t: "deal.ingestWorkbookQuote", dealId: "dl-ironpeak-perim", presetId: "wb-rev1", at: now }],
      },
      {
        id: "sf-recipient",
        title: "Tag Quote Recipient on bidding contact",
        hint: "Add Quote Recipient label to Marcus Hale on the deal.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => Boolean(c.w.deals.find((d) => d.id === "dl-ironpeak-perim")?.contactLabels?.["ct-marcus-hale"]?.includes("Quote Recipient")),
        script: () => [{ t: "deal.addContactLabel", dealId: "dl-ironpeak-perim", contactId: "ct-marcus-hale", label: "Quote Recipient" }],
      },
      {
        id: "sf-rev2",
        title: "Ingest Rev 2 on the SAME deal (no duplicate)",
        hint: "Click Ingest Rev 2 ($485,000) so revision history stays on one deal.",
        path: () => "/deals/dl-ironpeak-perim",
        done: (c) => has(c, "wb.dl-ironpeak-perim.wb-rev2"),
        script: (_c, now) => [{ t: "deal.ingestWorkbookQuote", dealId: "dl-ironpeak-perim", presetId: "wb-rev2", at: now }],
      },
    ],
  },

  "mesh-quoting-workflow": {
    moduleId: "mesh-quoting-workflow",
    steps: [
      {
        id: "mesh-quote-pending",
        title: "Move Security Mesh deal to Quote Pending",
        hint: "Open Cascade Data — equipment yard mesh panels and move to Quote Pending.",
        path: () => "/deals/dl-mesh-yard",
        done: (c) => has(c, "stage.dl-mesh-yard.mesh-quote-pending"),
        script: (_c, now) => [
          { t: "deal.selectPipeline", pipelineId: "security-mesh" },
          { t: "persona", id: "ind-rep" },
          { t: "deal.setStage", dealId: "dl-mesh-yard", stage: "mesh-quote-pending", at: now },
        ],
      },
      {
        id: "mesh-open-quote",
        title: "Open draft HubSpot quote with Oracle SKUs",
        hint: "Open HSQ-2026-MESH-77 from the deal Quotes card.",
        path: () => "/quotes/q-mesh-yard-1",
        done: (c) => Boolean(c.w.quotes.find((q) => q.id === "q-mesh-yard-1")),
        script: () => [flag("seen.quote.q-mesh-yard-1")],
      },
      {
        id: "mesh-publish",
        title: "Publish & send for e-signature",
        hint: "Publish the Security Mesh quote to move the deal toward Quoted.",
        path: () => "/quotes/q-mesh-yard-1",
        done: (c) => c.w.quotes.find((q) => q.id === "q-mesh-yard-1")?.status !== "Draft",
        script: (_c, now) => [{ t: "quote.send", id: "q-mesh-yard-1", at: now }],
      },
      {
        id: "mesh-shipping",
        title: "Advance to Shipping on partial fulfillment path",
        hint: "Move deal to Shipping (80%) when product ships before final PO closeout.",
        path: () => "/deals/dl-mesh-yard",
        done: (c) => has(c, "stage.dl-mesh-yard.mesh-shipping"),
        script: (_c, now) => [{ t: "deal.setStage", dealId: "dl-mesh-yard", stage: "mesh-shipping", at: now }],
      },
    ],
  },
};