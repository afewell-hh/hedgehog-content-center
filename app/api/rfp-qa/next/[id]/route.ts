// app/api/rfp-qa/next/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

interface Params {
  id: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const currentRfpId = parseInt(params.id, 10);

  try {
    // Find the next RFP_QA record
    const nextRfp = await prisma.rfpQa.findFirst({
      where: {
        id: {
          gt: currentRfpId, // greater than the current ID
        },
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ nextId: nextRfp?.id || null });
  } catch (error) {
    console.error("Error fetching next RFP_QA:", error);
    return NextResponse.json(
      { error: "Failed to fetch next RFP_QA." },
      { status: 500 }
    );
  }
}