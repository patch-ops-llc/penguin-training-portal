"use client";

import Link from "next/link";
import { buildToc, KnowledgeMarkdown } from "@/components/knowledge-markdown";
import { TenantLockup } from "@/components/brand";
import { categoryBadgeClass, categoryBadgeLabel } from "@/lib/knowledge/types";
import type { KnowledgeDocumentPublic } from "@/lib/knowledge/serialize";

export function KnowledgeReader({
  tenant,
  doc,
}: {
  tenant: { slug: string; name: string; accentColor: string };
  doc: KnowledgeDocumentPublic;
}) {
  const toc = buildToc(doc.contentMarkdown);

  function printPage() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-surface-subtle text-ink" data-testid="knowledge-reader">
      <header className="border-b border-line bg-surface print:hidden">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-8 py-4">
          <TenantLockup tenantSlug={tenant.slug} tenantName={tenant.name} accentColor={tenant.accentColor} height={28} />
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link href="/knowledge" className="rounded-md border border-line px-2.5 py-1 hover:bg-surface-subtle">
              ← Back to library
            </Link>
            <button
              type="button"
              onClick={printPage}
              data-testid="knowledge-print-pdf"
              className="rounded-md bg-penguin-soft px-2.5 py-1 font-penguin font-semibold text-penguin hover:bg-penguin hover:text-white"
            >
              Print / Save PDF
            </button>
            {doc.fileName ? (
              <a
                href={`/api/knowledge/${doc.id}/download`}
                data-testid="knowledge-reader-download"
                className="rounded-md bg-penguin px-2.5 py-1 font-penguin font-semibold text-white hover:bg-penguin-strong"
              >
                Download Original (.docx)
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1240px] gap-8 px-8 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="print:hidden" data-testid="knowledge-toc">
          <p className="font-penguin text-[11px] font-semibold uppercase tracking-[0.08em] text-penguin">On this page</p>
          <nav className="mt-3 max-h-[70vh] overflow-y-auto text-[13px]">
            <ul className="space-y-1.5">
              {toc.map((entry) => (
                <li key={entry.id} style={{ paddingLeft: `${(entry.level - 1) * 10}px` }}>
                  <a href={`#${entry.id}`} className="text-ink-soft hover:text-penguin hover:underline">
                    {entry.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="rounded-[14px] border border-line bg-surface px-8 py-8 shadow-sm print:border-0 print:shadow-none" data-testid="knowledge-reader-article">
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryBadgeClass(doc.category)}`}>
              {categoryBadgeLabel(doc.category)}
            </span>
            {doc.division ? (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">{doc.division}</span>
            ) : null}
          </div>
          <div className="knowledge-prose mt-2 max-w-[760px]">
            <KnowledgeMarkdown markdown={doc.contentMarkdown} />
          </div>
        </article>
      </main>
    </div>
  );
}