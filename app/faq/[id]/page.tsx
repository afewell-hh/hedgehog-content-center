"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
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
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchFaqData = async () => {
      try {
        const id = parseInt(resolvedParams.id, 10);
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
  }, [resolvedParams.id]);

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

  const handlePreviousRecord = async () => {
    try {
      const response = await fetch(`/api/faq/${faqItem.id}/navigation`);
      if (response.ok) {
        const data = await response.json();
        if (data.prevId) {
          router.push(`/faq/${data.prevId}`);
        }
      }
    } catch (error) {
      console.error('Error navigating to previous record:', error);
    }
  };

  const handleNextRecord = async () => {
    try {
      const response = await fetch(`/api/faq/${faqItem.id}/navigation`);
      if (response.ok) {
        const data = await response.json();
        if (data.nextId) {
          router.push(`/faq/${data.nextId}`);
        }
      }
    } catch (error) {
      console.error('Error navigating to next record:', error);
    }
  };

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">
        Edit FAQ #{faqItem.id}
      </h1>

      {/* Previous/Next Navigation */}
      <div className="mb-4">
        <button
          onClick={handlePreviousRecord}
          className="btn btn-secondary mr-2"
        >
          Previous Record
        </button>
        <button
          onClick={handleNextRecord}
          className="btn btn-secondary"
        >
          Next Record
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <label htmlFor="question" className="block font-bold">
            Question:
          </label>
          <div className="border rounded-md overflow-hidden">
            <FaqEditor
              id="question"
              value={faqItem.question}
              onChange={(value) => setFaqItem(prev => prev ? { ...prev, question: value } : null)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="answer" className="block font-bold">
            Answer:
          </label>
          <div className="border rounded-md overflow-hidden">
            <FaqEditor
              id="answer"
              value={faqItem.answer}
              onChange={(value) => setFaqItem(prev => prev ? { ...prev, answer: value } : null)}
            />
          </div>
        </div>

        {/* LLM Interaction Field */}
        <div className="mb-4">
          <label htmlFor="userInput" className="block font-bold">
            LLM Interaction:
          </label>
          <div className="flex">
            <LlmInteraction
              faqId={faqItem.id}
            />
          </div>
        </div>

        {/* Visibility and Status Fields */}
        <div className="mb-4 flex space-x-4">
          <div>
            <label htmlFor="visibility" className="block font-bold">
              Visibility:
            </label>
            <select
              id="visibility"
              value={faqItem.visibility}
              onChange={(e) => setFaqItem(prev => prev ? { ...prev, visibility: e.target.value } : null)}
              className="border p-2"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
              <option value="needs-work">Needs Work</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block font-bold">
              Status:
            </label>
            <select
              id="status"
              value={faqItem.status || "draft"}
              onChange={(e) => setFaqItem(prev => prev ? { ...prev, status: e.target.value } : null)}
              className="border p-2"
            >
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Notes Field */}
        <div className="mb-4">
          <label htmlFor="notes" className="block font-bold">
            Notes:
          </label>
          <textarea
            id="notes"
            value={faqItem.notes || ""}
            onChange={(e) => setFaqItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
            className="border p-2 w-full h-32"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={() => handleFaqUpdate({ question: faqItem.question, answer: faqItem.answer })}
            className="btn btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Related FAQs Section */}
      {faqItem.rfpQa && (
        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Related FAQs</h2>
            <RelatedFaqs faqs={relatedFaqs} />
          </div>
        </div>
      )}
    </div>
  );
}