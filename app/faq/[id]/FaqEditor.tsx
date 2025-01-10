// app/faq/[id]/FaqEditor.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface FaqEditorProps {
  id: number;
  initialQuestion: string;
  initialAnswer: string;
}

export default function FaqEditor({
  id,
  initialQuestion,
  initialAnswer,
}: FaqEditorProps) {
  const router = useRouter();
  const [question, setQuestion] = useState(initialQuestion);
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialAnswer,
  });

  // We'll call a route or server action to save
  const handleSave = useCallback(async () => {
    const newAnswer = editor?.getHTML() || "";
    const res = await fetch(`/api/faq/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer: newAnswer }),
    });
    if (res.ok) {
      alert("FAQ updated!");
      router.refresh(); // refresh the page to get new data
    } else {
      alert("Error updating FAQ");
    }
  }, [editor, question, id, router]);

  return (
    <div>
      <label className="block font-semibold mb-1">Question:</label>
      <input
        className="border p-1 w-full mb-4"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <label className="block font-semibold mb-1">Answer (Rich Text):</label>
      <div className="border p-2 mb-4">
        {editor && <EditorContent editor={editor} />}
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Save
      </button>
    </div>
  );
}
