import type { LineItem, Quote, QuoteStatus } from "@/tenants/types";

type Priced = Pick<Quote, "lineItems" | "discountPct">;

const round2 = (value: number) => Math.round(value * 100) / 100;

export function subtotal(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

export function costOf(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);
}

export function unitDiscountPct(quote: Priced, line: LineItem): number {
  return line.discountPct ?? quote.discountPct;
}

export function lineNet(quote: Priced, line: LineItem): number {
  return round2(line.qty * line.unitPrice * (1 - unitDiscountPct(quote, line) / 100));
}

export function quoteTotals(quote: Priced) {
  const sub = subtotal(quote.lineItems);
  const total = round2(quote.lineItems.reduce((sum, l) => sum + lineNet(quote, l), 0));
  const discount = round2(sub - total);
  const discountPct = sub > 0 ? round2((discount / sub) * 100) : 0;
  const cost = costOf(quote.lineItems);
  const marginPct = total > 0 ? ((total - cost) / total) * 100 : 0;
  const maxLead = quote.lineItems.reduce((max, l) => Math.max(max, l.leadDays), 0);
  return { subtotal: sub, discount, discountPct, total, cost, marginPct, maxLead };
}

export function quoteStatusLabel(status: QuoteStatus): string {
  return status === "Sent" ? "Published" : status;
}

export function quoteStatusColor(status: QuoteStatus): string {
  switch (status) {
    case "Accepted":
      return "#00bda5";
    case "Changes requested":
      return "#f2545b";
    case "Draft":
      return "#b0b9c6";
    default:
      return "#f5c26b";
  }
}
