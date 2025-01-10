// app/api/rfp-qa/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const rfpRecords = await prisma.rfpQa.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(rfpRecords);
}
