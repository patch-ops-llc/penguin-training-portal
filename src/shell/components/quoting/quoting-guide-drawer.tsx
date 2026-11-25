"use client";

import { useEffect } from "react";
import { quotingGuideForTrack } from "@/curriculum/amico/quoting";
import { useShell } from "@/store/store";
import { cx } from "../../ui";

export function QuotingGuideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pack } = useShell();
  const guide = quotingGuideForTrack(pack.track);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !guide) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" data-testid="quoting-guide-drawer">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close quoting guide reference" onClick={onClose} />
      <aside
        role="dialog"
        aria-labelledby="quoting-guide-title"
        className="relative flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-white shadow-2xl"
      >
        <header className="border-b border-[#dfe3eb] bg-[#f5f8fa] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#516f90]">Quoting Guide Reference</p>
              <h2 id="quoting-guide-title" className="mt-1 text-[18px] font-semibold text-[#33475b]">
                {guide.division}
              </h2>
              <p className="mt-1 text-[12.5px] text-[#516f90]">{guide.pipeline} · {guide.quotingSystem}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="quoting-guide-close"
              className="rounded-md border border-[#cbd6e2] px-2.5 py-1 text-[12px] font-semibold text-[#33475b] hover:bg-white"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-[#7c98b6]">{guide.sourceNote}</p>
        </header>
        <div className="hs-scroll flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-[#33475b]">
          <Section title="Before you quote" items={guide.beforeYouQuote} />
          <Section title="Create a quote" items={guide.createQuote} />
          <Section title="View & manage" items={guide.viewAndManage} />
          <Section title="Automation & tasks" items={guide.automationAndTasks} />
          {guide.quickReference.map((block) => (
            <QuickRefBlock key={block.title} title={block.title} items={block.bullets} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mb-5">
      <h3 className="text-[13.5px] font-semibold text-[#0091ae]">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] text-[#33475b]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function QuickRefBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className={cx("mb-5 rounded-lg border border-[#dfe3eb] bg-[#f5f8fa] p-3.5")}>
      <h3 className="text-[13px] font-semibold text-[#33475b]">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] text-[#516f90]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}