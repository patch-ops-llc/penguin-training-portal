import { scriptFor } from "@/curriculum";
import { quotingGuideForTrack } from "@/curriculum/amico/quoting";
import type { Pack, TrainingModuleMeta } from "@/tenants/types";

export type ModuleReferenceGuide = {
  moduleTitle: string;
  moduleCode: string;
  trackTitle: string;
  subtitle: string;
  beforeYouStart: string[];
  howItWorks: string[];
  checklist: string[];
  dosDontsAutomations: string[];
};

function checklistFromModule(pack: Pack, module: TrainingModuleMeta): string[] {
  const script = scriptFor(module.id, pack);
  return script.steps.map((step, i) => {
    const hint = typeof step.hint === "string" ? step.hint : step.title;
    return `${i + 1}. ${step.title} — ${hint}`;
  });
}

/** Builds reference guide content for any AMICO training module (quoting + core + email + SF). */
export function referenceGuideForModule(pack: Pack, module: TrainingModuleMeta): ModuleReferenceGuide {
  const quoting = pack.track.category === "division-quoting" ? quotingGuideForTrack(pack.track) : null;

  const checklist = checklistFromModule(pack, module);

  if (quoting) {
    return {
      moduleTitle: module.title,
      moduleCode: module.code,
      trackTitle: pack.track.title,
      subtitle: `${quoting.pipeline} · ${quoting.quotingSystem}`,
      beforeYouStart: quoting.beforeYouQuote,
      howItWorks: [...quoting.createQuote, ...quoting.viewAndManage],
      checklist,
      dosDontsAutomations: [...quoting.automationAndTasks, ...quoting.quickReference.flatMap((b) => [`${b.title}:`, ...b.bullets.map((x) => `• ${x}`)])],
    };
  }

  const beforeYouStart = [
    module.summary,
    `Learning objective: ${module.objective}`,
    `Typical time: ~${module.minutes} minutes`,
  ];

  const howItWorks = module.takeaways.length > 0 ? module.takeaways : [module.objective];

  const dosDontsAutomations = [
    ...module.dos.map((d) => `Do: ${d}`),
    ...module.donts.map((d) => `Don't: ${d}`),
  ];

  return {
    moduleTitle: module.title,
    moduleCode: module.code,
    trackTitle: pack.track.title,
    subtitle: pack.track.division,
    beforeYouStart,
    howItWorks,
    checklist,
    dosDontsAutomations,
  };
}