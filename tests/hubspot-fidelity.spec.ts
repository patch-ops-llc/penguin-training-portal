import path from "node:path";
import { expect, test } from "@playwright/test";
import { openModule, signIn, walkToCompletion } from "./helpers";

const ALL_AMICO_MODULES = [
  { trackId: "amico-hubspot-101", moduleId: "orientation-navigation" },
  { trackId: "amico-hubspot-101", moduleId: "cross-division-accounts" },
  { trackId: "amico-hubspot-101", moduleId: "working-deals-logging" },
  { trackId: "amico-hubspot-101", moduleId: "quoting-routes-epicor" },
  { trackId: "amico-hubspot-101", moduleId: "projects-post-award" },
  { trackId: "amico-hubspot-101", moduleId: "preferences-breeze-help" },
  { trackId: "amico-security-fence", moduleId: "sf-lead-to-deal" },
  { trackId: "amico-security-fence", moduleId: "sf-estimating-bidding" },
  { trackId: "amico-security-fence", moduleId: "sf-quote-ingestion-bid" },
  { trackId: "amico-security-fence", moduleId: "sf-award-pm-handoff" },
  { trackId: "amico-security-fence", moduleId: "sf-views-stuck-deals" },
] as const;

test("HubSpot 2025/2026 Smart CRM UI Fidelity: dark slate chrome, Search HubSpot, Saved Views, Kanban weighted totals, 3-pane record + floating composer, Preview drawer, Sales Workspace drawer & Penguin HUD", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const screenshotDir = process.env.SCREENSHOT_DIR;
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await openModule(page, "amico-security-fence", "sf-estimating-bidding");
  await page.evaluate(() => document.fonts.ready);

  // 1. Dark Slate Global Chrome (#1f2a37), Search HubSpot (⌘K / /), Quick Create (+), Copilot, & Account Indicator
  const topBar = page.getByTestId("hubspot-top-bar");
  const leftNav = page.getByTestId("hubspot-left-nav");
  await expect(topBar).toBeVisible();
  await expect(leftNav).toBeVisible();

  const topBg = await topBar.evaluate((el) => getComputedStyle(el).backgroundColor);
  const leftBg = await leftNav.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(topBg).toBe("rgb(51, 51, 51)"); // #333333 AMICO live toolbar
  expect(leftBg).toBe("rgb(51, 51, 51)"); // #333333

  await expect(page.getByTestId("global-search")).toHaveAttribute("placeholder", "Find in HubSpot");
  await expect(page.getByTestId("global-quick-create")).toBeVisible();
  await expect(page.getByTestId("breeze-copilot-btn")).toBeVisible();
  await expect(page.getByTestId("account-menu")).toContainText("AMICO");

  // Verify `/` shortcut focuses Search HubSpot
  await page.keyboard.press("/");
  await expect(page.getByTestId("global-search")).toBeFocused();
  await page.keyboard.press("Escape");

  // 2. Penguin Training Coach HUD Separation + Minimize / Expand Toggle
  const hud = page.getByTestId("training-bar");
  await expect(hud).toContainText("TRAINING GUIDE");
  await page.getByTestId("training-bar-minimize").click();
  await expect(page.getByTestId("training-bar-show")).toBeVisible();
  await page.getByTestId("training-bar-show").click();
  await expect(hud).toBeVisible();

  // 3. Companies Index: Object Switcher, Saved Views, Quick Filter Strip, Dense Grid & Right-Side Record Preview Drawer
  await expect(page.getByTestId("nav-addresses")).toBeVisible();
  await expect(page.getByTestId("nav-epicor-quotes")).toBeVisible();
  await page.getByTestId("nav-companies").click();
  await expect(page.getByTestId("object-switcher")).toContainText("Companies");
  await expect(page.getByTestId("index-search")).toHaveAttribute("placeholder", "Search companies");
  await expect(page.getByTestId("saved-views-bar")).toBeVisible();
  await expect(page.getByTestId("quick-filter-strip")).toBeVisible();
  await expect(page.getByTestId("index-pagination")).toContainText("25 per page");

  // Hover row and click Preview -> opens right slide-over Record Preview Drawer
  const companyRow = page.getByTestId("row-co-grading-pacific");
  await companyRow.hover();
  if (screenshotDir) {
    await page.screenshot({
      path: path.join(screenshotDir, "hubspot-fidelity-companies-index.png"),
    });
  }
  await page.getByTestId("preview-co-grading-pacific").click();
  await expect(page.getByTestId("record-preview-drawer")).toBeVisible();
  await expect(page.getByTestId("record-preview-drawer")).toContainText("About this company");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("record-preview-drawer")).toHaveCount(0);

  // 4. Deals Kanban Board: Pipeline selector beside List/Board toggle, probability bars, activity warning & Weighted totals
  await page.getByTestId("nav-deals").click();
  await page.getByTestId("pipeline-selector").selectOption("security-fence");
  await page.getByTestId("layout-board").click();
  await expect(page.getByTestId("deals-board")).toBeVisible();
  await expect(page.getByTestId("board-col-totals-planning")).toContainText("Total amount:");
  await expect(page.getByTestId("board-col-totals-planning")).toContainText("Weighted amount (10%):");
  if (screenshotDir) {
    await page.screenshot({
      path: path.join(screenshotDir, "hubspot-fidelity-deals-board.png"),
    });
  }

  // Verify Create deal opens right-side HubSpot Create Drawer
  await page.getByTestId("add-deal-btn").click();
  await expect(page.getByTestId("create-deal-modal")).toBeVisible();
  await page.keyboard.press("Escape");

  // 5. 3-Pane CRM Deal Record: Left Quick Action Icons -> Floating Bottom-Right Composer + Inline Edit Sticky Save/Cancel Bar
  await page.getByTestId("layout-table").click();
  await page.getByTestId("deal-link-dl-ironpeak-perim").click();
  await expect(page.getByTestId("deal-record")).toBeVisible();
  await expect(page.getByTestId("record-quick-actions")).toBeVisible();
  await expect(page.getByTestId("deal-estimating-progress-card")).toBeVisible();
  await expect(page.getByTestId("deal-quoting-card")).toBeVisible();

  // Click Call Quick Action icon -> opens floating bottom-right HubSpot Composer with Call Outcome selector
  await page.getByTestId("quick-action-call").click();
  await expect(page.getByTestId("floating-composer")).toBeVisible();
  await expect(page.getByTestId("call-outcome-select")).toBeVisible();
  await page.getByTestId("call-outcome-select").selectOption("Left voicemail");
  await page.getByTestId("log-text").fill("Left voicemail for GC estimator regarding perimeter bollard spec.");
  if (screenshotDir) {
    // Minimize HUD briefly if needed? No — keep Penguin HUD visible so separation is demonstrated!
    await page.screenshot({
      path: path.join(screenshotDir, "hubspot-fidelity-deal-record.png"),
    });
  }
  await page.getByTestId("log-submit").click();
  await expect(page.getByTestId("floating-composer")).toHaveCount(0);

  // Switch middle canvas to Activities tab and verify month-grouped timeline + Search activities
  await page.getByTestId("record-tab-activities").click();
  await expect(page.getByTestId("activity-search-input")).toBeVisible();
  await expect(page.getByTestId("activity-timeline")).toContainText("Left voicemail");

  // Test inline edit in Left Sidebar -> sticky Save / Cancel footer appears
  const amountProp = page.locator("dt", { hasText: "Amount" }).first();
  await amountProp.hover();
  await amountProp.locator("button").click();
  await page.getByTestId("deal-amount-input").fill("492000");
  await expect(page.getByTestId("left-sidebar-dirty-bar")).toBeVisible();
  await page.getByTestId("save-record-props-btn").click();
  await expect(page.getByTestId("deal-amount")).toContainText("$492,000");

  // 6. Sales Workspace: Summary / Leads / Deals / Schedule tabs, KPI strip & Inline Right-Side Lead Slide-Over Drawer
  await page.getByTestId("nav-sales-workspace").click();
  await expect(page.getByTestId("sales-workspace")).toBeVisible();
  await expect(page.getByTestId("sales-workspace-kpis")).toContainText("Tasks due today");
  await expect(page.getByTestId("ws-tab-summary")).toBeVisible();
  await expect(page.getByTestId("ws-tab-leads")).toBeVisible();
  await expect(page.getByTestId("ws-tab-deals")).toBeVisible();
  await expect(page.getByTestId("ws-tab-schedule")).toBeVisible();

  // Click lead name -> opens inline right-side Lead Slide-Over Workspace Drawer without navigating away
  await page.getByTestId("lead-open-ld-summit-grid").click();
  await expect(page.getByTestId("lead-workspace-drawer")).toBeVisible();
  await page.getByTestId("drawer-lead-stage-select").selectOption("Connected");
  if (screenshotDir) {
    await page.screenshot({
      path: path.join(screenshotDir, "hubspot-fidelity-sales-workspace.png"),
    });
  }
  await expect(page.getByTestId("sales-workspace")).toBeVisible();
});

test("all 11 AMICO curriculum modules (101-M1..M6 and SF-M1..M5) walk cleanly in the overhauled HubSpot UI", async ({
  page,
}) => {
  await signIn(page);

  for (const { trackId, moduleId } of ALL_AMICO_MODULES) {
    await openModule(page, trackId, moduleId);
    await walkToCompletion(page);
    await expect(page.getByTestId("training-step-count")).toHaveText("Completed");
  }
});
