import type { KnowledgeDocument } from "@prisma/client";

export type KnowledgeDocumentPublic = {
  id: string;
  slug: string;
  title: string;
  category: KnowledgeDocument["category"];
  division: string | null;
  summary: string;
  contentMarkdown: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  externalUrl: string | null;
  sortOrder: number;
  adminEdited: boolean;
  createdAt: string;
  updatedAt: string;
};

export function serializeKnowledgeDoc(doc: KnowledgeDocument): KnowledgeDocumentPublic {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    division: doc.division,
    summary: doc.summary,
    contentMarkdown: doc.contentMarkdown,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    externalUrl: doc.externalUrl,
    sortOrder: doc.sortOrder,
    adminEdited: doc.adminEdited,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function serializeKnowledgeList(docs: KnowledgeDocument[]): KnowledgeDocumentPublic[] {
  return docs.map(serializeKnowledgeDoc);
}