import { expect, test } from "@playwright/test";
import { openModule, signIn } from "./helpers";

test("AMICO HubSpot shell: CRM nav, Profile, Global Search, Duplicate Contact, Multi-Division Companies, and Coaching H-key", async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page);
  await openModule(page, "amico-hubspot-101", "orientation-navigation");

  // 1. Left CRM navigation exposes all 8 AMICO CRM objects + Revenue + Automation
  for (const id of [
    "nav-contacts",
    "nav-companies",
    "nav-deals",
    "nav-projects",
    "nav-epicor-quotes",
    "nav-segments",
    "nav-tasks",
    "nav-leads",
    "nav-quotes",
    "nav-products",
    "nav-workflows",
  ]) {
    await expect(page.getByTestId(id)).toBeVisible();
  }

  // 2. Profile & Preferences via top-right avatar menu (organically completes Task 1 of 6!)
  await expect(page.getByTestId("training-step-count")).toContainText("Task 1 of 6");
  await page.getByTestId("account-menu").click();
  await page.getByTestId("menu-profile-prefs").click();
  await expect(page.getByTestId("profile-page")).toBeVisible();
  await page.getByTestId("save-profile-btn").click();
  await expect(page.getByTestId("training-step-count")).toContainText("Task 2 of 6");

  // 3. Global search finds migrated Grading Pacific record (organically completes Task 2 of 6!)
  const search = page.getByTestId("global-search");
  await search.fill("Grading Pacific");
  await expect(page.getByTestId("search-results")).toBeVisible();
  await page.getByTestId("search-hit-co-grading-pacific").click();
  await expect(page.getByTestId("training-step-count")).toContainText("Task 3 of 6");

  // 4. Multi-division Company record: Parent/Child hierarchy + Cross-Division Summary + division edit-lock
  await expect(page.getByTestId("company-record")).toBeVisible();
  await expect(page.getByTestId("cross-division-card")).toBeVisible();
  await expect(page.getByTestId("related-companies-card")).toBeVisible();
  await expect(page.getByTestId("child-company-link-co-grading-pacific-phx")).toBeVisible();

  // Switch role to Jordan Vance (Outside Sales, Security Fence) -> Grading Pacific (Industrials primary) shows edit-lock banner
  await page.getByTestId("view-as").click();
  await page.getByTestId("view-as-outside-rep").click();
  await expect(page.getByTestId("company-edit-locked-banner")).toBeVisible();

  // Duplicate Company governance: Flag duplicate to NSM / Penguin
  await page.getByTestId("nav-companies").click();
  await page.getByTestId("company-link-co-grading-pacific-dup").click();
  await expect(page.getByTestId("suspected-duplicate-banner")).toBeVisible();
  await page.getByTestId("flag-duplicate-btn").click();
  await expect(page.getByText(/Escalated to NSM/i).first()).toBeVisible();

  // 5. Duplicate Contact email enforcement on CRM > Contacts (organically completes Task 3 of 6!)
  await page.getByTestId("nav-contacts").click();
  await page.getByTestId("add-contact-btn").click();
  await expect(page.getByTestId("create-contact-modal")).toBeVisible();
  await page.getByTestId("contact-email-input").fill("elena.rostova@gradingpacific.example");
  await expect(page.getByTestId("duplicate-email-banner")).toBeVisible();
  await expect(page.getByTestId("create-contact-submit")).toBeDisabled();
  await page.click("button:has-text('Cancel')");
  await expect(page.getByTestId("training-step-count")).toContainText("Task 4 of 6");

  // 6. Navigate to Deals and press H key to toggle AMICO Rule & Penguin Coaching callout pins
  await page.getByTestId("nav-deals").click();
  await page.keyboard.press("h");
  await expect(page.locator("[data-testid^='ext-pin-']").first()).toBeVisible();
});

test("AMICO Deals pipelines, Stage Gate modals, Multi-Owner, Workbook Quote, Epicor Quotes, Projects sync, Task Queues, Segments & Leads", async ({ page }) => {
  await signIn(page);
  await openModule(page, "amico-security-fence", "sf-estimating-bidding");

  // 1. Multi-pipeline Deals selector (all 8 AMICO pipelines + Global Read-Only Rollup + All Division Pipelines = 10 options)
  await page.getByTestId("nav-deals").click();
  const pipeSelect = page.getByTestId("pipeline-selector");
  await expect(pipeSelect.locator("option")).toHaveCount(10);

  await pipeSelect.selectOption("global");
  await expect(page.getByText("Global Shadow Pipeline · Read-Only Executive Rollup")).toBeVisible();
  await expect(page.getByTestId("add-deal-btn")).toBeDisabled();

  // Open Global Shadow Deal to verify read-only deal banner
  await page.getByTestId("deal-link-dl-global-ironpeak").click();
  await expect(page.getByTestId("global-readonly-banner")).toBeVisible();

  // Switch back to Security Fence pipeline, Board view, and + Add view
  await page.getByTestId("nav-deals").click();
  await page.getByTestId("pipeline-selector").selectOption("security-fence");
  await page.getByTestId("layout-board").click();
  await expect(page.getByTestId("deals-board")).toBeVisible();

  await page.getByTestId("add-view-btn").click();
  await expect(page.getByTestId("create-view-modal")).toBeVisible();
  await page.getByTestId("view-name-input").fill("Fence bids due this month");
  await page.getByTestId("save-view-btn").click();
  await expect(page.locator("button", { hasText: "Fence bids due this month" })).toBeVisible();

  // 2. IronPeak Deal Record: Multi-owner, Association Role Labels, Stage Gate Modals, Workbook Quote, Awarded -> Project
  await page.getByTestId("layout-table").click();
  await page.getByTestId("deal-link-dl-ironpeak-perim").click();
  await expect(page.getByTestId("deal-owners-card")).toBeVisible();
  await expect(page.getByTestId("deal-companies-card")).toContainText("General Contractor");
  await expect(page.getByTestId("deal-companies-card")).toContainText("A/E Firm");

  // Stage Gate 1: Design (Project Specification) -> Drawings Received prompt
  await page.getByTestId("deal-stage-design").click();
  await expect(page.getByTestId("stage-prompt-modal")).toBeVisible();
  await page.getByTestId("prompt-drawings-select").selectOption("In Progress");
  await page.getByTestId("stage-prompt-save").click();
  await expect(page.getByTestId("stage-prompt-modal")).toHaveCount(0);

  // Stage Gate 2: Engineering -> Engineering Required prompt -> auto-creates Engineering review task for Estimator
  await page.getByTestId("deal-stage-engineering").click();
  await expect(page.getByTestId("stage-prompt-modal")).toBeVisible();
  await page.getByTestId("prompt-engineering-select").selectOption("In-house");
  await page.getByTestId("stage-prompt-save").click();
  await expect(page.getByTestId("deal-open-tasks-card")).toContainText(/Engineering review/i);

  // Pricing Workbook Ingestion (Rev 1 -> $468,000, Rev 2 -> $485,000 on same Deal)
  await page.getByTestId("ingest-wb-wb-rev1").click();
  await expect(page.getByTestId("deal-amount")).toContainText("$468,000");
  await page.getByTestId("ingest-wb-wb-rev2").click();
  await expect(page.getByTestId("deal-amount")).toContainText("$485,000");

  // Stage Gate 3: Closed - Lost requires Lost Reason (Save disabled until required * field is filled)
  await page.getByTestId("deal-stage-closed-lost").click();
  await expect(page.getByTestId("stage-prompt-modal")).toBeVisible();
  await expect(page.getByTestId("stage-prompt-save")).toBeDisabled();
  await expect(page.getByTestId("stage-prompt-modal").getByRole("alert")).toContainText(/Lost Reason is required/i);
  await page.click("button:has-text('Cancel')");

  // Stage Gate 4: Awarded requires Customer PO # + Project / Handoff Required and auto-creates a Project
  await page.getByTestId("deal-stage-awarded").click();
  await expect(page.getByTestId("stage-prompt-modal")).toBeVisible();
  await page.getByTestId("prompt-handoff-select").selectOption("Yes");
  await page.getByTestId("prompt-customer-po").fill("PO-VCC-44910");
  await page.getByTestId("stage-prompt-save").click();
  await expect(page.getByTestId("deal-projects-card")).toBeVisible();

  // 3. Epicor Quotes read-only custom object + Native HubSpot Quote E-Sign
  await page.getByTestId("nav-epicor-quotes").click();
  await page.getByTestId("epicor-quote-link-eq-77419").click();
  await expect(page.getByTestId("epicor-quote-record")).toBeVisible();
  await expect(page.getByTestId("epicor-readonly-banner")).toBeVisible();

  await page.getByTestId("nav-quotes").click();
  await page.getByTestId("quote-link-q-redstone-1").click();
  await expect(page.getByTestId("native-quote-page")).toBeVisible();
  await page.getByTestId("quote-send-btn").click();
  await page.getByTestId("quote-accept-btn").click();
  await expect(page.getByText("Accepted").first()).toBeVisible();

  // 4. CRM > Projects: Sales Rep view-only vs Project Manager edit + automatic Deal delivery stage sync
  await page.getByTestId("nav-projects").click();
  await page.getByTestId("project-pipeline-select").selectOption("delivery-board");
  await page.getByTestId("projects-layout-board").click();
  await expect(page.getByTestId("projects-board")).toBeVisible();
  await page.getByTestId("projects-layout-table").click();
  await page.getByTestId("project-pipeline-select").selectOption("project-pipeline");
  await page.getByTestId("project-link-prj-204").click();

  // Sales Rep sees view-only banner on Project
  await expect(page.getByTestId("project-rep-readonly-banner")).toBeVisible();
  await expect(page.getByTestId("project-task-pt-204-3")).toBeDisabled();

  // Switch to Marcus Alvarez (Project Manager, Security) via View as
  await page.getByTestId("view-as").click();
  await page.getByTestId("view-as-pm-security").click();
  await expect(page.getByTestId("project-rep-readonly-banner")).toHaveCount(0);

  // Check off Project Plan task, set status On Track, switch to Delivery Board, and advance to In Production
  await page.getByTestId("project-task-pt-204-3").check();
  await page.getByTestId("project-status-btn-on-track").click();
  await page.getByTestId("project-record-pipeline-select").selectOption("delivery-board");
  await page.getByTestId("project-stage-in-production").click();
  await expect(page.getByTestId("project-synced-deal-stage")).toContainText(/in-production|In Production/i);

  // 5. Shared Task Queues, Segments (Lists), Workflows, and Leads Qualification
  await page.getByTestId("nav-tasks").click();
  await page.getByTestId("view-tab-Prepare quotes").click();
  await page.getByTestId("view-tab-Quote follow-ups").click();
  await page.getByTestId("view-tab-Stuck deal").click();
  await page.getByTestId("view-tab-Estimating").click();

  await page.getByTestId("nav-segments").click();
  await page.locator("[data-testid^='segment-link-']").first().click();
  await expect(page.getByTestId("segment-record")).toBeVisible();

  await page.getByTestId("nav-workflows").click();
  await page.getByTestId("workflow-link-wf-sf-stage-tasks").click();
  await expect(page.getByTestId("workflow-page")).toBeVisible();

  await page.getByTestId("nav-leads").click();
  await page.getByTestId("qualify-lead-ld-summit-grid").click();
  await expect(page.getByTestId("qualify-lead-modal")).toBeVisible();
  await page.getByTestId("confirm-qualify-btn").click();
  await expect(page.getByTestId("deal-record")).toBeVisible();
});
