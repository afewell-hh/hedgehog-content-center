import { useState } from 'react';
import { OpenAI } from 'openai';
import { formatLlmResponse } from '@/lib/formatUtils';

interface KbLlmInteractionProps {
  formData: {
    article_title: string;
    article_subtitle: string;
    article_body: string;
    category: string;
  };
  onUpdate?: (data: { title?: string; subtitle?: string; body?: string }) => void;
}

export default function KbLlmInteraction({ formData, onUpdate }: KbLlmInteractionProps) {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `You are a technical documentation expert. Help improve this knowledge base article.
Current article:
Title: ${formData.article_title}
Category: ${formData.category}
Subtitle: ${formData.article_subtitle}
Body: ${formData.article_body}

User request: ${userInput}

Please provide improvements that follow these STRICT formatting rules:
1. Title must be lowercase with hyphens, plain text only
2. Subtitle must be plain text only, NO HTML or markdown formatting
3. Body content must use a specific hybrid HTML/Markdown format:
   - Paragraphs must be wrapped in <p> tags
   - Use <br> for line breaks
   - Use markdown **bold** for emphasis
   - Lists can use either HTML or markdown format
   - Technical accuracy is crucial

Respond ONLY with the improved content in this format:
TITLE: [if title needs changing]
SUBTITLE: [if subtitle needs changing]
BODY: [if body needs changing]`;

      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const formattedResponse = formatLlmResponse(data.response);
      
      if (onUpdate) {
        onUpdate(formattedResponse);
      }

      setUserInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="userInput" className="sr-only">
          Your request
        </label>
        <textarea
          id="userInput"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask AI to help improve this article. For example: 'Make it more concise' or 'Add more technical details about X'"
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Get AI Help'
          )}
        </button>
      </div>
    </form>
  );
}
