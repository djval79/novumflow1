import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

interface FileWithPreview {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface DragDropUploadProps {
  employeeId?: string;
  applicationId?: string;
  onUploadComplete?: (files: any[]) => void;
}

export default function DragDropUpload({ employeeId, applicationId, onUploadComplete }: DragDropUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Please upload PDF, images, or Office documents.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    return { valid: true };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  }, []);

  const processFiles = (newFiles: File[]) => {
    const processedFiles: FileWithPreview[] = newFiles.map(file => {
      const validation = validateFile(file);
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: validation.valid ? 'pending' : 'error',
        progress: 0,
        error: validation.error
      };
    });

    setFiles(prev => [...prev, ...processedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    setIsUploading(true);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const filesToUpload = files.filter(f => f.status === 'pending');

      // Update status to uploading
      setFiles(prev => prev.map(f =>
        f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
      ));

      // Convert files to base64
      const filePromises = filesToUpload.map(async (fileWrapper) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              fileData: reader.result as string,
              fileName: fileWrapper.file.name,
              documentType: getDocumentType(fileWrapper.file.name),
              category: 'general'
            });
          };
          reader.readAsDataURL(fileWrapper.file);
        });
      });

      const filesData = await Promise.all(filePromises);

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('document-upload-enhanced', {
        body: {
          files: filesData,
          metadata: {
            employee_id: employeeId,
            application_id: applicationId,
            batch_name: `Upload ${new Date().toLocaleString()}`
          }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (error) throw error;

      // Update file statuses based on results
      const results = data.data.results;
      setFiles(prev => prev.map(f => {
        const result = results.find((r: any) => r.file === f.file.name);
        if (result) {
          return {
            ...f,
            status: result.success ? 'success' : 'error',
            progress: 100,
            error: result.error,
            url: result.data?.file_url
          };
        }
        return f;
      }));

      if (onUploadComplete) {
        const successfulUploads = results.filter((r: any) => r.success).map((r: any) => r.data);
        onUploadComplete(successfulUploads);
      }

    } catch (error) {
      log.error('Upload error', error, { component: 'DragDropUpload', action: 'uploadFiles' });
      setFiles(prev => prev.map(f =>
        f.status === 'uploading' ? { ...f, status: 'error' as const, error: 'Upload failed' } : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'pdf': 'document',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'doc': 'document',
      'docx': 'document',
      'xls': 'spreadsheet',
      'xlsx': 'spreadsheet'
    };
    return typeMap[ext || ''] || 'other';
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'uploading':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
            ? 'border-indigo-600 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
          }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`} />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
        >
          Select Files
        </label>
        <p className="text-xs text-gray-400 mt-4">
          Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (Max 10MB per file)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Files ({files.length})
            </h3>
            {pendingCount > 0 && (
              <button
                onClick={uploadFiles}
                disabled={isUploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : `Upload ${pendingCount} ${pendingCount === 1 ? 'File' : 'Files'}`}
              </button>
            )}
          </div>

          {(successCount > 0 || errorCount > 0) && (
            <div className="flex space-x-4 text-sm">
              {successCount > 0 && (
                <span className="text-green-600">
                  {successCount} uploaded successfully
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">
                  {errorCount} failed
                </span>
              )}
            </div>
          )}

          <div className="space-y-2">
            {files.map((fileWrapper) => (
              <div
                key={fileWrapper.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getFileIcon(fileWrapper.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileWrapper.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileWrapper.file.size / 1024).toFixed(1)} KB
                      {fileWrapper.error && ` - ${fileWrapper.error}`}
                    </p>
                  </div>
                </div>
                {fileWrapper.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(fileWrapper.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
