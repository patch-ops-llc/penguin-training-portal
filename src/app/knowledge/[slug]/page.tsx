import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser, resolveActiveTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeKnowledgeDoc } from "@/lib/knowledge/serialize";
import { KnowledgeReader } from "../knowledge-reader";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const user = await requireUser();
  const tenant = await resolveActiveTenant(user);
  if (!tenant) return { title: "Knowledge Library" };
  const doc = await db.knowledgeDocument.findUnique({ where: { tenantId_slug: { tenantId: tenant.id, slug } } });
  return { title: doc?.title ?? "Knowledge Library" };
}

export default async function KnowledgeReaderPage({ params }: Props) {
  const user = await requireUser();
  const tenant = await resolveActiveTenant(user);
  if (!tenant) notFound();

  const { slug } = await params;
  const doc = await db.knowledgeDocument.findUnique({ where: { tenantId_slug: { tenantId: tenant.id, slug } } });
  if (!doc || !doc.contentMarkdown?.trim()) notFound();

  const brandMeta =
    tenant.brandMeta && typeof tenant.brandMeta === "object" && !Array.isArray(tenant.brandMeta)
      ? (tenant.brandMeta as Record<string, unknown>)
      : {};
  const accentColor = typeof brandMeta.accentColor === "string" ? brandMeta.accentColor : "#0b6e6e";

  return (
    <KnowledgeReader tenant={{ slug: tenant.slug, name: tenant.name, accentColor }} doc={serializeKnowledgeDoc(doc)} />
  );
}