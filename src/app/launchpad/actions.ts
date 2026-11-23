"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_TENANT_COOKIE, requirePenguinAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function switchActiveTenantAction(formData: FormData): Promise<void> {
  await requirePenguinAdmin();
  const slug = String(formData.get("tenantSlug") ?? "").trim().toLowerCase();
  const returnTo = String(formData.get("returnTo") ?? "/launchpad");
  const safePath = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/launchpad";

  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (tenant) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_TENANT_COOKIE, tenant.slug, {
      httpOnly: true,
      secure: env.secureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  redirect(safePath);
}
