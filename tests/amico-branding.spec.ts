import { expect, test, type Locator } from "@playwright/test";
import { isLocal, signIn } from "./helpers";

async function expectLoadedImage(locator: Locator, expectedSrc: string) {
  await expect(locator).toBeVisible();
  await expect(locator).toHaveAttribute("src", expectedSrc);
  const loaded = await locator.evaluate((el) => {
    if (!(el instanceof HTMLImageElement)) return { ok: false, width: 0, height: 0 };
    return { ok: el.complete && el.naturalWidth > 0 && el.naturalHeight > 0, width: el.naturalWidth, height: el.naturalHeight };
  });
  expect(loaded.ok).toBe(true);
}

test("official AMICO brand SVG assets are served cleanly from /brands/amico/*", async ({ request }) => {
  for (const asset of [
    "/brands/amico/amico-logo.svg",
    "/brands/amico/amico-logo-white.svg",
    "/brands/amico/amico-mark.svg",
  ]) {
    const res = await request.get(asset);
    expect(res.status(), `Expected 200 for ${asset}`).toBe(200);
    expect(res.headers()["content-type"]).toContain("svg");
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("<path");
    expect(body).toContain("#E25027");
  }
});

test("/login and /invite/[token] display the official AMICO logo lockup with Penguin co-branding", async ({ page, browser }) => {
  await page.goto("/login");
  await expectLoadedImage(page.getByTestId("auth-tenant-logo"), "/brands/amico/amico-logo.svg");
  await expect(page.getByTestId("auth-cobranding")).toContainText("HubSpot Training Portal");
  await expect(page.getByTestId("auth-cobranding")).toContainText("Powered by");

  // Invalid invite token still renders branded AMICO portal lockup cleanly
  await page.goto("/invite/non-existent-preview-token");
  await expectLoadedImage(page.getByTestId("auth-tenant-logo"), "/brands/amico/amico-logo.svg");

  if (isLocal) {
    const inviteEmail = `amico-brand-invite-${Date.now()}@amico-test.example`;
    await signIn(page);
    await page.goto("/admin");
    await page.getByTestId("invite-emails-input").fill(inviteEmail);
    await page.getByTestId("invite-submit-btn").click();
    const inviteHref = (await page.getByTestId(`invite-link-${inviteEmail}`).textContent())?.trim();
    expect(inviteHref).toContain("/invite/");

    const inviteCtx = await browser.newContext();
    const invitePage = await inviteCtx.newPage();
    await invitePage.goto(inviteHref!);
    await expectLoadedImage(invitePage.getByTestId("auth-tenant-logo"), "/brands/amico/amico-logo.svg");
    await expect(invitePage.getByText("You have been invited to the AMICO HubSpot Training Portal.")).toBeVisible();
    await inviteCtx.close();

    // Clean up invited user
    page.once("dialog", (d) => d.accept());
    await page.getByTestId(`user-row-${inviteEmail}`).getByRole("button", { name: "Remove" }).click();
    await expect(page.getByTestId(`user-row-${inviteEmail}`)).toHaveCount(0);
  }
});

test("/launchpad, /account, and /admin surfaces render AMICO logo & mark badges with non-AMICO monogram fallback", async ({ page }) => {
  await signIn(page);

  // 1. Launchpad top bar + hero header
  await page.goto("/launchpad");
  await expectLoadedImage(page.getByTestId("launchpad-tenant-logo"), "/brands/amico/amico-logo.svg");
  await expectLoadedImage(page.getByTestId("launchpad-hero-mark"), "/brands/amico/amico-mark.svg");
  await expect(page.getByTestId("progress-banner")).toContainText("Alabama Metal Industries Corporation");

  // 2. Account top bar returning to Launchpad
  await page.goto("/account");
  await expectLoadedImage(page.getByTestId("account-tenant-logo"), "/brands/amico/amico-logo.svg");
  await page.getByTestId("account-back-launchpad").click();
  await expect(page).toHaveURL(/\/launchpad/);

  // 3. Admin layout + users + progress + tenants
  await page.goto("/admin");
  await expectLoadedImage(page.getByTestId("admin-header-tenant-logo"), "/brands/amico/amico-logo.svg");
  await expectLoadedImage(page.getByTestId("admin-users-tenant-mark"), "/brands/amico/amico-mark.svg");

  await page.goto("/admin/progress");
  await expectLoadedImage(page.getByTestId("admin-header-tenant-logo"), "/brands/amico/amico-logo.svg");
  await expectLoadedImage(page.getByTestId("admin-progress-tenant-mark"), "/brands/amico/amico-mark.svg");

  await page.goto("/admin/tenants");
  await expectLoadedImage(page.getByTestId("tenant-badge-amico"), "/brands/amico/amico-mark.svg");

  if (isLocal) {
    const fallbackSlug = `monogram-check-${Date.now()}`;
    await page.getByTestId("tenant-slug-input").fill(fallbackSlug);
    await page.getByTestId("tenant-name-input").fill("Summit Steelworks");
    await page.getByTestId("create-tenant-btn").click();

    const fallbackBadge = page.getByTestId(`tenant-badge-${fallbackSlug}`);
    await expect(fallbackBadge).toBeVisible();
    await expect(fallbackBadge).toHaveText("SS");
  }
});
