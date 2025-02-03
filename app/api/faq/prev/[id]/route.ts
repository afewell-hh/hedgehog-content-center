// app/api/faq/prev/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

interface Params {
  id: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const currentFaqId = parseInt(params.id, 10);

  try {
    // Find the previous FAQ
    const prevFaq = await prisma.faq.findFirst({
      where: {
        id: {
          lt: currentFaqId, // less than the current ID
        },
      },
      orderBy: {
        id: "desc", // order by descending to get the previous one
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ prevId: prevFaq?.id || null });
  } catch (error) {
    console.error("Error fetching previous FAQ:", error);
    return NextResponse.json(
      { error: "Failed to fetch previous FAQ." },
      { status: 500 }
    );
  }
}