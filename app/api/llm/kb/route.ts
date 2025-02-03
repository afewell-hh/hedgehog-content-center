import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { mode, userInput, context } = await request.json();

    if (mode !== 'dialogue') {
      return NextResponse.json(
        { error: 'Invalid mode. Only dialogue mode is supported.' },
        { status: 400 }
      );
    }

    // Construct the system message based on the category
    const categoryInstructions = {
      'Glossary': 'You are helping create a glossary entry. Focus on clear, concise definitions and technical accuracy.',
      'FAQs': 'You are helping create an FAQ entry. Focus on clear problem-solution format and practical examples.',
      'Getting started': 'You are helping create a getting started guide. Focus on step-by-step instructions and beginner-friendly explanations.',
      'Troubleshooting': 'You are helping create a troubleshooting guide. Focus on problem identification, solutions, and common pitfalls.',
      'General': 'You are helping create a general knowledge base article. Focus on clear explanations and comprehensive coverage.',
      'Reports': 'You are helping create a report-related article. Focus on data interpretation and actionable insights.',
      'Integrations': 'You are helping create an integration guide. Focus on technical details, prerequisites, and step-by-step setup.',
    }[context.category] || 'You are helping create a knowledge base article. Focus on clarity and accuracy.';

    const messages = [
      {
        role: 'system',
        content: `${categoryInstructions}

You have access to the current article content:
Title: ${context.article_title || '[Not set]'}
Subtitle: ${context.article_subtitle || '[Not set]'}
Category: ${context.category}
Content: ${context.article_body || '[Not set]'}

Your task is to help improve this knowledge base article. You can:
1. Suggest improvements to the title or subtitle
2. Help enhance the content's clarity and completeness
3. Recommend better formatting or structure
4. Add citations when making factual claims [1]
5. Ensure technical accuracy
6. Suggest relevant keywords

Always maintain a professional and helpful tone. When suggesting changes, explain your reasoning.`,
      },
      {
        role: 'user',
        content: userInput,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error in KB LLM route:', error);
    return NextResponse.json(
      { error: 'Failed to process LLM request' },
      { status: 500 }
    );
  }
}
