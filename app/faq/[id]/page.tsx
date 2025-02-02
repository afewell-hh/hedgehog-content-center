"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import FaqEditor from "./FaqEditor";
import LlmInteraction from "../../components/LlmInteraction";
import RelatedFaqs from "../../components/RelatedFaqs";

interface FaqDetailProps {
  params: { id: string };
}

interface Faq {
  id: number;
  question: string;
  answer: string;
  metadata: any;
  visibility: string;
  status: string;
  notes: string | null;
  rfpQa: any;
}

export default function FaqDetailPage({ params }: FaqDetailProps) {
  const router = useRouter();
  const [faqItem, setFaqItem] = useState<Faq | null>(null);
  const [relatedFaqs, setRelatedFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaqData = async () => {
      try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
          notFound();
          return;
        }

        const response = await fetch(`/api/faq/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
            return;
          }
          throw new Error('Failed to fetch FAQ');
        }

        const data = await response.json();
        setFaqItem(data);

        // Fetch related FAQs if this FAQ is related to an RFP Q&A
        if (data.rfpQa) {
          const relatedResponse = await fetch(`/api/faq/related/${data.rfpQa.id}`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedFaqs(relatedData.filter((faq: any) => faq.id !== id));
          }
        }
      } catch (error) {
        console.error('Error fetching FAQ:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="container p-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!faqItem) {
    return notFound();
  }

  const handleFaqUpdate = (updatedFaq: { question: string; answer: string }) => {
    setFaqItem(prev => prev ? { ...prev, ...updatedFaq } : null);
  };

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
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">LLM Interaction</h2>
            <p className="text-sm text-gray-600 mb-4">
              Ask me questions about this FAQ or request changes to the content. I can help you improve the question and answer.
            </p>
            <LlmInteraction
              faqId={faqItem.id}
              onUpdate={handleFaqUpdate}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Related FAQs</h2>
          {faqItem.rfpQa ? (
            <RelatedFaqs faqs={relatedFaqs} />
          ) : (
            <p className="text-gray-500">This FAQ is not associated with an RFP Q&A record.</p>
          )}
        </div>
      </div>
    </div>
  );
}