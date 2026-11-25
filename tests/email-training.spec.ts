import { expect, test } from "@playwright/test";
import { openModule, signIn, walkToCompletion } from "./helpers";

const AMICO_EMAIL_MODULES = [
  { trackId: "amico-email", moduleId: "em-sales-email-logging" },
  { trackId: "amico-email", moduleId: "em-templates-snippets" },
  { trackId: "amico-email", moduleId: "em-quote-email-followup" },
  { trackId: "amico-email", moduleId: "em-marketing-email-analytics" },
] as const;

test.describe("AMICO Email & Communications track", () => {
  test("launchpad lists Email & Communications track", async ({ page }) => {
    await signIn(page);
    await expect(page.getByTestId("track-amico-email")).toBeVisible();
    await expect(page.getByTestId("title-link-amico-email-em-sales-email-logging")).toBeVisible();
  });

  test("marketing email shell route renders AMICO campaign table", async ({ page }) => {
    await signIn(page);
    await openModule(page, "amico-email", "em-marketing-email-analytics");
    await page.goto("/learn/amico/amico-email/em-marketing-email-analytics/marketing/email");
    await expect(page.getByTestId("marketing-email-page")).toBeVisible();
    await expect(page.getByTestId("marketing-tab-sent")).toBeVisible();
    await expect(page.getByTestId("marketing-email-row-mkt-industrials-q4")).toBeVisible();
  });

  test("CRM email composer exposes HubSpot sales email controls", async ({ page }) => {
    await signIn(page);
    await page.goto("/learn/amico/amico-email/em-sales-email-logging/deals/dl-redstone-grating");
    await page.getByTestId("quick-action-email").click();
    await expect(page.getByTestId("floating-composer")).toBeVisible();
    await expect(page.getByTestId("email-from-field")).toBeVisible();
    await expect(page.getByTestId("outlook-connected-badge")).toBeVisible();
    await expect(page.getByTestId("email-template-picker")).toBeVisible();
    await expect(page.getByTestId("email-snippet-picker")).toBeVisible();
    await expect(page.getByTestId("email-track-opens")).toBeVisible();
    await expect(page.getByTestId("email-assoc-contact")).toBeVisible();
    await expect(page.getByTestId("email-send-submit")).toBeVisible();
  });

  for (const { trackId, moduleId } of AMICO_EMAIL_MODULES) {
    test(`module ${moduleId} walks to completion`, async ({ page }) => {
      await signIn(page);
      await openModule(page, trackId, moduleId);
      await walkToCompletion(page);
      await expect(page.getByTestId("training-step-count")).toHaveText("Completed");
      await page.getByTestId("training-finish-review").click();
      await expect(page.getByTestId("completion-card")).toBeVisible();
    });
  }
});