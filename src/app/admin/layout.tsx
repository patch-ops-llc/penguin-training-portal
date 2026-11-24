import type { Metadata } from "next";
import Link from "next/link";
import { PenguinLogo } from "@/components/brand";
import { TenantLogo } from "@/components/tenant-logo";
import { requireAdmin, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { switchActiveTenantAction } from "@/app/launchpad/actions";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: "Training Admin" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const activeTenant = await resolveActiveTenant(user);
  const allTenants =
    user.role === "PENGUIN_ADMIN"
      ? await db.tenant.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, status: true } })
      : [];

  return (
    <div className="min-h-screen bg-[#f6f5fb] font-penguin text-[#16122b]">
      <header className="border-b border-[#e4e2ee] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-6 py-3">
          {activeTenant ? (
            <TenantLogo
              tenantSlug={activeTenant.slug}
              tenantName={activeTenant.name}
              mode="full"
              height={26}
              testId="admin-header-tenant-logo"
            />
          ) : null}
          {activeTenant ? <span className="h-5 w-px bg-[#e4e2ee]" aria-hidden="true" /> : null}
          <PenguinLogo height={24} />
          <span className="rounded bg-penguin-soft px-2 py-0.5 text-[12px] font-semibold text-penguin">
            {user.role === "PENGUIN_ADMIN" ? "Penguin Super-Admin" : `${activeTenant?.name ?? "Client"} Admin`}
          </span>
          <AdminNav isPenguinAdmin={user.role === "PENGUIN_ADMIN"} />
          <div className="ml-auto flex flex-wrap items-center gap-3 text-[13px] text-[#5f5b73]">
            {user.role === "PENGUIN_ADMIN" && allTenants.length > 0 ? (
              <form action={switchActiveTenantAction} className="flex items-center gap-1.5">
                <input type="hidden" name="returnTo" value="/admin" />
                <select
                  name="tenantSlug"
                  defaultValue={activeTenant?.slug ?? ""}
                  aria-label="Active tenant"
                  data-testid="admin-tenant-switcher"
                  className="rounded-md border border-[#cfcbe0] bg-white px-2.5 py-1 text-[12.5px] font-medium text-[#16122b]"
                >
                  {allTenants.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} {t.status === "DISABLED" ? "(Disabled)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  data-testid="admin-tenant-switch-btn"
                  className="rounded-md bg-penguin px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-penguin-strong"
                >
                  Switch
                </button>
              </form>
            ) : activeTenant ? (
              <span className="rounded-full border border-[#e4e2ee] bg-[#faf9fd] px-3 py-0.5 text-[12px] font-medium text-[#16122b]">
                {activeTenant.name}
              </span>
            ) : null}
            <Link href="/launchpad" className="font-medium text-penguin hover:underline">
              Training launchpad
            </Link>
            <Link href="/account" className="hover:underline">
              {user.email}
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-md border border-[#e4e2ee] px-2.5 py-1 hover:bg-[#f6f5fb]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-6 py-8">{children}</main>
    </div>
  );
}
