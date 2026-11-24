"use client";

import { nowMs } from "@/lib/format";
import { quoteTotals } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { date, money2 } from "../format";
import { Icon } from "../icons";
import { A, Button, Card, Empty, Prop, statusTone, Tag } from "../ui";

export function QuotePage({ id }: { id: string }) {
  const { pack, world, dispatch } = useShell();
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
  const owner = pack.personas.find((u) => u.id === quote.ownerId);
  const totals = quoteTotals(quote);

  return (
    <div className="min-h-full bg-[#f5f8fa]" data-testid="native-quote-page">
      {/* Top HubSpot Commerce Quote Action Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dfe3eb] bg-white px-6 py-3.5">
        <div>
          <A to={deal ? `/deals/${deal.id}` : "/quotes"} className="hs-link inline-flex items-center gap-1 text-[12.5px]">
            <Icon name="chevronLeft" size={14} /> {deal ? `Back to ${deal.name}` : "Quotes"}
          </A>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="hs-heading text-[19px] font-bold text-[#33475b]">
              {quote.number}: {quote.title}
            </h1>
            <Tag tone={statusTone(quote.status)}>{quote.status}</Tag>
            <Tag tone="blue">HubSpot Commerce Quote</Tag>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[3px] border border-[#dfe3eb] bg-[#f5f8fa] px-2.5 py-1 font-mono text-[11.5px] text-[#516f90]">
            quotes.amico-sandbox.hubspot/{quote.number}
          </span>
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

      <div className="mx-auto max-w-[1140px] space-y-4 px-6 py-5">
        {/* AMICO Quoting Decision Tree Distinction Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-[#99d6e2] bg-[#e6f7f7] px-4 py-2.5 text-[12.5px] text-[#00494b]">
          <span>
            <strong>Native HubSpot Quote (Commerce Hub):</strong> Used for Oracle-migrated SKU catalogs &amp; buyer e-signature. For ERP-engineered orders, inspect read-only{" "}
            <A to="/epicor-quotes" className="font-bold underline">
              CRM &gt; Epicor Quotes
            </A>
            .
          </span>
          <Tag tone="teal">E-Signature Enabled</Tag>
        </div>

        <Ext id="oracle-native-quotes">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_310px]">
            {/* Buyer-Facing HubSpot Quote Sheet Preview */}
            <div className="overflow-hidden rounded-[4px] border border-[#cbd6e2] bg-white shadow-[0_8px_28px_rgba(31,42,55,0.08)]">
              {/* Branded AMICO Document Header Band */}
              <div className="flex flex-wrap items-start justify-between gap-4 bg-[#333333] px-7 py-6 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7fd1de]">
                    AMICO · Alabama Metal Industries Corporation
                  </p>
                  <h2 className="mt-1 text-[20px] font-bold !text-white">{quote.title}</h2>
                  <p className="mt-0.5 text-[12px] text-[#cbd6e2]">
                    3245 Fayette Ave · Birmingham, AL 35208 · Industrial &amp; Architectural Solutions
                  </p>
                </div>
                <div className="text-right text-[12px]">
                  <p className="font-mono text-[14px] font-bold text-white">{quote.number}</p>
                  <p className="mt-0.5 text-[#cbd6e2]">Issued: {date(quote.createdAt)}</p>
                  <p className="text-[#ffbfa8]">Expires: {date(quote.validUntil)}</p>
                </div>
              </div>

              {/* Buyer & Sender Columns */}
              <div className="grid grid-cols-2 gap-6 border-b border-[#dfe3eb] bg-[#f5f8fa] px-7 py-4 text-[12.5px]">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#516f90]">Prepared For</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#33475b]">{company?.name ?? "Customer"}</p>
                  {buyer ? (
                    <p className="text-[#516f90]">
                      {buyer.firstName} {buyer.lastName} · {buyer.title}
                    </p>
                  ) : null}
                  {buyer ? <p className="text-[#006162]">{buyer.email}</p> : null}
                </div>
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#516f90]">Prepared By</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#33475b]">{owner?.name ?? "AMICO Sales"}</p>
                  <p className="text-[#516f90]">{owner?.title ?? "Account Executive"}</p>
                  {deal ? <p className="text-[#516f90]">Division: {deal.division}</p> : null}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="px-7 py-5">
                <div className="hs-grid-wrap">
                  <table className="hs-grid" data-testid="quote-lines-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Item &amp; Specification</th>
                        <th className="!text-right">Qty</th>
                        <th className="!text-right">Unit Price</th>
                        <th className="!text-right">Disc %</th>
                        <th className="!text-right">Net Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.lineItems.map((line, i) => {
                        const disc = line.discountPct ?? quote.discountPct;
                        const net = line.qty * line.unitPrice * (1 - disc / 100);
                        return (
                          <tr key={i}>
                            <td className="font-mono text-[12px] font-semibold text-[#33475b]">{line.sku}</td>
                            <td>
                              <span className="font-medium text-[#33475b]">{line.name}</span>
                              {line.oracleContractPrice ? (
                                <span className="ml-2">
                                  <Tag tone="teal">Oracle Contract Price</Tag>
                                </span>
                              ) : null}
                            </td>
                            <td className="text-right tabular-nums">{line.qty}</td>
                            <td className="text-right tabular-nums">{money2(line.unitPrice)}</td>
                            <td className="text-right tabular-nums">{disc}%</td>
                            <td className="text-right font-semibold tabular-nums">{money2(net)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Quote Totals Summary */}
                <div className="mt-4 flex justify-end">
                  <div className="w-[280px] space-y-1.5 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3.5 text-[13px]">
                    <div className="flex justify-between text-[#516f90]">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{money2(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#516f90]">
                      <span>Contract Discount</span>
                      <span className="tabular-nums">-{money2(totals.discount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#cbd6e2] pt-2 text-[14.5px] font-bold text-[#33475b]">
                      <span>Total (USD)</span>
                      <span className="tabular-nums">{money2(totals.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Commercial Terms & Signature Block */}
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#dfe3eb] pt-4 text-[12px] text-[#516f90] md:grid-cols-2">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[#33475b]">Terms &amp; Freight</p>
                    <p className="mt-1">
                      Net 30 days (subject to Epicor credit standing). FOB Shipping Point unless specified on PO. Pricing valid through {date(quote.validUntil)}.
                    </p>
                  </div>
                  <div className="rounded-[4px] border border-dashed border-[#cbd6e2] bg-[#f5f8fa] p-3">
                    <p className="font-bold uppercase tracking-wider text-[#33475b]">Buyer Acceptance &amp; E-Signature</p>
                    {quote.status === "Accepted" ? (
                      <div className="mt-1.5 text-[#006c5f]">
                        <p className="font-serif text-[16px] italic">
                          /s/ {buyer ? `${buyer.firstName} ${buyer.lastName}` : "Authorized Buyer"}
                        </p>
                        <p className="text-[11px] font-semibold">
                          ✓ Electronically signed {quote.acceptedAt ? date(quote.acceptedAt) : "today"} · Attached to Deal
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[#7c98b6]">
                        {quote.status === "Sent"
                          ? "Awaiting countersignature from buyer via HubSpot E-Sign link…"
                          : "Publish quote to generate buyer signature link."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Metadata & Association Sidebar */}
            <div className="space-y-4">
              <Card title="Quote Details">
                <dl>
                  <Prop label="Quote Status">
                    <Tag tone={statusTone(quote.status)}>{quote.status}</Tag>
                  </Prop>
                  <Prop label="Associated Deal">
                    {deal ? (
                      <A to={`/deals/${deal.id}`} className="hs-link">
                        {deal.name}
                      </A>
                    ) : (
                      "—"
                    )}
                  </Prop>
                  <Prop label="Buyer Contact">
                    {buyer ? (
                      <A to={`/contacts/${buyer.id}`} className="hs-link">
                        {buyer.firstName} {buyer.lastName}
                      </A>
                    ) : (
                      "—"
                    )}
                  </Prop>
                  <Prop label="Net Total">{money2(totals.total)}</Prop>
                  {quote.sentAt ? <Prop label="Published">{date(quote.sentAt)}</Prop> : null}
                  {quote.acceptedAt ? <Prop label="Signed by buyer">{date(quote.acceptedAt)}</Prop> : null}
                </dl>
              </Card>
            </div>
          </div>
        </Ext>
      </div>
    </div>
  );
}
