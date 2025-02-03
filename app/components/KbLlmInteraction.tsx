"use client";

import { useState } from "react";

interface KbLlmInteractionProps {
  formData: {
    article_title: string;
    article_subtitle: string;
    article_body: string;
    category: string;
  };
}

export default function KbLlmInteraction({ formData }: KbLlmInteractionProps) {
  const [userInput, setUserInput] = useState("");
  const [dialogueHistory, setDialogueHistory] = useState<{ role: string; content: string }[]>([]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to dialogue history
    setDialogueHistory([
      ...dialogueHistory,
      { role: "user", content: userInput },
    ]);

    try {
      const response = await fetch("/api/llm/kb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "dialogue",
          userInput,
          context: {
            article_title: formData.article_title,
            article_subtitle: formData.article_subtitle,
            article_body: formData.article_body,
            category: formData.category,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get LLM response");
      }

      const data = await response.json();
      
      // Add assistant's response to dialogue history
      setDialogueHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      console.error("Error in LLM interaction:", error);
      setDialogueHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error processing your request." },
      ]);
    }

    setUserInput("");
  };

  return (
    <div className="mt-8 border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">AI Assistant</h3>
      
      {/* Dialogue History */}
      <div className="mb-4">
        <div className="border rounded-lg p-2 h-48 overflow-y-auto bg-gray-50">
          {dialogueHistory.length === 0 ? (
            <p className="text-gray-500 p-4">
              No messages yet. Start a conversation! I can help you:
              <ul className="list-disc ml-5 mt-2">
                <li>Improve your article content</li>
                <li>Suggest better titles or subtitles</li>
                <li>Add relevant keywords</li>
                <li>Format your content properly</li>
                <li>Add citations when needed</li>
              </ul>
            </p>
          ) : (
            dialogueHistory.map((message, index) => (
              <div 
                key={index} 
                className={`mb-2 p-3 rounded-lg ${
                  message.role === "user" 
                    ? "bg-blue-50 border border-blue-100" 
                    : "bg-white border border-gray-200"
                }`}
              >
                <strong className={message.role === "user" ? "text-blue-700" : "text-green-700"}>
                  {message.role === "user" ? "You" : "Assistant"}:
                </strong>{" "}
                {message.content}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              handleSendMessage();
              e.preventDefault();
            }
          }}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Ask me to help with your KB article..."
        />
        <button
          onClick={handleSendMessage}
          disabled={!userInput.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
