"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { queryTourElement, tourAnchorsForStep } from "@/curriculum/tour-targets";
import { stepText } from "@/curriculum";
import { useShell } from "@/store/store";
import { useLocaleOptional } from "./locale";

const HIGHLIGHT_CLASS = "tour-spotlight-target";

function clearHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
}

export function SpotlightTour({
  minimized,
  onToggleMinimize: _onToggleMinimize,
}: {
  minimized: boolean;
  onToggleMinimize: () => void;
}) {
  const { script, stepIndex, moduleId, showMe, world, pack } = useShell();
  const { t } = useLocaleOptional();
  const total = script.steps.length;
  const step = stepIndex < total ? script.steps[stepIndex] : null;
  const text = step ? stepText(step, { w: world, pack }) : null;

  const applyTarget = useCallback(() => {
    clearHighlights();
    if (!step || minimized) return null;
    const { target, fallback } = tourAnchorsForStep(moduleId, step);
    let el = queryTourElement(target);
    if (!el && fallback !== target) el = queryTourElement(fallback);
    if (el) {
      const tourId = el.getAttribute("data-tour") ?? "";
      if (tourId !== "save-profile-btn") {
        el.classList.add(HIGHLIGHT_CLASS);
      }
      return target;
    }
    return null;
  }, [step, moduleId, minimized]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!cancelled) applyTarget();
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      clearHighlights();
    };
  }, [applyTarget, stepIndex]);

  useEffect(() => {
    if (!step || minimized) return;
    const onReflow = () => applyTarget();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [step, minimized, applyTarget]);

  useEffect(() => () => clearHighlights(), []);

  if (!step || minimized) return null;

  const missingTarget = !document.querySelector(`.${HIGHLIGHT_CLASS}`);

  const banner = missingTarget ? (
    <div
      className="pointer-events-auto fixed left-1/2 top-4 z-[80] flex w-[min(520px,calc(100vw-24px))] -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-[#a594ff]/45 bg-[#1a1040]/96 px-4 py-3 text-white shadow-2xl"
      data-testid="spotlight-banner"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#c4b5fd]">{t.stepCoachOf(stepIndex + 1, total)}</p>
        <p className="truncate text-[14px] font-semibold">{text?.title}</p>
      </div>
      <button
        type="button"
        onClick={showMe}
        data-testid="spotlight-take-me-there"
        className="shrink-0 rounded-md bg-[#6f55e8] px-3 py-1.5 text-[12px] font-semibold hover:bg-[#5d42dc]"
      >
        {t.takeMeThere}
      </button>
    </div>
  ) : null;

  const ringProbe = document.querySelector(`.${HIGHLIGHT_CLASS}`);

  return createPortal(
    <>
      <div data-testid="spotlight-overlay" className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />
      {ringProbe ? <SpotlightRingMarker /> : null}
      {banner}
    </>,
    document.body,
  );
}

/** Presence marker for tests — the visible ring is applied via CSS on the target element. */
function SpotlightRingMarker() {
  return <span data-testid="spotlight-ring" className="sr-only" />;
}