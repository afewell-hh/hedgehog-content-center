import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CitationResult {
  text: string;
  citations: Array<{
    number: number;
    url: string;
  }>;
}

export interface VerificationResult {
  isValid: boolean;
  feedback: string;
  suggestedChanges?: string;
}

class LLMService {
  private static instance: LLMService;
  private constructor() {}

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async generateContent(prompt: string, context: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a technical writer creating content for Hedgehog's knowledge base. Focus on accuracy and clarity.",
          },
          {
            role: "user",
            content: `Context: ${context}\n\nPrompt: ${prompt}`,
          },
        ],
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  async processWithCitations(text: string): Promise<CitationResult> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a technical documentation assistant. Your task is to:
1. Analyze the provided text
2. Identify technical claims that need citations
3. Add numbered citations in [n] format
4. Return the modified text with a list of citation URLs

Format the response exactly as follows:
<text>
[Modified text with [n] citations]
</text>
<citations>
[1]: URL1
[2]: URL2
</citations>`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Parse the response
      const textMatch = response.match(/<text>([\s\S]*?)<\/text>/);
      const citationsMatch = response.match(/<citations>([\s\S]*?)<\/citations>/);
      
      if (!textMatch || !citationsMatch) {
        throw new Error('Invalid response format');
      }

      const modifiedText = textMatch[1].trim();
      const citationsText = citationsMatch[1].trim();
      
      // Parse citations
      const citations = citationsText.split('\n').map((line) => {
        const match = line.match(/\[(\d+)\]:\s*(.*)/);
        if (!match) return null;
        return {
          number: parseInt(match[1]),
          url: match[2].trim(),
        };
      }).filter((citation): citation is NonNullable<typeof citation> => citation !== null);

      return {
        text: modifiedText,
        citations,
      };
    } catch (error) {
      console.error('Error processing citations:', error);
      throw new Error('Failed to process citations');
    }
  }

  async verifyContent(content: string, context: string): Promise<VerificationResult> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a technical content verifier. Verify the provided content against the context for:
1. Technical accuracy
2. Consistency with Hedgehog's documentation
3. Appropriate technical depth
4. Clear explanations

Format your response exactly as follows:
<result>valid</result> or <result>invalid</result>
<feedback>[Your detailed feedback]</feedback>
<changes>[Suggested changes if any]</changes>`,
          },
          {
            role: "user",
            content: `Context: ${context}\n\nContent to verify: ${content}`,
          },
        ],
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Parse the response
      const resultMatch = response.match(/<result>(.*?)<\/result>/);
      const feedbackMatch = response.match(/<feedback>([\s\S]*?)<\/feedback>/);
      const changesMatch = response.match(/<changes>([\s\S]*?)<\/changes>/);
      
      if (!resultMatch || !feedbackMatch) {
        throw new Error('Invalid response format');
      }

      return {
        isValid: resultMatch[1].trim() === 'valid',
        feedback: feedbackMatch[1].trim(),
        suggestedChanges: changesMatch ? changesMatch[1].trim() : undefined,
      };
    } catch (error) {
      console.error('Error verifying content:', error);
      throw new Error('Failed to verify content');
    }
  }
}

export const llmService = LLMService.getInstance();
