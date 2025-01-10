import { prisma } from "@/app/lib/prisma";
import { faq } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

interface FaqDetailProps {
  params: { id: string }
}

export default async function FaqDetailPage({ params }: FaqDetailProps) {
  const faqId = parseInt(params.id, 10);
  if (isNaN(faqId)) return notFound();

  const faqItem: faq | null = await prisma.faq.findUnique({
    where: { id: faqId },
  });

  if (!faqItem) return notFound();

  // For now, just display the data. A real "Edit" might need a client component or server action form.
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">FAQ Detail #{faqItem.id}</h1>
      <p className="mb-2">
        <strong>Question: </strong>
        {faqItem.question}
      </p>
      <p className="mb-2">
        <strong>Answer: </strong>
        {faqItem.answer}
      </p>
      <Link
        href="/faq"
        className="inline-block mt-4 text-blue-600 underline"
      >
        Back to FAQ list
      </Link>
    </div>
  );
}
