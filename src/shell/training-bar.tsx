"use client";

import { useEffect } from "react";
import { PenguinMark } from "@/components/brand";
import { stepText } from "@/curriculum";
import { useShell } from "@/store/store";
import { Icon } from "./icons";
import { cx, Menu, MenuItem } from "./ui";

const barButton =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[8px] px-3 text-[13.5px] font-semibold text-white/90 hover:bg-white/10 disabled:text-white/35 disabled:hover:bg-transparent";
const wideOnly = "hidden min-[1340px]:inline";
const yieldFirst = "shrink-[1000000000]";
const yieldNext = "shrink-[1000000]";
const stepTitle = "line-clamp-2 text-[14.5px] font-semibold";
const stepHint = "mt-0.5 block w-0 min-w-full truncate text-[12.5px] text-white/75";

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable));
}

/**
 * Interactive learner Training Bar anchored at the bottom of the sandbox.
 * Auto-advances when the learner completes each task organically in HubSpot, while keeping
 * "Show me" available on every step to demonstrate the action and record `usedShowMeCount`.
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
        title="Show training bar (B)"
        data-testid="training-bar-show"
        className="fixed bottom-2 right-2 z-[60] inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1340] text-white opacity-60 shadow hover:opacity-100"
      >
        <PenguinMark size={13} />
      </button>
    );
  }

  return (
    <div
      className="relative z-[60] flex h-[62px] shrink-0 items-center gap-1.5 border-t-2 border-[#6f55e8] bg-[#1c1340] px-4 text-white shadow-[0_-6px_18px_rgba(28,19,64,0.22)]"
      style={{ fontFamily: "var(--font-penguin)" }}
      data-testid="training-bar"
    >
      <a
        href="/launchpad"
        title="Exit to Training Launchpad"
        data-testid="training-launchpad-link"
        className={cx("mr-1 flex min-w-5 items-center gap-2 rounded-md px-2 py-1 text-[12.5px] text-white/80 hover:bg-white/10", yieldFirst)}
      >
        <PenguinMark size={19} className="shrink-0 text-white" />
        <span className="hidden min-w-0 truncate min-[1520px]:block">Launchpad</span>
      </a>

      <Menu
        up
        width={340}
        className={cx("flex min-w-[120px]", yieldNext)}
        menuClassName="hs-scroll max-h-[420px] overflow-y-auto"
        menuTestId="module-switcher-menu"
        button={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            title="Switch module in this track"
            className={cx(barButton, "min-w-0 !shrink border border-white/30 bg-white/[0.14] !text-white hover:!bg-white/20")}
            data-testid="module-switcher"
          >
            <span className="max-w-[210px] min-w-0 truncate">
              {moduleMeta.code}: {moduleMeta.title}
            </span>
            <Icon name="chevronDown" size={16} className="shrink-0" />
          </button>
        )}
      >
        {(close) => (
          <div>
            <p className="px-3.5 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
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
                <span className="block truncate text-[11.5px] font-normal text-ink-muted">~{m.minutes} min</span>
              </MenuItem>
            ))}
          </div>
        )}
      </Menu>

      <div className="mx-2.5 flex min-w-0 flex-[1_1_auto] items-center gap-3" data-testid="training-step">
        <span
          className={cx(
            "shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold leading-none",
            complete ? "bg-[#0b5b2b] text-white" : "bg-[#6f55e8] text-white",
          )}
          data-testid="training-step-count"
        >
          {step ? `Task ${stepIndex + 1} of ${total}` : "Completed"}
        </span>
        <p className="min-w-0 flex-[1_1_auto] leading-tight" title={step && text ? `${text.title}. ${text.hint}` : undefined}>
          {step && text ? (
            <>
              <span className={stepTitle} data-testid="training-step-title">
                {text.title}
                {step.optional ? <span className="font-normal text-white/65"> (optional)</span> : null}
              </span>
              <span className={stepHint} data-testid="training-step-hint">
                {text.hint}
              </span>
            </>
          ) : (
            <>
              <span className={stepTitle} data-testid="training-step-title">
                Module complete — great work!
              </span>
              <span className={stepHint}>Review AMICO takeaways &amp; Do&rsquo;s and Don&rsquo;ts, or continue to the next module.</span>
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        className={barButton}
        onClick={back}
        disabled={stepIndex === 0}
        title="Undo back one task (Left arrow)"
        data-testid="training-back"
      >
        <Icon name="arrowLeft" size={16} /> Back
      </button>

      {step ? (
        <button
          type="button"
          className={cx(
            barButton,
            "border border-white/35 bg-white/[0.16] px-4 text-[13.5px] font-semibold !text-white hover:!bg-white/25",
          )}
          onClick={showMe}
          title="Perform this step for me in the sandbox"
          data-testid="training-show-me"
        >
          Show me <Icon name="arrowRight" size={15} strokeWidth={2.1} />
        </button>
      ) : null}

      {complete ? (
        <button
          type="button"
          className={cx(barButton, "bg-hs-orange px-4 text-[14px] font-bold !text-white hover:!bg-hs-orange-strong")}
          onClick={() => setCompletionOpen(true)}
          data-testid="training-finish-review"
        >
          Finish &amp; Review
        </button>
      ) : null}

      <span className="mx-1 h-7 w-px bg-white/20" aria-hidden="true" />

      <Menu
        up
        align="right"
        width={260}
        className={cx("flex min-w-[76px]", yieldNext)}
        button={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            className={cx(barButton, "min-w-0 !shrink")}
            title="Switch active HubSpot role / persona"
            data-testid="view-as"
          >
            <Icon name="eye" size={16} className="shrink-0" />
            <span className="max-w-[210px] min-w-0 truncate">
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
              <span className="block">{p.viewAs}</span>
              <span className="block text-[12px] font-normal text-ink-muted">
                {p.name} · {p.division}
              </span>
            </MenuItem>
          ))
        }
      </Menu>

      <button
        type="button"
        className={cx(barButton, highlight && "bg-penguin !text-white")}
        onClick={toggleHighlight}
        aria-pressed={highlight}
        title="Spotlight AMICO rules & Penguin CRM extensions on this screen (H)"
        data-testid="training-highlight"
      >
        <Icon name="highlight" size={16} /> <span className={wideOnly}>Coaching</span>
      </button>

      <button
        type="button"
        className={barButton}
        onClick={reset}
        title="Reset module sandbox (R)"
        data-testid="training-reset"
      >
        <Icon name="reset" size={16} /> <span className={wideOnly}>Reset</span>
      </button>
    </div>
  );
}
