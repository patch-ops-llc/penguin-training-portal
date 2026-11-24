"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { currentStep, requiredSteps, scriptFor, type TrainingScript } from "@/curriculum";
import { newRunId, track } from "@/lib/beacon";
import type { Pack, Persona, TrainingModuleMeta } from "@/tenants/types";
import { parseLocation, pushUrl, useLocation, type ShellRoute } from "./router";
import { saveSession, type Run, type Saved } from "./session";
import { replay, seedWorld, type Action, type World } from "./world";

type State = { changes: Action[]; runs: Record<string, Run> };

export type Shell = {
  pack: Pack;
  world: World;
  tenantSlug: string;
  trackId: string;
  moduleId: string;
  moduleMeta: TrainingModuleMeta;
  script: TrainingScript;
  stepIndex: number;
  complete: boolean;
  showMeCount: number;
  route: ShellRoute;
  persona: Persona;
  dispatch: (action: Action | Action[]) => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  href: (path: string) => string;
  /** Runs the current step's scripted action ("Show me" assist) and records usedShowMeCount. */
  showMe: () => void;
  back: () => void;
  reset: () => void;
  switchModule: (moduleId: string) => void;
  viewAs: (personaId: string) => void;
  highlight: boolean;
  toggleHighlight: () => void;
  barHidden: boolean;
  toggleBar: () => void;
  completionOpen: boolean;
  setCompletionOpen: (open: boolean) => void;
};

const ShellContext = createContext<Shell | null>(null);

export function useShell(): Shell {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error("useShell must be used inside ShellProvider");
  return shell;
}

function freshRun(base: number): Run {
  return { runId: newRunId(), marks: [base], furthest: 0, completed: false, showMeCount: 0 };
}

export function ShellProvider({
  pack,
  version,
  initial,
  initialLocation,
  children,
}: {
  pack: Pack;
  version: string;
  initial: Saved | null;
  initialLocation: string;
  children: React.ReactNode;
}) {
  const tenantSlug = pack.tenantSlug;
  const trackId = pack.track.id;
  const location = useLocation(initialLocation);
  const route = useMemo(() => parseLocation(location), [location]);

  const fallbackModule = pack.track.modules[0];
  const activeModuleMeta =
    pack.track.modules.find((m) => m.id === route.moduleId) ?? fallbackModule;
  const moduleId = activeModuleMeta.id;
  const script = useMemo(() => scriptFor(moduleId, pack), [moduleId, pack]);

  const seed = useMemo(() => seedWorld(pack, activeModuleMeta.defaultPersonaId), [pack, activeModuleMeta.defaultPersonaId]);
  const [state, setState] = useState<State>(() => ({ changes: initial?.changes ?? [], runs: initial?.runs ?? {} }));
  const [highlight, setHighlight] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);

  const world = useMemo(() => replay(seed, state.changes, pack), [seed, state.changes, pack]);
  const stepIndex = useMemo(() => currentStep(script, { w: world, pack }), [script, world, pack]);
  const total = script.steps.length;
  const required = requiredSteps(script);
  const persona = pack.personas.find((p) => p.id === world.persona) ?? pack.personas[0];

  const live = useRef({ state, world, stepIndex, moduleId, script });
  useEffect(() => {
    live.current = { state, world, stepIndex, moduleId, script };
  });

  const href = useCallback((path: string) => `/learn/${tenantSlug}/${trackId}/${moduleId}${path}`, [tenantSlug, trackId, moduleId]);
  const navigate = useCallback(
    (path: string, options?: { replace?: boolean }) => pushUrl(`/learn/${tenantSlug}/${trackId}/${live.current.moduleId}${path}`, options?.replace),
    [tenantSlug, trackId],
  );

  const dispatch = useCallback((action: Action | Action[]) => {
    const actions = Array.isArray(action) ? action : [action];
    if (actions.length === 0) return;
    setState((s) => ({ ...s, changes: [...s.changes, ...actions] }));
  }, []);

  useEffect(() => {
    saveSession(tenantSlug, trackId, { version, changes: state.changes, runs: state.runs });
  }, [tenantSlug, trackId, version, state]);

  const run = state.runs[moduleId];
  useEffect(() => {
    if (run) return;
    const created = freshRun(live.current.state.changes.length);
    track({
      type: "module_started",
      tenantSlug,
      trackId,
      moduleId,
      runId: created.runId,
      step: 0,
      totalSteps: total,
      title: activeModuleMeta.title,
    });
    setState((s) => (s.runs[moduleId] ? s : { ...s, runs: { ...s.runs, [moduleId]: created } }));
  }, [run, moduleId, tenantSlug, trackId, total, activeModuleMeta.title]);

  useEffect(() => {
    const canonical = route.moduleId === moduleId;
    if (canonical && route.path) return;
    const ctx = { w: live.current.world, pack };
    const index = Math.min(live.current.stepIndex, total - 1);
    const target =
      live.current.stepIndex >= total
        ? (script.steps[total - 1].after?.(ctx) ?? script.steps[total - 1].path(ctx))
        : script.steps[index].path(ctx);
    pushUrl(`/learn/${tenantSlug}/${trackId}/${moduleId}${route.path || target}`, true);
  }, [route.moduleId, route.path, moduleId, script, total, pack, tenantSlug, trackId]);

  useEffect(() => {
    if (!run) return;
    const reached = run.marks.length - 1;
    if (stepIndex <= reached && (stepIndex < required || run.completed)) return;
    const marks = [...run.marks];
    for (let i = reached + 1; i <= stepIndex; i++) marks[i] = state.changes.length;
    const completed = stepIndex >= required;
    if (stepIndex > run.furthest) {
      const title = stepIndex > 0 ? script.steps[stepIndex - 1].title : undefined;
      track({
        type: "step_reached",
        tenantSlug,
        trackId,
        moduleId,
        runId: run.runId,
        step: stepIndex,
        totalSteps: total,
        title,
      });
    }
    if (completed && !run.completed) {
      track({
        type: "module_completed",
        tenantSlug,
        trackId,
        moduleId,
        runId: run.runId,
        step: total,
        totalSteps: total,
        title: activeModuleMeta.title,
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({
      ...s,
      runs: {
        ...s.runs,
        [moduleId]: {
          ...run,
          marks,
          furthest: Math.max(run.furthest, stepIndex),
          completed: run.completed || completed,
        },
      },
    }));
  }, [run, stepIndex, total, required, state.changes.length, moduleId, script, tenantSlug, trackId, activeModuleMeta.title]);

  const showMe = useCallback(() => {
    const { state: s, world: w, stepIndex: index, script: sc, moduleId: mid } = live.current;
    if (index >= sc.steps.length) {
      setCompletionOpen(true);
      return;
    }
    const step = sc.steps[index];
    const now = Date.now();
    const changes = [...s.changes, ...step.script({ w, pack }, now)];
    const after = { w: replay(seed, changes, pack), pack };
    const currentRun = s.runs[mid];
    if (currentRun) {
      track({
        type: "show_me_used",
        tenantSlug,
        trackId,
        moduleId: mid,
        runId: currentRun.runId,
        step: index + 1,
        totalSteps: sc.steps.length,
        title: step.title,
      });
    }
    setState((prev) => {
      const r = prev.runs[mid];
      return {
        changes,
        runs: r ? { ...prev.runs, [mid]: { ...r, showMeCount: r.showMeCount + 1 } } : prev.runs,
      };
    });
    navigate(step.after?.(after) ?? sc.steps[index + 1]?.path(after) ?? step.path(after));
  }, [pack, seed, navigate, tenantSlug, trackId]);

  const back = useCallback(() => {
    const { state: s, stepIndex: index, script: sc, moduleId: mid } = live.current;
    const current = s.runs[mid];
    if (!current || index === 0) return;
    setCompletionOpen(false);
    const target = Math.min(index, current.marks.length - 1) - 1;
    if (target < 0) return;
    const length = current.marks[target];
    const changes = s.changes.slice(0, length);
    const before = { w: replay(seed, changes, pack), pack };
    const runs = Object.fromEntries(
      Object.entries(s.runs).map(([id, r]) => [id, { ...r, marks: r.marks.map((m) => Math.min(m, length)) }]),
    );
    runs[mid] = { ...current, marks: current.marks.slice(0, target + 1), completed: false };
    setState({ changes, runs });
    navigate((target > 0 ? sc.steps[target - 1].after?.(before) : undefined) ?? sc.steps[target].path(before));
  }, [pack, seed, navigate]);

  const reset = useCallback(() => {
    const { state: s, script: sc, moduleId: mid } = live.current;
    const old = s.runs[mid];
    if (old) {
      track({
        type: "module_reset",
        tenantSlug,
        trackId,
        moduleId: mid,
        runId: old.runId,
        step: old.furthest,
        totalSteps: sc.steps.length,
      });
    }
    setCompletionOpen(false);
    setState({ changes: [], runs: {} });
    navigate(sc.steps[0].path({ w: seed, pack }));
  }, [pack, seed, navigate, tenantSlug, trackId]);

  const switchModule = useCallback(
    (targetModuleId: string) => {
      if (targetModuleId === live.current.moduleId) return;
      setCompletionOpen(false);
      track({ type: "module_switched", tenantSlug, trackId, moduleId: targetModuleId });
      pushUrl(`/learn/${tenantSlug}/${trackId}/${targetModuleId}`);
    },
    [tenantSlug, trackId],
  );

  const viewAs = useCallback((personaId: string) => dispatch({ t: "persona", id: personaId }), [dispatch]);

  const toggleHighlight = useCallback(() => {
    setHighlight((on) => {
      if (!on) track({ type: "highlight_used", tenantSlug, trackId, moduleId: live.current.moduleId });
      return !on;
    });
  }, [tenantSlug, trackId]);

  const toggleBar = useCallback(() => setBarHidden((hidden) => !hidden), []);

  const shell: Shell = {
    pack,
    world,
    tenantSlug,
    trackId,
    moduleId,
    moduleMeta: activeModuleMeta,
    script,
    stepIndex,
    complete: stepIndex >= required,
    showMeCount: run?.showMeCount ?? 0,
    route,
    persona,
    dispatch,
    navigate,
    href,
    showMe,
    back,
    reset,
    switchModule,
    viewAs,
    highlight,
    toggleHighlight,
    barHidden,
    toggleBar,
    completionOpen,
    setCompletionOpen,
  };

  return <ShellContext.Provider value={shell}>{children}</ShellContext.Provider>;
}

/** Marks a one-way "the trainee has viewed this screen" step condition. */
export function useSeen(flagKey: string, when = true): void {
  const { world, dispatch } = useShell();
  const seen = world.flags[flagKey] === true;
  useEffect(() => {
    if (when && !seen) dispatch({ t: "flag", k: flagKey });
  }, [when, seen, flagKey, dispatch]);
}
