"use client";

import { useSeen, useShell } from "@/store/store";
import type { EpicorQuote } from "@/tenants/types";
import { Ext } from "../ext";
import { date, money2, shortDate } from "../format";
import { Icon } from "../icons";
import { A, Card, Empty, Prop, statusTone, Tag } from "../ui";
import { IndexPage, type Column, type View } from "./index-table";

export function EpicorQuotesIndex() {
  const { world, dispatch } = useShell();

  const views: View<EpicorQuote>[] = [
    { id: "all", label: "All Epicor quotes", filter: () => true, closable: false },
    { id: "sent", label: "Sent / Pending SO", filter: (q) => q.status === "Sent" || q.status === "Pending SO" },
    { id: "accepted", label: "Accepted", filter: (q) => q.status === "Accepted" },
  ];

  const columns: Column<EpicorQuote>[] = [
    {
      id: "number",
      label: "Epicor Quote #",
      sort: (q) => q.quoteNumber,
      cell: (q) => (
        <A to={`/epicor-quotes/${q.id}`} className="hs-link font-mono" data-testid={`epicor-quote-link-${q.id}`}>
          {q.quoteNumber}
        </A>
      ),
    },
    { id: "title", label: "Quote Description", cell: (q) => <span className="font-medium text-[#33475b]">{q.title}</span> },
    {
      id: "company",
      label: "Associated Company",
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
    { id: "division", label: "Division", cell: (q) => <Tag tone="neutral">{q.division}</Tag> },
    { id: "source", label: "ERP Source", cell: (q) => <Tag tone="teal">{q.sourceSystem}</Tag> },
    { id: "status", label: "Status", cell: (q) => <Tag tone={statusTone(q.status)}>{q.status}</Tag> },
    { id: "amount", label: "Quote Total", align: "right", sort: (q) => q.total, cell: (q) => <span className="font-semibold">{money2(q.total)}</span> },
    { id: "erp", label: "Epicor Cust ID", cell: (q) => <span className="font-mono text-[12px]">{q.epicorCustomerId}</span> },
    { id: "exp", label: "Expiration Date", cell: (q) => shortDate(q.expirationDate) },
  ];

  return (
    <Ext id="epicor-readonly-sync">
      <IndexPage
        title="Epicor Quotes"
        objectSwitcherLabel="Epicor Quotes"
        noun="Epicor quote"
        rows={world.epicorQuotes}
        columns={columns}
        views={views}
        rowKey={(q) => q.id}
        searchText={(q) => `${q.quoteNumber} ${q.title} ${q.division} ${q.epicorCustomerId} ${q.customerPo}`}
        onPreviewRow={(q) => dispatch({ t: "ui", k: "preview", v: `epicor-quote:${q.id}` })}
        headerActions={<Tag tone="teal">Custom Object · Synced Read-Only from Epicor ERP</Tag>}
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
    <div className="hs-record-3pane" data-testid="epicor-quote-record">
      {/* LEFT SIDEBAR */}
      <aside className="hs-record-left hs-scroll">
        <div className="p-4">
          <A to="/epicor-quotes" className="hs-link inline-flex items-center gap-1 text-[12.5px]">
            <Icon name="chevronLeft" size={14} /> Epicor Quotes
          </A>
          <div className="mt-2.5">
            <h1 className="text-[17.5px] font-bold text-[#33475b]">
              {eq.quoteNumber} · {eq.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Tag tone={statusTone(eq.status)}>{eq.status}</Tag>
              <Tag tone="teal">{eq.sourceSystem}</Tag>
            </div>
            <p className="mt-2 text-[17px] font-bold tabular-nums text-[#33475b]">{money2(eq.total)}</p>
          </div>
        </div>

        <div className="border-t border-[#dfe3eb] px-4 py-3">
          <p className="text-[12.5px] font-bold text-[#33475b]">About this Epicor Quote</p>
          <dl className="mt-1">
            <Prop label="Epicor Quote #">{eq.quoteNumber}</Prop>
            <Prop label="Epicor Record ID">{eq.epicorQuoteId}</Prop>
            <Prop label="Status">
              <Tag tone={statusTone(eq.status)}>{eq.status}</Tag>
            </Prop>
            <Prop label="Division">{eq.division}</Prop>
            <Prop label="Source ERP System">{eq.sourceSystem}</Prop>
            <Prop label="Epicor Customer ID">{eq.epicorCustomerId}</Prop>
            <Prop label="Customer PO #">{eq.customerPo || "Pending PO"}</Prop>
            {eq.salesOrderNumber ? <Prop label="Epicor Sales Order #">{eq.salesOrderNumber}</Prop> : null}
            <Prop label="Created in ERP">{date(eq.createdAt)}</Prop>
            <Prop label="Expiration Date">{date(eq.expirationDate)}</Prop>
          </dl>
        </div>
      </aside>

      {/* MIDDLE CANVAS */}
      <section className="hs-record-center hs-scroll p-5 space-y-4">
        <Ext id="epicor-readonly-sync">
          <div
            className="flex items-center gap-2.5 rounded-[4px] border border-[#99e2d8] bg-[#e5f8f6] px-4 py-3 text-[12.5px] font-semibold text-[#006c5f]"
            data-testid="epicor-readonly-banner"
          >
            <Icon name="lock" size={15} className="shrink-0" />
            <span>
              Read-only ERP custom object · Do not recreate this quote in HubSpot Commerce Quotes — revise pricing in {eq.sourceSystem} and it syncs automatically.
            </span>
          </div>
        </Ext>

        <Card title="Data highlights">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
              <p className="text-[11px] font-semibold uppercase text-[#516f90]">Quote Value</p>
              <p className="mt-1 text-[14px] font-bold tabular-nums text-[#33475b]">{money2(eq.total)}</p>
            </div>
            <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
              <p className="text-[11px] font-semibold uppercase text-[#516f90]">ERP Source</p>
              <p className="mt-1 text-[13px] font-bold text-[#006162]">{eq.sourceSystem}</p>
            </div>
            <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
              <p className="text-[11px] font-semibold uppercase text-[#516f90]">Customer PO</p>
              <p className="mt-1 text-[13px] font-bold text-[#33475b]">{eq.customerPo || "Pending"}</p>
            </div>
            <div className="rounded-[3px] bg-[#f5f8fa] p-2.5">
              <p className="text-[11px] font-semibold uppercase text-[#516f90]">Valid Until</p>
              <p className="mt-1 text-[13px] font-bold text-[#33475b]">{shortDate(eq.expirationDate)}</p>
            </div>
          </div>
        </Card>

        <Card title="Synced ERP BOM / Line Summary (Read-Only)" right={<Tag tone="neutral">ERP System of Record</Tag>}>
          <p className="mb-3 text-[12.5px] text-[#516f90]">
            Per AMICO&rsquo;s 101 Quoting Decision Tree, {eq.division} quotes originate in {eq.sourceSystem} and sync into HubSpot so sales and leadership see live status, PO numbers, and totals on the Customer &amp; Deal record.
          </p>
          {dealLines.length > 0 ? (
            <div className="hs-grid-wrap">
              <table className="hs-grid" data-testid="epicor-line-items">
                <thead>
                  <tr>
                    <th>Part / SKU</th>
                    <th>Description</th>
                    <th className="!text-right">Qty</th>
                    <th className="!text-right">Unit Price</th>
                    <th className="!text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dealLines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-[12px] font-semibold">{line.sku}</td>
                      <td>{line.name}</td>
                      <td className="text-right tabular-nums">{line.qty}</td>
                      <td className="text-right tabular-nums">{money2(line.unitPrice)}</td>
                      <td className="text-right font-semibold tabular-nums">{money2(line.qty * line.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-4 text-[13px]">
              <div className="flex items-center justify-between font-semibold text-[#33475b]">
                <span>{eq.title}</span>
                <span className="tabular-nums">{money2(eq.total)}</span>
              </div>
              <p className="mt-1 text-[12px] text-[#516f90]">Customer Ref / PO: {eq.customerPo || "Pending PO"}</p>
            </div>
          )}
        </Card>
      </section>

      {/* RIGHT SIDEBAR */}
      <aside className="hs-record-right hs-scroll divide-y divide-[#dfe3eb]">
        <div className="p-4">
          <p className="text-[13px] font-bold text-[#33475b]">Deals ({deal ? 1 : 0})</p>
          {deal ? (
            <div className="mt-2 rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
              <A to={`/deals/${deal.id}`} className="hs-link" data-testid="epicor-assoc-deal">
                {deal.name}
              </A>
              <p className="mt-0.5 text-[11.5px] text-[#516f90]">
                Stage: {deal.stage} · {money2(deal.amount)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <p className="text-[13px] font-bold text-[#33475b]">Companies ({company ? 1 : 0})</p>
          {company ? (
            <div className="mt-2 rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <A to={`/companies/${company.id}`} className="hs-link">
                  {company.name}
                </A>
                <Tag tone="blue">Primary</Tag>
              </div>
              <p className="mt-0.5 text-[11.5px] text-[#516f90]">{company.crossDivision?.primaryDivision ?? company.industry}</p>
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <p className="text-[13px] font-bold text-[#33475b]">Contacts ({contact ? 1 : 0})</p>
          {contact ? (
            <div className="mt-2 rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
              <A to={`/contacts/${contact.id}`} className="hs-link">
                {contact.firstName} {contact.lastName}
              </A>
              <p className="mt-0.5 text-[11.5px] text-[#516f90]">{contact.email}</p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
