import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { title, subtitle, body, category } = await request.json();

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Construct a prompt for GPT to improve the content
    const prompt = `You are a technical documentation expert. Please improve the following knowledge base article while maintaining its core meaning and technical accuracy. Focus on clarity, completeness, and proper technical terminology.

Title: ${title}
Category: ${category}
${subtitle ? `Subtitle: ${subtitle}\n` : ''}
Current Content:
${body || 'No content provided'}

Please provide an improved version with:
1. A clear, concise subtitle that summarizes the key points
2. Well-structured content with proper headings and formatting
3. Technical accuracy and proper terminology
4. Clear explanations suitable for the target audience
5. Proper markdown formatting

Respond only with the improved content in this format:
SUBTITLE:
[improved subtitle]

BODY:
[improved body content in markdown]`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-1106-preview",
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the response
    const subtitleMatch = response.match(/SUBTITLE:\n([\s\S]*?)\n\nBODY:/);
    const bodyMatch = response.match(/BODY:\n([\s\S]*?)$/);

    const improvedSubtitle = subtitleMatch ? subtitleMatch[1].trim() : subtitle;
    const improvedBody = bodyMatch ? bodyMatch[1].trim() : body;

    return NextResponse.json({
      subtitle: improvedSubtitle,
      body: improvedBody,
    });
  } catch (error) {
    console.error('Error in auto-update:', error);
    return NextResponse.json(
      { error: 'Failed to auto-update KB entry' },
      { status: 500 }
    );
  }
}
