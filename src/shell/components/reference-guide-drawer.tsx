"use client";

import { useEffect, useMemo } from "react";
import { referenceGuideForModule } from "@/curriculum/reference-guides";
import { useShell } from "@/store/store";
import { useLocaleOptional } from "../locale";
import { cx } from "../ui";

export function ReferenceGuideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pack, moduleMeta } = useShell();
  const { t } = useLocaleOptional();
  const guide = useMemo(() => referenceGuideForModule(pack, moduleMeta), [pack, moduleMeta]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isQuoting = pack.track.category === "division-quoting";

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" data-testid="reference-guide-drawer">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close reference guide" onClick={onClose} />
      <aside
        role="dialog"
        aria-labelledby="reference-guide-title"
        className="relative flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-white shadow-2xl"
      >
        <header className="border-b border-[#dfe3eb] bg-[#f5f8fa] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#516f90]">
                {isQuoting ? "Quoting Guide Reference" : "AMICO Reference Guide"}
              </p>
              <h2 id="reference-guide-title" className="mt-1 text-[18px] font-semibold text-[#33475b]">
                {guide.moduleCode} · {guide.moduleTitle}
              </h2>
              <p className="mt-1 text-[12.5px] text-[#516f90]">
                {guide.trackTitle} · {guide.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="reference-guide-close"
              className="rounded-md border border-[#cbd6e2] px-2.5 py-1 text-[12px] font-semibold text-[#33475b] hover:bg-white"
            >
              {t.close}
            </button>
          </div>
        </header>
        <div className="hs-scroll flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-[#33475b]">
          <Section title={t.checklist} items={guide.checklist} ordered dataTestId="reference-checklist" />
          <Section title={t.beforeYouStart} items={guide.beforeYouStart} />
          <Section title={t.howItWorks} items={guide.howItWorks} />
          <Section title={t.dosDonts} items={guide.dosDontsAutomations} />
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  items,
  ordered,
  dataTestId,
}: {
  title: string;
  items: string[];
  ordered?: boolean;
  dataTestId?: string;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <section className="mb-5" data-testid={dataTestId}>
      <h3 className="text-[13.5px] font-semibold text-[#0091ae]">{title}</h3>
      <Tag className={cx("mt-2 space-y-1.5 pl-5 text-[13px] text-[#33475b]", ordered ? "list-decimal" : "list-disc")}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Tag>
    </section>
  );
}

/** @deprecated Use ReferenceGuideDrawer — kept for quoting test id alias */
export function QuotingGuideDrawer(props: { open: boolean; onClose: () => void }) {
  return <ReferenceGuideDrawer {...props} />;
}