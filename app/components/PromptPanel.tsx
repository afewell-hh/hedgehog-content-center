import React from 'react';

export interface PromptPanelProps {
  isOpen: boolean;
  type: 'quick-update' | 'interactive' | null;
  prompt: string;
  onClose: () => void;
  onPromptChange: (prompt: string) => void;
  onSave: () => void;
}

export default function PromptPanel({
  isOpen,
  type,
  prompt,
  onClose,
  onPromptChange,
  onSave,
}: PromptPanelProps) {
  return (
    <div 
      className={`fixed right-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50`}
    >
      <div className="h-full flex flex-col p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {type === 'quick-update' ? 'Quick Update Prompt' : 'Interactive Chat Prompt'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close panel"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Template
            </label>
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="w-full h-64 p-2 border rounded-md font-mono text-sm"
              placeholder="Enter your prompt template here..."
            />
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><code>{'{title}'}</code> - Article title</li>
                <li><code>{'{subtitle}'}</code> - Article subtitle</li>
                <li><code>{'{body}'}</code> - Current article body</li>
                <li><code>{'{category}'}</code> - Article category</li>
                <li><code>{'{keywords}'}</code> - Article keywords</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Tips</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>Use variables to make your prompt dynamic</li>
                <li>Be specific about the desired format and style</li>
                <li>Include any special requirements or constraints</li>
              </ul>
            </div>
            
            <button
              onClick={onSave}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Save Prompt
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Changes will be applied to future AI interactions</p>
        </div>
      </div>
    </div>
  );
}
