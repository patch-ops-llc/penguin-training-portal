"use client";

import { useSeen, useShell } from "@/store/store";
import type { EpicorQuote } from "@/tenants/types";
import { Ext } from "../ext";
import { date, money2 } from "../format";
import { Icon } from "../icons";
import { A, Card, Empty, Prop, statusTone, Tag } from "../ui";
import { IndexPage, PreviewShell, type Column, type View } from "./index-table";

export function EpicorQuotesIndex() {
  const { world } = useShell();

  const views: View<EpicorQuote>[] = [
    { id: "all", label: "All Epicor quotes", filter: () => true },
    { id: "sent", label: "Sent / Pending SO", filter: (q) => q.status === "Sent" || q.status === "Pending SO" },
    { id: "accepted", label: "Accepted", filter: (q) => q.status === "Accepted" },
  ];

  const columns: Column<EpicorQuote>[] = [
    {
      id: "number",
      label: "Epicor Quote #",
      sort: (q) => q.quoteNumber,
      cell: (q) => (
        <A to={`/epicor-quotes/${q.id}`} className="hs-link font-semibold" data-testid={`epicor-quote-link-${q.id}`}>
          {q.quoteNumber}
        </A>
      ),
    },
    { id: "title", label: "Description", cell: (q) => q.title },
    {
      id: "company",
      label: "Company",
      cell: (q) => {
        const c = world.companies.find((x) => x.id === q.companyId);
        return c ? (
          <A to={`/companies/${c.id}`} className="hs-link">
            {c.name}
          </A>
        ) : (
          "—"
        );
      },
    },
    { id: "division", label: "Division", cell: (q) => q.division },
    { id: "source", label: "Source System", cell: (q) => q.sourceSystem },
    { id: "status", label: "Status", cell: (q) => <Tag tone={statusTone(q.status)}>{q.status}</Tag> },
    { id: "amount", label: "Total", align: "right", sort: (q) => q.total, cell: (q) => money2(q.total) },
    { id: "erp", label: "ERP Cust ID", cell: (q) => q.epicorCustomerId },
    { id: "exp", label: "Expires", cell: (q) => date(q.expirationDate) },
  ];

  return (
    <Ext id="epicor-readonly-sync">
      <IndexPage
        title="Epicor Quotes"
        noun="Epicor quote"
        rows={world.epicorQuotes}
        columns={columns}
        views={views}
        rowKey={(q) => q.id}
        searchText={(q) => `${q.quoteNumber} ${q.title} ${q.division} ${q.epicorCustomerId} ${q.customerPo}`}
        toolbar={<Tag tone="teal">Synced from Epicor ERP · Read-Only</Tag>}
        preview={(q, close) => (
          <PreviewShell title={`${q.quoteNumber} · ${q.title}`} subtitle={`${q.division} · Synced from ${q.sourceSystem}`} to={`/epicor-quotes/${q.id}`} onClose={close}>
            <dl>
              <Prop label="Status">
                <Tag tone={statusTone(q.status)}>{q.status}</Tag>
              </Prop>
              <Prop label="Total amount">{money2(q.total)}</Prop>
              <Prop label="ERP Customer ID">{q.epicorCustomerId}</Prop>
              <Prop label="Valid until">{date(q.expirationDate)}</Prop>
            </dl>
          </PreviewShell>
        )}
      />
    </Ext>
  );
}

export function EpicorQuoteRecord({ id }: { id: string }) {
  const { world } = useShell();
  const eq = world.epicorQuotes.find((x) => x.id === id);
  useSeen(`seen.epicorQuote.${id}`, Boolean(eq));

  if (!eq) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Epicor quote not found">
            <A to="/epicor-quotes" className="hs-link">
              Back to Epicor Quotes
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const company = world.companies.find((c) => c.id === eq.companyId);
  const deal = world.deals.find((d) => d.id === eq.dealId);
  const contact = world.contacts.find((c) => c.id === eq.contactId);
  const dealLines = deal?.lineItems ?? [];

  return (
    <div className="min-h-full" data-testid="epicor-quote-record">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-6 py-4">
        <div>
          <A to="/epicor-quotes" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
            <Icon name="chevronLeft" size={14} /> Epicor Quotes
          </A>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-[20px] font-semibold">
              {eq.quoteNumber} · {eq.title}
            </h1>
            <Tag tone={statusTone(eq.status)}>{eq.status}</Tag>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            {eq.division} · Source: {eq.sourceSystem} · ERP Customer {eq.epicorCustomerId}
          </p>
        </div>
        <Ext id="epicor-readonly-sync">
          <div
            className="flex items-center gap-2 rounded-[8px] border border-[#b6dfdc] bg-[#eaf7f6] px-3.5 py-2 text-[12.5px] font-semibold text-[#00514f]"
            data-testid="epicor-readonly-banner"
          >
            <Icon name="lock" size={15} />
            Read-only custom object · Revise pricing in {eq.sourceSystem} (auto-syncs to HubSpot)
          </div>
        </Ext>
      </header>

      <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[290px_1fr_300px]">
        <div className="space-y-4">
          <Card title="About this Epicor Quote">
            <dl className="divide-y divide-line-soft">
              <Prop label="Epicor Quote #">{eq.quoteNumber}</Prop>
              <Prop label="Epicor Record ID">{eq.epicorQuoteId}</Prop>
              <Prop label="Quote Status">
                <Tag tone={statusTone(eq.status)}>{eq.status}</Tag>
              </Prop>
              <Prop label="Division">{eq.division}</Prop>
              <Prop label="Source System">{eq.sourceSystem}</Prop>
              <Prop label="Total Quote Value">{money2(eq.total)}</Prop>
              <Prop label="ERP Customer ID">{eq.epicorCustomerId}</Prop>
              {eq.salesOrderNumber ? <Prop label="Sales Order #">{eq.salesOrderNumber}</Prop> : null}
              <Prop label="Created in ERP">{date(eq.createdAt)}</Prop>
              <Prop label="Expiration Date">{date(eq.expirationDate)}</Prop>
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Synced ERP Quote Summary (Read-Only)" right={<Tag>Editing disabled in HubSpot</Tag>}>
            <p className="mb-3 text-[13px] text-ink-muted">
              Epicor, Paperless Parts, and MS Access remain the pricing system of record for {eq.division}. Reps inspect quote status, expiration, and totals here in HubSpot without opening ERP.
            </p>
            {dealLines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]" data-testid="epicor-line-items">
                  <thead>
                    <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                      <th className="px-3 py-2">Part / SKU</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealLines.map((line, idx) => (
                      <tr key={idx} className="border-b border-line-soft last:border-b-0">
                        <td className="px-3 py-2.5 font-mono text-[12px] font-semibold">{line.sku}</td>
                        <td className="px-3 py-2.5">{line.name}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{line.qty}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{money2(line.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{money2(line.qty * line.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-[13px]">
                <div className="flex items-center justify-between font-semibold">
                  <span>{eq.title}</span>
                  <span className="tabular-nums">{money2(eq.total)}</span>
                </div>
                <p className="mt-1 text-[12px] text-ink-muted">Customer Ref / PO: {eq.customerPo || "Pending PO"}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Associated Deal">
            {deal ? (
              <div className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                <A to={`/deals/${deal.id}`} className="hs-link font-semibold" data-testid="epicor-assoc-deal">
                  {deal.name}
                </A>
                <p className="mt-1 text-[12px] text-ink-muted">
                  Stage: {deal.stage} · {money2(deal.amount)}
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">No deal linked.</p>
            )}
          </Card>

          <Card title="Associated Company">
            {company ? (
              <div className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                <A to={`/companies/${company.id}`} className="hs-link font-semibold">
                  {company.name}
                </A>
                <p className="mt-1 text-[12px] text-ink-muted">{company.crossDivision?.primaryDivision ?? company.industry}</p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">No company linked.</p>
            )}
          </Card>

          <Card title="Quote Recipient">
            {contact ? (
              <div className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                <A to={`/contacts/${contact.id}`} className="hs-link font-semibold">
                  {contact.firstName} {contact.lastName}
                </A>
                <p className="mt-0.5 text-[12px] text-ink-muted">{contact.email}</p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">No contact linked.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
