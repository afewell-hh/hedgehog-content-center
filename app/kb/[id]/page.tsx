'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SimpleMDE from 'react-simplemde-editor';
import LLMChat from '@/components/LLMChat';
import { useLLM } from '@/lib/hooks/useLLM';
import 'easymde/dist/easymde.min.css';

interface KbEntry {
  id: number;
  article_title: string;
  article_subtitle: string;
  article_body: string;
  category: string;
  subcategory: string;
  keywords: string;
  internal_status: string;
  visibility: string;
  notes: string;
  metadata: {
    citations?: Array<{ number: number; url: string }>;
  };
}

export default function EditKbEntryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [entry, setEntry] = useState<KbEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { verifyContent } = useLLM({
    onError: (error) => setError(error.message),
  });

  const categories = [
    'Glossary',
    'FAQs',
    'Getting started',
    'Troubleshooting',
    'General',
    'Reports',
    'Integrations',
  ];

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/kb-entries/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch KB entry');
        }
        const data = await response.json();
        setEntry(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [params.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!entry) return;
    const { name, value } = e.target;
    setEntry((prev) => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleEditorChange = (value: string) => {
    if (!entry) return;
    setEntry((prev) => prev ? ({ ...prev, article_body: value }) : null);
  };

  const handleAddCitation = (citation: { number: number; url: string }) => {
    if (!entry) return;
    setEntry((prev) => {
      if (!prev) return null;
      const citations = prev.metadata.citations || [];
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          citations: [...citations, citation],
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setSaving(true);
    setError(null);

    try {
      // Verify content before saving
      const verificationResult = await verifyContent(
        entry.article_body,
        JSON.stringify({
          title: entry.article_title,
          category: entry.category,
          citations: entry.metadata.citations,
        })
      );

      if (!verificationResult.isValid) {
        setError(`Content verification failed: ${verificationResult.feedback}`);
        return;
      }

      const response = await fetch(`/api/kb-entries/${entry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error('Failed to update KB entry');
      }

      router.push('/kb');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Entry not found
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Edit KB Entry</h1>
        <button
          onClick={() => setShowChat(!showChat)}
          className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-dark"
        >
          {showChat ? 'Hide Assistant' : 'Show Assistant'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-${showChat ? '2' : '3'}`}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    name="article_title"
                    value={entry.article_title}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    name="article_subtitle"
                    value={entry.article_subtitle}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={entry.category}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="internal_status"
                    value={entry.internal_status}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Review">Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Visibility
                  </label>
                  <select
                    name="visibility"
                    value={entry.visibility}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Keywords
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={entry.keywords}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <SimpleMDE
                value={entry.article_body}
                onChange={handleEditorChange}
                options={{
                  spellChecker: false,
                  status: ['lines', 'words'],
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={entry.notes}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>

            {entry.metadata.citations && entry.metadata.citations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Citations
                </label>
                <div className="bg-gray-50 p-4 rounded">
                  {entry.metadata.citations.map((citation, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-gray-600">[{citation.number}]:</span>
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {citation.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {showChat && (
          <div className="lg:col-span-1 border rounded-lg overflow-hidden h-[800px]">
            <LLMChat
              context={JSON.stringify({
                title: entry.article_title,
                category: entry.category,
                content: entry.article_body,
                citations: entry.metadata.citations,
              })}
              onUpdateContent={(content) =>
                setEntry((prev) =>
                  prev ? { ...prev, article_body: content } : null
                )
              }
              onAddCitation={handleAddCitation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
