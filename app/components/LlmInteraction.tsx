"use client";

import { useState } from "react";

interface LlmInteractionProps {
  faqId: number;
  onUpdate: (updatedFaq: { question: string; answer: string }) => void;
}

export default function LlmInteraction({ faqId, onUpdate }: LlmInteractionProps) {
  const [userInput, setUserInput] = useState("");
  const [dialogueHistory, setDialogueHistory] = useState<{ role: string; content: string }[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to dialogue history
    setDialogueHistory((prev) => [...prev, { role: "user", content: userInput }]);

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

      // Handle FAQ update if the LLM suggests changes
      if (data.functionCall === "update_faq" && data.question && data.answer) {
        onUpdate({
          question: data.question,
          answer: data.answer,
        });
        setDialogueHistory((prev) => [
          ...prev,
          { role: "assistant", content: "FAQ updated based on your feedback." },
        ]);
      } else {
        // Add assistant's response to dialogue history
        setDialogueHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">AI Assistant</h3>
      
      {/* Dialogue History */}
      <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
        {dialogueHistory.length === 0 ? (
          <p className="text-gray-500">No messages yet. Start a conversation!</p>
        ) : (
          dialogueHistory.map((message, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded ${
                message.role === "user"
                  ? "bg-blue-100 ml-8"
                  : "bg-white mr-8"
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {message.role === "user" ? "You" : "Assistant"}:
              </p>
              <p className="text-sm">{message.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Ask me anything about this FAQ..."
          className="flex-1 p-2 border rounded-lg"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
