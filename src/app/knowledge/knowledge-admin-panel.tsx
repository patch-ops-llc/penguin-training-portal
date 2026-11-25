"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { KnowledgeDocumentPublic } from "@/lib/knowledge/serialize";

const CATEGORIES = [
  { value: "CORE_GUIDE", label: "Core Onboarding" },
  { value: "QUOTING_GUIDE", label: "Quoting Guide" },
  { value: "DIVISION_HANDOVER", label: "Division Handover" },
  { value: "RECORDING", label: "Training Recording" },
  { value: "OTHER", label: "Other" },
] as const;

export function KnowledgeAdminPanel({
  divisions,
  editing,
  onClose,
}: {
  divisions: string[];
  editing: KnowledgeDocumentPublic | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const url = editing ? `/api/knowledge/${editing.id}` : "/api/knowledge";
      const res = await fetch(url, { method: editing ? "PATCH" : "POST", body: data, credentials: "same-origin" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "save_failed");
        return;
      }
      form.reset();
      onClose();
      router.refresh();
    } catch {
      setError("network_error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="knowledge-admin-panel" className="rounded-[12px] border border-line bg-surface p-5 shadow-[0_2px_8px_rgba(45,62,80,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[17px] font-semibold text-ink">{editing ? "Replace / edit document" : "Add document or recording"}</h2>
        <button type="button" onClick={onClose} className="rounded-md border border-line px-2 py-1 text-[12px] text-ink-muted hover:bg-surface-subtle">
          Close
        </button>
      </div>
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1 text-[13px]">
          <span className="font-medium text-ink">Title</span>
          <input name="title" required defaultValue={editing?.title ?? ""} className="rounded-md border border-line px-3 py-2" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[13px]">
            <span className="font-medium text-ink">Category</span>
            <select name="category" defaultValue={editing?.category ?? "OTHER"} className="rounded-md border border-line px-3 py-2">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px]">
            <span className="font-medium text-ink">Division (optional)</span>
            <select name="division" defaultValue={editing?.division ?? ""} className="rounded-md border border-line px-3 py-2">
              <option value="">All divisions</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-[13px]">
          <span className="font-medium text-ink">Summary (optional)</span>
          <textarea name="summary" rows={2} defaultValue={editing?.summary ?? ""} className="rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-1 text-[13px]">
          <span className="font-medium text-ink">External recording / doc URL (optional)</span>
          <input
            name="externalUrl"
            type="url"
            placeholder="https://..."
            defaultValue={editing?.externalUrl ?? ""}
            className="rounded-md border border-line px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-[13px]">
          <span className="font-medium text-ink">{editing ? "Replace file (.docx or .pdf, max 10 MB)" : "Upload file (.docx or .pdf, max 10 MB)"}</span>
          <input name="file" type="file" accept=".docx,.pdf,application/pdf" className="text-[13px]" />
        </label>
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            data-testid="knowledge-admin-save"
            className="rounded-md bg-penguin px-4 py-2 font-penguin text-[13px] font-semibold text-white hover:bg-penguin-strong disabled:opacity-60"
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Add to library"}
          </button>
        </div>
      </form>
    </div>
  );
}