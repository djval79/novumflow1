import React, { useState } from 'react';
import Modal from './Modal';
import { log } from '../lib/logger';
import { documentEngine, DocumentTemplate } from '../lib/documentEngine';
import { FileText, Download, Eye, Printer } from 'lucide-react';

interface DocumentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: any;
  jobData?: any;
  candidateData?: any;
  type: 'employee_packet' | 'offer_letter' | 'custom';
}

export default function DocumentGenerationModal({
  isOpen,
  onClose,
  employeeData,
  jobData,
  candidateData,
  type
}: DocumentGenerationModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  const templates = documentEngine.getAvailableTemplates();

  const handleGenerateDocument = async () => {
    setLoading(true);

    try {
      let document = '';

      if (type === 'employee_packet' && employeeData) {
        const packet = await documentEngine.generateEmployeePacket(employeeData, jobData);
        document = Object.entries(packet).map(([name, content]) =>
          `=== ${name.toUpperCase()} ===\n\n${content}\n\n`
        ).join('\n');
      } else if (type === 'offer_letter' && candidateData && jobData) {
        document = await documentEngine.generateOfferLetter(candidateData, jobData);
      } else if (selectedTemplate) {
        const data = {
          employee: employeeData,
          job: jobData,
          custom: customData
        };
        document = documentEngine.generateDocument(selectedTemplate, data);
      }

      setGeneratedDocument(document);
      setPreviewMode('preview');
    } catch (error) {
      log.error('Document generation failed', error, { component: 'DocumentGenerationModal', action: 'handleGenerateDocument', metadata: { type, selectedTemplate } });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Generated Document</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${generatedDocument}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const selectedTemplateObj = selectedTemplate ? documentEngine.getTemplateById(selectedTemplate) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🤖 Smart Document Generation"
    >
      <div className="space-y-6">
        {type === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedTemplateObj && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Template Variables</h3>
            <p className="text-sm text-blue-700 mb-3">
              Fill in custom values (leave blank to use defaults):
            </p>
            <div className="grid grid-cols-2 gap-3">
              {selectedTemplateObj.variables.map((variable) => (
                <div key={variable}>
                  <label className="block text-xs text-blue-700 mb-1">
                    {variable.replace(/_/g, ' ').toUpperCase()}
                  </label>
                  <input
                    type="text"
                    value={customData[variable] || ''}
                    onChange={(e) => setCustomData({ ...customData, [variable]: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500"
                    placeholder="Auto-filled if empty"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {(type === 'employee_packet' || type === 'offer_letter' || selectedTemplate) && (
          <div className="flex justify-center">
            <button
              onClick={handleGenerateDocument}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              {loading ? 'Generating...' : '🚀 Generate Document'}
            </button>
          </div>
        )}

        {generatedDocument && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Document</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {previewMode === 'edit' ? 'Preview' : 'Edit'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>

            {previewMode === 'edit' ? (
              <textarea
                value={generatedDocument}
                onChange={(e) => setGeneratedDocument(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Generated document will appear here..."
              />
            ) : (
              <div className="h-96 p-4 border border-gray-300 rounded-lg bg-white overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">{generatedDocument}</pre>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}