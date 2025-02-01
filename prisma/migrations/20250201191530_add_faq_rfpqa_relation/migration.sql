-- AlterTable
ALTER TABLE "faq" ADD COLUMN     "rfpQaId" INTEGER;

-- AddForeignKey
ALTER TABLE "faq" ADD CONSTRAINT "faq_rfpQaId_fkey" FOREIGN KEY ("rfpQaId") REFERENCES "rfp_qa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
