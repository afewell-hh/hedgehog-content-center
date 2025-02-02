"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";

// Import SimpleMDE dynamically with SSR disabled
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface RfpQa {
  id: number;
  question: string;
  answer: string;
  metadata: object;
}

interface Faq {
  id: number;
  question: string;
  answer: string;
  metadata: object;
  visibility: string;
  status: string;
  notes: string | null;
}

export default function CreateFaqDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rfpId = parseInt(params.rfp_id as string, 10);

  const [rfpRecord, setRfpRecord] = useState<RfpQa | null>(null);
  const [proposedQuestion, setProposedQuestion] = useState("");
  const [proposedAnswer, setProposedAnswer] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [status, setStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<
    { role: string; content: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [relatedFaqs, setRelatedFaqs] = useState<Faq[]>([]);
  const [isDialogueHistoryExpanded, setIsDialogueHistoryExpanded] =
    useState(false);

  useEffect(() => {
    const fetchRfpData = async () => {
      const response = await fetch(`/api/rfp-qa/${rfpId}`);
      if (response.ok) {
        const data = await response.json();
        setRfpRecord(data);
      } else {
        console.error("Failed to fetch RFP_QA data.");
      }
    };

    fetchRfpData();
  }, [rfpId]);

  useEffect(() => {
    const fetchRelatedFaqs = async () => {
      const response = await fetch(`/api/faq/related/${rfpId}`);
      if (response.ok) {
        const data = await response.json();
        setRelatedFaqs(data);
      } else {
        console.error("Failed to fetch related FAQs.");
      }
    };

    fetchRelatedFaqs();
  }, [rfpId]);

  const handleGenerateFaq = async () => {
    try {
      const llmResponse = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "generate",
          question: rfpRecord?.question,
          answer: rfpRecord?.answer,
        }),
      });

      if (llmResponse.ok) {
        const data = await llmResponse.json();
        if (data.error) {
          console.error("API Error:", data.error);
          // You might want to show this error to the user
          return;
        }
        const { question, answer } = data;
        setProposedQuestion(question);
        setProposedAnswer(answer);
      } else {
        const errorData = await llmResponse.json().catch(() => ({ error: "Unknown error occurred" }));
        console.error("Failed to generate FAQ:", errorData.error || llmResponse.statusText);
        // You might want to show this error to the user
      }
    } catch (error) {
      console.error("Error generating FAQ:", error);
      // You might want to show this error to the user
    }
  };

  const handleSendMessage = async () => {
    // Add user's input to dialogue history
    setDialogueHistory([
      ...dialogueHistory,
      { role: "user", content: userInput },
    ]);

    // Call the LLM API for interactive dialogue
    const llmResponse = await fetch("/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "dialogue",
        userInput: userInput,
        currentFaq: {
          question: proposedQuestion,
          answer: proposedAnswer,
        },
      }),
    });

    if (llmResponse.ok) {
      const responseData = await llmResponse.json();
      if (responseData.functionCall === "update_faq") {
        setProposedQuestion(responseData.question);
        setProposedAnswer(responseData.answer);
        setDialogueHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "FAQ updated based on your feedback",
          },
        ]);
      } else {
        setDialogueHistory((prev) => [
          ...prev,
          { role: "assistant", content: responseData.message },
        ]);
      }
      setUserInput(""); // Clear the input field after sending
    } else {
      console.error("Failed to send message.");
    }
  };

  const handleSaveFaq = async () => {
    const response = await fetch("/api/faq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: proposedQuestion,
        answer: proposedAnswer,
        visibility,
        status, // Include status in the POST request
        notes, // Include notes in the POST request
        rfpId,
      }),
    });

    if (response.ok) {
      router.push("/faq");
    } else {
      console.error("Failed to save FAQ.");
    }
  };

  // New: Handle Previous/Next RFP_QA Record Navigation
  const handleNextRfp = async () => {
    const response = await fetch(`/api/rfp-qa/next/${rfpId}`);
    const data = await response.json();
    if (data.nextId) {
      router.push(`/create-faq/${data.nextId}`);
    }
  };

  const handlePreviousRfp = async () => {
    const response = await fetch(`/api/rfp-qa/prev/${rfpId}`);
    const data = await response.json();
    if (data.prevId) {
      router.push(`/create-faq/${data.prevId}`);
    }
  };

  const toggleDialogueHistory = () => {
    setIsDialogueHistoryExpanded((prev) => !prev);
  };

  // Define column definitions for related FAQs grid
  const relatedFaqColumnDefs: ColDef[] = [
    {
      headerName: "ID",
      field: "id",
      filter: "agNumberColumnFilter",
    },
    {
      headerName: "Question",
      field: "question",
      filter: "agTextColumnFilter",
      flex: 1,
    },
    {
      headerName: "Answer",
      field: "answer",
      filter: "agTextColumnFilter",
      flex: 1,
      cellRenderer: (params: { value: string }) => (
        <Markdown remarkPlugins={[remarkGfm]}>{params.value}</Markdown>
      ),
    },
    {
      headerName: "Status",
      field: "status",
      filter: "agTextColumnFilter",
      flex: 1,
    },
  ];

  // Memoize the editor options
  const editorOptions = useMemo(
    () => ({
      autofocus: false,
      spellChecker: false,
      status: false,
      minHeight: "200px",
    }),
    []
  );

  if (!rfpRecord) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">
        Create FAQ from RFP
      </h1>

      {/* New: Add Previous/Next RFP_QA Record Navigation Buttons */}
      <div className="mb-2">
        <button
          onClick={handlePreviousRfp}
          className="btn btn-secondary mr-2"
        >
          Previous Record
        </button>
        <button onClick={handleNextRfp} className="btn btn-secondary">
          Next Record
        </button>
      </div>

      {/* Display the RFP_QA record (read-only) */}
      <div className="mb-4 card">
        <h2 className="text-2xl font-bold text-primary mb-2">RFP_QA Record</h2>
        <div className="p-4">
          <p className="mb-2">
            <strong className="text-lg">Question:</strong>{" "}
            <span className="text-lg">{rfpRecord.question}</span>
          </p>
          <p className="mb-2">
            <strong className="text-lg">Answer:</strong>{" "}
            <span className="text-lg">{rfpRecord.answer}</span>
          </p>
        </div>
      </div>

      {/* Proposed FAQ Form */}
      <div className="card">
        <h2 className="text-2xl font-bold text-primary">Proposed FAQ</h2>
        <div className="mb-4">
          <button onClick={handleGenerateFaq} className="btn btn-primary">
            Generate FAQ
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="question" className="block font-bold">
            Question:
          </label>
          <input
            type="text"
            id="question"
            value={proposedQuestion}
            onChange={(e) => setProposedQuestion(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="answer" className="block font-bold">
            Answer:
          </label>
          <div className="border rounded-md overflow-hidden">
            <SimpleMDE
              id="answer"
              value={proposedAnswer}
              onChange={setProposedAnswer}
              options={editorOptions}
            />
          </div>
        </div>
        {/* LLM Interaction Field */}
        <div className="mb-4">
          <label htmlFor="userInput" className="block font-bold">
            LLM Interaction:
          </label>
          <div className="flex">
            <input
              type="text"
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                  e.preventDefault();
                }
              }}
              className="border p-2 w-full"
            />
            <button
              onClick={handleSendMessage}
              className="btn btn-primary ml-2"
            >
              Send
            </button>
          </div>
        </div>
        {/* Dialogue History */}
        <div className="mb-4">
          <button
            onClick={toggleDialogueHistory}
            className="btn btn-secondary mb-2"
          >
            {isDialogueHistoryExpanded
              ? "Hide Dialogue History"
              : "Show Dialogue History"}
          </button>
          {isDialogueHistoryExpanded && (
            <div className="border p-2">
              {dialogueHistory.map((message, index) => (
                <div key={index} className="mb-2">
                  <strong>
                    {message.role === "user" ? "You" : "Assistant"}
                  :</strong>{" "}
                  {message.content}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Visibility and Status Fields on the Same Line */}
        <div className="mb-4 flex space-x-4">
          <div>
            <label htmlFor="visibility" className="block font-bold">
              Visibility:
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
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
              value={status || "draft"}
              onChange={(e) => setStatus(e.target.value)}
              className="border p-2"
            >
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
              <option value="needs-work">Needs Work</option>
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
            value={notes || ""}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <button onClick={handleSaveFaq} className="btn btn-primary">
          Save FAQ
        </button>
      </div>

      {/* Related FAQs */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-primary mb-4">Related FAQs</h2>
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
      <Link
        href="/create-faq"
        className="inline-block mt-4 text-primary hover:text-secondary underline"
      >
        Back to Create FAQ
      </Link>
    </div>
  );
}