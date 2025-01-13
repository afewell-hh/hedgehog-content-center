-- CreateTable
CREATE TABLE "rfp_qa" (
    "id" SERIAL NOT NULL,
    "record_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "ingestion_date" TIMESTAMPTZ(6),
    "company_name" TEXT,
    "company_crm_id" TEXT,
    "creation_date" TIMESTAMPTZ(6),
    "rfp_id" TEXT,

    CONSTRAINT "rfp_qa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);
