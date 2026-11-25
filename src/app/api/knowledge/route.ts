import type { KnowledgeDocumentCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isKnowledgeAdmin, requireKnowledgeTenant, slugify } from "@/lib/knowledge/access";
import { extractFromUpload } from "@/lib/knowledge/docx";
import { serializeKnowledgeList, serializeKnowledgeDoc } from "@/lib/knowledge/serialize";
import { DOCX_MIME, MAX_UPLOAD_BYTES, PDF_MIME } from "@/lib/knowledge/types";

const CATEGORIES: ReadonlySet<string> = new Set([
  "CORE_GUIDE",
  "DIVISION_HANDOVER",
  "QUOTING_GUIDE",
  "RECORDING",
  "OTHER",
]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tenant = await requireKnowledgeTenant(user);
  const docs = await db.knowledgeDocument.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return NextResponse.json({ ok: true, documents: serializeKnowledgeList(docs) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isKnowledgeAdmin(user)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const tenant = await requireKnowledgeTenant(user);
  const form = await request.formData();

  const title = String(form.get("title") ?? "").trim();
  const category = String(form.get("category") ?? "OTHER").trim().toUpperCase();
  const divisionRaw = form.get("division");
  const division = typeof divisionRaw === "string" && divisionRaw.trim() ? divisionRaw.trim() : null;
  const summaryInput = String(form.get("summary") ?? "").trim();
  const externalUrlRaw = form.get("externalUrl");
  const externalUrl =
    typeof externalUrlRaw === "string" && externalUrlRaw.trim() ? externalUrlRaw.trim().slice(0, 2048) : null;
  const slugInput = String(form.get("slug") ?? "").trim();
  const file = form.get("file");

  if (!title || !CATEGORIES.has(category)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  let slug = slugInput ? slugify(slugInput) : slugify(title);
  if (!slug) slug = `doc-${Date.now()}`;

  const collision = await db.knowledgeDocument.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
  });
  if (collision) slug = `${slug}-${Date.now().toString(36)}`;

  let fileBytes: Buffer | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let fileSize: number | null = null;
  let contentMarkdown = "";
  let summary = summaryInput;

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
      if (!summary) summary = extracted.summary;
      mimeType = DOCX_MIME;
    }
  }

  if (category === "RECORDING" && !externalUrl && !fileBytes) {
    return NextResponse.json({ ok: false, error: "recording_needs_url" }, { status: 400 });
  }

  const maxSort = await db.knowledgeDocument.aggregate({
    where: { tenantId: tenant.id },
    _max: { sortOrder: true },
  });

  const doc = await db.knowledgeDocument.create({
    data: {
      tenantId: tenant.id,
      slug,
      title: title.slice(0, 240),
      category: category as KnowledgeDocumentCategory,
      division: division?.slice(0, 120) ?? null,
      summary: summary.slice(0, 500),
      contentMarkdown,
      fileName,
      mimeType,
      fileSize,
      fileBytes: fileBytes ? new Uint8Array(fileBytes) : null,
      externalUrl,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 10,
      adminEdited: true,
    },
  });

  return NextResponse.json({ ok: true, document: serializeKnowledgeDoc(doc) }, { status: 201 });
}