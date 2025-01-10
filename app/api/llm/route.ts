// app/api/llm/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { question, answer } = await req.json();

  // For local dev, we’ll just do a mock response. 
  // If you want to call OpenAI, do:
  // const res = await fetch("https://api.openai.com/v1/chat/completions", { ... });
  // For a simpler example, let's mock:
  
  const newQuestion = `FAQ: ${question}`;
  const newAnswer = `Answer (rewritten): ${answer}`;

  return NextResponse.json({
    question: newQuestion,
    answer: newAnswer,
  });
}
