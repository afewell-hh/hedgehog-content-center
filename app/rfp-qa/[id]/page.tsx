// app/rfp-qa/[id]/page.tsx
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";

interface RfpQaDetailPageProps {
  params: { id: string };
}

export default async function RfpQaDetailPage({ params }: RfpQaDetailPageProps) {
  const { id } = params;

  // Convert ID to integer if your 'id' column is Int
  const recordId = parseInt(id, 10);
  if (isNaN(recordId)) {
    return notFound();
  }

  const record = await prisma.rfpQa.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    return notFound();
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">RFP_QA Detail</h1>
      <p><strong>ID:</strong> {record.id}</p>
      <p><strong>Question:</strong> {record.question}</p>
      <p><strong>Answer:</strong> {record.answer}</p>
      <p><strong>Metadata:</strong> {JSON.stringify(record.metadata)}</p>
    </div>
  );
}
