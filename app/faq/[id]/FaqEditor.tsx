"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

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
  const [answer, setAnswer] = useState(initialAnswer);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Memoize editor options
  const editorOptions = useMemo(
    () => ({
      autofocus: false,
      spellChecker: false,
      status: false,
      minHeight: "100px",
    }),
    []
  );

  const answerEditorOptions = useMemo(
    () => ({
      ...editorOptions,
      minHeight: "200px",
    }),
    [editorOptions]
  );

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          metadata,
          visibility,
          status,
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save FAQ");
      }

      router.refresh();
    } catch (error) {
      console.error("Error saving FAQ:", error);
    } finally {
      setIsSaving(false);
    }
  }, [id, question, answer, metadata, visibility, status, notes, router, isSaving]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
      <div>
        <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
          Question
        </label>
        <div className="border rounded-md overflow-hidden">
          <SimpleMDE
            id="question"
            value={question}
            onChange={setQuestion}
            options={editorOptions}
          />
        </div>
      </div>

      <div>
        <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
          Answer
        </label>
        <div className="border rounded-md overflow-hidden">
          <SimpleMDE
            id="answer"
            value={answer}
            onChange={setAnswer}
            options={answerEditorOptions}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
