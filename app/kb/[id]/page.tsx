'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import KbLlmInteraction from '@/app/components/KbLlmInteraction';
import 'easymde/dist/easymde.min.css';

interface KbEntry {
  id: number;
  knowledge_base_name: string;
  article_title: string;
  article_subtitle: string;
  article_language: string;
  article_url: string;
  article_body: string;
  category: string;
  subcategory: string;
  keywords: string;
  status: string;
  archived: boolean;
  internal_status: string;
  visibility: string;
  notes: string;
  metadata: Record<string, any>;
}

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false
});

export default function EditKbEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [entry, setEntry] = useState<KbEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const response = await fetch(`/api/kb-entries/${resolvedParams.id}`);
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
  }, [resolvedParams.id]);

  // Memoized editor options
  const editorOptions = useMemo(() => ({
    spellChecker: false,
    status: false,
    toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "preview"],
  }), []);

  // Calculate Hubspot status based on internal_status and visibility
  const calculateHubspotStatus = (internal_status: string, visibility: string): string => {
    return (internal_status === 'Approved' && visibility === 'Public') ? 'PUBLISHED' : 'DRAFT';
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!entry) return;
    const { name, value } = e.target;
    setEntry((prev) => {
      if (!prev) return null;
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // Update status if internal_status or visibility changes
      if (name === 'internal_status' || name === 'visibility') {
        newData.status = calculateHubspotStatus(
          name === 'internal_status' ? value : prev.internal_status,
          name === 'visibility' ? value : prev.visibility
        );
      }
      
      return newData;
    });
  };

  // Memoized editor change handler
  const handleEditorChange = useMemo(() => (value: string) => {
    if (!entry) return;
    setEntry((prev) => prev ? ({
      ...prev,
      article_body: value,
    }) : null);
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setSaving(true);
    setError(null);

    try {
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

  const handleAutoUpdate = async () => {
    if (!entry) return;
    
    if (!confirm('This will automatically update the KB entry using AI. The content will be verified against authoritative sources. Continue?')) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/llm/kb/auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: entry.article_title,
          subtitle: entry.article_subtitle,
          body: entry.article_body,
          category: entry.category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-update KB entry');
      }

      const data = await response.json();
      
      // Update the entry with the AI-generated content
      setEntry(prev => {
        if (!prev) return null;
        return {
          ...prev,
          article_subtitle: data.subtitle,
          article_body: data.body,
        };
      });

      // Show success message
      alert('KB entry has been updated successfully. Please review the changes before saving.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-update KB entry');
    } finally {
      setUpdating(false);
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
      <h1 className="text-3xl font-bold text-primary mb-6">Edit KB Entry</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        autoComplete="off"
        data-lpignore="true"
      >
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subcategory
              </label>
              <input
                type="text"
                name="subcategory"
                value={entry.subcategory}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Internal Status
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
                Hubspot Status
                <span className="ml-2 text-xs text-gray-500">
                  (Controlled by Internal Status and Visibility)
                </span>
              </label>
              <input
                type="text"
                value={entry.status}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">
                PUBLISHED when Internal Status is Approved and Visibility is Public, otherwise DRAFT
              </p>
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
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subtitle
          </label>
          <SimpleMDE
            value={entry.article_subtitle}
            onChange={(value) => setEntry(prev => prev ? ({ ...prev, article_subtitle: value }) : null)}
            options={editorOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article Body
          </label>
          <SimpleMDE
            value={entry.article_body}
            onChange={handleEditorChange}
            options={editorOptions}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Assistance</h2>
          <p className="text-gray-600 mb-6">
            Choose how you want AI to help improve your KB entry:
          </p>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Automatic Update Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-500 transition-colors">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Quick Update</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Let AI automatically improve your content with verified information and proper citations.
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• Fact-checks against reliable sources</li>
                    <li>• Adds relevant citations</li>
                    <li>• Improves clarity and completeness</li>
                  </ul>
                  <button
                    type="button"
                    onClick={handleAutoUpdate}
                    disabled={updating}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update with AI'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Chat Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Interactive Chat</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Have a conversation with AI to get specific help and suggestions for your content.
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• Ask specific questions</li>
                    <li>• Get writing suggestions</li>
                    <li>• Refine content iteratively</li>
                  </ul>
                </div>
              </div>
              <KbLlmInteraction
                formData={{
                  article_title: entry.article_title,
                  article_subtitle: entry.article_subtitle,
                  article_body: entry.article_body,
                  category: entry.category,
                }}
              />
            </div>
          </div>
        </div>

        <hr className="my-8 border-t border-gray-200" />
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
