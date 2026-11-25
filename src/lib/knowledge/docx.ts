import "server-only";
import { docxBufferToMarkdown, summaryFromMarkdown } from "./docx.mjs";

export { docxBufferToMarkdown, summaryFromMarkdown };

export async function extractFromUpload(bytes: Buffer): Promise<{ markdown: string; summary: string }> {
  const markdown = await docxBufferToMarkdown(bytes);
  return { markdown, summary: summaryFromMarkdown(markdown) };
}