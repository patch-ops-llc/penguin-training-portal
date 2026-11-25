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
  let md = turndown.turndown(html);
  md = md
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^(#{1,6})\s*(.+)$/gm, (_, hashes, text) => `${hashes} ${text.trim()}`);
  return md;
}

/** @param {string} filePath */
export async function docxFileToMarkdown(filePath) {
  const buffer = fs.readFileSync(filePath);
  return docxBufferToMarkdown(buffer);
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