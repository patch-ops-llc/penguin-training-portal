"use client";

import { PenguinMark } from "@/components/brand";
import { useShell } from "@/store/store";
import { Icon } from "./icons";
import { Button, Modal } from "./ui";

/**
 * Learner Completion Card shown upon finishing all required tasks in a module:
 * displays Completion Badge, Key Takeaways, AMICO Do's & Don'ts, Practice Again, and Next Module.
 */
export function CompletionCard() {
  const { pack, moduleId, moduleMeta, showMeCount, reset, switchModule, setCompletionOpen } = useShell();
  const modules = pack.track.modules;
  const idx = modules.findIndex((m) => m.id === moduleId);
  const nextMod = idx >= 0 && idx + 1 < modules.length ? modules[idx + 1] : null;

  return (
    <Modal
      title={`Module Completed · ${moduleMeta.code}`}
      onClose={() => setCompletionOpen(false)}
      width={780}
      testId="completion-card"
      footer={
        <>
          <a href="/launchpad" className="mr-auto text-[13.5px] font-semibold text-ink-muted hover:text-ink" data-testid="completion-launchpad-link">
            ← Back to Training Launchpad
          </a>
          <Button icon="reset" onClick={reset} data-testid="completion-practice-again">
            Practice again
          </Button>
          {nextMod ? (
            <Button variant="primary" onClick={() => switchModule(nextMod.id)} data-testid="completion-next-module">
              Next module: {nextMod.code} <Icon name="arrowRight" size={15} />
            </Button>
          ) : (
            <a
              href="/launchpad"
              className="inline-flex h-9 items-center rounded-[6px] bg-hs-orange px-4 text-[13.5px] font-semibold text-white hover:bg-hs-orange-strong"
            >
              Finish track
            </a>
          )}
        </>
      }
    >
      <div className="flex items-start justify-between gap-4 rounded-[10px] border border-[#b9e0c4] bg-[#eefaf1] px-4 py-3.5">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0b5b2b]">
            ✓ Saved to your {pack.portal.company} training record
          </p>
          <h3 className="mt-0.5 text-[17px] font-semibold text-ink">{moduleMeta.title}</h3>
          <p className="mt-0.5 text-[13px] text-ink-muted">{moduleMeta.objective}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0b5b2b] px-3 py-1 text-[12px] font-semibold text-white">
          <PenguinMark size={11} /> Completed
          {showMeCount > 0 ? ` (${showMeCount} assist${showMeCount === 1 ? "" : "s"})` : " · Hands-on"}
        </span>
      </div>

      {moduleMeta.takeaways.length > 0 ? (
        <section className="mt-4 rounded-[10px] border border-line p-4">
          <h4 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Key takeaways</h4>
          <ul className="mt-2.5 space-y-2 text-[13.5px]">
            {moduleMeta.takeaways.map((t, i) => (
              <li key={i} className="flex gap-2">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-[10px] border border-[#b9e0c4] bg-[#f7fcf8] p-4" data-testid="completion-dos">
          <h4 className="text-[13px] font-semibold text-[#0b5b2b]">Do&rsquo;s in HubSpot</h4>
          <ul className="mt-2.5 space-y-2 text-[13px]">
            {moduleMeta.dos.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-[#0b5b2b]">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[10px] border border-[#f3b4b4] bg-[#fdf6f6] p-4" data-testid="completion-donts">
          <h4 className="text-[13px] font-semibold text-[#99201a]">Don&rsquo;ts &amp; guardrails</h4>
          <ul className="mt-2.5 space-y-2 text-[13px]">
            {moduleMeta.donts.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-[#99201a]">✕</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
