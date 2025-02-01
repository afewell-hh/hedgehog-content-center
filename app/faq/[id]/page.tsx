import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import FaqEditor from "./FaqEditor";
import LlmInteraction from "../../components/LlmInteraction";
import RelatedFaqs from "../../components/RelatedFaqs";

interface FaqDetailProps {
  params: { id: string };
}

export default async function FaqDetailPage({ params }: FaqDetailProps) {
  // Wait for params to be available
  const { id } = await params;
  const faqId = parseInt(id, 10);
  if (isNaN(faqId)) return notFound();

  const faqItem = await prisma.faq.findUnique({
    where: { id: faqId },
    include: {
      rfpQa: true,
    }
  });

  if (!faqItem) return notFound();

  // If this FAQ is related to an RFP Q&A, get other FAQs based on the same RFP Q&A
  let relatedFaqs = [];
  if (faqItem.rfpQa) {
    relatedFaqs = await prisma.faq.findMany({
      where: {
        rfpQaId: faqItem.rfpQa.id,
        id: { not: faqId },
      },
    });
  }

  return (
    <div className="container p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Edit FAQ #{faqItem.id}</h1>
        <Link href="/faq" className="text-blue-600 underline">
          Back to FAQ list
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card p-6">
            <FaqEditor
              id={faqItem.id}
              initialQuestion={faqItem.question}
              initialAnswer={faqItem.answer}
              metadata={faqItem.metadata}
              visibility={faqItem.visibility}
              status={faqItem.status}
              notes={faqItem.notes}
            />
          </div>

          {faqItem.rfpQa && relatedFaqs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Related FAQs</h2>
              <RelatedFaqs faqs={relatedFaqs} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">LLM Interaction</h2>
            <p className="text-sm text-gray-600 mb-4">
              Ask me questions about this FAQ or request changes to the content. I can help you improve the question and answer.
            </p>
            <LlmInteraction
              currentFaq={{
                id: faqItem.id,
                question: faqItem.question,
                answer: faqItem.answer,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}