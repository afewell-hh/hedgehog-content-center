"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface FaqEditorProps {
  id: number;
  initialQuestion: string;
  initialAnswer: string;
  metadata: any;
  visibility: string;
  status: string;
  notes: string | null;
}

export default function FaqEditor({
  id,
  initialQuestion,
  initialAnswer,
  metadata,
  visibility: initialVisibility,
  status: initialStatus,
  notes: initialNotes,
}: FaqEditorProps) {
  const router = useRouter();
  const [question, setQuestion] = useState(initialQuestion);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialAnswer,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
  });

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const newAnswer = editor?.getHTML() || "";
      const res = await fetch(`/api/faq/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question, 
          answer: newAnswer,
          visibility,
          status,
          notes,
          metadata, // Keep existing metadata
        }),
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      router.refresh(); // refresh the page to get new data
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert("Error updating FAQ: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [editor, question, visibility, status, notes, metadata, id, router, isSaving]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-semibold mb-2" htmlFor="question">
          Question:
        </label>
        <input
          id="question"
          className="w-full px-3 py-2 border rounded-md"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold mb-2" htmlFor="answer">
          Answer:
        </label>
        <div className="border rounded-md p-4 bg-white">
          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-2" htmlFor="visibility">
          Visibility:
        </label>
        <select
          id="visibility"
          className="w-full px-3 py-2 border rounded-md"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-2" htmlFor="status">
          Status:
        </label>
        <select
          id="status"
          className="w-full px-3 py-2 border rounded-md"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-2" htmlFor="notes">
          Notes:
        </label>
        <textarea
          id="notes"
          className="w-full px-3 py-2 border rounded-md"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add any internal notes here..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full px-4 py-2 text-white rounded-md ${
          isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
