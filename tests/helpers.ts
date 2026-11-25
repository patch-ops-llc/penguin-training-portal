import { expect, type Page } from "@playwright/test";

export const isLocal = /localhost|127\.0\.0\.1/.test(process.env.E2E_BASE_URL ?? "http://localhost:3000");

export function credentials() {
  const email = process.env.E2E_EMAIL ?? "admin@penguinstrategies.example";
  const password = process.env.E2E_PASSWORD ?? "penguin-admin-password-1";
  return { email, password };
}

export async function signIn(page: Page, who = credentials()) {
  await page.goto("/login");
  await page.fill("input[name=email]", who.email);
  await page.fill("input[name=password]", who.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/launchpad");
}

export async function openModule(page: Page, trackId: string, moduleId: string, tenantSlug = "amico") {
  await page.goto(`/learn/${tenantSlug}/${trackId}/${moduleId}?fresh=1`);
  await expect(page.getByTestId("training-bar")).toBeVisible();
}

export async function walkToCompletion(page: Page): Promise<number> {
  let steps = 0;
  // Allow initial mount useSeen effects to settle
  await page.waitForTimeout(50);
  const isDone = (text: string | null) => text === "Completed" || text === "Terminé";
  while (!isDone(await page.getByTestId("training-step-count").textContent())) {
    const before = await page.getByTestId("training-step-count").textContent();
    try {
      await page.getByTestId("training-show-me").click({ timeout: 1500 });
    } catch {
      // Step auto-completed via organic useSeen effect
    }
    await expect(page.getByTestId("training-step-count")).not.toHaveText(before ?? "");
    await page.waitForTimeout(50);
    steps += 1;
    if (steps > 20) throw new Error("Module did not reach Completed within 20 steps.");
  }
  return steps;
}
