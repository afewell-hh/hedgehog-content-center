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

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAutoUpdate}
            disabled={updating}
            className="mb-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update KB Entry with AI'}
          </button>
        </div>

        <KbLlmInteraction
          formData={{
            article_title: entry.article_title,
            article_subtitle: entry.article_subtitle,
            article_body: entry.article_body,
            category: entry.category,
          }}
        />

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
