import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { formatLlmResponse } from '@/lib/formatUtils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, testData, type } = await request.json();

    // Validate required fields
    if (!prompt || !testData || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Replace variables in prompt
    const processedPrompt = prompt
      .replace('{title}', testData.title)
      .replace('{subtitle}', testData.subtitle)
      .replace('{body}', testData.body)
      .replace('{category}', testData.category)
      .replace('{keywords}', testData.keywords);

    // Get LLM response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [{ role: 'user', content: processedPrompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0].message.content || '';

    // Validate response format
    try {
      const formattedResponse = formatLlmResponse(response);
      return NextResponse.json({
        isValid: true,
        response: response,
        formattedResponse
      });
    } catch (error) {
      return NextResponse.json({
        isValid: false,
        response: response,
        error: 'Response format validation failed. Expected XML format with subtitle, body, and keywords sections.'
      });
    }
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to test prompt' },
      { status: 500 }
    );
  }
}
