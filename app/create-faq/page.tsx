// app/create-faq/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useSearchParams } from "next/navigation";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface RfpQa {
  id: number;
  question: string;
  answer: string;
  metadata: object;
}

export default function CreateFaqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("q") || "";

  const [rfpRecords, setRfpRecords] = useState<RfpQa[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/rfp-qa?q=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setRfpRecords(data);
      } else {
        console.error("Failed to fetch RFP_QA data.");
      }
    };

    fetchData();
  }, [filter]);

  // Define column definitions for ag-grid
  const columnDefs: ColDef[] = [
    {
      headerName: "Create FAQ",
      width: 150,
      cellRenderer: (params: { data: { id: number } }) => (
        <button
          onClick={() => handleCreateFaqClick(params.data.id)}
          className="btn btn-primary"
        >
          Create FAQ
        </button>
      ),
      autoHeight: true,
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
    // ... other columns
  ];

  const handleCreateFaqClick = async (rfpId: number) => {
    // 1. Call the LLM to generate the proposed FAQ (we'll implement this later)
    // For now, we'll just log the rfpId
    console.log("Create FAQ for RFP ID:", rfpId);

    // 2. Navigate to the new page
    router.push(`/create-faq/${rfpId}`);
  };

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">Create FAQ from RFP</h1>

      <div className="ag-theme-alpine" className="h-[600px] w-full">
        <AgGridReact
          rowData={rfpRecords}
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