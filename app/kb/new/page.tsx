'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import KbLlmInteraction from '@/app/components/KbLlmInteraction';
import PromptPanel from '@/app/components/PromptPanel';
import { usePrompts, defaultPrompts } from '@/app/hooks/usePrompts';
import 'easymde/dist/easymde.min.css';

// Dynamic import of SimpleMDE to prevent SSR issues
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false
});

interface FormData {
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

const initialFormData: FormData = {
  knowledge_base_name: 'KB',
  article_title: '',
  article_subtitle: '',
  article_language: 'English',
  article_url: '',  // Will be generated on the server
  article_body: '',
  category: 'Glossary',
  subcategory: '',
  keywords: '',
  status: 'DRAFT',  // Read-only, controlled by internal_status and visibility
  archived: false,
  internal_status: 'Draft',
  visibility: 'Private',
  notes: '',
  metadata: {},
};

interface PromptPanelState {
  isOpen: boolean;
  type: 'quick-update' | 'interactive' | 'newEntry';
  prompt: string;
}

export default function CreateKbEntryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { prompts, updatePrompt } = usePrompts();
  const [promptPanel, setPromptPanel] = useState<PromptPanelState>({
    isOpen: false,
    type: 'newEntry',
    prompt: prompts.newEntry || defaultPrompts.newEntry
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
    const { name, value } = e.target;
    setFormData((prev) => {
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
    setFormData((prev) => ({
      ...prev,
      article_body: value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/kb-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create KB entry');
      }

      const entry = await response.json();
      router.push(`/kb/${entry.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  };

  const handleOpenPrompt = () => {
    setPromptPanel({
      isOpen: true,
      type: 'newEntry',
      prompt: prompts.newEntry || defaultPrompts.newEntry
    });
  };

  const handleClosePrompt = () => {
    setPromptPanel(prev => ({ ...prev, isOpen: false }));
  };

  const handlePromptChange = (newPrompt: string) => {
    setPromptPanel(prev => ({ ...prev, prompt: newPrompt }));
  };

  const handlePromptSave = () => {
    updatePrompt('newEntry', promptPanel.prompt);
  };

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Create New KB Entry</h1>

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
                value={formData.article_title}
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
                value={formData.category}
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
                value={formData.subcategory}
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
                value={formData.keywords}
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
                value={formData.internal_status}
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
                value={formData.visibility}
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
                value={formData.status}
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
                value={formData.notes}
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
            value={formData.article_subtitle}
            onChange={(value) => setFormData(prev => ({ ...prev, article_subtitle: value }))}
            options={editorOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article Body
          </label>
          <SimpleMDE
            value={formData.article_body}
            onChange={handleEditorChange}
            options={editorOptions}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Assistance</h2>
          <p className="text-gray-600 mb-6">
            Get help creating your KB entry:
          </p>
          
          <div className="space-y-6">
            {/* AI Assistance Section */}
            <div className="space-y-8 px-4 py-6">
              <div className="flex flex-col space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">AI Assistance</h2>
                <p className="text-gray-600">
                  Get help from AI while creating your KB entry
                </p>
                
                {/* Interactive Chat Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-500 transition-colors">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Interactive Chat</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Have a conversation with AI to get help creating your content.
                          </p>
                        </div>
                        <button
                          onClick={handleOpenPrompt}
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
                    entry={formData}
                    onUpdate={(updatedEntry) => {
                      setFormData(prev => ({
                        ...prev,
                        article_subtitle: updatedEntry.article_subtitle,
                        article_body: updatedEntry.article_body,
                        keywords: updatedEntry.keywords
                      }));
                    }}
                    prompt={prompts.newEntry}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Panel */}
        <PromptPanel
          isOpen={promptPanel.isOpen}
          type={promptPanel.type}
          prompt={promptPanel.prompt}
          onClose={handleClosePrompt}
          onPromptChange={handlePromptChange}
          onSave={handlePromptSave}
        />

        <hr className="my-8 border-t border-gray-200" />
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-orange-200 rounded-md shadow-sm text-sm font-medium text-orange-600 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save KB Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
