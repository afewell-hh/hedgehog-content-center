import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { formatKbSubtitle, formatKbBody } from '@/lib/formatUtils';
import { generateKbUrl, shouldUpdateKbUrl } from '@/lib/urlUtils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { title, subtitle, body, category, keywords, prompt, article_url } = await request.json();

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Use the provided prompt template or fall back to a default
    const formattedPrompt = (prompt || '').replace(
      /{(\w+)}/g,
      (match, key) => {
        const values = {
          title,
          subtitle: subtitle || '',
          body: body || '',
          category,
          keywords: keywords || ''
        };
        return values[key as keyof typeof values] || match;
      }
    );

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: formattedPrompt }],
      model: "gpt-4-1106-preview",
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the response sections
    const cleanResponse = response.trim();
    const sections = cleanResponse.match(
      /^<response>[\s\S]*?<subtitle>([\s\S]*?)<\/subtitle>[\s\S]*?<body>([\s\S]*?)<\/body>[\s\S]*?<keywords>([\s\S]*?)<\/keywords>[\s\S]*?(?:<sources>[\s\S]*?<\/sources>)?[\s\S]*?<\/response>$/
    );

    if (!sections) {
      console.error('Invalid response format. Response:', response);
      throw new Error('Invalid response format from AI');
    }

    const [, rawSubtitle, rawBody, rawKeywords] = sections;

    // Format the content
    const improvedSubtitle = formatKbSubtitle(rawSubtitle.trim());
    const improvedBody = formatKbBody(rawBody.trim());
    const improvedKeywords = rawKeywords.trim();

    // Handle article URL
    let improvedUrl = article_url;
    if (shouldUpdateKbUrl(article_url)) {
      improvedUrl = generateKbUrl(category, title);
    }

    return NextResponse.json({
      subtitle: improvedSubtitle,
      body: improvedBody,
      keywords: improvedKeywords,
      article_url: improvedUrl
    });
  } catch (error) {
    console.error('Error in auto-update:', error);
    return NextResponse.json(
      { error: 'Failed to auto-update KB entry' },
      { status: 500 }
    );
  }
}
