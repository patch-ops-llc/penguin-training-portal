"use client";

import { nowMs } from "@/lib/format";
import { quoteTotals } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { date, money2 } from "../format";
import { Icon } from "../icons";
import { A, Button, Card, Empty, Prop, statusTone, Tag } from "../ui";

export function QuotePage({ id }: { id: string }) {
  const { world, dispatch } = useShell();
  const quote = world.quotes.find((q) => q.id === id);

  if (!quote) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Quote not found">
            <A to="/quotes" className="hs-link">
              Back to Quotes
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const deal = world.deals.find((d) => d.id === quote.dealId);
  const company = world.companies.find((c) => c.id === quote.companyId);
  const buyer = world.contacts.find((c) => c.id === quote.contactId);
  const totals = quoteTotals(quote);

  return (
    <div className="mx-auto max-w-[1040px] space-y-5 px-6 py-6" data-testid="native-quote-page">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-3">
            <A to={deal ? `/deals/${deal.id}` : "/quotes"} className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
              <Icon name="chevronLeft" size={14} /> {deal ? deal.name : "Quotes"}
            </A>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-[21px] font-semibold">
              {quote.number}: {quote.title}
            </h1>
            <Tag tone={statusTone(quote.status)}>{quote.status}</Tag>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Native HubSpot Quote (Oracle-migrated Product Library) · Valid until {date(quote.validUntil)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quote.status === "Draft" || quote.status === "Approved" ? (
            <Button
              variant="primary"
              icon="send"
              data-testid="quote-send-btn"
              onClick={() => dispatch({ t: "quote.send", id: quote.id, at: nowMs() })}
            >
              Publish &amp; send quote link
            </Button>
          ) : null}
          {quote.status === "Sent" ? (
            <Button
              variant="primary"
              icon="check"
              data-testid="quote-accept-btn"
              onClick={() => dispatch({ t: "quote.accept", id: quote.id, at: nowMs() })}
            >
              Simulate buyer e-signature
            </Button>
          ) : null}
        </div>
      </header>

      <Ext id="oracle-native-quotes">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <Card title="Customer Quote Document">
            <div className="mb-4 flex flex-wrap justify-between gap-4 rounded-[8px] bg-[#fafafa] p-4 text-[13px]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Prepared for</p>
                <p className="mt-0.5 font-semibold">{company?.name ?? "Customer"}</p>
                {buyer ? (
                  <p className="text-ink-muted">
                    {buyer.firstName} {buyer.lastName} ({buyer.email})
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Quote reference</p>
                <p className="mt-0.5 font-semibold">{quote.number}</p>
                <p className="text-ink-muted">Valid through {date(quote.validUntil)}</p>
              </div>
            </div>

            <table className="w-full border-collapse text-[13px]" data-testid="quote-lines-table">
              <thead>
                <tr className="border-b border-line-soft text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Disc %</th>
                  <th className="px-3 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((line, i) => {
                  const disc = line.discountPct ?? quote.discountPct;
                  const net = line.qty * line.unitPrice * (1 - disc / 100);
                  return (
                    <tr key={i} className="border-b border-line-soft">
                      <td className="px-3 py-2.5 font-mono text-[12px] font-semibold">{line.sku}</td>
                      <td className="px-3 py-2.5">{line.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{line.qty}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money2(line.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{disc}%</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{money2(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line font-semibold">
                  <td colSpan={5} className="px-3 py-2.5 text-right">
                    Net Quote Total
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{money2(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </Card>

          <div className="space-y-4">
            <Card title="Quote Details">
              <dl className="divide-y divide-line-soft">
                <Prop label="Status">
                  <Tag tone={statusTone(quote.status)}>{quote.status}</Tag>
                </Prop>
                <Prop label="Subtotal">{money2(totals.subtotal)}</Prop>
                <Prop label="Discount">{money2(totals.discount)}</Prop>
                <Prop label="Total">{money2(totals.total)}</Prop>
                {quote.sentAt ? <Prop label="Published">{date(quote.sentAt)}</Prop> : null}
                {quote.acceptedAt ? <Prop label="Signed by buyer">{date(quote.acceptedAt)}</Prop> : null}
              </dl>
            </Card>
          </div>
        </div>
      </Ext>
    </div>
  );
}
