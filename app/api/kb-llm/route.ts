import { NextResponse } from 'next/server';
import { llmService } from '@/lib/llm/openai';
import { z } from 'zod';

// Validation schemas
const generateContentSchema = z.object({
  title: z.string(),
  currentBody: z.string().optional(),
  currentSubtitle: z.string().optional(),
});

const processCitationsSchema = z.object({
  text: z.string(),
});

const verifyContentSchema = z.object({
  content: z.string(),
  context: z.string(),
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'generate': {
        const { title, currentBody, currentSubtitle } = generateContentSchema.parse(body);
        const result = await llmService.generateContent(title, currentBody, currentSubtitle);
        return NextResponse.json(result);
      }

      case 'citations': {
        const { text } = processCitationsSchema.parse(body);
        const result = await llmService.processWithCitations(text);
        return NextResponse.json(result);
      }

      case 'verify': {
        const { content, context } = verifyContentSchema.parse(body);
        const result = await llmService.verifyContent(content, context);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('LLM API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process LLM request' },
      { status: 500 }
    );
  }
}
