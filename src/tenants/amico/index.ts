import { buildAmicoPack } from "./shared";

export const amicoHubSpot101Pack = buildAmicoPack("amico-hubspot-101");
export const amicoSecurityFencePack = buildAmicoPack("amico-security-fence");

export const AMICO_PACKS = {
  "amico-hubspot-101": amicoHubSpot101Pack,
  "amico-security-fence": amicoSecurityFencePack,
} as const;
