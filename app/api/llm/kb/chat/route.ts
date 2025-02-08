import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { formatLlmResponse } from '@/lib/formatUtils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, entry, prompt } = await request.json();

    // Add system message with prompt and context
    const systemMessage = {
      role: 'system',
      content: `${prompt}

Current Entry Context:
Title: ${entry.title}
Category: ${entry.category}
Current Subtitle: ${entry.subtitle}
Current Body: ${entry.body}
Current Keywords: ${entry.keywords}

Remember: Only update fields when explicitly requested by the user. Maintain format standards but do not make unrequested changes.`
    };

    // Create messages array with system message first
    const allMessages = [
      systemMessage,
      ...messages
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;

    // Parse the response for any field updates
    const formattedResponse = formatLlmResponse(response);

    return NextResponse.json({
      response: response,
      updatedEntry: formattedResponse.fields
    });
  } catch (error) {
    console.error('Error in KB LLM chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process LLM request' },
      { status: 500 }
    );
  }
}
