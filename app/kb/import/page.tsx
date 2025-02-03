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
  const [errors, setErrors] = useState<string[]>([]);

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
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid CSV file');
        setFile(null);
      }
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
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Skip empty rows
        if (!row['Article title'] && !row['Article body'] && !row['Category']) {
          continue;
        }

        // Map CSV fields to our internal field names
        const mappedRow = {
          title: row['Article title']?.trim(),
          body: row['Article body']?.trim(),
          category: row['Category']?.trim(),
          article_url: row['Article URL']?.trim(),
          last_modified_date: row['Last modified date'],
          status: row['Status'],
          metadata: {
            subtitle: row['Article subtitle']?.trim(),
            language: row['Article language']?.trim(),
            subcategory: row['Subcategory']?.trim(),
            keywords: row['Keywords']?.trim(),
            archived: row['Archived'] === 'true'
          }
        };

        // Basic validation
        if (!mappedRow.title || !mappedRow.body || !mappedRow.category) {
          const missingFields = [
            !mappedRow.title && 'title',
            !mappedRow.body && 'body',
            !mappedRow.category && 'category'
          ].filter(Boolean);
          
          throw new Error(`Missing required fields for entry "${mappedRow.title || 'Unknown'}": ${missingFields.join(', ')}`);
        }

        // Validate category
        if (!categories.includes(mappedRow.category)) {
          throw new Error(`Invalid category "${mappedRow.category}" for entry "${mappedRow.title}". Valid categories are: ${categories.join(', ')}`);
        }

        // Skip entries that don't match the selected category
        if (selectedCategory !== 'all' && mappedRow.category !== selectedCategory) {
          continue;
        }

        // Check for conflicts
        if (!mappedRow.article_url) {
          continue; // Skip entries without article_url
        }

        const checkResponse = await fetch(`/api/kb-entries?article_url=${encodeURIComponent(mappedRow.article_url)}`);
        if (!checkResponse.ok) {
          throw new Error('Failed to check for conflicts');
        }

        const existingEntries = await checkResponse.json();

        if (existingEntries && existingEntries.length > 0 && !overwrite) {
          stats.conflicts++;
          conflicts.push({
            article_url: mappedRow.article_url,
            existing_date: existingEntries[0].last_modified_date,
            import_date: mappedRow.last_modified_date,
          });
          continue;
        }

        // Map Hubspot status to internal status and visibility
        const { internal_status, visibility } = mapHubspotStatus(mappedRow.status);

        // Process the entry
        const method = existingEntries && existingEntries.length > 0 ? 'PATCH' : 'POST';
        const url = existingEntries && existingEntries.length > 0
          ? `/api/kb-entries/${existingEntries[0].id}`
          : '/api/kb-entries';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...mappedRow,
            internal_status,
            visibility,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${method.toLowerCase()} entry`);
        }

        stats.processed++;
      } catch (err) {
        console.error('Error processing entry:', err);
        stats.errors++;
        errors.push(err instanceof Error ? err.message : 'Unknown error');
      }

      // Update progress
      setStats({ ...stats });
    }

    return { stats, conflicts, errors };
  };

  const mapHubspotStatus = (hubspotStatus: string): { internal_status: string, visibility: string } => {
    const status = (hubspotStatus || '').toUpperCase();
    if (status === 'PUBLISHED') {
      return {
        internal_status: 'Approved',
        visibility: 'Public'
      };
    }
    return {
      internal_status: 'Draft',
      visibility: 'Private'
    };
  };

  const handleImport = async (overwrite: boolean = false) => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setStats(null);
    setConflicts([]);
    setErrors([]);

    try {
      // Parse CSV file
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => (value ? value.trim() : value),
        complete: async (results) => {
          console.log('Parsed CSV data:', results.data); // Debug log
          try {
            // Filter out empty rows
            const validRows = results.data.filter((row: any) => {
              const hasRequiredFields = 
                row['Article title']?.toString().trim() && 
                row['Article body']?.toString().trim() && 
                row['Category']?.toString().trim();
              return hasRequiredFields;
            });

            console.log('Valid rows:', validRows); // Debug log

            const { stats, conflicts, errors } = await processImport(validRows, overwrite);
            setStats(stats);
            setConflicts(conflicts);
            setErrors(errors);

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
          console.error('CSV parsing error:', error); // Debug log
          setError(`Failed to parse CSV: ${error.message}`);
          setImporting(false);
        },
      });
    } catch (err) {
      console.error('File reading error:', err); // Debug log
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
        <div className="flex flex-col gap-4">
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

            <div className="flex gap-4 items-center flex-1">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="block text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary-dark
                  cursor-pointer"
              />

              <button
                onClick={() => handleImport(false)}
                disabled={!file || importing}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {importing ? 'Importing...' : 'Import File'}
              </button>
            </div>
          </div>
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

        {errors.length > 0 && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Errors</h2>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
