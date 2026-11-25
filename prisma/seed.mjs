// Runs on every start, after migrations. Idempotent.
// 1. Ensures the initial AMICO tenant exists with all 8 divisions and default tracks.
// 2. Ensures every ADMIN_EMAILS address has an active PENGUIN_ADMIN account.
// 3. Purges access logs, attempts, and audits older than LOG_RETENTION_DAYS, plus expired sessions/links.
import { createHmac, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/password.mjs";
import { docxFileToMarkdown, summaryFromMarkdown } from "../src/lib/knowledge/docx.mjs";
import { AMICO_KNOWLEDGE_SEEDS } from "./knowledge-seed-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, "..", "public", "docs", "amico");

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

export const AMICO_DIVISIONS = [
  "Security Fence",
  "Architecture",
  "FRP",
  "Industrials",
  "Security Mesh",
  "Building Products",
  "AMF",
  "APC and Diamond",
];

export const AMICO_DEFAULT_TRACKS = ["amico-hubspot-101", "amico-security-fence", "amico-email"];

async function seedTenants() {
  const amico = await prisma.tenant.upsert({
    where: { slug: "amico" },
    create: {
      slug: "amico",
      name: "AMICO",
      status: "ACTIVE",
      divisionOptions: AMICO_DIVISIONS,
      defaultTrackIds: AMICO_DEFAULT_TRACKS,
      brandMeta: {
        subtitle: "HubSpot Sales Hub Go-Live Onboarding",
        accentColor: "#5C6672",
        logoUrl: "/brands/amico/amico-logo.svg",
        hubId: "44592643",
        allowedDomains: ["amicoglobal.com"],
      },
    },
    update: {
      divisionOptions: AMICO_DIVISIONS,
      defaultTrackIds: AMICO_DEFAULT_TRACKS,
      brandMeta: {
        subtitle: "HubSpot Sales Hub Go-Live Onboarding",
        accentColor: "#5C6672",
        logoUrl: "/brands/amico/amico-logo.svg",
        hubId: "44592643",
        allowedDomains: ["amicoglobal.com"],
      },
    },
  });
  console.log(`[seed] Tenant ready: ${amico.name} (${amico.slug})`);
}

async function seedAdmins() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || null;
  const forceReset = (process.env.ADMIN_PASSWORD_RESET ?? "").trim().toLowerCase() === "true";

  if (adminEmails.length === 0) {
    console.warn("[seed] ADMIN_EMAILS is empty. No Penguin super-admin account was created.");
    return;
  }
  if (initialPassword && initialPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_INITIAL_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  for (const email of adminEmails) {
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, role: "PENGUIN_ADMIN", status: "ACTIVE", tenantId: null },
      update: { role: "PENGUIN_ADMIN", status: "ACTIVE" },
    });

    if (initialPassword && (!user.passwordHash || forceReset)) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(initialPassword) } });
      console.log(`[seed] PENGUIN_ADMIN ready, password ${forceReset ? "reset" : "set"} from ADMIN_INITIAL_PASSWORD: ${email}`);
    } else if (!user.passwordHash) {
      const secret = process.env.SESSION_SECRET;
      const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
      if (!secret || !appUrl) throw new Error("SESSION_SECRET and APP_URL are required.");
      const token = randomBytes(32).toString("base64url");
      await prisma.invite.updateMany({ where: { userId: user.id, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
      await prisma.invite.create({
        data: {
          tokenHash: createHmac("sha256", secret).update(token).digest("hex"),
          userId: user.id,
          expiresAt: new Date(Date.now() + 14 * DAY_MS),
        },
      });
      console.log(`[seed] PENGUIN_ADMIN ready, no password yet: ${email}\n[seed] Set a password with this one-time link (valid 14 days):\n${appUrl}/invite/${token}`);
    } else {
      console.log(`[seed] PENGUIN_ADMIN ready: ${email}`);
    }
  }

  if (forceReset) {
    console.warn("[seed] ADMIN_PASSWORD_RESET is true. Remove it now so the next deploy does not reset passwords again.");
  }
}

async function seedKnowledgeLibrary() {
  const amico = await prisma.tenant.findUnique({ where: { slug: "amico" } });
  if (!amico) {
    console.warn("[seed] AMICO tenant missing; skipping knowledge library seed.");
    return;
  }

  for (const item of AMICO_KNOWLEDGE_SEEDS) {
    const filePath = path.join(DOCS_DIR, item.publicFile);
    if (!fs.existsSync(filePath)) {
      console.warn(`[seed] Missing knowledge file ${item.publicFile}; skipping ${item.slug}.`);
      continue;
    }
    const fileBytes = fs.readFileSync(filePath);
    const markdown = await docxFileToMarkdown(filePath);
    const summary = item.summary || summaryFromMarkdown(markdown, item.title);

    const existing = await prisma.knowledgeDocument.findUnique({
      where: { tenantId_slug: { tenantId: amico.id, slug: item.slug } },
    });

    const base = {
      title: item.title,
      category: item.category,
      division: item.division,
      sortOrder: item.sortOrder,
      fileName: item.publicFile,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: fileBytes.length,
    };

    if (!existing) {
      await prisma.knowledgeDocument.create({
        data: {
          tenantId: amico.id,
          slug: item.slug,
          summary,
          contentMarkdown: markdown,
          fileBytes,
          ...base,
        },
      });
      console.log(`[seed] Knowledge doc created: ${item.slug}`);
      continue;
    }

    if (existing.adminEdited) {
      await prisma.knowledgeDocument.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          category: item.category,
          division: item.division,
          sortOrder: item.sortOrder,
        },
      });
      console.log(`[seed] Knowledge doc metadata refreshed (admin-edited, content preserved): ${item.slug}`);
      continue;
    }

    const needsContent = !existing.contentMarkdown?.trim() || !existing.fileBytes || existing.fileBytes.length === 0;

    await prisma.knowledgeDocument.update({
      where: { id: existing.id },
      data: {
        ...base,
        summary: needsContent || !existing.summary ? summary : existing.summary,
        contentMarkdown: needsContent ? markdown : existing.contentMarkdown,
        fileBytes: needsContent ? fileBytes : existing.fileBytes,
      },
    });
    console.log(`[seed] Knowledge doc upserted: ${item.slug}`);
  }
}

async function purge() {
  const days = Number(process.env.LOG_RETENTION_DAYS ?? "");
  const retentionDays = Number.isFinite(days) && days > 0 ? days : 730;
  const cutoff = new Date(Date.now() - retentionDays * DAY_MS);
  const now = new Date();

  const [events, attempts, audits, sessions] = await Promise.all([
    prisma.accessEvent.deleteMany({ where: { at: { lt: cutoff } } }),
    prisma.trainingAttempt.deleteMany({ where: { startedAt: { lt: cutoff } } }),
    prisma.adminAudit.deleteMany({ where: { at: { lt: cutoff } } }),
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.magicLinkToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 7 * DAY_MS) } } }),
  ]);
  console.log(
    `[seed] Retention ${retentionDays} days: removed ${events.count} events, ${attempts.count} attempts, ${audits.count} audit rows, ${sessions.count} expired sessions.`,
  );
}

async function main() {
  await seedTenants();
  await seedAdmins();
  await seedKnowledgeLibrary();
  await purge();
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
