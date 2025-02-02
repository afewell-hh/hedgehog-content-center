"use client";

import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface Faq {
  id: number;
  question: string;
  answer: string;
  status: string;
}

interface RelatedFaqsProps {
  faqs: Faq[];
}

export default function RelatedFaqs({ faqs }: RelatedFaqsProps) {
  const columnDefs: ColDef[] = [
    {
      headerName: "ID",
      field: "id",
      filter: "agNumberColumnFilter",
      width: 100,
      cellRenderer: (params: { value: number }) => (
        <Link href={`/faq/${params.value}`} className="text-blue-600 hover:underline">
          {params.value}
        </Link>
      ),
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
      cellRenderer: (params: { value: string }) => (
        <div className="max-h-32 overflow-y-auto">
          <Markdown remarkPlugins={[remarkGfm]}>{params.value}</Markdown>
        </div>
      ),
    },
    {
      headerName: "Status",
      field: "status",
      filter: "agTextColumnFilter",
      width: 120,
    },
  ];

  return (
    <div className="h-[400px] w-full ag-theme-alpine">
      <AgGridReact
        rowData={faqs}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          resizable: true,
          filter: true,
        }}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
}
