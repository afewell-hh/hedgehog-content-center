"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useSearchParams } from "next/navigation";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
} from "ag-grid-community";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface RfpQa {
  id: number;
  question: string;
  answer: string;
  metadata: object;
}

export default function RfpQaListPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("q") || "";

  const [rfpRecords, setRfpRecords] = useState<RfpQa[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch RFP_QA records from the API route
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
      headerName: "View",
      width: 170,
      cellRenderer: (params: { data: { id: number } }) => (
        <Link href={`/rfp-qa/${params.data.id}`}>
        <button className="btn btn-primary">View Record</button>
      </Link>
      ),
      autoHeight: true,
      cellClass: "grid-button-cell", // Add this line
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
  ];

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">RFP_QA Records</h1>

      <SearchBar defaultValue={filter} />

      <div className="ag-theme-alpine h-[600px] w-full">
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