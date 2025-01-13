// app/api/faq/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { question, answer, visibility, rfpId } = await req.json();

    // Validate the required fields
    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required." },
        { status: 400 }
      );
    }

    // Create the FAQ entry
    const newFaq = await prisma.faq.create({
      data: {
        question,
        answer,
        visibility,
        status: "draft",
        metadata: {
          source_rfp_id: rfpId, // Link to the RFP_QA record
        },
      },
    });

    return NextResponse.json(newFaq, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const filter = searchParams.get("q") || "";

  try {
    const faqRecords = await prisma.faq.findMany({
      where: {
        OR: [
          { question: { contains: filter, mode: "insensitive" } },
          { answer: { contains: filter, mode: "insensitive" } },
        ],
      },
      orderBy: { id: "asc" },
    });

    console.log("API Route - faqRecords:", faqRecords); // Log fetched records

    return NextResponse.json(faqRecords);
  } catch (error) {
    console.error("Error fetching FAQ data:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQ data." },
      { status: 500 }
    );
  }
}