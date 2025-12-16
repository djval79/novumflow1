import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    FileText, Download, Printer, ChevronLeft, ChevronRight,
    ZoomIn, ZoomOut, RotateCw, X, Maximize, Minimize,
    Image as ImageIcon, File, FileSpreadsheet
} from 'lucide-react';

interface DocumentPreviewProps {
    documentId?: string;
    documentUrl?: string;
    fileName?: string;
    fileType?: string;
    onClose?: () => void;
}

export default function DocumentPreview({
    documentId,
    documentUrl,
    fileName = 'Document',
    fileType = 'application/pdf',
    onClose
}: DocumentPreviewProps) {
    const [url, setUrl] = useState<string | null>(documentUrl || null);
    const [loading, setLoading] = useState(!documentUrl);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (documentId && !documentUrl) {
            loadDocument();
        }
    }, [documentId]);

    async function loadDocument() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('file_path, file_name, file_type')
                .eq('id', documentId)
                .single();

            if (error) throw error;

            if (data?.file_path) {
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(data.file_path);

                setUrl(urlData.publicUrl);
            }
        } catch (err) {
            console.error('Error loading document:', err);
            setError('Failed to load document');
        } finally {
            setLoading(false);
        }
    }

    function handleZoomIn() {
        setZoom(prev => Math.min(prev + 25, 200));
    }

    function handleZoomOut() {
        setZoom(prev => Math.max(prev - 25, 50));
    }

    function handleRotate() {
        setRotation(prev => (prev + 90) % 360);
    }

    function handleDownload() {
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function handlePrint() {
        if (url) {
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.addEventListener('load', () => {
                    printWindow.print();
                });
            }
        }
    }

    function toggleFullscreen() {
        setIsFullscreen(!isFullscreen);
    }

    function getFileIcon() {
        if (fileType.includes('pdf')) {
            return <FileText className="w-12 h-12 text-red-500" />;
        } else if (fileType.includes('image')) {
            return <ImageIcon className="w-12 h-12 text-blue-500" />;
        } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
            return <FileSpreadsheet className="w-12 h-12 text-green-500" />;
        }
        return <File className="w-12 h-12 text-gray-500" />;
    }

    function renderPreview() {
        if (!url) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    {getFileIcon()}
                    <p className="mt-4 text-lg font-medium">{fileName}</p>
                    <p className="text-sm">Preview not available</p>
                    <button
                        onClick={handleDownload}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Download className="w-4 h-4 inline mr-2" />
                        Download File
                    </button>
                </div>
            );
        }

        const isPDF = fileType.includes('pdf');
        const isImage = fileType.includes('image');

        if (isPDF) {
            return (
                <iframe
                    src={`${url}#toolbar=0&page=${currentPage}`}
                    className="w-full h-full border-0"
                    style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center'
                    }}
                    title={fileName}
                />
            );
        }

        if (isImage) {
            return (
                <div className="flex items-center justify-center h-full overflow-auto p-4">
                    <img
                        src={url}
                        alt={fileName}
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                        style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        }}
                    />
                </div>
            );
        }

        // Other file types - show download option
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                {getFileIcon()}
                <p className="mt-4 text-lg font-medium">{fileName}</p>
                <p className="text-sm text-gray-400 mb-4">{fileType}</p>
                <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Download className="w-4 h-4 inline mr-2" />
                    Download File
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            </div>
        );
    }

    const containerClass = isFullscreen
        ? "fixed inset-0 z-50 bg-gray-900"
        : "fixed inset-4 md:inset-8 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden";

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70"
                onClick={onClose}
            />

            {/* Preview Container */}
            <div className={containerClass}>
                {/* Toolbar */}
                <div className={`flex items-center justify-between px-4 py-3 ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'} border-b border-gray-200`}>
                    <div className="flex items-center space-x-3">
                        {getFileIcon()}
                        <div>
                            <p className={`font-medium ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>{fileName}</p>
                            <p className={`text-xs ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>{fileType}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1">
                        {/* Zoom controls */}
                        <button
                            onClick={handleZoomOut}
                            className={`p-2 rounded-lg transition ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title="Zoom out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className={`px-2 text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>{zoom}%</span>
                        <button
                            onClick={handleZoomIn}
                            className={`p-2 rounded-lg transition ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title="Zoom in"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>

                        <div className={`w-px h-6 mx-2 ${isFullscreen ? 'bg-gray-600' : 'bg-gray-300'}`} />

                        {/* Rotate */}
                        <button
                            onClick={handleRotate}
                            className={`p-2 rounded-lg transition ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title="Rotate"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className={`p-2 rounded-lg transition ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>

                        <div className={`w-px h-6 mx-2 ${isFullscreen ? 'bg-gray-600' : 'bg-gray-300'}`} />

                        {/* Download & Print */}
                        <button
                            onClick={handleDownload}
                            className={`p-2 rounded-lg transition ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title="Download"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handlePrint}
                            className={`p-2 rounded-lg transition ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title="Print"
                        >
                            <Printer className="w-5 h-5" />
                        </button>

                        <div className={`w-px h-6 mx-2 ${isFullscreen ? 'bg-gray-600' : 'bg-gray-300'}`} />

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className={`flex-1 overflow-hidden ${isFullscreen ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ height: 'calc(100% - 56px)' }}>
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <FileText className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium">{error}</p>
                            <button
                                onClick={loadDocument}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        renderPreview()
                    )}
                </div>

                {/* Page navigation for PDF */}
                {fileType.includes('pdf') && totalPages > 1 && (
                    <div className={`flex items-center justify-center px-4 py-2 ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'} border-t border-gray-200`}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`p-1 rounded ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'} disabled:opacity-50`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className={`mx-4 text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`p-1 rounded ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'} disabled:opacity-50`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
