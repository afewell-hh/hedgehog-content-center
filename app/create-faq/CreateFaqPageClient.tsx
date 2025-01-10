"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateFaqPageClient() {
  const router = useRouter();
  const [rfpList, setRfpList] = useState<any[]>([]);
  const [selectedRfp, setSelectedRfp] = useState<any | null>(null);

  // Proposed FAQ text
  const [proposedQuestion, setProposedQuestion] = useState("");
  const [proposedAnswer, setProposedAnswer] = useState("");

  // 1) Fetch RFP_QA list from an API route, e.g. /api/rfp-qa
  useEffect(() => {
    async function fetchRfpQa() {
      const res = await fetch("/api/rfp-qa");
      const data = await res.json();
      setRfpList(data);
    }
    fetchRfpQa();
  }, []);

  function handleSelectRfp(rfp: any) {
    setSelectedRfp(rfp);
    setProposedQuestion("");
    setProposedAnswer("");
  }

  async function handleGenerateFaq() {
    if (!selectedRfp) return;
    // Example call to /api/llm
    const res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: selectedRfp.question,
        answer: selectedRfp.answer,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      // Expect { question: "...", answer: "..." }
      setProposedQuestion(data.question);
      setProposedAnswer(data.answer);
    }
  }

  async function handleCreateFaq() {
    // Create new FAQ using the *proposed* Q&A, not the original RFP
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: proposedQuestion,
        answer: proposedAnswer,
        metadata: selectedRfp ? { source_rfp_id: selectedRfp.id } : {},
      }),
    });
    if (res.ok) {
      alert("FAQ created!");
      router.push("/faq");
    }
  }

  return (
    <div className="flex gap-4">
      {/* LEFT: Scrollable RFP_QA List */}
      <div className="w-1/3 border-r border-gray-300 h-[80vh] overflow-y-auto p-2">
        <h2 className="font-bold mb-2">RFP_QA Records</h2>
        {rfpList.map((rfp) => (
          <div
            key={rfp.id}
            className={`p-2 border-b cursor-pointer ${
              selectedRfp?.id === rfp.id ? "bg-blue-100" : ""
            }`}
            onClick={() => handleSelectRfp(rfp)}
          >
            <p className="font-semibold">{rfp.question.slice(0, 60)}...</p>
          </div>
        ))}
      </div>

      {/* RIGHT: Proposed FAQ */}
      <div className="flex-1 p-4">
        {selectedRfp ? (
          <div>
            <h2 className="text-lg font-bold mb-2">Selected RFP_QA</h2>
            <p>
              <strong>Q:</strong> {selectedRfp.question}
            </p>
            <p>
              <strong>A:</strong> {selectedRfp.answer}
            </p>

            <button
              className="px-3 py-1 bg-blue-600 text-white rounded mt-2"
              onClick={handleGenerateFaq}
            >
              Generate FAQ
            </button>

            <div className="mt-4">
              <h2 className="font-bold">Proposed FAQ Entry</h2>
              <label className="block mt-2">Question</label>
              <input
                className="block border w-full p-1"
                value={proposedQuestion}
                onChange={(e) => setProposedQuestion(e.target.value)}
              />
              <label className="block mt-2">Answer</label>
              <textarea
                className="block border w-full p-1 h-32"
                value={proposedAnswer}
                onChange={(e) => setProposedAnswer(e.target.value)}
              />
              <button
                className="px-3 py-1 bg-green-600 text-white rounded mt-2"
                onClick={handleCreateFaq}
              >
                Create FAQ Entry
              </button>
            </div>
          </div>
        ) : (
          <p>Select an RFP_QA record from the list on the left.</p>
        )}
      </div>
    </div>
  );
}
