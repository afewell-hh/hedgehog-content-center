"use client";

import { useEffect, useState, useMemo, use } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";

// Import SimpleMDE dynamically with SSR disabled
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

ModuleRegistry.registerModules([ClientSideRowModelModule]);

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
  const [dialogueHistory, setDialogueHistory] = useState<{ role: string; content: string }[]>([]);
  const [userInput, setUserInput] = useState("");
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

  const handleSendMessage = async () => {
    if (!userInput.trim() || !faqItem) return;

    setDialogueHistory([...dialogueHistory, { role: "user", content: userInput }]);

    try {
      const llmResponse = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "dialogue",
          userInput,
          currentFaq: {
            question: faqItem.question,
            answer: faqItem.answer,
          },
          faqId: faqItem.id,
        }),
      });

      if (llmResponse.ok) {
        const responseData = await llmResponse.json();
        
        if (responseData.functionCall === "update_faq" && responseData.question && responseData.answer) {
          // Update the FAQ content
          setFaqItem(prev => prev ? {
            ...prev,
            question: responseData.question,
            answer: responseData.answer
          } : null);
          
          // Save the changes to the database
          await fetch(`/api/faq/${faqItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: responseData.question,
              answer: responseData.answer,
              visibility: faqItem.visibility,
              status: faqItem.status,
              notes: faqItem.notes
            }),
          });
          
          setDialogueHistory(prev => [...prev, {
            role: "assistant",
            content: "I've updated the FAQ based on your feedback. Please review the changes above.",
          }]);
        } else if (responseData.message) {
          setDialogueHistory(prev => [...prev, {
            role: "assistant",
            content: responseData.message,
          }]);
        }
      } else {
        throw new Error('Failed to get LLM response');
      }
    } catch (error) {
      console.error('Error in LLM interaction:', error);
      setDialogueHistory(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
      }]);
    }

    setUserInput("");
  };

  const handleSaveFaq = async () => {
    if (!faqItem) return;

    try {
      const response = await fetch(`/api/faq/${faqItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: faqItem.question,
          answer: faqItem.answer,
          visibility: faqItem.visibility,
          status: faqItem.status,
          notes: faqItem.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  const handlePreviousRecord = async () => {
    try {
      const response = await fetch(`/api/faq/${faqItem?.id}/navigation`);
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
      const response = await fetch(`/api/faq/${faqItem?.id}/navigation`);
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

  const relatedFaqColumnDefs = useMemo<ColDef[]>(() => [
    {
      field: "id",
      headerName: "ID",
      width: 100,
    },
    {
      field: "question",
      headerName: "Question",
      flex: 2,
      cellRenderer: (params: any) => (
        <Link href={`/faq/${params.data.id}`} className="text-orange-600 hover:text-orange-700">
          {params.value}
        </Link>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
    },
    {
      field: "visibility",
      headerName: "Visibility",
      width: 120,
    },
  ], []);

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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Edit FAQ #{faqItem.id}
        </h1>
      </div>

      {/* Previous/Next Navigation */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={handlePreviousRecord}
          className="btn btn-secondary bg-orange-600 text-white hover:bg-orange-700"
        >
          Previous Record
        </button>
        <button
          onClick={handleNextRecord}
          className="btn btn-secondary bg-orange-600 text-white hover:bg-orange-700"
        >
          Next Record
        </button>
      </div>

      {/* Main Form Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
        {/* Question Field */}
        <div>
          <label className="block text-lg font-semibold mb-2">
            Question:
          </label>
          <SimpleMDE
            value={faqItem.question}
            onChange={(value) => setFaqItem(prev => prev ? { ...prev, question: value } : null)}
            options={{
              spellChecker: false,
              status: false,
            }}
          />
        </div>

        {/* Answer Field */}
        <div>
          <label className="block text-lg font-semibold mb-2">
            Answer:
          </label>
          <SimpleMDE
            value={faqItem.answer}
            onChange={(value) => setFaqItem(prev => prev ? { ...prev, answer: value } : null)}
            options={{
              spellChecker: false,
              status: false,
            }}
          />
        </div>

        {/* LLM Interaction */}
        <div>
          {/* Input Area */}
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                  e.preventDefault();
                }
              }}
              placeholder="Ask me to help improve the FAQ..."
              className="flex-1 border rounded-md p-2"
            />
            <button
              onClick={handleSendMessage}
              className="btn btn-primary bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-md"
            >
              Send
            </button>
          </div>

          {/* Dialogue History */}
          <div className="border rounded-lg p-4 bg-gray-50 h-48 overflow-y-auto mb-4">
            {dialogueHistory.length === 0 ? (
              <p className="text-gray-500">No messages yet. Start a conversation!</p>
            ) : (
              dialogueHistory.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded ${
                    message.role === "user" ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <strong className={message.role === "user" ? "text-blue-600" : "text-green-600"}>
                    {message.role === "user" ? "You" : "Assistant"}:
                  </strong>{" "}
                  {message.content}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Visibility:
            </label>
            <select
              value={faqItem.visibility}
              onChange={(e) => setFaqItem(prev => prev ? { ...prev, visibility: e.target.value } : null)}
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-semibold mb-2">
              Status:
            </label>
            <select
              value={faqItem.status}
              onChange={(e) => setFaqItem(prev => prev ? { ...prev, status: e.target.value } : null)}
              className="w-full border rounded-md p-2"
            >
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Notes:
          </label>
          <textarea
            value={faqItem.notes || ""}
            onChange={(e) => setFaqItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
            className="w-full border rounded-md p-2 h-32"
            placeholder="Add any notes about this FAQ..."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveFaq}
            className="btn btn-primary bg-orange-600 text-white hover:bg-orange-700 px-6 py-2 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Related FAQs Section */}
      {faqItem.rfpQa && relatedFaqs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Related FAQs</h2>
          <div className="ag-theme-alpine h-[300px] w-full">
            <AgGridReact
              rowData={relatedFaqs}
              columnDefs={relatedFaqColumnDefs}
              domLayout="autoHeight"
              defaultColDef={{
                sortable: true,
                resizable: true,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}