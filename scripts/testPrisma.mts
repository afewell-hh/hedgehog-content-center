// scripts/testPrisma.ts
import { prisma } from "../app/lib/prisma";

async function main() {
  const faqEntry = await prisma.faq.findFirst();
  console.log(faqEntry);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
