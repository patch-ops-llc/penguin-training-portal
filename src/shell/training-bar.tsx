"use client";

import { useEffect, useState } from "react";
import { QuotingGuideDrawer } from "./components/quoting/quoting-guide-drawer";
import { PenguinMark } from "@/components/brand";
import { stepText } from "@/curriculum";
import { useShell } from "@/store/store";
import { Icon } from "./icons";
import { cx, Menu, MenuItem } from "./ui";

const hudButton =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-semibold text-white/90 hover:bg-white/12 disabled:text-white/35 disabled:hover:bg-transparent";
const wideOnly = "hidden min-[1360px]:inline";
const yieldFirst = "shrink-[1000000000]";
const yieldNext = "shrink-[1000000]";

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable));
}

/**
 * Floating Penguin Training Coach HUD — deliberately styled in Penguin Strategies' deep royal-purple/indigo
 * palette with a "TRAINING GUIDE" badge and minimize toggle so learners never confuse training chrome with HubSpot.
 */
export function TrainingBar() {
  const {
    pack,
    world,
    moduleId,
    moduleMeta,
    script,
    stepIndex,
    complete,
    persona,
    showMe,
    back,
    reset,
    switchModule,
    viewAs,
    highlight,
    toggleHighlight,
    barHidden,
    toggleBar,
    setCompletionOpen,
  } = useShell();

  const [quotingGuideOpen, setQuotingGuideOpen] = useState(false);
  const showQuotingReference = pack.track.category === "division-quoting";

  const total = script.steps.length;
  const step = stepIndex < total ? script.steps[stepIndex] : null;
  const text = step ? stepText(step, { w: world, pack }) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "ArrowLeft") back();
      else if (e.key === "r" || e.key === "R") reset();
      else if (e.key === "h" || e.key === "H") toggleHighlight();
      else if (e.key === "b" || e.key === "B") toggleBar();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [back, reset, toggleHighlight, toggleBar]);

  if (barHidden) {
    return (
      <button
        type="button"
        onClick={toggleBar}
        title="Expand Penguin Training Guide (B)"
        data-testid="training-bar-show"
        className="penguin-hud-shell fixed bottom-3 right-4 z-[65] inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[12px] font-semibold text-white hover:brightness-110"
      >
        <PenguinMark size={14} />
        <span>TRAINING GUIDE</span>
        <span className="rounded-full bg-[#6f55e8] px-2 py-0.5 text-[11px]">
          {step ? `${stepIndex + 1}/${total}` : "✓"}
        </span>
      </button>
    );
  }

  return (
    <div className="shrink-0 bg-[#333333] px-3 pb-2 pt-1.5">
      <div
        className="penguin-hud-shell relative z-[60] flex min-h-[56px] items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-white"
        data-testid="training-bar"
      >
        {/* Penguin Training Guide Identity Pill + Exit */}
        <a
          href="/launchpad"
          title="Exit to Penguin Training Launchpad"
          data-testid="training-launchpad-link"
          className={cx(
            "flex items-center gap-2 rounded-[6px] border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#dfd8ff] hover:bg-white/[0.16]",
            yieldFirst,
          )}
        >
          <PenguinMark size={15} className="shrink-0 text-white" />
          <span>TRAINING GUIDE</span>
        </a>

        {/* Module Switcher */}
        <Menu
          up
          width={350}
          className={cx("flex min-w-[110px]", yieldNext)}
          menuClassName="hs-scroll max-h-[420px] overflow-y-auto"
          menuTestId="module-switcher-menu"
          button={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              title="Switch training module"
              className={cx(hudButton, "min-w-0 !shrink border border-white/25 bg-white/[0.10] !text-white hover:!bg-white/20")}
              data-testid="module-switcher"
            >
              <span className="max-w-[190px] min-w-0 truncate">
                {moduleMeta.code}: {moduleMeta.title}
              </span>
              <Icon name="chevronDown" size={14} className="shrink-0" />
            </button>
          )}
        >
          {(close) => (
            <div>
              <p className="px-3.5 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#516f90]">
                {pack.track.title}
              </p>
              {pack.track.modules.map((m) => (
                <MenuItem
                  key={m.id}
                  active={m.id === moduleId}
                  testId={`switch-module-${m.id}`}
                  onClick={() => {
                    close();
                    switchModule(m.id);
                  }}
                >
                  <span className="block truncate font-semibold">
                    {m.code} · {m.title}
                  </span>
                  <span className="block truncate text-[11.5px] font-normal text-[#516f90]">~{m.minutes} min</span>
                </MenuItem>
              ))}
            </div>
          )}
        </Menu>

        {/* Step Progress & Coaching Prompt */}
        <div className="mx-2 flex min-w-0 flex-[1_1_auto] items-center gap-2.5" data-testid="training-step">
          <span
            className={cx(
              "shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold leading-none",
              complete ? "bg-[#00a4bd] text-white" : "bg-[#6f55e8] text-white",
            )}
            data-testid="training-step-count"
          >
            {step ? `Task ${stepIndex + 1} of ${total}` : "Completed"}
          </span>
          <p className="min-w-0 flex-[1_1_auto] leading-tight" title={step && text ? `${text.title}. ${text.hint}` : undefined}>
            {step && text ? (
              <>
                <span className="line-clamp-1 text-[13.5px] font-semibold text-white" data-testid="training-step-title">
                  {text.title}
                  {step.optional ? <span className="font-normal text-white/65"> (optional)</span> : null}
                </span>
                <span className="mt-0.5 block w-0 min-w-full truncate text-[12px] text-[#d5ccff]" data-testid="training-step-hint">
                  {text.hint}
                </span>
              </>
            ) : (
              <>
                <span className="line-clamp-1 text-[13.5px] font-semibold text-white" data-testid="training-step-title">
                  Module complete — great work!
                </span>
                <span className="mt-0.5 block w-0 min-w-full truncate text-[12px] text-[#d5ccff]">
                  Review AMICO takeaways &amp; Do&rsquo;s and Don&rsquo;ts, or continue to the next module.
                </span>
              </>
            )}
          </p>
        </div>

        {/* Navigation & Show-Me Controls */}
        <button
          type="button"
          className={hudButton}
          onClick={back}
          disabled={stepIndex === 0}
          title="Undo back one task (Left arrow)"
          data-testid="training-back"
        >
          <Icon name="arrowLeft" size={14} /> Back
        </button>

        {step ? (
          <button
            type="button"
            className={cx(
              hudButton,
              "border border-[#a594ff]/60 bg-[#6f55e8] px-3.5 text-[12.5px] font-semibold !text-white hover:!bg-[#5d42dc]",
            )}
            onClick={showMe}
            title="Demonstrate this step in HubSpot"
            data-testid="training-show-me"
          >
            Show me <Icon name="arrowRight" size={14} strokeWidth={2.1} />
          </button>
        ) : null}

        {complete ? (
          <button
            type="button"
            className={cx(hudButton, "bg-[#00a4bd] px-3.5 text-[13px] font-bold !text-white hover:!bg-[#008da3]")}
            onClick={() => setCompletionOpen(true)}
            data-testid="training-finish-review"
          >
            Finish &amp; Review
          </button>
        ) : null}

        <span className="mx-0.5 h-6 w-px bg-white/20" aria-hidden="true" />

        {/* Active HubSpot Role Switcher */}
        <Menu
          up
          align="right"
          width={265}
          className={cx("flex min-w-[72px]", yieldNext)}
          button={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className={cx(hudButton, "min-w-0 !shrink")}
              title="Switch simulated HubSpot role / persona"
              data-testid="view-as"
            >
              <Icon name="eye" size={15} className="shrink-0 text-[#c4b5fd]" />
              <span className="max-w-[190px] min-w-0 truncate">
                <span className={wideOnly}>Role: </span>
                {persona.viewAs}
              </span>
            </button>
          )}
        >
          {(close) =>
            pack.personas.map((p) => (
              <MenuItem
                key={p.id}
                active={p.id === persona.id}
                testId={`view-as-${p.id}`}
                onClick={() => {
                  close();
                  viewAs(p.id);
                }}
              >
                <span className="block font-semibold">{p.viewAs}</span>
                <span className="block text-[11.5px] font-normal text-[#516f90]">
                  {p.name} · {p.division}
                </span>
              </MenuItem>
            ))
          }
        </Menu>

        {showQuotingReference ? (
          <button
            type="button"
            className={cx(hudButton, quotingGuideOpen && "bg-[#6f55e8] !text-white")}
            onClick={() => setQuotingGuideOpen(true)}
            title="Open division Quoting Guide reference"
            data-testid="quoting-guide-open"
          >
            <Icon name="book" size={14} /> <span className={wideOnly}>Guide</span>
          </button>
        ) : null}

        <button
          type="button"
          className={cx(hudButton, highlight && "bg-[#6f55e8] !text-white")}
          onClick={toggleHighlight}
          aria-pressed={highlight}
          title="Spotlight AMICO rules & Penguin CRM extensions on screen (H)"
          data-testid="training-highlight"
        >
          <Icon name="highlight" size={14} /> <span className={wideOnly}>Coaching</span>
        </button>

        <button
          type="button"
          className={hudButton}
          onClick={reset}
          title="Reset module sandbox (R)"
          data-testid="training-reset"
        >
          <Icon name="reset" size={14} /> <span className={wideOnly}>Reset</span>
        </button>

        <button
          type="button"
          onClick={toggleBar}
          title="Minimize Penguin Training Guide (B)"
          aria-label="Minimize Penguin Training Guide"
          data-testid="training-bar-minimize"
          className="ml-0.5 inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-white/70 hover:bg-white/12 hover:text-white"
        >
          <Icon name="minimize" size={14} />
        </button>
      </div>
      <QuotingGuideDrawer open={quotingGuideOpen} onClose={() => setQuotingGuideOpen(false)} />
    </div>
  );
}
