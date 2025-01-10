"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [search, setSearch] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSearch() {
    const query = new URLSearchParams(searchParams.toString());
    if (search) {
      query.set("q", search);
    } else {
      query.delete("q");
    }
    // Navigate to /rfp-qa with updated param
    router.push(`/rfp-qa?${query.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="border p-1"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white px-2 py-1 rounded"
      >
        Search
      </button>
    </div>
  );
}
