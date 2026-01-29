/**
 * Enterprise Data Export Service
 */

export const exportService = {
    /**
     * Export an array of objects to CSV.
     */
    exportToCSV: (filename: string, data: any[]) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(row =>
                headers.map(fieldName => {
                    const value = row[fieldName] ?? '';
                    // Escape commas and quotes
                    const escaped = ('' + value).replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            )
        ].join('\r\n');

        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        exportService.triggerDownload(blob, `${filename}.csv`);
    },

    /**
     * Export data to JSON file.
     */
    exportToJSON: (filename: string, data: any) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        exportService.triggerDownload(blob, `${filename}.json`);
    },

    /**
     * Internal helper to trigger a browser download.
     */
    triggerDownload: (blob: Blob, filename: string) => {
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
