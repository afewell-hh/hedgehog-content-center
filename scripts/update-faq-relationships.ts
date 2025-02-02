import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get all FAQs that have source_rfp_id in metadata but no rfpQaId
  const faqs = await prisma.faq.findMany({
    where: {
      rfpQaId: null,
    },
  });

  for (const faq of faqs) {
    const metadata = faq.metadata as any;
    if (metadata?.source_rfp_id) {
      // Find the RFP QA record
      const rfpQa = await prisma.rfpQa.findFirst({
        where: {
          id: parseInt(metadata.source_rfp_id, 10),
        },
      });

      if (rfpQa) {
        // Update the FAQ with the proper relationship
        await prisma.faq.update({
          where: { id: faq.id },
          data: {
            rfpQaId: rfpQa.id,
          },
        });
        console.log(`Updated FAQ ${faq.id} with rfpQaId ${rfpQa.id}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
