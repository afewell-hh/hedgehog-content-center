// app/api/faq/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

interface Params {
  id: string;
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const faqId = parseInt(params.id, 10);
  const { question, answer, visibility, status, notes } = await req.json();

  try {
    const updatedFaq = await prisma.faq.update({
      where: { id: faqId },
      data: {
        question,
        answer,
        visibility,
        status,
        notes,
      },
    });

    return NextResponse.json(updatedFaq);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ." },
      { status: 500 }
    );
  }
}