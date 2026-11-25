import fs from "node:fs";
import mammoth from "mammoth";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
turndown.use(gfm);

/** Turndown-safe markers (no underscores — Turndown escapes them inside emphasis contexts). */
const TABLE_MARKER_RE = /⟦TABLE:(\d+)⟧/g;

/** Decode minimal entities and collapse Word cell markup to one line of plain text. */
function stripCellHtml(fragment) {
  return fragment
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>\s*<p[^>]*>/gi, " ")
    .replace(/<\/li>\s*<li[^>]*>/gi, "; ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\|/g, "\\|");
}

/** Convert one Mammoth `<table>` fragment into a GFM pipe table (single line per row). */
function tableHtmlToGfm(tableHtml) {
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const bodyRows = [];
  for (const row of rowMatches) {
    const cellMatches = [...row[1].matchAll(/<t(h|d)[^>]*>([\s\S]*?)<\/t\1>/gi)];
    if (cellMatches.length === 0) continue;
    const cells = cellMatches.map((m) => stripCellHtml(m[2]));
    bodyRows.push(cells);
  }
  if (bodyRows.length === 0) return "";

  const width = Math.max(...bodyRows.map((r) => r.length));
  const pad = (cells) => {
    const next = [...cells];
    while (next.length < width) next.push("");
    return next;
  };

  const header = pad(bodyRows[0]);
  const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
  for (let i = 1; i < bodyRows.length; i += 1) {
    lines.push(`| ${pad(bodyRows[i]).join(" | ")} |`);
  }
  return `\n\n${lines.join("\n")}\n\n`;
}

/**
 * Replace HTML tables with inline markers before Turndown runs (avoids broken GFM from `<p>` in cells).
 * @param {string} html
 */
function extractTablesToMarkers(html) {
  /** @type {string[]} */
  const tables = [];
  const without = html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const idx = tables.length;
    tables.push(tableHtmlToGfm(tableHtml));
    return `<p>⟦TABLE:${idx}⟧</p>`;
  });
  return { html: without, tables };
}

function restoreTableMarkers(markdown, tables) {
  return markdown.replace(TABLE_MARKER_RE, (_, raw) => {
    const i = Number(raw);
    return tables[i] ?? "";
  });
}

/** @param {Buffer} buffer */
export async function docxBufferToMarkdown(buffer) {
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
      ],
    },
  );

  const { html: htmlWithoutTables, tables } = extractTablesToMarkers(html);
  let md = turndown.turndown(htmlWithoutTables);
  md = restoreTableMarkers(md, tables);
  md = md
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^(#{1,6})\s*(.+)$/gm, (_, hashes, text) => `${hashes} ${text.trim()}`);
  return md;
}

/** Fail fast when extraction still emits broken pipe-table syntax. */
export function assertCleanGfmTables(markdown, label = "document") {
  if (/\|\|/.test(markdown)) {
    throw new Error(`[docx] Broken table pipes (||) in ${label}`);
  }
  const lines = markdown.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t.includes("|")) continue;
    if (/^\|?\s*---/.test(t) && !/^\|[-\s|]+\|$/.test(t)) {
      throw new Error(`[docx] Malformed GFM separator in ${label}: ${t.slice(0, 80)}`);
    }
  }
}

/** @param {string} filePath */
export async function docxFileToMarkdown(filePath) {
  const buffer = fs.readFileSync(filePath);
  const md = await docxBufferToMarkdown(buffer);
  assertCleanGfmTables(md, filePath);
  return md;
}

/** @param {string} markdown */
export function summaryFromMarkdown(markdown, fallback = "") {
  const plain = markdown
    .replace(/^#+\s+/gm, "")
    .replace(/\|[^|\n]+\|/g, " ")
    .replace(/[*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = plain.split(/(?<=[.!?])\s+/).find((s) => s.length > 40) ?? plain.slice(0, 220);
  const text = (sentence || fallback).slice(0, 280);
  return text.endsWith("…") ? text : text.length >= 280 ? `${text.slice(0, 277)}…` : text;
}