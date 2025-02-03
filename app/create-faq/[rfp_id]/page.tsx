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

    console.log("Sending request to LLM API with:", {
      mode: "dialogue",
      userInput,
      currentFaq: {
        question: proposedQuestion,
        answer: proposedAnswer,
      },
    });

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
      console.log("Received response from LLM API:", responseData);

      if (responseData.functionCall === "update_faq" && responseData.question && responseData.answer) {
        console.log("Updating FAQ fields with:", {
          question: responseData.question,
          answer: responseData.answer,
        });
        
        // Update the form fields with the new FAQ content
        setProposedQuestion(responseData.question);
        setProposedAnswer(responseData.answer);
        
        // Add a message to dialogue history about the update
        setDialogueHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I've updated the FAQ based on your feedback. Please review the changes in the question and answer fields above.",
          },
        ]);
      } else if (responseData.message) {
        console.log("Adding message to dialogue history:", responseData.message);
        // Add the regular message to dialogue history
        setDialogueHistory((prev) => [
          ...prev,
          { role: "assistant", content: responseData.message },
        ]);
      }
      setUserInput(""); // Clear the input field after sending
    } else {
      console.error("Failed to send message:", await llmResponse.text());
      setDialogueHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error processing your request." },
      ]);
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

  // Memoized editor options
  const editorOptions = useMemo(() => ({
    spellChecker: false,
    status: false,
    toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "preview"],
  }), []);

  // Memoized change handlers for SimpleMDE
  const handleQuestionChange = useMemo(() => (value: string) => {
    setProposedQuestion(value);
  }, []);

  const handleAnswerChange = useMemo(() => (value: string) => {
    setProposedAnswer(value);
  }, []);

  const handlePreviousRfp = () => {
    router.push(`/create-faq/${rfpId - 1}`);
  };

  const handleNextRfp = () => {
    router.push(`/create-faq/${rfpId + 1}`);
  };

  if (!rfpRecord) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create New FAQ from RFP QA</h1>

      {/* Navigation Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={handlePreviousRfp}
          className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-md"
        >
          Previous Record
        </button>
        <button
          onClick={handleNextRfp}
          className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-md"
        >
          Next Record
        </button>
      </div>

      {/* RFP QA Record Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">RFP QA Record</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-semibold mb-2">Question:</label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Markdown remarkPlugins={[remarkGfm]}>{rfpRecord.question}</Markdown>
            </div>
          </div>
          <div>
            <label className="block text-lg font-semibold mb-2">Answer:</label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Markdown remarkPlugins={[remarkGfm]}>{rfpRecord.answer}</Markdown>
            </div>
          </div>
        </div>
      </div>

      {/* Proposed FAQ Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Proposed FAQ</h2>
        <div className="mb-6">
          <button
            onClick={handleGenerateFaq}
            className="bg-orange-600 text-white hover:bg-orange-700 px-6 py-2 rounded-md"
          >
            Generate FAQ
          </button>
        </div>

        {/* Question and Answer Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-2">Question:</label>
            <SimpleMDE
              value={proposedQuestion}
              onChange={handleQuestionChange}
              options={editorOptions}
            />
          </div>
          <div>
            <label className="block text-lg font-semibold mb-2">Answer:</label>
            <SimpleMDE
              value={proposedAnswer}
              onChange={handleAnswerChange}
              options={editorOptions}
            />
          </div>
        </div>

        {/* LLM Interaction */}
        <div className="mt-6 space-y-4">
          <label className="block text-lg font-semibold">LLM Interaction:</label>
          <div className="flex space-x-2">
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
              className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-md"
            >
              Send
            </button>
          </div>

          {/* Dialogue History */}
          <div className="border rounded-lg p-4 bg-gray-50 h-48 overflow-y-auto">
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
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Visibility:</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
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
            <label className="block text-sm font-semibold mb-2">Status:</label>
            <select
              value={status || "draft"}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-md p-2"
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
        <div className="mt-6">
          <label className="block text-sm font-semibold mb-2">Notes:</label>
          <textarea
            value={notes || ""}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-md p-2 h-32"
            placeholder="Add any notes about this FAQ..."
          />
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveFaq}
            className="bg-orange-600 text-white hover:bg-orange-700 px-6 py-2 rounded-md"
          >
            Save FAQ
          </button>
        </div>
      </div>

      {/* Related FAQs */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Related FAQs</h2>
        <div className="ag-theme-alpine" style={{ height: 400 }}>
          <AgGridReact
            rowData={relatedFaqs}
            columnDefs={relatedFaqColumnDefs}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/create-faq"
          className="text-orange-600 hover:text-orange-700 underline"
        >
          Back to Create FAQ
        </Link>
      </div>
    </div>
  );
}