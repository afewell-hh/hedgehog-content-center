import React, { useState, useEffect } from 'react';

interface PromptVersion {
  content: string;
  timestamp: string;
  author: string;
  description: string;
}

export interface PromptPanelProps {
  isOpen: boolean;
  type: 'quickUpdate' | 'interactive' | 'newEntry';
  prompt: string;
  onClose: () => void;
  onPromptChange: (prompt: string) => void;
  onSave: () => void;
}

interface TestResult {
  isValid: boolean;
  response: string;
  error?: string;
}

export default function PromptPanel({
  isOpen,
  type,
  prompt,
  onClose,
  onPromptChange,
  onSave,
}: PromptPanelProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'test' | 'history'>('edit');
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [promptHistory, setPromptHistory] = useState<PromptVersion[]>([]);
  const [changeDescription, setChangeDescription] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testData, setTestData] = useState({
    title: 'Sample Article',
    subtitle: 'A brief description',
    body: 'This is a sample article body',
    category: 'Glossary',
    keywords: 'sample, test, example'
  });

  // Update local prompt when prop changes
  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);

  const handlePromptChange = (newPrompt: string) => {
    setLocalPrompt(newPrompt);
    onPromptChange(newPrompt);
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/llm/kb/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: localPrompt,
          testData,
          type
        }),
      });

      const data = await response.json();
      setTestResult({
        isValid: data.isValid,
        response: data.response,
        error: data.error
      });
    } catch (error) {
      setTestResult({
        isValid: false,
        response: '',
        error: 'Failed to test prompt'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveVersion = () => {
    if (!changeDescription) {
      alert('Please provide a description of your changes');
      return;
    }

    const newVersion: PromptVersion = {
      content: localPrompt,
      timestamp: new Date().toISOString(),
      author: 'Current User', // Could be fetched from auth context
      description: changeDescription
    };

    setPromptHistory([newVersion, ...promptHistory]);
    setChangeDescription('');
    onSave();
  };

  const handleRestore = (version: PromptVersion) => {
    if (confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
      onPromptChange(version.content);
    }
  };

  return (
    <div 
      className={`fixed right-0 top-0 h-full w-[32rem] bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50 flex flex-col`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold">
          {type === 'quickUpdate' ? 'Quick Update Prompt' : type === 'interactive' ? 'Interactive Chat Prompt' : 'New Entry Prompt'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close panel"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-2 px-4 ${activeTab === 'edit' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`flex-1 py-2 px-4 ${activeTab === 'test' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
        >
          Test
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 ${activeTab === 'history' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-auto p-4">
        {activeTab === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Template
              </label>
              <textarea
                value={localPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                className="w-full h-64 p-2 border rounded-md font-mono text-sm"
                placeholder="Enter your prompt template here..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Description
              </label>
              <input
                type="text"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Describe your changes..."
              />
            </div>

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
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Test Data</h4>
              {Object.entries(testData).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <label className="block text-sm text-gray-600">{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setTestData(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleTest}
              disabled={isTesting}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Prompt'}
            </button>

            {testResult && (
              <div className={`p-4 rounded-md ${testResult.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                <h4 className={`font-medium mb-2 ${testResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.isValid ? 'Test Passed' : 'Test Failed'}
                </h4>
                {testResult.error && (
                  <p className="text-red-600 text-sm mb-2">{testResult.error}</p>
                )}
                <pre className="bg-white p-2 rounded border text-sm overflow-auto max-h-64">
                  {testResult.response}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {promptHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No history available</p>
            ) : (
              promptHistory.map((version, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-600">
                        {new Date(version.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">{version.author}</p>
                    </div>
                    <button
                      onClick={() => handleRestore(version)}
                      className="text-orange-600 hover:text-orange-700 text-sm"
                    >
                      Restore
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{version.description}</p>
                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto max-h-32">
                    {version.content}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveVersion}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
