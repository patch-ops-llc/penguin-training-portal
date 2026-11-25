-- CreateEnum
CREATE TYPE "KnowledgeDocumentCategory" AS ENUM ('CORE_GUIDE', 'DIVISION_HANDOVER', 'QUOTING_GUIDE', 'RECORDING', 'OTHER');

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "KnowledgeDocumentCategory" NOT NULL,
    "division" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "contentMarkdown" TEXT NOT NULL DEFAULT '',
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "fileBytes" BYTEA,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "adminEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeDocument_tenantId_category_idx" ON "KnowledgeDocument"("tenantId", "category");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_tenantId_sortOrder_idx" ON "KnowledgeDocument"("tenantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDocument_tenantId_slug_key" ON "KnowledgeDocument"("tenantId", "slug");

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
