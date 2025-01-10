"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFaqPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function handleCreate() {
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
    if (res.ok) {
      alert("FAQ created!");
      router.push("/faq"); // go back to the FAQ list
    } else {
      alert("Error creating FAQ");
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create New FAQ</h1>
      <label className="block mb-1">Question:</label>
      <input
        className="border p-1 w-full mb-2"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <label className="block mb-1">Answer:</label>
      <textarea
        className="border p-1 w-full mb-2 h-24"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button
        onClick={handleCreate}
        className="bg-green-600 text-white px-3 py-1 rounded"
      >
        Save
      </button>
    </div>
  );
}
