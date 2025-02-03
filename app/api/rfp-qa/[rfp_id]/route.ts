// app/api/rfp-qa/[rfp_id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

interface Params {
  rfp_id: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const rfpId = parseInt(params.rfp_id, 10);

  try {
    const rfpRecord = await prisma.rfpQa.findUnique({
      where: { id: rfpId },
    });

    if (!rfpRecord) {
      return NextResponse.json(
        { error: "RFP_QA record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(rfpRecord);
  } catch (error) {
    console.error("Error fetching RFP_QA record:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFP_QA record." },
      { status: 500 }
    );
  }
}