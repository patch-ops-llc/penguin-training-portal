"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppLocale = "en" | "fr-CA";

const STORAGE_KEY = "ptp-locale";

type Messages = {
  taskOf: (n: number, total: number) => string;
  completed: string;
  showMe: string;
  back: string;
  reset: string;
  guide: string;
  coaching: string;
  minimizeSpotlight: string;
  stepCoachOf: (n: number, total: number) => string;
  takeMeThere: string;
  trainingGuide: string;
  finishReview: string;
  moduleComplete: string;
  checklist: string;
  beforeYouStart: string;
  howItWorks: string;
  dosDonts: string;
  close: string;
  launchpadTitle: string;
  allTracks: string;
  en: string;
  frCa: string;
};

const EN: Messages = {
  taskOf: (n, total) => `Task ${n} of ${total}`,
  completed: "Completed",
  showMe: "Show me",
  back: "Back",
  reset: "Reset",
  guide: "Guide",
  coaching: "Coaching",
  minimizeSpotlight: "Minimize spotlight",
  stepCoachOf: (n, total) => `Step ${n} of ${total}`,
  takeMeThere: "Take me there",
  trainingGuide: "TRAINING GUIDE",
  finishReview: "Finish & Review",
  moduleComplete: "Module complete — great work!",
  checklist: "Written Step-by-Step Checklist",
  beforeYouStart: "Before You Start",
  howItWorks: "How It Works in AMICO HubSpot",
  dosDonts: "Do's, Don'ts & Automations",
  close: "Close",
  launchpadTitle: "Training Launchpad",
  allTracks: "All Tracks",
  en: "EN",
  frCa: "FR (CA)",
};

const FR: Messages = {
  taskOf: (n, total) => `Tâche ${n} sur ${total}`,
  completed: "Terminé",
  showMe: "Montrez-moi",
  back: "Retour",
  reset: "Réinitialiser",
  guide: "Guide",
  coaching: "Coaching",
  minimizeSpotlight: "Réduire le projecteur",
  stepCoachOf: (n, total) => `Étape ${n} sur ${total}`,
  takeMeThere: "Y aller",
  trainingGuide: "GUIDE DE FORMATION",
  finishReview: "Terminer et réviser",
  moduleComplete: "Module terminé — excellent travail!",
  checklist: "Liste d'étapes écrites",
  beforeYouStart: "Avant de commencer",
  howItWorks: "Fonctionnement dans HubSpot AMICO",
  dosDonts: "À faire, à éviter et automatisations",
  close: "Fermer",
  launchpadTitle: "Portail de formation",
  allTracks: "Tous les parcours",
  en: "EN",
  frCa: "FR (CA)",
};

type LocaleCtx = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: Messages;
};

const LocaleContext = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
      if (stored === "fr-CA" || stored === "en") setLocaleState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = locale === "fr-CA" ? FR : EN;

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}

/** Optional hook for components that may render outside LocaleProvider (falls back to EN). */
export function useLocaleOptional(): LocaleCtx {
  const ctx = useContext(LocaleContext);
  return ctx ?? { locale: "en" as const, setLocale: () => {}, t: EN };
}

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocaleOptional();
  return (
    <div
      className={className}
      role="group"
      aria-label="Language"
      data-testid="locale-toggle"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        data-testid="locale-en"
        aria-pressed={locale === "en"}
        className={
          locale === "en"
            ? "rounded-l-md bg-white/20 px-2 py-1 text-[11px] font-bold text-white"
            : "rounded-l-md px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10"
        }
      >
        {t.en}
      </button>
      <button
        type="button"
        onClick={() => setLocale("fr-CA")}
        data-testid="locale-fr-ca"
        aria-pressed={locale === "fr-CA"}
        className={
          locale === "fr-CA"
            ? "rounded-r-md bg-white/20 px-2 py-1 text-[11px] font-bold text-white"
            : "rounded-r-md px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10"
        }
      >
        {t.frCa}
      </button>
    </div>
  );
}