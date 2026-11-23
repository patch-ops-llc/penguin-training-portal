import type { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";
import { canAccessTenant, canAccessTrack, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShellApp } from "@/shell/shell-app";
import { getTenantTracks } from "@/tenants/catalog";
import { tenantPackVersions } from "@/tenants/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "HubSpot" },
  icons: { icon: "/brand/hubspot-sprocket.svg" },
};

export default async function LearnShellPage({ params }: PageProps<"/learn/[[...path]]">) {
  const user = await requireUser();
  const { path = [] } = await params;

  if (path.length === 0) {
    redirect("/launchpad");
  }

  const tenantSlug = path[0] ?? "";
  const trackId = path[1] ?? "";

  if (!canAccessTenant(user, tenantSlug)) {
    forbidden();
  }

  const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant || tenant.status !== "ACTIVE") {
    notFound();
  }

  if (trackId && !canAccessTrack(user, tenant.slug, trackId)) {
    forbidden();
  }

  const tracks = getTenantTracks(tenant.slug, tenant.name, tenant.defaultTrackIds);
  if (trackId && !tracks.some((t) => t.id === trackId)) {
    notFound();
  }

  const packVersions = await tenantPackVersions(tenant.slug, tenant.name, tenant.defaultTrackIds);

  return <ShellApp tenantSlug={tenant.slug} tenantName={tenant.name} tracks={tracks} packVersions={packVersions} />;
}
