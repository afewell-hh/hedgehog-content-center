// app/api/rfp-qa/prev/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

interface Params {
  id: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const currentRfpId = parseInt(params.id, 10);

  try {
    // Find the previous RFP_QA record
    const prevRfp = await prisma.rfpQa.findFirst({
      where: {
        id: {
          lt: currentRfpId, // less than the current ID
        },
      },
      orderBy: {
        id: "desc", // order by descending to get the previous one
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ prevId: prevRfp?.id || null });
  } catch (error) {
    console.error("Error fetching previous RFP_QA:", error);
    return NextResponse.json(
      { error: "Failed to fetch previous RFP_QA." },
      { status: 500 }
    );
  }
}