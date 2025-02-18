'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { formatKbTitle, formatKbSubtitle, formatKbBody } from '@/lib/formatUtils';

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

      const response = await fetch(`/api/kb-entries/export?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch entries');
      }

      const entries = await response.json();
      const stats: ExportStats = {
        total: entries.length,
        processed: 0,
        errors: 0,
      };
      setStats(stats);

      // Map the data to CSV format
      const csvData = entries.map((entry) => ({
        'Knowledge base name': 'KB',
        'Article title': formatKbTitle(entry.article_title),
        'Article subtitle': formatKbSubtitle(entry.article_subtitle || ''),
        'Article language': 'English',
        'Article URL': entry.article_url,
        'Article body': formatKbBody(entry.article_body),
        'Category': entry.category,
        'Subcategory': entry.subcategory || '',
        'Keywords': entry.keywords || '',
        'Last modified date': new Date(entry.last_modified_date).toISOString(),
        'Status': 'PUBLISHED', // All exported entries are published
        'Archived': false,
      }));

      // Convert to CSV with proper formatting
      const csv = Papa.unparse(csvData, {
        quotes: true, // Always quote strings
        header: true,
        newline: '\r\n', // Windows-style newlines for compatibility
      });

      // Create and download file without BOM
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = URL.createObjectURL(blob);
      link.download = `kb-export-${timestamp}.csv`;
      link.click();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
      successDiv.textContent = `Successfully exported ${stats.processed} entries`;
      document.querySelector('.container')?.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 5000);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export entries');
      if (stats) {
        stats.errors++;
        setStats({ ...stats });
      }
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
        <div className="bg-blue-50 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">Export Format Details</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-600">
            <li>Article titles will be preserved exactly as entered (plain text)</li>
            <li>Article subtitles will be plain text without any formatting</li>
            <li>Article body will use Hubspot's hybrid HTML/Markdown format:
              <ul className="ml-6 mt-1 list-disc">
                <li>Paragraphs wrapped in {"<p>"} tags</li>
                <li>Line breaks as {"<br>"} tags</li>
                <li>Bold text as **text**</li>
              </ul>
            </li>
          </ul>
        </div>

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
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 font-semibold text-lg min-w-[120px]"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </span>
            ) : (
              'Export to CSV'
            )}
          </button>
        </div>

        {stats && (
          <div className="bg-gray-50 p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">Export Progress</h2>
            <div className="space-y-2">
              <p>Total entries: {stats.total}</p>
              <p>Processed: <span className="text-green-600">{stats.processed}</span></p>
              {stats.errors > 0 && (
                <p>Errors: <span className="text-red-600">{stats.errors}</span></p>
              )}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <h2 className="text-lg font-semibold text-yellow-700 mb-2">Important Notes</h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-600">
            <li>Only published entries (internal_status="Approved" and visibility="Public") will be exported</li>
            <li>All entries will be formatted according to Hubspot requirements</li>
            <li>Select a category to filter the export, or "All Categories" to export everything</li>
            <li>The export file will be named kb-export-[date].csv</li>
            <li>The CSV file does not include a BOM marker</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
