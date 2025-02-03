'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  ValidationModule,
  DateFilterModule,
  PaginationModule,
  TextFilterModule,
} from 'ag-grid-community';
import Link from 'next/link';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ValidationModule,
  DateFilterModule,
  PaginationModule,
  TextFilterModule,
]);

interface KbEntry {
  id: number;
  article_title: string;
  category: string;
  internal_status: string;
  visibility: string;
  last_modified_date: string;
}

const statusColors = {
  Draft: 'text-gray-600',
  Review: 'text-blue-600',
  Approved: 'text-green-600',
  Archived: 'text-red-600',
};

export default function KbListPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/kb-entries');
        if (!response.ok) {
          throw new Error('Failed to fetch KB entries');
        }
        
        const data = await response.json();
        setEntries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const columnDefs: ColDef[] = [
    {
      headerName: 'Actions',
      width: 100,
      cellRenderer: (params: { data: { id: number } }) => (
        <Link
          href={`/kb/${params.data.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          Edit
        </Link>
      ),
    },
    {
      headerName: 'Title',
      field: 'article_title',
      filter: 'agTextColumnFilter',
      flex: 2,
    },
    {
      headerName: 'Category',
      field: 'category',
      filter: 'agTextColumnFilter',
      width: 150,
    },
    {
      headerName: 'Status',
      field: 'internal_status',
      filter: 'agTextColumnFilter',
      width: 120,
      cellRenderer: (params: { value: keyof typeof statusColors }) => (
        <span className={statusColors[params.value] || 'text-gray-600'}>
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'Visibility',
      field: 'visibility',
      filter: 'agTextColumnFilter',
      width: 120,
    },
    {
      headerName: 'Last Modified',
      field: 'last_modified_date',
      filter: 'agDateColumnFilter',
      width: 160,
      valueFormatter: (params: { value: string }) => {
        return new Date(params.value).toLocaleString();
      },
    },
  ];

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Knowledge Base Entries</h1>
        <div className="flex gap-4 items-center">
          <Link
            href="/kb/import"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Import
          </Link>
          <Link
            href="/kb/export"
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Export
          </Link>
          <Link
            href="/kb/new"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create New
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="ag-theme-alpine h-[600px] w-full">
          <AgGridReact
            rowData={entries}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={20}
            defaultColDef={{
              sortable: true,
              resizable: true,
            }}
            theme="legacy"
          />
        </div>
      )}
    </div>
  );
}
