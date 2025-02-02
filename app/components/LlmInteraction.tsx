"use client";

import { useState } from "react";

interface LlmInteractionProps {
  faqId: number;
}

export default function LlmInteraction({ faqId }: LlmInteractionProps) {
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
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "dialogue",
          userInput,
          faqId,
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
    <div>
      {/* Input Area */}
      <div className="flex">
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
          className="border p-2 w-full"
          placeholder="Ask me to help improve the FAQ..."
        />
        <button
          onClick={handleSendMessage}
          className="btn btn-primary ml-2"
        >
          Send
        </button>
      </div>

      {/* Dialogue History */}
      <div className="mt-4">
        <div className="border p-2 h-48 overflow-y-auto bg-gray-50">
          {dialogueHistory.length === 0 ? (
            <p className="text-gray-500">No messages yet. Start a conversation!</p>
          ) : (
            dialogueHistory.map((message, index) => (
              <div key={index} className={`mb-2 p-2 rounded ${message.role === "user" ? "bg-blue-50" : "bg-white"}`}>
                <strong className={message.role === "user" ? "text-blue-600" : "text-green-600"}>
                  {message.role === "user" ? "You" : "Assistant"}:
                </strong>{" "}
                {message.content}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
