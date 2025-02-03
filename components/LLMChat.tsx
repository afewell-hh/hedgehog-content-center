'use client';

import { useState } from 'react';
import { useLLM } from '@/lib/hooks/useLLM';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMChatProps {
  context: string;
  onUpdateContent?: (content: string) => void;
  onAddCitation?: (citation: { number: number; url: string }) => void;
}

export default function LLMChat({ context, onUpdateContent, onAddCitation }: LLMChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { loading, error, generateContent, processCitations } = useLLM({
    onError: (error) => console.error('LLM Error:', error),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Generate response
      const content = await generateContent(input, context);
      
      // Process citations if needed
      if (content.includes('[') && content.includes(']')) {
        const { text, citations } = await processCitations(content);
        
        // Add assistant message with processed text
        const assistantMessage: Message = { role: 'assistant', content: text };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update content if callback provided
        onUpdateContent?.(text);

        // Add citations if callback provided
        citations.forEach((citation) => {
          onAddCitation?.(citation);
        });
      } else {
        // Add assistant message without processing
        const assistantMessage: Message = { role: 'assistant', content };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update content if callback provided
        onUpdateContent?.(content);
      }
    } catch (err) {
      console.error('Failed to process message:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mx-4 mb-4">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for help with your KB entry..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
