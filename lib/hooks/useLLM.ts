import { useState } from 'react';

interface UseLLMOptions {
  onError?: (error: Error) => void;
}

interface CitationResult {
  text: string;
  citations: Array<{
    number: number;
    url: string;
  }>;
}

interface VerificationResult {
  isValid: boolean;
  feedback: string;
  suggestedChanges?: string;
}

export function useLLM(options: UseLLMOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: Error) => {
    setError(error);
    options.onError?.(error);
  };

  const generateContent = async (prompt: string, context: string): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kb-llm?action=generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      return data.content;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate content');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const processCitations = async (text: string): Promise<CitationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kb-llm?action=citations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to process citations');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process citations');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyContent = async (content: string, context: string): Promise<VerificationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kb-llm?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify content');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to verify content');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateContent,
    processCitations,
    verifyContent,
  };
}
