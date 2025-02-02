// app/api/faq/[id]/route.ts
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid FAQ ID" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const {
      question,
      answer,
      visibility,
      status,
      notes,
      metadata,
    } = data;

    // Validate required fields
    if (!question || !answer || !visibility) {
      return NextResponse.json(
        { error: "Question, answer, and visibility are required" },
        { status: 400 }
      );
    }

    // Update FAQ
    const updatedFaq = await prisma.faq.update({
      where: { id },
      data: {
        question,
        answer,
        visibility,
        status,
        notes,
        metadata,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedFaq);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid FAQ ID" },
        { status: 400 }
      );
    }

    const faq = await prisma.faq.findUnique({
      where: { id },
      include: {
        rfpQa: true,
      },
    });

    if (!faq) {
      return NextResponse.json(
        { error: "FAQ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQ" },
      { status: 500 }
    );
  }
}