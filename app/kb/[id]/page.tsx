'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import KbLlmInteraction from '@/app/components/KbLlmInteraction';
import PromptPanel from '@/app/components/PromptPanel';
import { defaultPrompts } from '@/app/hooks/usePrompts';
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
  navigation?: {
    prev: { id: number; title: string } | null;
    next: { id: number; title: string } | null;
  };
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

  const [prompts, setPrompts] = useState<{
    'quickUpdate': string;
    'interactive': string;
  }>({
    'quickUpdate': '',
    'interactive': ''
  });

  useEffect(() => {
    const loadedPrompts = {
      'quickUpdate': localStorage.getItem('prompt-quickUpdate') || defaultPrompts['quickUpdate'],
      'interactive': localStorage.getItem('prompt-interactive') || defaultPrompts['interactive']
    };
    setPrompts(loadedPrompts);
  }, []);

  const updatePrompt = (type: 'quickUpdate' | 'interactive', newPrompt: string) => {
    setPrompts(prev => ({
      ...prev,
      [type]: newPrompt
    }));
    localStorage.setItem(`prompt-${type}`, newPrompt);
    setPromptPanel(prev => ({ ...prev, isOpen: false }));
  };

  const handleOpenPrompt = (type: 'quickUpdate' | 'interactive') => {
    setPromptPanel({
      isOpen: true,
      type,
      prompt: prompts[type] || defaultPrompts[type]
    });
  };

  const handleClosePrompt = () => {
    setPromptPanel(prev => ({ ...prev, isOpen: false }));
  };

  const handlePromptChange = (newPrompt: string) => {
    setPromptPanel(prev => ({ ...prev, prompt: newPrompt }));
  };

  const handlePromptSave = () => {
    const { type, prompt } = promptPanel;
    updatePrompt(type, prompt);
  };

  const [promptPanel, setPromptPanel] = useState<{
    isOpen: boolean;
    type: 'quickUpdate' | 'interactive';
    prompt: string;
  }>({
    isOpen: false,
    type: 'quickUpdate',
    prompt: ''
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

  const editorOptions = useMemo(() => ({
    spellChecker: false,
    status: false,
    toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "preview"],
  }), []);

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
      
      if (name === 'internal_status' || name === 'visibility') {
        newData.status = calculateHubspotStatus(
          name === 'internal_status' ? value : prev.internal_status,
          name === 'visibility' ? value : prev.visibility
        );
      }
      
      return newData;
    });
  };

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
          keywords: entry.keywords,
          prompt: prompts['quickUpdate']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-update KB entry');
      }

      const data = await response.json();
      
      setEntry(prev => {
        if (!prev) return null;
        return {
          ...prev,
          article_subtitle: data.subtitle,
          article_body: data.body,
          keywords: data.keywords,
        };
      });

      alert('KB entry has been updated successfully. Please review the changes before saving.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-update KB entry');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    // First confirmation
    if (!confirm('Are you sure you want to delete this KB entry?')) {
      return;
    }

    // Second confirmation with reason
    const reason = prompt('Please provide a reason for deletion (required):');
    if (!reason) {
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/kb-entries/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete KB entry');
      }

      router.push('/kb');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
    <div className="container p-4 relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Edit KB Entry</h1>
        <div className="flex gap-4">
          {entry?.navigation?.prev && (
            <button
              type="button"
              onClick={() => router.push(`/kb/${entry.navigation.prev.id}`)}
              className="inline-flex items-center px-4 py-2 border border-orange-200 rounded-md shadow-sm text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous Record
            </button>
          )}
          {entry?.navigation?.next && (
            <button
              type="button"
              onClick={() => router.push(`/kb/${entry.navigation.next.id}`)}
              className="inline-flex items-center px-4 py-2 border border-orange-200 rounded-md shadow-sm text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Next Record
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {entry && (
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
                  value={entry.notes || ''}
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
            
            <div className="space-y-6">
              {/* Quick Update Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-500 transition-colors">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Quick Update</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Let AI automatically improve your content with verified information and proper citations.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenPrompt('quickUpdate')}
                        className="flex items-center text-gray-500 hover:text-orange-600 transition-colors"
                      >
                        <span className="mr-2 text-sm">View/Edit Prompt</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="sm:flex sm:justify-between sm:items-start mt-4">
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Fact-checks against reliable sources</li>
                        <li>• Adds relevant citations</li>
                        <li>• Improves clarity and completeness</li>
                      </ul>
                      <button
                        type="button"
                        onClick={handleAutoUpdate}
                        disabled={updating}
                        className="mt-4 sm:mt-0 sm:ml-4 sm:w-48 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              </div>

              {/* Interactive Chat Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-500 transition-colors">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Interactive Chat</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Have a conversation with AI to get specific help and suggestions for your content.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenPrompt('interactive')}
                        className="flex items-center text-gray-500 hover:text-orange-600 transition-colors"
                      >
                        <span className="mr-2 text-sm">View/Edit Prompt</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      <li>• Ask specific questions</li>
                      <li>• Get writing suggestions</li>
                      <li>• Refine content iteratively</li>
                    </ul>
                  </div>
                </div>
                <KbLlmInteraction
                  entry={entry}
                  onUpdate={(updatedEntry) => setEntry(updatedEntry)}
                  prompt={prompts['interactive']}
                />
              </div>
            </div>
          </div>

          <hr className="my-8 border-t border-gray-200" />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              disabled={saving}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
              <span>Delete Entry</span>
            </button>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/kb')}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

        </form>
      )}

      <PromptPanel
        isOpen={promptPanel.isOpen}
        type={promptPanel.type}
        prompt={promptPanel.prompt}
        onClose={handleClosePrompt}
        onPromptChange={handlePromptChange}
        onSave={handlePromptSave}
      />
    </div>
  );
}
