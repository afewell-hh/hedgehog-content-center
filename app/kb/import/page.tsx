'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';

interface ImportStats {
  total: number;
  processed: number;
  conflicts: number;
  errors: number;
}

interface ConflictEntry {
  article_url: string;
  existing_date: string;
  import_date: string;
}

export default function ImportKbPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'all',
    'Glossary',
    'FAQs',
    'Getting started',
    'Troubleshooting',
    'General',
    'Reports',
    'Integrations',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const processImport = async (data: any[], overwrite: boolean = false) => {
    const stats: ImportStats = {
      total: data.length,
      processed: 0,
      conflicts: 0,
      errors: 0,
    };

    const conflicts: ConflictEntry[] = [];

    for (const row of data) {
      try {
        // Skip entries that don't match the selected category
        if (selectedCategory !== 'all' && row.category !== selectedCategory) {
          continue;
        }

        // Check for conflicts
        const checkResponse = await fetch(`/api/kb-entries?article_url=${row.article_url}`);
        const existingEntries = await checkResponse.json();

        if (existingEntries.length > 0 && !overwrite) {
          stats.conflicts++;
          conflicts.push({
            article_url: row.article_url,
            existing_date: existingEntries[0].last_modified_date,
            import_date: row.last_modified_date,
          });
          continue;
        }

        // Process the entry
        const method = existingEntries.length > 0 ? 'PATCH' : 'POST';
        const url = existingEntries.length > 0 
          ? `/api/kb-entries/${existingEntries[0].id}`
          : '/api/kb-entries';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...row,
            metadata: typeof row.metadata === 'string' 
              ? JSON.parse(row.metadata) 
              : row.metadata,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to ${method.toLowerCase()} entry`);
        }

        stats.processed++;
      } catch (err) {
        console.error('Error processing entry:', err);
        stats.errors++;
      }

      // Update progress
      setStats({ ...stats });
    }

    return { stats, conflicts };
  };

  const handleImport = async (overwrite: boolean = false) => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setStats(null);
    setConflicts([]);

    try {
      // Parse CSV file
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          try {
            const { stats, conflicts } = await processImport(results.data, overwrite);
            setStats(stats);
            setConflicts(conflicts);

            if (stats.processed === stats.total) {
              setTimeout(() => {
                router.push('/kb');
              }, 2000);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process import');
          } finally {
            setImporting(false);
          }
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
          setImporting(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setImporting(false);
    }
  };

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Import KB Entries</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex gap-4 items-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded p-2"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary-dark"
            disabled={importing}
          />

          <button
            onClick={() => handleImport(false)}
            disabled={!file || importing}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>

        {stats && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Import Progress</h2>
            <div className="space-y-2">
              <p>Total entries: {stats.total}</p>
              <p>Processed: {stats.processed}</p>
              <p>Conflicts: {stats.conflicts}</p>
              <p>Errors: {stats.errors}</p>
            </div>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="bg-yellow-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Conflicts Detected</h2>
            <p className="mb-4">
              The following entries have conflicts. Would you like to overwrite them?
            </p>
            <div className="space-y-2 mb-4">
              {conflicts.map((conflict, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{conflict.article_url}</span>
                  <span className="text-sm text-gray-600">
                    Existing: {new Date(conflict.existing_date).toLocaleString()}
                    <br />
                    Import: {new Date(conflict.import_date).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleImport(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Overwrite Existing Entries
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
