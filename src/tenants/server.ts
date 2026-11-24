import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { AMICO_PACKS } from "./amico";
import { buildGenericPack } from "./amico/shared";
import { getTenantTracks } from "./catalog";
import type { Pack } from "./types";

const cache = new Map<string, { json: string; version: string }>();

function serializePack(cacheKey: string, pack: Pack): { json: string; version: string } {
  let entry = cache.get(cacheKey);
  if (!entry) {
    const json = JSON.stringify(pack);
    entry = { json, version: createHash("sha256").update(json).digest("hex").slice(0, 16) };
    cache.set(cacheKey, entry);
  }
  return entry;
}

/**
 * Resolves and SHA-256 content-hashes a tenant track pack.
 * Returns null if the tenant does not exist (or is disabled) or if trackId is unknown for that tenant.
 */
export async function packJson(tenantSlug: string, trackId: string): Promise<{ json: string; version: string } | null> {
  if (tenantSlug === "amico" && trackId in AMICO_PACKS) {
    const tenant = await db.tenant.findUnique({ where: { slug: "amico" }, select: { status: true } });
    if (tenant && tenant.status !== "ACTIVE") return null;
    const pack = AMICO_PACKS[trackId as keyof typeof AMICO_PACKS];
    return serializePack(`amico/${trackId}`, pack);
  }

  const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant || tenant.status !== "ACTIVE") return null;

  const allowedTracks = getTenantTracks(tenant.slug, tenant.name, tenant.defaultTrackIds);
  if (!allowedTracks.some((t) => t.id === trackId)) return null;

  const pack = buildGenericPack(tenant.slug, tenant.name, trackId);
  return serializePack(`${tenant.slug}/${trackId}:${tenant.name}`, pack);
}

/** Returns `{ [trackId]: contentHashVersion }` for all tracks of a given tenant. */
export async function tenantPackVersions(tenantSlug: string, tenantName: string, defaultTrackIds: string[]): Promise<Record<string, string>> {
  const tracks = getTenantTracks(tenantSlug, tenantName, defaultTrackIds);
  const versions: Record<string, string> = {};
  for (const track of tracks) {
    if (tenantSlug === "amico" && track.id in AMICO_PACKS) {
      versions[track.id] = serializePack(`amico/${track.id}`, AMICO_PACKS[track.id as keyof typeof AMICO_PACKS]).version;
    } else {
      versions[track.id] = serializePack(`${tenantSlug}/${track.id}:${tenantName}`, buildGenericPack(tenantSlug, tenantName, track.id)).version;
    }
  }
  return versions;
}
