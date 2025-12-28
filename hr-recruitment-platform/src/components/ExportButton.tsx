import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File, Loader2, Check, X } from 'lucide-react';
import { log } from '@/lib/logger';

interface ExportOptions {
    format: 'csv' | 'xlsx' | 'pdf' | 'json';
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
    columns?: string[];
}

interface ExportButtonProps {
    data: any[];
    filename: string;
    columns?: { key: string; label: string }[];
    title?: string;
    onExport?: (format: string) => void;
    className?: string;
}

export function ExportButton({ data, filename, columns, title, onExport, className = '' }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const formatOptions = [
        { value: 'csv', label: 'CSV', icon: <FileSpreadsheet className="w-4 h-4" />, description: 'Comma separated values' },
        { value: 'xlsx', label: 'Excel', icon: <FileSpreadsheet className="w-4 h-4" />, description: 'Microsoft Excel format' },
        { value: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" />, description: 'Portable document format' },
        { value: 'json', label: 'JSON', icon: <File className="w-4 h-4" />, description: 'JavaScript Object Notation' },
    ];

    async function handleExport(format: string) {
        setExporting(format);

        try {
            const exportColumns = columns || Object.keys(data[0] || {}).map(key => ({ key, label: key }));

            switch (format) {
                case 'csv':
                    exportToCSV(data, exportColumns, filename);
                    break;
                case 'xlsx':
                    await exportToExcel(data, exportColumns, filename, title);
                    break;
                case 'pdf':
                    await exportToPDF(data, exportColumns, filename, title);
                    break;
                case 'json':
                    exportToJSON(data, filename);
                    break;
            }

            setSuccess(format);
            setTimeout(() => setSuccess(null), 2000);
            onExport?.(format);
        } catch (error) {
            log.error('Export error', error, { component: 'ExportButton', action: 'handleExport', metadata: { format, filename } });
            alert('Export failed. Please try again.');
        } finally {
            setExporting(null);
        }
    }

    function exportToCSV(data: any[], columns: { key: string; label: string }[], filename: string) {
        const headers = columns.map(col => col.label).join(',');
        const rows = data.map(row =>
            columns.map(col => {
                const value = row[col.key];
                // Escape quotes and wrap in quotes if contains comma
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(',')
        );

        const csv = [headers, ...rows].join('\n');
        downloadFile(csv, `${filename}.csv`, 'text/csv');
    }

    async function exportToExcel(data: any[], columns: { key: string; label: string }[], filename: string, title?: string) {
        // Simple Excel XML format (works without external libraries)
        const worksheetName = title || 'Data';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${worksheetName}">
    <Table>
      <Row>`;

        // Headers
        columns.forEach(col => {
            xml += `<Cell><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`;
        });
        xml += '</Row>';

        // Data rows
        data.forEach(row => {
            xml += '<Row>';
            columns.forEach(col => {
                const value = row[col.key];
                const type = typeof value === 'number' ? 'Number' : 'String';
                xml += `<Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>`;
            });
            xml += '</Row>';
        });

        xml += '</Table></Worksheet></Workbook>';

        downloadFile(xml, `${filename}.xls`, 'application/vnd.ms-excel');
    }

    async function exportToPDF(data: any[], columns: { key: string; label: string }[], filename: string, title?: string) {
        // Generate HTML table and use browser print to PDF
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${title || filename}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
    th { background-color: #4F46E5; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 20px; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <h1>${title || filename}</h1>
  <p>Generated on ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>${columns.map(col => `<th>${col.label}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>${columns.map(col => `<td>${row[col.key] ?? ''}</td>`).join('')}</tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>Total records: ${data.length}</p>
    <p>Report generated by NovumFlow HR Platform</p>
  </div>
</body>
</html>`;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    }

    function exportToJSON(data: any[], filename: string) {
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, `${filename}.json`, 'application/json');
    }

    function downloadFile(content: string, filename: string, mimeType: string) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition ${className}`}
            >
                <Download className="w-4 h-4 mr-2" />
                Export
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">Export Data</p>
                            <p className="text-xs text-gray-500">{data.length} records</p>
                        </div>
                        <div className="py-2">
                            {formatOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => handleExport(option.value)}
                                    disabled={exporting !== null}
                                    className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    <div className={`p-2 rounded-lg ${success === option.value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {exporting === option.value ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : success === option.value ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            option.icon
                                        )}
                                    </div>
                                    <div className="ml-3 text-left">
                                        <p className="text-sm font-medium text-gray-900">{option.label}</p>
                                        <p className="text-xs text-gray-500">{option.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Standalone export functions for use elsewhere
export function downloadCSV(data: any[], columns: { key: string; label: string }[], filename: string) {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const value = row[col.key];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadJSON(data: any[], filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default ExportButton;
