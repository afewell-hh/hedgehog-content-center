import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
// If your model is called Faq with capital F, adjust here:
import { Faq } from "@prisma/client";

export default async function FaqListPage() {
  // fetch from DB
  const faqList: Faq[] = await prisma.faq.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">FAQ List</h1>
        <Link
          href="/faq/new"
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          New FAQ
        </Link>
      </div>

      <ul className="space-y-4">
        {faqList.map((item) => (
          <li key={item.id} className="border-b pb-2">
            <h2 className="text-lg font-semibold">
              {/* Hyperlink to detail page */}
              <Link href={`/faq/${item.id}`} className="text-blue-600 underline">
                {item.question}
              </Link>
            </h2>

            {/* If the answer has HTML tags, let's show them raw or strip them */}
            {/* Option A: show them as raw text: */}
            <p>{item.answer}</p>

            {/* Option B: render HTML with dangerouslySetInnerHTML: */}
            {/* <div dangerouslySetInnerHTML={{ __html: item.answer }} /> */}
          </li>
        ))}
      </ul>
    </div>
  );
}
