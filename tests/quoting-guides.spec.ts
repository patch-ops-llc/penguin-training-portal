import { expect, test } from "@playwright/test";
import { openModule, signIn, walkToCompletion } from "./helpers";

const QUOTING_TRACKS = [
  { trackId: "amico-quoting-amf", moduleId: "amf-quoting-workflow", divisionTestId: "quoting-division-amf" },
  { trackId: "amico-quoting-architecture", moduleId: "arch-quoting-workflow", divisionTestId: "quoting-division-architecture" },
  { trackId: "amico-quoting-building-products", moduleId: "bp-quoting-workflow", divisionTestId: "quoting-division-building-products" },
  { trackId: "amico-quoting-frp", moduleId: "frp-quoting-workflow", divisionTestId: "quoting-division-frp" },
  { trackId: "amico-quoting-industrial", moduleId: "ind-quoting-workflow", divisionTestId: "quoting-division-industrials" },
  { trackId: "amico-quoting-perforated", moduleId: "perf-quoting-workflow", divisionTestId: "quoting-division-apc-and-diamond" },
  { trackId: "amico-quoting-security-fence", moduleId: "sf-quoting-workflow", divisionTestId: "quoting-division-security-fence" },
  { trackId: "amico-quoting-security-mesh", moduleId: "mesh-quoting-workflow", divisionTestId: "quoting-division-security-mesh" },
] as const;

test("Launchpad division quoting filters render eight tracks", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("track-category-division-quoting").click();
  await expect(page.getByTestId("track-amico-quoting-amf")).toBeVisible();
  await expect(page.getByTestId("track-amico-quoting-security-mesh")).toBeVisible();

  await page.getByTestId("quoting-division-frp").click();
  await expect(page.getByTestId("track-amico-quoting-frp")).toBeVisible();
  await expect(page.getByTestId("track-amico-quoting-amf")).not.toBeVisible();
});

test("Quoting guide reference drawer opens on division quoting modules", async ({ page }) => {
  await signIn(page);
  await openModule(page, "amico-quoting-industrial", "ind-quoting-workflow");
  await page.getByTestId("training-guide-open").click();
  await expect(page.getByTestId("reference-guide-drawer")).toBeVisible();
  await expect(page.getByTestId("reference-checklist")).toBeVisible();
  await page.getByTestId("reference-guide-close").click();
  await expect(page.getByTestId("reference-guide-drawer")).not.toBeVisible();
});

test("all eight division quoting tracks complete interactively", async ({ page }) => {
  await signIn(page);
  for (const { trackId, moduleId } of QUOTING_TRACKS) {
    await openModule(page, trackId, moduleId);
    await walkToCompletion(page);
    await expect(page.getByTestId("training-step-count")).toHaveText("Completed");
    await page.getByTestId("training-finish-review").click();
    await expect(page.getByTestId("completion-card")).toBeVisible();
  }
});