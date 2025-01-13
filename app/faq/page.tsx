"use client";

import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useSearchParams } from "next/navigation";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import Link from "next/link";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface Faq {
  id: number;
  question: string;
  answer: string;
  metadata: object;
  visibility: string;
}

export default function FaqListPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("q") || "";

  const [faqRecords, setFaqRecords] = useState<Faq[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/faq?q=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setFaqRecords(data);
      } else {
        console.error("Failed to fetch FAQ data.");
      }
    };

    fetchData();
  }, [filter]);

  // Define column definitions for ag-grid
  const columnDefs: ColDef[] = [
    {
      headerName: "View/Edit",
      width: 100,
      cellRenderer: (params: { data: { id: number } }) => (
        <Link href={`/faq/${params.data.id}`}>View/Edit</Link>
      ),
    },
    {
      headerName: "ID",
      field: "id",
      filter: "agNumberColumnFilter",
    },
    {
      headerName: "Question",
      field: "question",
      filter: "agTextColumnFilter",
      flex: 1,
    },
    {
      headerName: "Answer",
      field: "answer",
      filter: "agTextColumnFilter",
      flex: 1,
    },
    {
      headerName: "Metadata",
      field: "metadata",
      filter: "agTextColumnFilter",
      flex: 1,
    },
    {
      headerName: "Visibility",
      field: "visibility",
      filter: "agTextColumnFilter",
      flex: 1,
    },
  ];

  return (
    <div className="container p-4">
      <div className="container flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-primary">FAQ List</h1>
        <Link
          href="/faq/new"
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          New FAQ
        </Link>
      </div>

      <div className="h-[600px] w-full">
        <AgGridReact
          rowData={faqRecords}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          defaultColDef={{
            sortable: true,
            resizable: true,
          }}
        />
      </div>
    </div>
  );
}