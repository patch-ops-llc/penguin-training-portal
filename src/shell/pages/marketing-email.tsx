"use client";

import { useMemo, useState } from "react";
import { useSeen, useShell } from "@/store/store";
import { AMICO_MARKETING_EMAILS } from "../email-data";
import { Icon } from "../icons";
import { Button, Card, Empty, Tag, cx } from "../ui";

type EmailTab = "all" | "sent" | "scheduled" | "draft";

const TABS: { id: EmailTab; label: string }[] = [
  { id: "all", label: "All emails" },
  { id: "sent", label: "Sent" },
  { id: "scheduled", label: "Scheduled" },
  { id: "draft", label: "Draft" },
];

export function MarketingEmailIndex() {
  const { dispatch } = useShell();
  useSeen("seen.marketing.email");
  const [tab, setTab] = useState<EmailTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draftName, setDraftName] = useState("AMICO Industrials — Year-End Stock Promo");

  const rows = useMemo(() => {
    if (tab === "all") return AMICO_MARKETING_EMAILS;
    if (tab === "sent") return AMICO_MARKETING_EMAILS.filter((e) => e.status === "Sent");
    if (tab === "scheduled") return AMICO_MARKETING_EMAILS.filter((e) => e.status === "Scheduled");
    return AMICO_MARKETING_EMAILS.filter((e) => e.status === "Draft");
  }, [tab]);

  const selected = selectedId ? AMICO_MARKETING_EMAILS.find((e) => e.id === selectedId) : null;

  const selectTab = (next: EmailTab) => {
    setTab(next);
    dispatch({ t: "flag", k: `marketing.email.tab.${next}` });
  };

  const inspectRow = (id: string) => {
    setSelectedId(id);
    dispatch({ t: "flag", k: `marketing.email.campaign.${id}` });
    dispatch({ t: "flag", k: "marketing.email.campaignViewed" });
  };

  const createDraft = () => {
    dispatch({ t: "marketing.email.createDraft", name: draftName.trim() || draftName });
    setShowCreate(false);
    setTab("draft");
    dispatch({ t: "flag", k: "marketing.email.draftCreated" });
  };

  return (
    <div className="min-h-full bg-[#f0f0f0]" data-testid="marketing-email-page">
      <header className="border-b border-[#cbd6e2] bg-[#333333] px-6 py-3.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7fd1de]">Marketing</p>
            <h1 className="text-[20px] font-bold">Email</h1>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon="email"
            onClick={() => setShowCreate(true)}
            data-testid="marketing-create-email"
          >
            Create email
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-1 rounded-[4px] border border-[#cbd6e2] bg-white p-1" data-testid="marketing-email-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`marketing-tab-${t.id}`}
              onClick={() => selectTab(t.id)}
              className={cx(
                "rounded-[3px] px-3.5 py-1.5 text-[13px] font-semibold",
                tab === t.id ? "bg-[#00494b] text-white" : "text-[#33475b] hover:bg-[#e6f7f7]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className="overflow-hidden !p-0">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-[#f5f8fa] text-[11px] font-semibold uppercase tracking-wide text-[#516f90]">
              <tr>
                <th className="px-4 py-2.5">Email name</th>
                <th className="px-4 py-2.5">Division</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Recipients</th>
                <th className="px-4 py-2.5">Open rate</th>
                <th className="px-4 py-2.5">Click rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <Empty title="No emails in this tab">Switch tabs or create a new marketing email.</Empty>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-t border-[#eaf0f6] hover:bg-[#f5f8fa]"
                    data-testid={`marketing-email-row-${row.id}`}
                    onClick={() => inspectRow(row.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-[#006162]">{row.name}</td>
                    <td className="px-4 py-3 text-[#33475b]">{row.division}</td>
                    <td className="px-4 py-3">
                      <Tag tone={row.status === "Sent" ? "green" : row.status === "Scheduled" ? "amber" : "neutral"}>
                        {row.status}
                      </Tag>
                    </td>
                    <td className="px-4 py-3 text-[#33475b]">{row.recipients > 0 ? row.recipients.toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-[#33475b]">{row.status === "Sent" ? `${row.openRate}%` : "—"}</td>
                    <td className="px-4 py-3 text-[#33475b]">{row.status === "Sent" ? `${row.clickRate}%` : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        {selected ? (
          <Card data-testid="marketing-email-preview">
            <MarketingEmailPreview selected={selected} />
          </Card>
        ) : null}
      </div>

      {showCreate ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#33475b]/55 p-4"
          data-testid="marketing-email-create-modal"
        >
          <MarketingEmailEditor
            draftName={draftName}
            onNameChange={setDraftName}
            onCancel={() => setShowCreate(false)}
            onSave={createDraft}
          />
        </div>
      ) : null}
    </div>
  );
}

function MarketingEmailPreview({
  selected,
}: {
  selected: (typeof AMICO_MARKETING_EMAILS)[number];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[#33475b]">{selected.name}</h2>
          <p className="mt-0.5 text-[12px] text-[#516f90]">{selected.division} · Marketing email</p>
        </div>
        <Tag tone="teal">{selected.status}</Tag>
      </div>
      {selected.status === "Sent" ? (
        <dl className="grid grid-cols-3 gap-3 text-[12px]">
          <Metric label="Delivered" value={selected.recipients.toLocaleString()} />
          <Metric label="Open rate" value={`${selected.openRate}%`} testId="marketing-metric-open-rate" />
          <Metric label="Click rate" value={`${selected.clickRate}%`} testId="marketing-metric-click-rate" />
        </dl>
      ) : null}
      <div className="rounded border border-[#dfe3eb] bg-[#fafbfc] p-4">
        <div className="mx-auto max-w-[520px] rounded border border-[#cbd6e2] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 border-b border-[#eaf0f6] pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#00494b] text-[11px] font-bold text-white">
              AM
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#33475b]">AMICO Global</p>
              <p className="text-[11px] text-[#516f90]">news@amicoglobal.com</p>
            </div>
          </div>
          <p className="text-[14px] font-semibold text-[#33475b]">{selected.name}</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#33475b]">
            Preview of the AMICO marketing email body. Recipients see division-specific product imagery, CTA buttons, and
            unsubscribe links consistent with HubSpot Marketing Email.
          </p>
          <span className="mt-4 inline-block rounded bg-[#006162] px-3 py-1.5 text-[12px] font-semibold text-white">
            View product catalog
          </span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="rounded border border-[#eaf0f6] bg-[#f5f8fa] px-3 py-2" data-testid={testId}>
      <dt className="text-[11px] font-medium text-[#516f90]">{label}</dt>
      <dd className="text-[18px] font-bold text-[#00494b]">{value}</dd>
    </div>
  );
}

function MarketingEmailEditor({
  draftName,
  onNameChange,
  onCancel,
  onSave,
}: {
  draftName: string;
  onNameChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="w-full max-w-[640px] rounded-[6px] border border-[#cbd6e2] bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-[#dfe3eb] bg-[#333333] px-4 py-3 text-white">
        <span className="text-[14px] font-semibold">Create marketing email</span>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded p-1 hover:bg-white/15">
          <Icon name="close" size={16} />
        </button>
      </header>
      <div className="space-y-3 p-5">
        <label className="block text-[12px]">
          <span className="font-medium text-[#516f90]">Internal email name</span>
          <input
            value={draftName}
            onChange={(e) => onNameChange(e.target.value)}
            data-testid="marketing-draft-name-input"
            className="hs-input mt-1 w-full !bg-white"
          />
        </label>
        <div className="rounded border border-dashed border-[#cbd6e2] bg-[#f5f8fa] p-8 text-center text-[12.5px] text-[#516f90]">
          Drag HubSpot modules here (hero, text, CTA). Training preview only — publish saves as Draft.
        </div>
      </div>
      <footer className="flex justify-end gap-2 border-t border-[#dfe3eb] bg-[#f5f8fa] px-5 py-3">
        <Button size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} data-testid="marketing-save-draft">
          Save as draft
        </Button>
      </footer>
    </div>
  );
}