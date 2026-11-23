"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useSeen, useShell } from "@/store/store";
import type { LeadItem } from "@/tenants/types";
import { Ext } from "../ext";
import { dateTime, money } from "../format";
import { A, Button, Modal, statusTone, Tag } from "../ui";
import { IndexPage, type Column, type View } from "./index-table";

export function LeadsPage() {
  const { pack, world, navigate, dispatch } = useShell();
  useSeen("seen.leads", true);

  const [qualifying, setQualifying] = useState<LeadItem | null>(null);
  const [outsideOwner, setOutsideOwner] = useState("sf-outside-rep");
  const [insideOwner, setInsideOwner] = useState("sf-inside-rep");

  const views: View<LeadItem>[] = [
    { id: "all", label: "All leads", filter: () => true },
    { id: "new", label: "New / Unassigned", filter: (l) => l.status === "New" || l.status === "Attempting" },
    { id: "qualified", label: "Qualified", filter: (l) => l.status === "Qualified" },
  ];

  const columns: Column<LeadItem>[] = [
    {
      id: "name",
      label: "Lead",
      sort: (l) => l.name,
      cell: (l) => <span className="font-semibold">{l.name}</span>,
    },
    { id: "company", label: "Company", cell: (l) => l.companyName },
    { id: "division", label: "Division", cell: (l) => l.division },
    { id: "segment", label: "Market Segment", cell: (l) => l.marketSegment },
    { id: "est", label: "Est. Value", align: "right", cell: (l) => money(l.estimatedAmount) },
    {
      id: "status",
      label: "Status",
      cell: (l) => <Tag tone={l.status === "Qualified" ? "green" : l.status === "New" ? "amber" : statusTone(l.status)}>{l.status}</Tag>,
    },
    { id: "created", label: "Received", cell: (l) => dateTime(l.createdAt) },
    {
      id: "action",
      label: "Action",
      cell: (l) =>
        l.convertedDealId ? (
          <A to={`/deals/${l.convertedDealId}`} className="hs-link font-semibold" data-testid={`lead-deal-link-${l.id}`}>
            Open deal →
          </A>
        ) : (
          <Button
            size="sm"
            variant="primary"
            data-testid={`qualify-lead-${l.id}`}
            onClick={() => {
              setQualifying(l);
            }}
          >
            Qualify &amp; create deal
          </Button>
        ),
    },
  ];

  function submitQualify() {
    if (!qualifying) return;
    const leadId = qualifying.id;
    dispatch({
      t: "lead.qualify",
      leadId,
      outsideSalesOwnerId: outsideOwner,
      insideSalesOwnerId: insideOwner,
      stage: "planning",
      at: nowMs(),
    });
    setQualifying(null);
    navigate(`/deals/dl-qual-${leadId}`);
  }

  return (
    <>
      <Ext id="nsm-lead-routing">
        <IndexPage
          title="Leads · NSM Inbound Triage"
          noun="lead"
          rows={world.leads}
          columns={columns}
          views={views}
          rowKey={(l) => l.id}
          searchText={(l) => `${l.name} ${l.companyName} ${l.division} ${l.marketSegment} ${l.inquirySummary}`}
        />
      </Ext>

      {qualifying ? (
        <Modal
          title={`Qualify Inbound Lead · ${qualifying.companyName}`}
          onClose={() => setQualifying(null)}
          testId="qualify-lead-modal"
          footer={
            <>
              <Button onClick={() => setQualifying(null)}>Cancel</Button>
              <Button variant="primary" onClick={submitQualify} data-testid="confirm-qualify-btn">
                Create Security Fence Deal
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-[13.5px]">
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <p className="font-semibold">
                {qualifying.contactName} · {qualifying.companyName} ({qualifying.marketSegment})
              </p>
              <p className="mt-1 text-[12.5px] text-ink-muted">{qualifying.inquirySummary}</p>
            </div>

            <label className="block space-y-1">
              <span className="font-semibold text-ink-muted">Outside Sales Rep (Territory Owner)</span>
              <select
                value={outsideOwner}
                onChange={(e) => setOutsideOwner(e.target.value)}
                data-testid="qualify-outside-owner"
                className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
              >
                {pack.personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-ink-muted">Inside Sales Coordinator</span>
              <select
                value={insideOwner}
                onChange={(e) => setInsideOwner(e.target.value)}
                data-testid="qualify-inside-owner"
                className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
              >
                {pack.personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
