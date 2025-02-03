"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Import SimpleMDE dynamically with SSR disabled
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

export default function NewFaqPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [dialogueHistory, setDialogueHistory] = useState<{ role: string; content: string }[]>([]);
  const [userInput, setUserInput] = useState("");

  // Memoize editor options to prevent unnecessary re-renders
  const editorOptions = useMemo(() => ({
    spellChecker: false,
    status: false,
    toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "preview"],
  }), []);

  // Memoize onChange handlers
  const handleQuestionChange = useMemo(() => (value: string) => {
    setQuestion(value);
  }, []);

  const handleAnswerChange = useMemo(() => (value: string) => {
    setAnswer(value);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

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
            question,
            answer,
          },
        }),
      });

      if (llmResponse.ok) {
        const responseData = await llmResponse.json();
        
        if (responseData.functionCall === "update_faq" && responseData.question && responseData.answer) {
          setQuestion(responseData.question);
          setAnswer(responseData.answer);
          
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

  async function handleCreate() {
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        question, 
        answer,
        visibility,
        status,
        notes
      }),
    });
    if (res.ok) {
      router.push("/faq");
    } else {
      console.error("Error creating FAQ");
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New FAQ</h1>
      </div>

      {/* Main Form Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
        {/* Question Field */}
        <div>
          <label className="block text-lg font-semibold mb-2">
            Question:
          </label>
          <SimpleMDE
            value={question}
            onChange={handleQuestionChange}  // Using the memoized handler
            options={editorOptions}
          />
        </div>

        {/* Answer Field */}
        <div>
          <label className="block text-lg font-semibold mb-2">
            Answer:
          </label>
          <div className="border rounded-lg overflow-hidden">
            <SimpleMDE
              key="answer-editor"
              value={answer}
              onChange={handleAnswerChange}
              options={editorOptions}
            />
          </div>
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
            <label className="block text-sm font-semibold mb-2">
              Status:
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-md p-2 h-32"
            placeholder="Add any notes about this FAQ..."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            className="btn btn-primary bg-orange-600 text-white hover:bg-orange-700 px-6 py-2 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
