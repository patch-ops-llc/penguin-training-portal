import type { KnowledgeDocumentCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertDocumentTenant, isKnowledgeAdmin, requireKnowledgeTenant, slugify } from "@/lib/knowledge/access";
import { extractFromUpload } from "@/lib/knowledge/docx";
import { serializeKnowledgeDoc } from "@/lib/knowledge/serialize";
import { DOCX_MIME, MAX_UPLOAD_BYTES, PDF_MIME } from "@/lib/knowledge/types";

const CATEGORIES: ReadonlySet<string> = new Set([
  "CORE_GUIDE",
  "DIVISION_HANDOVER",
  "QUOTING_GUIDE",
  "RECORDING",
  "OTHER",
]);

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const tenant = await requireKnowledgeTenant(user);
  const doc = await db.knowledgeDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  assertDocumentTenant(user, doc, tenant.id);

  return NextResponse.json({ ok: true, document: serializeKnowledgeDoc(doc) });
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isKnowledgeAdmin(user)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const tenant = await requireKnowledgeTenant(user);
  const existing = await db.knowledgeDocument.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  assertDocumentTenant(user, existing, tenant.id);

  const form = await request.formData();
  const title = form.has("title") ? String(form.get("title") ?? "").trim() : existing.title;
  const categoryRaw = form.has("category") ? String(form.get("category") ?? "").trim().toUpperCase() : existing.category;
  if (!CATEGORIES.has(categoryRaw)) {
    return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 400 });
  }
  const divisionRaw = form.get("division");
  const division =
    form.has("division")
      ? typeof divisionRaw === "string" && divisionRaw.trim()
        ? divisionRaw.trim()
        : null
      : existing.division;
  const summary = form.has("summary") ? String(form.get("summary") ?? "").trim() : existing.summary;
  const externalUrlRaw = form.get("externalUrl");
  const externalUrl = form.has("externalUrl")
    ? typeof externalUrlRaw === "string" && externalUrlRaw.trim()
      ? externalUrlRaw.trim().slice(0, 2048)
      : null
    : existing.externalUrl;
  const slugInput = form.has("slug") ? slugify(String(form.get("slug") ?? "")) : existing.slug;
  const file = form.get("file");

  let fileBytes = existing.fileBytes;
  let fileName = existing.fileName;
  let mimeType = existing.mimeType;
  let fileSize = existing.fileSize;
  let contentMarkdown = existing.contentMarkdown;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    mimeType = file.type || (file.name.endsWith(".pdf") ? PDF_MIME : DOCX_MIME);
    fileName = file.name.slice(0, 200);
    fileSize = buf.length;
    fileBytes = buf;
    if (mimeType === DOCX_MIME || file.name.endsWith(".docx")) {
      const extracted = await extractFromUpload(buf);
      contentMarkdown = extracted.markdown;
    }
  }

  if (slugInput && slugInput !== existing.slug) {
    const taken = await db.knowledgeDocument.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: slugInput } },
    });
    if (taken && taken.id !== existing.id) {
      return NextResponse.json({ ok: false, error: "slug_taken" }, { status: 409 });
    }
  }

  const updated = await db.knowledgeDocument.update({
    where: { id },
    data: {
      title: title.slice(0, 240),
      category: categoryRaw as KnowledgeDocumentCategory,
      division: division?.slice(0, 120) ?? null,
      summary: summary.slice(0, 500),
      contentMarkdown,
      fileName,
      mimeType,
      fileSize,
      fileBytes: fileBytes ? new Uint8Array(fileBytes) : null,
      externalUrl,
      slug: slugInput || existing.slug,
      adminEdited: true,
    },
  });

  return NextResponse.json({ ok: true, document: serializeKnowledgeDoc(updated) });
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isKnowledgeAdmin(user)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const tenant = await requireKnowledgeTenant(user);
  const existing = await db.knowledgeDocument.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  assertDocumentTenant(user, existing, tenant.id);

  await db.knowledgeDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}