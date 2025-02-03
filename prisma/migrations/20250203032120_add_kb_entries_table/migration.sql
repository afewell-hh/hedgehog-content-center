-- CreateTable
CREATE TABLE "kb_entries" (
    "id" SERIAL NOT NULL,
    "knowledge_base_name" TEXT NOT NULL DEFAULT 'KB',
    "article_title" TEXT NOT NULL,
    "article_subtitle" TEXT,
    "article_language" TEXT NOT NULL DEFAULT 'English',
    "article_url" TEXT NOT NULL,
    "article_body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "keywords" TEXT,
    "last_modified_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "internal_status" TEXT NOT NULL DEFAULT 'Draft',
    "visibility" TEXT NOT NULL DEFAULT 'Private',
    "notes" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kb_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kb_entries_article_url_key" ON "kb_entries"("article_url");
