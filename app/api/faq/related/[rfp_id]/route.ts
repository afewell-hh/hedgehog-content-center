// app/api/faq/related/[rfp_id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

interface Params {
  rfp_id: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  const rfpId = parseInt(params.rfp_id, 10);

  try {
    const relatedFaqs = await prisma.faq.findMany({
      where: {
        metadata: {
          path: ["source_rfp_id"],
          equals: rfpId,
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(relatedFaqs);
  } catch (error) {
    console.error("Error fetching related FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch related FAQs." },
      { status: 500 }
    );
  }
}