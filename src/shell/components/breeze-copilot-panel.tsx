"use client";

import { useState } from "react";
import { AiPill } from "../ui";
import { Icon } from "../icons";
import { useShell } from "@/store/store";

const SUGGESTED = [
  "Summarize this account's cross-division activity",
  "How do I send a quote for my division?",
  "Why can't I merge duplicate contacts?",
  "Draft a quote follow-up email",
] as const;

const REPLIES: Record<string, string> = {
  "Summarize this account's cross-division activity":
    "Check the Cross-Division Activity Card on the Parent Company before outreach. AMICO shares Companies and Contacts across divisions; deals stay division-scoped. Coordinate with the most recent division owner listed on the card.",
  "How do I send a quote for my division?":
    "Industrials, Building Products, and Security Mesh use native HubSpot Quotes with Oracle SKU pricing. Security Fence and Architecture use the Estimating Workbook → Quote Ingestion Tool. AMF uses Paperless Parts. APC and Diamond quotes flow from MS Access/Epicor — never edit synced fields in HubSpot.",
  "Why can't I merge duplicate contacts?":
    "Email is the unique key on Contacts. HubSpot blocks duplicate emails so Pipedrive/Epicor history stays intact. Open the existing contact or flag legacy duplicates (missing domain) to your NSM or Penguin — do not merge manually.",
  "Draft a quote follow-up email":
    "Log email from the Deal record so Company, Contact, and Deal associations attach automatically. Mention quote number, revision, and follow-up date. Set a Task due in 3 business days if no buyer reply.",
};

export function BreezeCopilotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { persona, dispatch } = useShell();
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);

  if (!open) return null;

  function ask(text: string) {
    setPrompt(text);
    const grounded =
      REPLIES[text] ??
      "For AMICO: search HubSpot before creating records, respect division deal ownership, and use the Training Portal Guide drawer for step-by-step checklists. Escalate duplicate merges and ERP quote edits to your NSM.";
    setReply(grounded);
    dispatch({ t: "flag", k: "breeze.asked" });
  }

  return (
    <div className="fixed inset-0 z-[72] flex justify-end" data-testid="breeze-copilot-panel">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close Breeze Assistant" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#dfe3eb] px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="sparkle" size={16} className="text-[#ff8fb1]" />
            <span className="text-[15px] font-semibold text-[#33475b]">Breeze Assistant</span>
            <AiPill />
          </div>
          <button type="button" onClick={onClose} data-testid="breeze-panel-close" className="text-[12px] font-semibold text-[#516f90]">
            Close
          </button>
        </header>
        <div className="hs-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[13px]">
          <p className="text-[#516f90]">
            Copilot for <strong className="text-[#33475b]">{persona.name}</strong> ({persona.division})
          </p>
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#7c98b6]">Suggested prompts</p>
            {SUGGESTED.map((s, idx) => (
              <button
                key={s}
                type="button"
                data-testid={`breeze-suggest-${idx}`}
                onClick={() => ask(s)}
                className="block w-full rounded-lg border border-[#dfe3eb] bg-[#f5f8fa] px-3 py-2 text-left text-[12.5px] hover:border-[#00a4bd]"
              >
                {s}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-semibold text-[#516f90]">Ask Breeze</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              data-testid="breeze-prompt"
              className="w-full rounded-md border border-[#cbd6e2] px-3 py-2 text-[13px]"
              placeholder="Type a question about AMICO HubSpot rules…"
            />
          </label>
          <button
            type="button"
            onClick={() => ask(prompt.trim() || SUGGESTED[0])}
            data-testid="breeze-submit"
            className="w-full rounded-md bg-[#ff5c35] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#e84b27]"
          >
            Send to Breeze
          </button>
          {reply ? (
            <div className="rounded-lg border border-[#dfe3eb] bg-[#e6f7f7] p-3 text-[13px]" data-testid="breeze-reply">
              {reply}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}