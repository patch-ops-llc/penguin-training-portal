import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertDocumentTenant, requireKnowledgeTenant } from "@/lib/knowledge/access";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const tenant = await requireKnowledgeTenant(user);
  const doc = await db.knowledgeDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  assertDocumentTenant(user, doc, tenant.id);

  if (doc.fileBytes && doc.fileBytes.length > 0) {
    const name = doc.fileName ?? `${doc.slug}.bin`;
    return new NextResponse(doc.fileBytes, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
        "Content-Length": String(doc.fileBytes.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  if (doc.fileName) {
    const staticPath = path.join(process.cwd(), "public", "docs", "amico", doc.fileName);
    if (fs.existsSync(staticPath)) {
      const buf = fs.readFileSync(staticPath);
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": doc.mimeType ?? "application/octet-stream",
          "Content-Disposition": `attachment; filename="${doc.fileName.replace(/"/g, "")}"`,
          "Content-Length": String(buf.length),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }
  }

  return NextResponse.json({ ok: false, error: "no_file" }, { status: 404 });
}