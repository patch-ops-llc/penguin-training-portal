"use client";

import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function KnowledgeMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 id={headingId(children)} className="mt-8 scroll-mt-24 font-display text-[26px] font-bold text-ink first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 id={headingId(children)} className="mt-7 scroll-mt-24 font-display text-[20px] font-semibold text-ink">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 id={headingId(children)} className="mt-5 scroll-mt-24 text-[16px] font-semibold text-ink">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 id={headingId(children)} className="mt-4 scroll-mt-24 text-[14.5px] font-semibold text-ink-soft">
            {children}
          </h4>
        ),
        p: ({ children }) => <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{children}</p>,
        ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-5 text-[14.5px] text-ink-soft">{children}</ul>,
        ol: ({ children }) => (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14.5px] text-ink-soft marker:font-semibold marker:text-penguin">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-lg border border-line">
            <table className="min-w-full border-collapse text-left text-[13.5px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface-subtle text-[12.5px] font-semibold uppercase tracking-wide text-ink-muted">{children}</thead>,
        th: ({ children }) => <th className="border-b border-line px-3 py-2 font-semibold text-ink">{children}</th>,
        td: ({ children }) => <td className="border-b border-line-soft px-3 py-2 text-ink-soft">{children}</td>,
        tr: ({ children }) => <tr className="even:bg-surface-subtle/60">{children}</tr>,
        blockquote: ({ children }) => (
          <blockquote className="my-4 rounded-r-lg border-l-4 border-penguin bg-penguin-soft/60 px-4 py-3 text-[14px] text-ink">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} className="font-semibold text-link underline decoration-link/40 underline-offset-2 hover:decoration-link" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{children}</code>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function headingId(children: React.ReactNode): string {
  const text = flatten(children);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function flatten(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join("");
  if (node && typeof node === "object" && "props" in node) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    return flatten(el.props.children);
  }
  return "";
}

export type TocEntry = { id: string; text: string; level: number };

export function buildToc(markdown: string): TocEntry[] {
  const lines = markdown.split("\n");
  const entries: TocEntry[] = [];
  for (const line of lines) {
    const m = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const text = m[2].replace(/\*\*|__/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    entries.push({ id, text, level: m[1].length });
  }
  return entries;
}