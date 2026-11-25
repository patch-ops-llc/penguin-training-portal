import type { Metadata } from "next";
import { requireUser, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeKnowledgeList } from "@/lib/knowledge/serialize";
import { AMICO_DIVISIONS } from "@/tenants/catalog";
import { KnowledgeLibrary } from "./knowledge-library";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge Library" };

export default async function KnowledgePage() {
  const user = await requireUser();
  const tenant = await resolveActiveTenant(user);
  if (!tenant) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-20 font-penguin text-[#16122b]">
        <h1 className="text-[22px] font-semibold">No active organization configured</h1>
      </main>
    );
  }

  const docs = await db.knowledgeDocument.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const brandMeta =
    tenant.brandMeta && typeof tenant.brandMeta === "object" && !Array.isArray(tenant.brandMeta)
      ? (tenant.brandMeta as Record<string, unknown>)
      : {};
  const accentColor = typeof brandMeta.accentColor === "string" ? brandMeta.accentColor : "#0b6e6e";
  const divisions =
    tenant.divisionOptions.length > 0 ? tenant.divisionOptions : tenant.slug === "amico" ? [...AMICO_DIVISIONS] : [];

  return (
    <KnowledgeLibrary
      user={{ email: user.email, name: user.name, role: user.role }}
      tenant={{ slug: tenant.slug, name: tenant.name, accentColor }}
      documents={serializeKnowledgeList(docs)}
      divisions={divisions}
    />
  );
}