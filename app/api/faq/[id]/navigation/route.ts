import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentId = parseInt(params.id, 10);
  if (isNaN(currentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Get all FAQ IDs ordered by ID
    const faqs = await prisma.faq.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });

    // Find the current FAQ's index
    const currentIndex = faqs.findIndex((faq) => faq.id === currentId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    // Get previous and next IDs
    const prevId = currentIndex > 0 ? faqs[currentIndex - 1].id : null;
    const nextId = currentIndex < faqs.length - 1 ? faqs[currentIndex + 1].id : null;

    return NextResponse.json({ prevId, nextId });
  } catch (error) {
    console.error("Error fetching FAQ navigation:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQ navigation" },
      { status: 500 }
    );
  }
}
