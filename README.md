# Penguin Training Portal

A private, multi-tenant HubSpot training portal built and operated by Penguin Strategies for enterprise HubSpot rollouts. Trainees sign in to an isolated client workspace, launch assigned curriculum tracks, and practice real CRM workflows inside an interactive, deterministic HubSpot sandbox without touching production data.

## Architecture Overview

- **Multi-Tenant Access Control & RBAC.** Three roles (`PENGUIN_ADMIN`, `CLIENT_ADMIN`, `TRAINEE`) backed by PostgreSQL + Prisma. Every non-Penguin user is bound to a single `Tenant` (`tenantId`), enforced across `/launchpad`, `/learn`, `/admin`, `/api/packs/[version]/[tenantSlug]/[trackId]`, and `/api/events`. Signed-out screens display Penguin Strategies branding only.
- **Authentication.** Invite-only access with `scrypt` password hashing, 15-minute magic sign-in links, optional Google OAuth 2.0, and optional Microsoft Entra ID (Azure AD) OAuth 2.0 (`MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`).
- **Curriculum Launchpad (`/launchpad`).** Co-branded client header (`<Tenant> × HubSpot | Trained by Penguin Strategies`), Required curriculum progress banner, assigned vs. optional track sections (with optional `trackLocked` enforcement), role filters, search, and saved session resume.
- **Interactive Training Sandbox (`/learn/[tenantSlug]/[trackId]/[moduleId]`).** Deterministic client-side `World` + `Action[]` replay engine (`src/store/`) paired with `<TrainingBar>` (organic UI action auto-advance via `done(ctx)`, `"Show me"` assist tracking `usedShowMeCount`, `Back`, `Reset` (`R`), `View as` role switcher, and `Coaching` (`H`) callout pins for `by: "penguin"` and `by: "amico-rule"`), plus `<CompletionCard>` (`Key Takeaways`, `Do's & Don'ts`, completion badge, and `Next Module`).
- **AMICO HubSpot Shell Extensions (`src/shell/`, `src/tenants/amico/`, `src/curriculum/amico/`):**
  1. Left `CRM` navigation (`Contacts`, `Companies`, `Deals`, `Projects`, `Epicor Quotes`, `Segments (Lists)`, `Tasks`, `Leads`), Global Search, unique-email Contact guardrail, and Avatar -> `Profile & Preferences`;
  2. Multi-division `Companies` with Parent/Child hierarchy, Cross-Division Activity Card, division edit-locking, and duplicate escalation (`Flag duplicate to NSM / Penguin`);
  3. Multi-pipeline `Deals` selector (all 8 AMICO division pipelines + read-only `Global` executive shadow rollup), Table/Board views, Stage Gate prompt modals (`Drawings Received`, `Engineering Required`, required `Project / Handoff Required` + `Customer PO #` at `Awarded`, required `Lost Reason` at `Closed - Lost`), multi-owner Deal Team card, multi-party association role labels, Penguin Quote Ingestion Tool (Estimating Workbook Rev 1 / Rev 2), and `+ Add view` / `+ Add deal`;
  4. `CRM > Epicor Quotes` read-only ERP-synced custom object index & record view alongside native Oracle-SKU HubSpot `Quotes`;
  5. `CRM > Projects` (`Project Pipeline` + `Delivery Board` + Project Record with phased `Project Plan` checklist, Sales Rep view-only banner vs. Project Manager edit mode, `On Track` / `Blocked` status, and automatic delivery stage sync back to the originating Deal);
  6. Shared Task Queues (`Prepare quotes`, `Quote follow-ups`, `Stuck deal`, `Estimating`), `CRM > Segments (Lists)`, and NSM `CRM > Leads` qualification.
- **Training Admin (`/admin`).** `CLIENT_ADMIN` manages their organization's roster, single/bulk invites (with division, job role, required tracks, and copyable invite links), password resets, learner Completion Matrix (`/admin/progress`), Module Attempts (`/admin/attempts`), Access Log (`/admin/activity`), and Admin Audit (`/admin/audit`). `PENGUIN_ADMIN` additionally manages client tenants (`/admin/tenants`) and switches active tenant context.

## Local Development

Requires Node.js >= 22 and PostgreSQL.

```bash
cp .env.example .env        # configure DATABASE_URL, SESSION_SECRET, ADMIN_EMAILS, ADMIN_INITIAL_PASSWORD
npm install
npx prisma migrate deploy   # apply Prisma schema migrations
npm run db:seed             # seed AMICO tenant + PENGUIN_ADMIN account(s)
npm run dev                 # http://localhost:3000
```

## Verification & E2E Tests

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

## Railway Deployment

Configured via `railway.json`:
- **Build:** `npm run build` (`prisma generate && next build`)
- **Start:** `npm run start` (`prisma migrate deploy && node prisma/seed.mjs && next start`)
- **Healthcheck:** `GET /api/health`
