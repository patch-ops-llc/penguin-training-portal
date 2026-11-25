import { AMICO_TRACKS } from "@/tenants/catalog";
import { buildAmicoPack } from "./shared";
import type { Pack } from "@/tenants/types";

export const amicoHubSpot101Pack = buildAmicoPack("amico-hubspot-101");
export const amicoSecurityFencePack = buildAmicoPack("amico-security-fence");

export const AMICO_PACKS = Object.fromEntries(AMICO_TRACKS.map((t) => [t.id, buildAmicoPack(t.id)])) as Record<string, Pack>;