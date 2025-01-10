import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import { SearchBar } from "./SearchBar";

interface RfpQaPageProps {
  searchParams: { q?: string };
}

export default async function RfpQaListPage({ searchParams }: RfpQaPageProps) {
  const filter = searchParams.q || "";

  // Fetch RFP_QA where question OR answer contains the filter
  const rfpRecords = await prisma.rfpQa.findMany({
    where: {
      OR: [
        { question: { contains: filter, mode: "insensitive" } },
        { answer: { contains: filter, mode: "insensitive" } },
      ],
    },
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">RFP_QA Records</h1>

      {/* The SearchBar is a client component that updates `?q=`. */}
      <SearchBar defaultValue={filter} />

      <ul className="mt-4 space-y-2">
        {rfpRecords.map((rec) => {
          const snippet = rec.question.length > 60
            ? rec.question.slice(0, 60) + "..."
            : rec.question;
          return (
            <li key={rec.id} className="border-b pb-2">
              <Link href={`/rfp-qa/${rec.id}`} className="text-blue-600 underline">
                {snippet}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
