// app/api/faq/next/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

interface Params {
  id: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const currentFaqId = parseInt(params.id, 10);

  try {
    // Find the next FAQ
    const nextFaq = await prisma.faq.findFirst({
      where: {
        id: {
          gt: currentFaqId, // greater than the current ID
        },
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ nextId: nextFaq?.id || null });
  } catch (error) {
    console.error("Error fetching next FAQ:", error);
    return NextResponse.json(
      { error: "Failed to fetch next FAQ." },
      { status: 500 }
    );
  }
}