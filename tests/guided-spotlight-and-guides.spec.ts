import { expect, test } from "@playwright/test";
import { openModule, signIn, walkToCompletion } from "./helpers";

test("guided spotlight ring and coach card render on module load", async ({ page }) => {
  await signIn(page);
  await openModule(page, "amico-hubspot-101", "orientation-navigation");
  await expect(page.getByTestId("spotlight-overlay")).toBeVisible();
  await expect(page.getByTestId("training-show-me")).toHaveClass(/tour-spotlight-target/);
  await expect(page.getByTestId("spotlight-coach-card")).toBeVisible();
  await expect(page.getByTestId("training-step-pill-1")).toBeVisible();
});

test("numbered Penguin Ext badges appear on cross-division module", async ({ page }) => {
  await signIn(page);
  await openModule(page, "amico-hubspot-101", "cross-division-accounts");
  await page.getByTestId("training-highlight").click();
  const badges = page.locator("[data-testid^='ext-pin-badge-']");
  await expect(badges.first()).toBeVisible();
  await expect(badges.filter({ hasText: "1" })).toHaveCount(1);
  await expect(badges.filter({ hasText: "2" })).toHaveCount(1);
});

test("universal Guide drawer on 101-M3, email, security fence, and quoting", async ({ page }) => {
  await signIn(page);
  const cases = [
    { trackId: "amico-hubspot-101", moduleId: "working-deals-logging" },
    { trackId: "amico-email", moduleId: "em-sales-email-logging" },
    { trackId: "amico-security-fence", moduleId: "sf-lead-to-deal" },
    { trackId: "amico-quoting-industrial", moduleId: "ind-quoting-workflow" },
  ] as const;
  for (const { trackId, moduleId } of cases) {
    await openModule(page, trackId, moduleId);
    await page.getByTestId("training-guide-open").click();
    await expect(page.getByTestId("reference-guide-drawer")).toBeVisible();
    await expect(page.getByTestId("reference-checklist")).toBeVisible();
    await page.getByTestId("reference-guide-close").click();
  }
});

test("Breeze Assistant panel, preferences modal, and 101-M6 walkthrough", async ({ page }) => {
  await signIn(page);
  await openModule(page, "amico-hubspot-101", "preferences-breeze-help");
  await page.getByTestId("breeze-copilot-btn").click();
  await expect(page.getByTestId("breeze-copilot-panel")).toBeVisible();
  await page.getByTestId("breeze-suggest-0").click();
  await expect(page.getByTestId("breeze-reply")).toBeVisible();
  await page.getByTestId("breeze-panel-close").click();

  await page.getByTestId("settings-gear").click();
  await expect(page.getByTestId("preferences-modal")).toBeVisible();
  await page.getByTestId("preferences-modal-close").click();

  await walkToCompletion(page);
  await expect(page.getByTestId("training-step-count")).toHaveText("Completed");
});

test("EN | FR (CA) locale toggle on HUD and Launchpad", async ({ page }) => {
  await signIn(page);
  await openModule(page, "amico-hubspot-101", "orientation-navigation");
  await page.getByTestId("locale-fr-ca").click();
  await expect(page.getByTestId("training-step-count")).toContainText("Tâche");
  await expect(page.getByTestId("training-show-me")).toContainText("Montrez-moi");
  await page.goto("/launchpad");
  await page.getByTestId("locale-en").click();
  await expect(page.getByTestId("locale-en")).toHaveAttribute("aria-pressed", "true");
});