"use client";

import { useShell } from "@/store/store";
import type { Segment } from "@/tenants/types";
import { date } from "../format";
import { Icon } from "../icons";
import { A, Card, Empty, Tag } from "../ui";
import { IndexPage, type Column, type View } from "./index-table";

export function SegmentsIndex() {
  const { world } = useShell();

  const views: View<Segment>[] = [
    { id: "all", label: "All segments", filter: () => true },
    { id: "active", label: "Active lists", filter: (s) => s.kind === "Active" },
    { id: "static", label: "Static lists", filter: (s) => s.kind === "Static" },
  ];

  const columns: Column<Segment>[] = [
    {
      id: "name",
      label: "Segment (List) Name",
      sort: (s) => s.name,
      cell: (s) => (
        <A to={`/segments/${s.id}`} className="hs-link font-semibold" data-testid={`segment-link-${s.id}`}>
          {s.name}
        </A>
      ),
    },
    { id: "object", label: "Object", cell: (s) => s.objectType },
    { id: "kind", label: "Type", cell: (s) => <Tag tone={s.kind === "Active" ? "teal" : "neutral"}>{s.kind}</Tag> },
    { id: "division", label: "Division", cell: (s) => s.division },
    { id: "size", label: "Size", align: "right", sort: (s) => s.memberIds.length, cell: (s) => s.memberIds.length },
    { id: "filter", label: "Criteria Summary", cell: (s) => <span className="text-[12.5px] text-ink-muted">{s.filterSummary}</span> },
    { id: "updated", label: "Updated", cell: (s) => date(s.updatedAt) },
  ];

  return (
    <IndexPage
      title="Segments (Lists)"
      noun="segment"
      rows={world.segments}
      columns={columns}
      views={views}
      rowKey={(s) => s.id}
      searchText={(s) => `${s.name} ${s.division} ${s.filterSummary}`}
    />
  );
}

export function SegmentRecord({ id }: { id: string }) {
  const { world } = useShell();
  const seg = world.segments.find((s) => s.id === id);

  if (!seg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Segment not found">
            <A to="/segments" className="hs-link">
              Back to Segments (Lists)
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6" data-testid="segment-record">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <A to="/segments" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
            <Icon name="chevronLeft" size={14} /> Segments (Lists)
          </A>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-[20px] font-semibold">{seg.name}</h1>
            <Tag tone={seg.kind === "Active" ? "teal" : "neutral"}>{seg.kind} segment</Tag>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            {seg.objectType} list · {seg.division} · Filter: {seg.filterSummary}
          </p>
        </div>
        <Tag tone="blue">{seg.memberIds.length} records</Tag>
      </header>

      <Card title={`Sample ${seg.objectType} Members in Segment`}>
        <div className="space-y-2 text-[13.5px]">
          {seg.memberIds.map((mid) => {
            const c = world.contacts.find((x) => x.id === mid);
            const co = world.companies.find((x) => x.id === mid);
            const dl = world.deals.find((x) => x.id === mid);
            if (c) {
              return (
                <div key={mid} className="flex items-center justify-between rounded border border-line-soft px-3.5 py-2">
                  <A to={`/contacts/${c.id}`} className="hs-link font-semibold">
                    {c.firstName} {c.lastName}
                  </A>
                  <span className="text-ink-muted">{c.email}</span>
                </div>
              );
            }
            if (co) {
              return (
                <div key={mid} className="flex items-center justify-between rounded border border-line-soft px-3.5 py-2">
                  <A to={`/companies/${co.id}`} className="hs-link font-semibold">
                    {co.name}
                  </A>
                  <span className="text-ink-muted">{co.crossDivision?.primaryDivision ?? co.industry}</span>
                </div>
              );
            }
            if (dl) {
              return (
                <div key={mid} className="flex items-center justify-between rounded border border-line-soft px-3.5 py-2">
                  <A to={`/deals/${dl.id}`} className="hs-link font-semibold">
                    {dl.name}
                  </A>
                  <span className="text-ink-muted">{dl.stage}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </Card>
    </div>
  );
}
