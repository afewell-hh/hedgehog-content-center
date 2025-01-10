// app/api/faq/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const { question, answer, metadata } = await req.json();

  const newFaq = await prisma.faq.create({
    data: {
      question: question || "",
      answer: answer || "",
      metadata: metadata || {},
    },
  });

  return NextResponse.json(newFaq);
}
