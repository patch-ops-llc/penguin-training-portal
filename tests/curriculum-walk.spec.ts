import { expect, test } from "@playwright/test";
import { openModule, signIn, walkToCompletion } from "./helpers";

const ALL_AMICO_MODULES = [
  { trackId: "amico-hubspot-101", moduleId: "orientation-navigation" },
  { trackId: "amico-hubspot-101", moduleId: "cross-division-accounts" },
  { trackId: "amico-hubspot-101", moduleId: "working-deals-logging" },
  { trackId: "amico-hubspot-101", moduleId: "quoting-routes-epicor" },
  { trackId: "amico-hubspot-101", moduleId: "projects-post-award" },
  { trackId: "amico-security-fence", moduleId: "sf-lead-to-deal" },
  { trackId: "amico-security-fence", moduleId: "sf-estimating-bidding" },
  { trackId: "amico-security-fence", moduleId: "sf-quote-ingestion-bid" },
  { trackId: "amico-security-fence", moduleId: "sf-award-pm-handoff" },
  { trackId: "amico-security-fence", moduleId: "sf-views-stuck-deals" },
  { trackId: "amico-email", moduleId: "em-sales-email-logging" },
  { trackId: "amico-email", moduleId: "em-templates-snippets" },
  { trackId: "amico-email", moduleId: "em-quote-email-followup" },
  { trackId: "amico-email", moduleId: "em-marketing-email-analytics" },
] as const;

test("every AMICO HubSpot 101 and Security Fence module walks cleanly to completion", async ({ page }) => {
  await signIn(page);

  for (const { trackId, moduleId } of ALL_AMICO_MODULES) {
    await openModule(page, trackId, moduleId);
    await walkToCompletion(page);

    await expect(page.getByTestId("training-step-count")).toHaveText("Completed");
    await page.getByTestId("training-finish-review").click();
    await expect(page.getByTestId("completion-card")).toBeVisible();
    await expect(page.getByTestId("completion-dos")).toBeVisible();
    await expect(page.getByTestId("completion-donts")).toBeVisible();
  }
});
