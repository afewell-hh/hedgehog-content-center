import { useState } from 'react';
import { OpenAI } from 'openai';
import { formatLlmResponse } from '@/lib/formatUtils';

interface KbEntry {
  id: number;
  article_title: string;
  article_subtitle: string;
  article_body: string;
  category: string;
  keywords: string;
  [key: string]: any;
}

interface KbLlmInteractionProps {
  entry: KbEntry;
  onUpdate: (entry: KbEntry) => void;
  prompt: string;
}

export default function KbLlmInteraction({ entry, onUpdate, prompt }: KbLlmInteractionProps) {
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newMessage = { role: 'user', content: userInput };
    setConversation(prev => [...prev, newMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/llm/kb/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...conversation, newMessage],
          entry: {
            title: entry.article_title,
            subtitle: entry.article_subtitle,
            body: entry.article_body,
            category: entry.category,
            keywords: entry.keywords
          },
          prompt: prompt // Use the custom prompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      if (data.updatedEntry) {
        onUpdate({
          ...entry,
          article_subtitle: data.updatedEntry.subtitle,
          article_body: data.updatedEntry.body
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="h-64 overflow-y-auto p-4 border border-gray-200 rounded-t-lg">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-orange-100 text-gray-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block p-3 rounded-lg bg-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me about improving this article..."
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !userInput.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
