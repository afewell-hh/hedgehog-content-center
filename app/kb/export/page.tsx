'use client';

import { useState } from 'react';
import Papa from 'papaparse';

interface ExportStats {
  total: number;
  processed: number;
  errors: number;
}

export default function ExportKbPage() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExportStats | null>(null);
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

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setStats({ total: 0, processed: 0, errors: 0 });

    try {
      // Fetch entries
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }
      // Only export published entries
      queryParams.append('status', 'PUBLISHED');

      const response = await fetch(`/api/kb-entries?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }

      const entries = await response.json();
      const stats: ExportStats = {
        total: entries.length,
        processed: 0,
        errors: 0,
      };

      // Transform entries for export
      const exportData = entries.map((entry: any) => ({
        knowledge_base_name: entry.knowledge_base_name,
        article_title: entry.article_title,
        article_subtitle: entry.article_subtitle || '',
        article_language: entry.article_language,
        article_url: entry.article_url,
        article_body: entry.article_body,
        category: entry.category,
        subcategory: entry.subcategory || '',
        keywords: entry.keywords || '',
        last_modified_date: entry.last_modified_date,
        status: entry.status,
        archived: entry.archived,
      }));

      // Convert to CSV
      const csv = Papa.unparse(exportData);

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = URL.createObjectURL(blob);
      link.download = `kb-export-${timestamp}.csv`;
      link.click();

      stats.processed = exportData.length;
      setStats(stats);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export entries');
      if (stats) stats.errors++;
      setStats(stats);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Export KB Entries</h1>

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

          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>

        {stats && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Export Progress</h2>
            <div className="space-y-2">
              <p>Total entries: {stats.total}</p>
              <p>Processed: {stats.processed}</p>
              <p>Errors: {stats.errors}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Export Notes</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Only published entries will be exported</li>
            <li>All entries will be formatted according to Hubspot requirements</li>
            <li>Select a category to filter the export, or "All Categories" to export everything</li>
            <li>The export file will be named kb-export-[date].csv</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
