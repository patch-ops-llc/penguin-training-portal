import type { TrainingStep } from "./types";

/** Maps curriculum step ids to `data-tour` anchor ids (and optional fallbacks when the primary target is not mounted). */
const TOUR_BY_KEY: Record<string, { target: string; fallback?: string }> = {
  "orientation-navigation:profile-setup": { target: "training-show-me", fallback: "settings-gear" },
  "orientation-navigation:global-search": { target: "global-search" },
  "orientation-navigation:duplicate-contact-check": { target: "global-quick-create", fallback: "nav-contacts" },
  "orientation-navigation:pipeline-filter": { target: "pipeline-selector", fallback: "nav-deals" },
  "orientation-navigation:board-layout": { target: "layout-board", fallback: "nav-deals" },
  "orientation-navigation:notifications-tasks": { target: "bell", fallback: "nav-tasks" },

  "cross-division-accounts:open-parent-company": { target: "nav-companies", fallback: "shell-main" },
  "cross-division-accounts:open-child-site": { target: "shell-main" },
  "cross-division-accounts:coordinate-note": { target: "shell-main" },
  "cross-division-accounts:flag-duplicate": { target: "shell-main" },

  "working-deals-logging:inspect-deal-hygiene": { target: "nav-deals", fallback: "shell-main" },
  "working-deals-logging:log-call-deal": { target: "shell-main" },
  "working-deals-logging:log-email-deal": { target: "shell-main" },
  "working-deals-logging:create-followup-task": { target: "shell-main" },

  "quoting-routes-epicor:publish-oracle-quote": { target: "shell-main" },
  "quoting-routes-epicor:simulate-esign": { target: "shell-main" },
  "quoting-routes-epicor:inspect-epicor-quote": { target: "nav-epicor-quotes" },
  "quoting-routes-epicor:inspect-paperless-parts": { target: "nav-deals" },

  "projects-post-award:sales-open-project": { target: "shell-main" },
  "projects-post-award:switch-to-pm": { target: "view-as" },
  "projects-post-award:clear-project-blocker": { target: "shell-main" },
  "projects-post-award:advance-project-production": { target: "nav-projects" },

  "preferences-breeze-help:open-settings": { target: "settings-gear" },
  "preferences-breeze-help:configure-notifications": { target: "save-profile-btn", fallback: "settings-gear" },
  "preferences-breeze-help:open-help-support": { target: "help-menu" },
  "preferences-breeze-help:ask-breeze": { target: "breeze-copilot-btn" },

  "em-sales-email-logging:open-contact-email": { target: "nav-contacts" },
  "em-sales-email-logging:open-deal": { target: "nav-deals" },

  "sf-lead-to-deal:open-nsm-leads": { target: "nav-leads" },
};

const DEFAULT_FALLBACK = "training-show-me";

export function tourAnchorsForStep(moduleId: string, step: TrainingStep | null): { target: string; fallback: string } {
  if (!step) return { target: DEFAULT_FALLBACK, fallback: DEFAULT_FALLBACK };
  const explicit = step.tourTarget
    ? { target: step.tourTarget, fallback: step.tourFallback ?? DEFAULT_FALLBACK }
    : null;
  const mapped = TOUR_BY_KEY[`${moduleId}:${step.id}`];
  const resolved = explicit ?? mapped ?? { target: DEFAULT_FALLBACK, fallback: DEFAULT_FALLBACK };
  return { target: resolved.target, fallback: resolved.fallback ?? DEFAULT_FALLBACK };
}

export function queryTourElement(tourId: string): HTMLElement | null {
  return (
    document.querySelector(`[data-tour="${tourId}"]`) ??
    document.querySelector(`[data-testid="${tourId}"]`)
  );
}