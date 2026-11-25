import type { Action, World } from "@/store/world";
import type { Pack } from "@/tenants/types";

export type StepCtx = { w: World; pack: Pack };

export type TrainingStep = {
  id: string;
  title: string;
  hint: string | ((c: StepCtx) => string);
  optional?: boolean;
  /** `data-tour` anchor id for the guided spotlight (defaults to curriculum tour map). */
  tourTarget?: string;
  /** Fallback `data-tour` when the primary target is not mounted. */
  tourFallback?: string;
  /** The shell path where this step happens. */
  path: (c: StepCtx) => string;
  /** Screen shown immediately after running Show me, when different from next step's start path. */
  after?: (c: StepCtx) => string;
  /** Pure predicate on World: returns true when the trainee has completed the action (either organically or via Show me). */
  done: (c: StepCtx) => boolean;
  /** Deterministic action sequence executed when the trainee clicks "Show me". */
  script: (c: StepCtx, now: number) => Action[];
};

export type TrainingScript = {
  moduleId: string;
  steps: TrainingStep[];
};

export const flag = (k: string): Action => ({ t: "flag", k });
export const has = (c: StepCtx, k: string): boolean => c.w.flags[k] === true;

/** Index of the step the learner is currently on (equals steps.length when complete). */
export function currentStep(script: TrainingScript, ctx: StepCtx): number {
  for (let i = script.steps.length - 1; i >= 0; i--) {
    if (script.steps[i].done(ctx)) return i + 1;
  }
  return 0;
}

export function requiredSteps(script: TrainingScript): number {
  for (let i = script.steps.length - 1; i >= 0; i--) {
    if (!script.steps[i].optional) return i + 1;
  }
  return script.steps.length;
}

export function stepText(step: TrainingStep, ctx: StepCtx): { title: string; hint: string } {
  return {
    title: step.title,
    hint: typeof step.hint === "function" ? step.hint(ctx) : step.hint,
  };
}
