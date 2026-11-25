import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { credentials, isLocal, signIn } from "./helpers";

const RECORDING_SLUGS = [
  "training-recording-hubspot-101-monday",
  "training-recording-hubspot-101-tuesday",
  "training-recording-division-handover-monday",
  "training-recording-division-handover-tuesday",
];

const SEEDED_SLUGS = [
  "amico-hubspot-101-training-guide",
  "security-fence-hubspot-handover",
  "amf-quoting-guide",
  "architecture-quoting-guide",
  "building-products-quoting-guide",
  "frp-quoting-guide",
  "industrials-quoting-guide",
  "apc-perforated-quoting-guide",
  "security-fence-quoting-guide",
  "security-mesh-quoting-guide",
];

test("launchpad links to Knowledge Library and all 10 seeded AMICO docs are filterable", async ({ page }) => {
  await signIn(page);
  await page.goto("/launchpad");
  await page.getByTestId("launchpad-knowledge-cta").click();
  await expect(page).toHaveURL(/\/knowledge/);
  await expect(page.getByTestId("knowledge-library")).toBeVisible();
  await expect(page.getByTestId("knowledge-result-count")).toContainText("Showing 14 of 14");

  for (const slug of [...SEEDED_SLUGS, ...RECORDING_SLUGS]) {
    await expect(page.getByTestId(`knowledge-card-${slug}`)).toBeVisible();
  }

  for (const slug of RECORDING_SLUGS) {
    await expect(page.getByTestId(`knowledge-recording-pending-${slug}`)).toBeVisible();
  }

  await page.getByTestId("knowledge-category-core-onboarding").click();
  await expect(page.getByTestId("knowledge-card-amico-hubspot-101-training-guide")).toBeVisible();
  await expect(page.getByTestId("knowledge-card-amf-quoting-guide")).toHaveCount(0);

  await page.getByTestId("knowledge-category-division-handover").click();
  await expect(page.getByTestId("knowledge-card-security-fence-hubspot-handover")).toBeVisible();

  await page.getByTestId("knowledge-category-division-quoting").click();
  await expect(page.getByTestId("knowledge-card-amf-quoting-guide")).toBeVisible();

  await page.getByTestId("knowledge-category-all").click();
  await page.getByTestId("knowledge-division-amf").click();
  await expect(page.getByTestId("knowledge-card-amf-quoting-guide")).toBeVisible();
  await expect(page.getByTestId("knowledge-card-amico-hubspot-101-training-guide")).toBeVisible();
});

test("formatted reader shows TOC, tables, download, and docx bytes from API", async ({ page, request }) => {
  await signIn(page);
  await page.goto("/knowledge");
  await page.getByTestId("knowledge-read-amico-hubspot-101-training-guide").click();
  await expect(page).toHaveURL(/\/knowledge\/amico-hubspot-101-training-guide/);
  await expect(page.getByTestId("knowledge-reader")).toBeVisible();
  await expect(page.getByTestId("knowledge-toc")).toBeVisible();
  await expect(page.getByTestId("knowledge-reader-article")).toBeVisible();
  await expect(page.locator(".knowledge-table").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".knowledge-table thead th").first()).toBeVisible();
  const articleText = await page.getByTestId("knowledge-reader-article").innerText();
  expect(articleText).not.toContain("||");
  expect(articleText).not.toContain("TABLE_GFM");
  await expect(page.getByRole("heading").first()).toBeVisible();

  const listRes = await request.get("/api/knowledge", { headers: { cookie: await sessionCookie(page) } });
  expect(listRes.ok()).toBeTruthy();
  const listJson = (await listRes.json()) as { documents: { id: string; slug: string; contentMarkdown: string }[] };
  for (const slug of SEEDED_SLUGS) {
    const doc = listJson.documents.find((d) => d.slug === slug);
    expect(doc, `missing seeded doc ${slug}`).toBeTruthy();
    expect(doc!.contentMarkdown).not.toMatch(/\|\|/);
  }
  const hubspot = listJson.documents.find((d) => d.slug === "amico-hubspot-101-training-guide");
  expect(hubspot).toBeTruthy();

  const dl = await request.get(`/api/knowledge/${hubspot!.id}/download`, {
    headers: { cookie: await sessionCookie(page) },
  });
  expect(dl.status()).toBe(200);
  const buf = await dl.body();
  expect(buf.subarray(0, 2).toString("utf8")).toBe("PK");
  const ct = dl.headers()["content-type"] ?? "";
  expect(ct).toMatch(/wordprocessingml|octet-stream/);
});

test("admin can upload handover doc and add recording; trainee cannot mutate", async ({ page, browser, request }) => {
  test.skip(!isLocal, "Admin upload tests run against local DB only.");
  test.setTimeout(120_000);

  const uploadPath = path.join(
    process.cwd(),
    "public/docs/amico/AMICO-Security-Fence-HubSpot-Handover.docx",
  );
  expect(fs.existsSync(uploadPath)).toBe(true);

  await signIn(page);
  const cookie = await sessionCookie(page);

  await page.goto("/knowledge");
  await page.getByTestId("knowledge-add-btn").click();
  await expect(page.getByTestId("knowledge-admin-panel")).toBeVisible();

  const title = `E2E Handover Upload ${Date.now()}`;
  await page.locator('[name="title"]').fill(title);
  await page.locator('[name="category"]').selectOption("DIVISION_HANDOVER");
  await page.locator('[name="division"]').selectOption("Security Fence");
  await page.locator('input[name="file"]').setInputFiles(uploadPath);
  await page.getByTestId("knowledge-admin-save").click();
  await expect(page.getByTestId("knowledge-admin-panel")).toHaveCount(0, { timeout: 20_000 });

  await expect(page.getByText(title)).toBeVisible();
  const createdCard = page.locator("li", { hasText: title });
  await expect(createdCard.getByRole("link", { name: "Read Step-by-Step" })).toBeVisible();

  await page.getByTestId("knowledge-add-btn").click();
  const recTitle = `E2E Training Recording ${Date.now()}`;
  await page.locator('[name="title"]').fill(recTitle);
  await page.locator('[name="category"]').selectOption("RECORDING");
  await page.locator('[name="externalUrl"]').fill("https://example.com/amico-training-recording");
  await page.getByTestId("knowledge-admin-save").click();
  await expect(page.getByText(recTitle)).toBeVisible();

  const traineeEmail = `trainee-kl-${Date.now()}@amico-test.example`;
  await page.goto("/admin");
  await page.getByTestId("invite-emails-input").fill(traineeEmail);
  await page.getByTestId("invite-role-select").selectOption("TRAINEE");
  await page.getByTestId("invite-division-select").selectOption("Security Fence");
  await page.getByTestId("invite-submit-btn").click();
  const inviteLink = (await page.getByTestId(`invite-link-${traineeEmail}`).textContent())?.trim();
  expect(inviteLink).toContain("/invite/");

  const traineeContext = await browser.newContext();
  const traineePage = await traineeContext.newPage();
  await traineePage.goto(inviteLink!);
  await traineePage.fill("input[name=name]", "Knowledge Trainee");
  await traineePage.fill("input[name=password]", "trainee-password-kl-1");
  await traineePage.fill("input[name=confirm]", "trainee-password-kl-1");
  await traineePage.click('button[type="submit"]');
  await traineePage.waitForURL("**/launchpad");

  const traineeCookie = await sessionCookie(traineePage);
  const postRes = await request.post("/api/knowledge", {
    headers: { cookie: traineeCookie },
    multipart: { title: "blocked", category: "OTHER" },
  });
  expect(postRes.status()).toBe(403);

  const listRes = await request.get("/api/knowledge", { headers: { cookie } });
  const { documents } = (await listRes.json()) as { documents: { id: string; title: string }[] };
  const uploaded = documents.find((d) => d.title === title);
  expect(uploaded).toBeTruthy();
  const delRes = await request.delete(`/api/knowledge/${uploaded!.id}`, { headers: { cookie: traineeCookie } });
  expect(delRes.status()).toBe(403);

  const adminDel = await request.delete(`/api/knowledge/${uploaded!.id}`, { headers: { cookie } });
  expect(adminDel.ok()).toBeTruthy();
  const rec = documents.find((d) => d.title === recTitle);
  if (rec) await request.delete(`/api/knowledge/${rec.id}`, { headers: { cookie } });

  await traineeContext.close();
});

async function sessionCookie(page: import("@playwright/test").Page): Promise<string> {
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === "training_portal_session");
  return session ? `${session.name}=${session.value}` : "";
}