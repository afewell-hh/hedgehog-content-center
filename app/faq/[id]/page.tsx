import { prisma } from "@/app/lib/prisma";

import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface FaqDetailProps {
  params: { id: string };
}

export default async function FaqDetailPage({ params }: FaqDetailProps) {
  const faqId = parseInt(params.id, 10);
  if (isNaN(faqId)) return notFound();

  const faqItem = await prisma.faq.findUnique({
    where: { id: faqId },
  });

  if (!faqItem) return notFound();

  return (
    <div className="container p-4 card">
      <h1 className="text-3xl font-bold text-primary mb-4">FAQ Detail #{faqItem.id}</h1>
      <p className="mb-2">
        <strong>Question:</strong> {faqItem.question}
      </p>
      <div className="mb-2 prose">
        <strong>Answer:</strong>{" "}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {faqItem.answer}
        </ReactMarkdown>
      </div>
      <p className="mb-2">
        <strong>Visibility:</strong> {faqItem.visibility}
      </p>
      <Link href="/faq" className="inline-block mt-4 text-blue-600 underline">
        Back to FAQ list
      </Link>
    </div>
  );
}