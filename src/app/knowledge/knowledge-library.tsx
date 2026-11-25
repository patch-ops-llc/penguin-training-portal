"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TenantLockup } from "@/components/brand";
import { TenantLogo } from "@/components/tenant-logo";
import type { KnowledgeDocumentPublic } from "@/lib/knowledge/serialize";
import {
  KNOWLEDGE_CATEGORY_FILTERS,
  categoryBadgeClass,
  categoryBadgeLabel,
  formatFileSize,
  type KnowledgeCategoryFilter,
} from "@/lib/knowledge/types";
import { KnowledgeAdminPanel } from "./knowledge-admin-panel";

export function KnowledgeLibrary({
  user,
  tenant,
  documents,
  divisions,
}: {
  user: { email: string; name: string | null; role: "PENGUIN_ADMIN" | "CLIENT_ADMIN" | "TRAINEE" };
  tenant: { slug: string; name: string; accentColor: string };
  documents: KnowledgeDocumentPublic[];
  divisions: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<KnowledgeCategoryFilter>("all");
  const [division, setDivision] = useState("All divisions");
  const [showAdmin, setShowAdmin] = useState(false);
  const [editing, setEditing] = useState<KnowledgeDocumentPublic | null>(null);

  const isAdmin = user.role === "PENGUIN_ADMIN" || user.role === "CLIENT_ADMIN";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      const catOk =
        category === "all" ||
        (category === "core-onboarding" && doc.category === "CORE_GUIDE") ||
        (category === "division-quoting" && doc.category === "QUOTING_GUIDE") ||
        (category === "division-handover" && doc.category === "DIVISION_HANDOVER") ||
        (category === "training-recordings" && doc.category === "RECORDING");
      if (!catOk) return false;
      if (division !== "All divisions" && doc.division && doc.division !== division) return false;
      if (division !== "All divisions" && !doc.division && doc.category !== "CORE_GUIDE") return false;
      if (!q) return true;
      const hay = `${doc.title} ${doc.summary} ${doc.division ?? ""} ${categoryBadgeLabel(doc.category)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [category, division, documents, query]);

  async function deleteDoc(doc: KnowledgeDocumentPublic) {
    if (!window.confirm(`Delete “${doc.title}”?`)) return;
    const res = await fetch(`/api/knowledge/${doc.id}`, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface-subtle text-ink" data-testid="knowledge-library">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-8 py-4">
          <TenantLockup tenantSlug={tenant.slug} tenantName={tenant.name} accentColor={tenant.accentColor} height={28} />
          <nav className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link href="/launchpad" className="rounded-md border border-line px-2.5 py-1 font-medium text-ink-soft hover:bg-surface-subtle">
              Launchpad
            </Link>
            <Link
              href="/knowledge"
              data-testid="nav-knowledge-link"
              className="rounded-md bg-penguin-soft px-2.5 py-1 font-penguin font-semibold text-penguin"
            >
              Knowledge Library
            </Link>
            {isAdmin ? (
              <Link href="/admin" className="rounded-md border border-line px-2.5 py-1 text-ink-soft hover:bg-surface-subtle">
                Admin
              </Link>
            ) : null}
            <Link href="/account" className="text-ink-muted hover:text-ink hover:underline">
              {user.name ?? user.email}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-8 py-9">
        <section className="rounded-[14px] border border-line bg-surface px-7 py-6 shadow-[0_1px_3px_rgba(45,62,80,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[720px]">
              <div className="mb-2 flex items-center gap-3">
                <TenantLogo tenantSlug={tenant.slug} tenantName={tenant.name} accentColor={tenant.accentColor} mode="mark" height={32} />
                <p className="font-penguin text-[12px] font-semibold uppercase tracking-[0.08em] text-penguin">Official guides &amp; recordings</p>
              </div>
              <h1 className="font-display text-[26px] font-bold text-ink">Knowledge Library</h1>
              <p className="mt-1.5 text-[14px] text-ink-soft">
                Read step-by-step AMICO training guides and division handover documents in the portal, or download the original{" "}
                <span className="font-medium text-ink">.docx</span> files for offline reference.
              </p>
            </div>
            {isAdmin ? (
              <button
                type="button"
                data-testid="knowledge-add-btn"
                onClick={() => {
                  setEditing(null);
                  setShowAdmin(true);
                }}
                className="rounded-md bg-penguin px-4 py-2 font-penguin text-[13px] font-semibold text-white hover:bg-penguin-strong"
              >
                + Add Document or Recording
              </button>
            ) : null}
          </div>
        </section>

        {showAdmin ? (
          <div className="mt-5">
            <KnowledgeAdminPanel
              divisions={divisions}
              editing={editing}
              onClose={() => {
                setShowAdmin(false);
                setEditing(null);
              }}
            />
          </div>
        ) : null}

        <div className="mt-7 space-y-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides, handovers, quoting playbooks…"
            data-testid="knowledge-search"
            className="w-full rounded-[10px] border border-line bg-surface px-4 py-2.5 text-[14px] shadow-sm"
          />

          <div className="flex flex-wrap gap-1.5" data-testid="knowledge-category-filters">
            {KNOWLEDGE_CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                data-testid={`knowledge-category-${f.id}`}
                onClick={() => setCategory(f.id)}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ${
                  category === f.id ? "bg-brand text-white" : "border border-line bg-surface text-ink-soft hover:bg-surface-sunken"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5" data-testid="knowledge-division-filters">
            {["All divisions", ...divisions].map((d) => (
              <button
                key={d}
                type="button"
                data-testid={`knowledge-division-${d.replaceAll(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`}
                onClick={() => setDivision(d)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  division === d ? "bg-penguin text-white" : "border border-line bg-surface text-ink-soft hover:bg-surface-sunken"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[13px] text-ink-muted" data-testid="knowledge-result-count">
          Showing {filtered.length} of {documents.length} resources
        </p>

        <ul className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="knowledge-doc-list">
          {filtered.map((doc) => (
            <li
              key={doc.id}
              data-testid={`knowledge-card-${doc.slug}`}
              className="flex flex-col rounded-[12px] border border-line bg-surface p-5 shadow-[0_1px_3px_rgba(45,62,80,0.05)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryBadgeClass(doc.category)}`}>
                  {categoryBadgeLabel(doc.category)}
                </span>
                {doc.division ? (
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">{doc.division}</span>
                ) : null}
              </div>
              <h2 className="mt-2 font-display text-[17px] font-semibold leading-snug text-ink">{doc.title}</h2>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-ink-soft">{doc.summary}</p>
              <p className="mt-2 text-[12px] text-ink-muted">
                {doc.category === "RECORDING"
                  ? doc.externalUrl
                    ? "External recording · link ready"
                    : "Recording pending — admin will post replay link"
                  : `${doc.fileName ?? "Document"} · ${formatFileSize(doc.fileSize)}`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {doc.category === "RECORDING" && doc.externalUrl ? (
                  <a
                    href={doc.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`knowledge-open-recording-${doc.slug}`}
                    className="rounded-md bg-success px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-90"
                  >
                    Open Recording
                  </a>
                ) : doc.category === "RECORDING" ? (
                  <span
                    data-testid={`knowledge-recording-pending-${doc.slug}`}
                    className="rounded-md border border-line bg-surface-subtle px-3 py-1.5 text-[13px] font-medium text-ink-muted"
                  >
                    Recording scheduled
                  </span>
                ) : doc.contentMarkdown?.trim() ? (
                  <Link
                    href={`/knowledge/${doc.slug}`}
                    data-testid={`knowledge-read-${doc.slug}`}
                    className="rounded-md bg-penguin px-3 py-1.5 font-penguin text-[13px] font-semibold text-white hover:bg-penguin-strong"
                  >
                    Read Step-by-Step
                  </Link>
                ) : null}
                {doc.fileName || doc.fileSize ? (
                  <a
                    href={`/api/knowledge/${doc.id}/download`}
                    data-testid={`knowledge-download-${doc.slug}`}
                    className="rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-subtle"
                  >
                    Download .docx
                  </a>
                ) : null}
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      data-testid={`knowledge-edit-${doc.slug}`}
                      onClick={() => {
                        setEditing(doc);
                        setShowAdmin(true);
                      }}
                      className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink-soft hover:bg-surface-subtle"
                    >
                      Replace / Edit
                    </button>
                    <button
                      type="button"
                      data-testid={`knowledge-delete-${doc.slug}`}
                      onClick={() => void deleteDoc(doc)}
                      className="rounded-md border border-danger/30 px-3 py-1.5 text-[12.5px] text-danger hover:bg-danger-soft"
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}