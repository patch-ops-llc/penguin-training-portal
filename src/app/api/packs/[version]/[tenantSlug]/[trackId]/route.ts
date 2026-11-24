import { NextResponse } from "next/server";
import { canAccessTenant, canAccessTrack, getCurrentUser } from "@/lib/auth";
import { packJson } from "@/tenants/server";

export const dynamic = "force-dynamic";

/**
 * Serves a tenant training pack behind the session cookie and strict tenant guard.
 * `version` is the 16-char SHA-256 content hash of the serialized pack, so a matching
 * response is immutable in the signed-in browser cache (`private, max-age=31536000, immutable`).
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/packs/[version]/[tenantSlug]/[trackId]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { version, tenantSlug, trackId } = await params;

  if (!canAccessTenant(user, tenantSlug)) {
    return NextResponse.json({ error: "forbidden_tenant" }, { status: 403 });
  }

  if (!canAccessTrack(user, tenantSlug, trackId)) {
    return NextResponse.json({ error: "forbidden_track" }, { status: 403 });
  }

  const pack = await packJson(tenantSlug, trackId);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const cacheControl = version === pack.version ? "private, max-age=31536000, immutable" : "private, no-store";
  return new NextResponse(pack.json, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cacheControl },
  });
}
