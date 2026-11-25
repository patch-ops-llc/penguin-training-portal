import { AMICO_EMAIL_SCRIPTS } from "./amico/email";
import { AMICO_101_SCRIPTS } from "./amico/hubspot-101";
import { AMICO_SECURITY_FENCE_SCRIPTS } from "./amico/security-fence";
import { currentStep, flag, has, requiredSteps, stepText, type StepCtx, type TrainingScript, type TrainingStep } from "./types";
import type { Pack } from "@/tenants/types";

export { currentStep, flag, has, requiredSteps, stepText, type StepCtx, type TrainingScript, type TrainingStep };

const ALL_SCRIPTS: Record<string, TrainingScript> = {
  ...AMICO_101_SCRIPTS,
  ...AMICO_SECURITY_FENCE_SCRIPTS,
  ...AMICO_EMAIL_SCRIPTS,
};

export function scriptFor(moduleId: string, pack: Pack): TrainingScript {
  if (pack.tenantSlug === "amico" && ALL_SCRIPTS[moduleId]) {
    return ALL_SCRIPTS[moduleId];
  }
  return {
    moduleId,
    steps: [
      {
        id: "generic-profile",
        title: "Confirm Profile & Notification Settings",
        hint: "Open Avatar > Profile & Preferences and save your timezone & alert settings.",
        path: () => "/profile",
        done: (c) => has(c, "profile.saved"),
        script: () => [{ t: "profile.update", patch: { taskReminders: true } }],
      },
      {
        id: "generic-deals",
        title: "Switch Deals to Board View",
        hint: "Open CRM > Deals and toggle to Board view.",
        path: () => "/deals",
        done: (c) => c.w.ui["deals.layout"] === "board" || has(c, "deals.boardView"),
        script: () => [{ t: "deal.setLayout", board: true }],
      },
    ],
  };
}
