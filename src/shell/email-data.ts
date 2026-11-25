/** AMICO-standardized 1:1 sales email templates (HubSpot Message Templates). */
export const AMICO_EMAIL_TEMPLATES = [
  {
    id: "amico-intro",
    name: "AMICO Division Introduction",
    subject: "AMICO {{division}} — Introduction & Capabilities",
    body: `Hi {{contact.firstName}},

Thank you for connecting with AMICO {{division}}. We manufacture engineered metal systems including perimeter security, industrial grating, and building envelope products.

I'd like to learn more about your upcoming projects and share how our team supports spec-driven bids and fast-turn stock programs.

Best regards,
{{owner.name}}
AMICO Sales`,
  },
  {
    id: "quote-follow-up",
    name: "Quote Follow-Up",
    subject: "Following up — {{deal.name}} quote {{quote.number}}",
    body: `Hi {{contact.firstName}},

I'm following up on the quote we sent for {{deal.name}} ({{quote.number}}, {{quote.total}}).

Please let me know if you need revised lead times, alternates, or a submittal package for your GC team.

Best,
{{owner.name}}`,
  },
  {
    id: "submittal-follow-up",
    name: "Submittal Package Follow-Up",
    subject: "Submittal package — {{deal.name}}",
    body: `Hi {{contact.firstName}},

Attached is the AMICO submittal package for {{deal.name}}. It includes product data sheets, finish schedules, and anchor details your A/E team requested.

Reply with any RFIs before your bid date of {{deal.closeDate}}.

Regards,
{{owner.name}}`,
  },
  {
    id: "cross-division-handoff",
    name: "Cross-Division Handoff",
    subject: "Coordinated AMICO outreach — {{company.name}}",
    body: `Hi {{contact.firstName}},

I'm reaching out from AMICO {{division}} after coordinating with your account team. We want to make sure you hear from one AMICO division at a time while we support your full project scope.

Happy to schedule a quick call to align on next steps.

{{owner.name}}
AMICO Sales`,
  },
] as const;

export type AmicoEmailTemplateId = (typeof AMICO_EMAIL_TEMPLATES)[number]["id"];

export const AMICO_EMAIL_SNIPPETS = [
  {
    id: "oracle-pricing",
    name: "Oracle pricing note",
    text: "Pricing reflects your Oracle customer contract and current mill surcharges.",
  },
  {
    id: "lead-time",
    name: "Standard lead time",
    text: "Typical lead time is 3–4 weeks ARO for stock SKUs; fabricated items may require 6–8 weeks.",
  },
  {
    id: "submittal-turn",
    name: "Submittal turnaround",
    text: "Engineered submittals typically return within 5 business days once drawings are received.",
  },
  {
    id: "cross-sell",
    name: "Cross-division courtesy",
    text: "I've cc'd your AMICO account owner so we stay aligned across divisions.",
  },
] as const;

export type AmicoEmailSnippetId = (typeof AMICO_EMAIL_SNIPPETS)[number]["id"];

/** Marketing Hub email campaigns (division product sends). */
export const AMICO_MARKETING_EMAILS = [
  {
    id: "mkt-industrials-q4",
    division: "Industrials",
    name: "Q4 Bar Grating & Expanded Metal Stock Program",
    status: "Sent" as const,
    sentAt: "2026-11-08T15:00:00.000Z",
    recipients: 1842,
    openRate: 38.4,
    clickRate: 6.2,
  },
  {
    id: "mkt-security-fence",
    division: "Security Fence",
    name: "Perimeter Systems — Spec & BIM Library Update",
    status: "Sent" as const,
    sentAt: "2026-10-22T14:30:00.000Z",
    recipients: 956,
    openRate: 41.1,
    clickRate: 9.4,
  },
  {
    id: "mkt-building-products",
    division: "Building Products",
    name: "AMICO Louvers — AIA Lunch & Learn Invitation",
    status: "Scheduled" as const,
    scheduledAt: "2026-12-02T16:00:00.000Z",
    recipients: 620,
    openRate: 0,
    clickRate: 0,
  },
  {
    id: "mkt-frp-stock",
    division: "FRP",
    name: "FRP Pultruded Grating Stock Availability",
    status: "Sent" as const,
    sentAt: "2026-09-15T13:00:00.000Z",
    recipients: 712,
    openRate: 35.8,
    clickRate: 4.1,
  },
  {
    id: "mkt-mesh-winter",
    division: "Security Mesh",
    name: "Winter Mesh Panel Promo — Distributor Network",
    status: "Draft" as const,
    recipients: 0,
    openRate: 0,
    clickRate: 0,
  },
  {
    id: "mkt-architecture-ae",
    division: "Architecture",
    name: "Architectural Mesh Design Guide — 2026 Edition",
    status: "Draft" as const,
    recipients: 0,
    openRate: 0,
    clickRate: 0,
  },
] as const;

export function personalizeEmailTokens(
  template: string,
  tokens: {
    contactFirstName?: string;
    companyName?: string;
    dealName?: string;
    quoteNumber?: string;
    quoteTotal?: string;
    closeDate?: string;
    division?: string;
    ownerName?: string;
  },
): string {
  return template
    .replace(/\{\{contact\.firstName\}\}/g, tokens.contactFirstName ?? "there")
    .replace(/\{\{company\.name\}\}/g, tokens.companyName ?? "your company")
    .replace(/\{\{deal\.name\}\}/g, tokens.dealName ?? "your project")
    .replace(/\{\{deal\.closeDate\}\}/g, tokens.closeDate ?? "—")
    .replace(/\{\{quote\.number\}\}/g, tokens.quoteNumber ?? "—")
    .replace(/\{\{quote\.total\}\}/g, tokens.quoteTotal ?? "—")
    .replace(/\{\{division\}\}/g, tokens.division ?? "AMICO")
    .replace(/\{\{owner\.name\}\}/g, tokens.ownerName ?? "AMICO Sales");
}