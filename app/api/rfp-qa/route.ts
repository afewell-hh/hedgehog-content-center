// app/api/rfp-qa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const filter = searchParams.get("q") || "";

  try {
    const rfpRecords = await prisma.rfpQa.findMany({
      where: {
        OR: [
          { question: { contains: filter, mode: "insensitive" } },
          { answer: { contains: filter, mode: "insensitive" } },
        ],
      },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(rfpRecords);
  } catch (error) {
    console.error("Error fetching RFP_QA data:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFP_QA data." },
      { status: 500 }
    );
  }
}