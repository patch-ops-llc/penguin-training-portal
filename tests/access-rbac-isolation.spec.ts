import { expect, test } from "@playwright/test";
import { credentials, isLocal, signIn, walkToCompletion } from "./helpers";

test("signed-out visitors are redirected to /login and APIs return 401", async ({ page, request }) => {
  await page.goto("/launchpad");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/learn/amico/amico-hubspot-101/orientation-navigation");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);

  const packRes = await request.get("/api/packs/any/amico/amico-hubspot-101");
  expect(packRes.status()).toBe(401);

  const eventsRes = await request.post("/api/events", {
    data: { events: [{ kind: "launchpad_opened", tenantSlug: "amico" }] },
  });
  expect(eventsRes.status()).toBe(401);
});

test("sign-in page displays official AMICO logo lockup with Penguin Strategies co-branding", async ({ page }) => {
  await page.goto("/login");
  const amicoLogo = page.getByTestId("auth-tenant-logo");
  await expect(amicoLogo).toBeVisible();
  await expect(amicoLogo).toHaveAttribute("src", "/brands/amico/amico-logo.svg");
  await expect(page.getByTestId("auth-cobranding")).toContainText("HubSpot Training Portal");
  await expect(page.getByText("Penguin Strategies").first()).toBeVisible();
});

test("wrong password is refused and recorded in the access log", async ({ page }) => {
  const { email } = credentials();
  await page.goto("/login");
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", "wrong-password-attempt-1");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/login/);

  await signIn(page);
  await page.goto(`/admin/activity?user=${encodeURIComponent(email)}`);
  await expect(page.getByTestId("access-log")).toContainText("Sign-in failed");
});

test("launchpad Start module CTA has opaque brand background and clicking module title navigates into /learn", async ({ page }) => {
  await signIn(page);
  await page.goto("/launchpad");

  const cta = page.getByTestId("launch-amico-hubspot-101-orientation-navigation");
  const titleLink = page.getByTestId("title-link-amico-hubspot-101-orientation-navigation");
  await expect(cta).toBeVisible();
  await expect(titleLink).toBeVisible();

  // Verify title link points to the exact same target URL as the CTA button
  const ctaHref = await cta.getAttribute("href");
  const titleHref = await titleLink.getAttribute("href");
  expect(ctaHref).toBeTruthy();
  expect(titleHref).toBe(ctaHref);

  // Verify computed CSS styles on the CTA button (opaque non-white brand background + contrasting white text)
  const styles = await cta.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return { backgroundColor: cs.backgroundColor, color: cs.color };
  });
  expect(styles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.backgroundColor).not.toBe("transparent");
  expect(styles.backgroundColor).not.toBe("rgb(255, 255, 255)");
  expect(styles.backgroundColor).toMatch(/^rgb\(\s*76,\s*50,\s*183\s*\)$/);
  expect(styles.color).toMatch(/^rgb\(\s*255,\s*255,\s*255\s*\)$/);

  // Clicking the module title navigates directly into the module sandbox
  await titleLink.click();
  await expect(page).toHaveURL(/\/learn\/amico\/amico-hubspot-101\/orientation-navigation/);
  await expect(page.getByTestId("training-bar")).toBeVisible();
});

test("multi-tenant RBAC, 403 cross-tenant isolation, invite flow, and TrainingProgress persistence", async ({ page, browser }) => {
  test.skip(!isLocal, "Creates test tenants and users against local DB only.");

  const suffix = Date.now();
  const secondTenantSlug = `northstar-${suffix}`;
  const clientAdmin = { email: `client-admin-${suffix}@amico-test.example`, password: "client-admin-password-1" };
  const trainee = { email: `trainee-${suffix}@amico-test.example`, password: "trainee-password-1" };

  // 1. Sign in as PENGUIN_ADMIN and create a second tenant for cross-tenant 403 verification
  await signIn(page);
  await page.goto("/admin/tenants");
  await expect(page.getByTestId("tenant-row-amico")).toBeVisible();

  await page.getByTestId("tenant-slug-input").fill(secondTenantSlug);
  await page.getByTestId("tenant-name-input").fill("NorthStar Manufacturing");
  await page.getByTestId("create-tenant-btn").click();
  await expect(page.getByTestId(`tenant-row-${secondTenantSlug}`)).toBeVisible();

  // Invite AMICO CLIENT_ADMIN + track-locked TRAINEE
  await page.goto("/admin");
  await page.getByTestId("invite-emails-input").fill(clientAdmin.email);
  await page.getByTestId("invite-role-select").selectOption("CLIENT_ADMIN");
  await page.getByTestId("invite-division-select").selectOption("Security Fence");
  await page.getByTestId("invite-submit-btn").click();

  const clientAdminInvite = (await page.getByTestId(`invite-link-${clientAdmin.email}`).textContent())?.trim();
  expect(clientAdminInvite).toContain("/invite/");

  await page.getByTestId("invite-emails-input").fill(trainee.email);
  await page.getByTestId("invite-role-select").selectOption("TRAINEE");
  await page.getByTestId("invite-division-select").selectOption("Security Fence");
  const inviteForm = page.getByTestId("invite-form");
  const hs101Checkbox = inviteForm.locator("input[name=assignedTrackIds][value='amico-hubspot-101']");
  if (await hs101Checkbox.isChecked()) await hs101Checkbox.uncheck();
  const sfCheckbox = inviteForm.locator("input[name=assignedTrackIds][value='amico-security-fence']");
  if (!(await sfCheckbox.isChecked())) await sfCheckbox.check();
  await inviteForm.locator("input[name=trackLocked]").check();
  await page.getByTestId("invite-submit-btn").click();

  const traineeInvite = (await page.getByTestId(`invite-link-${trainee.email}`).textContent())?.trim();
  expect(traineeInvite).toContain("/invite/");

  // 2. Accept CLIENT_ADMIN invite in isolated browser context and verify RBAC + cross-tenant 403
  const caContext = await browser.newContext();
  const caPage = await caContext.newPage();
  await caPage.goto(clientAdminInvite!);
  await caPage.fill("input[name=name]", "AMICO Client Admin");
  await caPage.fill("input[name=password]", clientAdmin.password);
  await caPage.fill("input[name=confirm]", clientAdmin.password);
  await caPage.click("button[type=submit]");
  await caPage.waitForURL("**/launchpad");
  await expect(caPage.getByTestId("tenant-lockup")).toBeVisible();

  // CLIENT_ADMIN can view /admin and /admin/progress for AMICO
  await caPage.goto("/admin");
  await expect(caPage.getByTestId(`user-row-${trainee.email}`)).toBeVisible();
  await caPage.goto("/admin/progress");
  await expect(caPage.getByTestId("completion-matrix")).toBeVisible();

  // CLIENT_ADMIN gets HTTP 403 on Penguin-only /admin/tenants
  const caTenantsRes = await caPage.goto("/admin/tenants");
  expect(caTenantsRes?.status()).toBe(403);
  await expect(caPage.getByTestId("forbidden-screen")).toBeVisible();

  // CLIENT_ADMIN gets HTTP 403 on cross-tenant pack API, events API, and /learn route
  const crossPackRes = await caContext.request.get(`/api/packs/any/${secondTenantSlug}/northstar-core`);
  expect(crossPackRes.status()).toBe(403);

  const crossEventRes = await caContext.request.post("/api/events", {
    data: { events: [{ kind: "launchpad_opened", tenantSlug: secondTenantSlug }] },
  });
  expect(crossEventRes.status()).toBe(403);

  const crossLearnRes = await caPage.goto(`/learn/${secondTenantSlug}/northstar-core/core-overview`);
  expect(crossLearnRes?.status()).toBe(403);
  await expect(caPage.getByTestId("forbidden-screen")).toBeVisible();

  // Verify content-hashed Pack API returns Cache-Control: private, max-age=31536000, immutable
  const packRespPromise = caPage.waitForResponse((r) => r.url().includes("/api/packs/") && r.url().includes("/amico/amico-security-fence"));
  await caPage.goto("/learn/amico/amico-security-fence/sf-lead-to-deal?fresh=1");
  const packResp = await packRespPromise;
  expect(packResp.status()).toBe(200);
  expect(packResp.headers()["cache-control"]).toContain("private");
  expect(packResp.headers()["cache-control"]).toContain("immutable");

  // 3. Accept TRAINEE invite in isolated context, verify RBAC + track-lock + completion persistence
  const trContext = await browser.newContext();
  const trPage = await trContext.newPage();
  await trPage.goto(traineeInvite!);
  await trPage.fill("input[name=name]", "Alex Trainee");
  await trPage.fill("input[name=password]", trainee.password);
  await trPage.fill("input[name=confirm]", trainee.password);
  await trPage.click("button[type=submit]");
  await trPage.waitForURL("**/launchpad");

  // Required progress starts at 0 of 5 (Security Fence track has 5 modules)
  await expect(trPage.getByTestId("required-progress-count")).toHaveText("0 of 5");
  await expect(trPage.getByTestId("module-amico-security-fence-sf-lead-to-deal")).toBeVisible();
  // Unassigned HubSpot 101 track is hidden because trackLocked=true
  await expect(trPage.getByTestId("track-amico-hubspot-101")).toHaveCount(0);

  // TRAINEE gets 403 on /admin
  const trAdminRes = await trPage.goto("/admin");
  expect(trAdminRes?.status()).toBe(403);
  await expect(trPage.getByTestId("forbidden-screen")).toBeVisible();

  // TRAINEE gets 403 on unassigned track (trackLocked) and cross-tenant pack
  const lockedTrackRes = await trPage.goto("/learn/amico/amico-hubspot-101/orientation-navigation");
  expect(lockedTrackRes?.status()).toBe(403);
  expect((await trContext.request.get("/api/packs/any/amico/amico-hubspot-101")).status()).toBe(403);
  expect((await trContext.request.get(`/api/packs/any/${secondTenantSlug}/northstar-core`)).status()).toBe(403);

  // TRAINEE completes sf-lead-to-deal (3 steps) using Show Me assist
  await trPage.goto("/learn/amico/amico-security-fence/sf-lead-to-deal?fresh=1");
  await expect(trPage.getByTestId("training-bar")).toBeVisible();

  // Walk remaining steps via Show Me assist until completion
  await walkToCompletion(trPage);

  // Click Finish & Review in TrainingBar to open the Completion Card with Key Takeaways and Do's & Don'ts
  await expect(trPage.getByTestId("training-finish-review")).toBeVisible();
  await trPage.getByTestId("training-finish-review").click();
  await expect(trPage.getByTestId("completion-card")).toBeVisible();
  await expect(trPage.getByTestId("completion-dos")).toBeVisible();
  await expect(trPage.getByTestId("completion-donts")).toBeVisible();
  await trPage.waitForTimeout(350);

  // Return to Launchpad and verify PostgreSQL TrainingProgress persisted across reload
  await trPage.goto("/launchpad");
  await expect(trPage.getByTestId("required-progress-count")).toHaveText("1 of 5");
  await expect(trPage.getByTestId("status-amico-security-fence-sf-lead-to-deal")).toContainText("Completed");

  // CLIENT_ADMIN sees Alex Trainee's COMPLETED status and Show-me assist count in /admin/progress
  await caPage.goto("/admin/progress");
  const matrixRow = caPage.getByTestId(`matrix-row-${trainee.email}`);
  await expect(matrixRow).toContainText("Alex Trainee");
  await expect(matrixRow).toContainText("Done");
  await expect(matrixRow).toContainText("Show me:");

  await trContext.close();
  await caContext.close();

  // Clean up test users
  await page.goto("/admin");
  for (const email of [trainee.email, clientAdmin.email]) {
    page.once("dialog", (d) => d.accept());
    await page.getByTestId(`user-row-${email}`).getByRole("button", { name: "Remove" }).click();
    await expect(page.getByTestId(`user-row-${email}`)).toHaveCount(0);
  }
});
