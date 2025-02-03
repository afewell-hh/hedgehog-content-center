import { useState, useEffect } from 'react';

export interface Prompts {
  quickUpdate: string;
  interactive: string;
}

export const defaultPrompts: Prompts = {
  quickUpdate: `Given the following article about {title} in the {category} category:

{body}

Please verify and enhance the content while:
1. Maintaining technical accuracy
2. Preserving the original meaning and intent
3. Improving clarity and readability
4. Adding relevant technical details
5. Ensuring proper formatting for Hubspot (paragraphs in <p> tags, line breaks as <br>)

If a subtitle is provided, enhance it as well: {subtitle}

Keywords to consider: {keywords}`,

  interactive: `You are an AI assistant helping to improve a knowledge base article about {title}.

Current article content:
{body}

Please help enhance this article while:
1. Maintaining its place in the {category} category
2. Preserving technical accuracy
3. Using clear, professional language
4. Following Hubspot formatting conventions

Consider these keywords: {keywords}

How would you like to improve this article?`
};

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompts>(defaultPrompts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load prompts from localStorage on mount
    const loadPrompts = () => {
      try {
        const stored = localStorage.getItem('kb-prompts');
        if (stored) {
          setPrompts(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load prompts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, []);

  const savePrompts = (newPrompts: Prompts) => {
    try {
      localStorage.setItem('kb-prompts', JSON.stringify(newPrompts));
      setPrompts(newPrompts);
    } catch (error) {
      console.error('Failed to save prompts:', error);
      throw error;
    }
  };

  const updatePrompt = (type: keyof Prompts, prompt: string) => {
    const newPrompts = { ...prompts, [type]: prompt };
    savePrompts(newPrompts);
  };

  const resetPrompts = () => {
    localStorage.removeItem('kb-prompts');
    setPrompts(defaultPrompts);
  };

  return {
    prompts,
    loading,
    updatePrompt,
    resetPrompts,
  };
}
