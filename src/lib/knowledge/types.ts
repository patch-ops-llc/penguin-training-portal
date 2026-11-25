import type { KnowledgeDocumentCategory } from "@prisma/client";

export type KnowledgeCategoryFilter =
  | "all"
  | "core-onboarding"
  | "division-quoting"
  | "division-handover"
  | "training-recordings";

export const KNOWLEDGE_CATEGORY_FILTERS: { id: KnowledgeCategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "core-onboarding", label: "Core Onboarding" },
  { id: "division-quoting", label: "Division Quoting Guides" },
  { id: "division-handover", label: "Division Handovers" },
  { id: "training-recordings", label: "Training Recordings" },
];

export function filterToPrismaCategories(filter: KnowledgeCategoryFilter): KnowledgeDocumentCategory[] | null {
  switch (filter) {
    case "all":
      return null;
    case "core-onboarding":
      return ["CORE_GUIDE"];
    case "division-quoting":
      return ["QUOTING_GUIDE"];
    case "division-handover":
      return ["DIVISION_HANDOVER"];
    case "training-recordings":
      return ["RECORDING"];
    default:
      return null;
  }
}

export function categoryBadgeLabel(category: KnowledgeDocumentCategory): string {
  switch (category) {
    case "CORE_GUIDE":
      return "Core Onboarding";
    case "QUOTING_GUIDE":
      return "Quoting Guide";
    case "DIVISION_HANDOVER":
      return "Division Handover";
    case "RECORDING":
      return "Training Recording";
    default:
      return "Document";
  }
}

export function categoryBadgeClass(category: KnowledgeDocumentCategory): string {
  switch (category) {
    case "CORE_GUIDE":
      return "bg-penguin-soft text-penguin";
    case "QUOTING_GUIDE":
      return "bg-info-soft text-info";
    case "DIVISION_HANDOVER":
      return "bg-warning-soft text-warning";
    case "RECORDING":
      return "bg-success-soft text-success";
    default:
      return "bg-surface-sunken text-ink-soft";
  }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME = "application/pdf";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;