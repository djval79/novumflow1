
import React, { useState } from 'react';
import {
   Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
   ArrowRight, Sparkles, Loader2, XCircle, RefreshCw
} from 'lucide-react';
import { validateImportData } from '../services/geminiService';

import { staffService, clientService } from '../services/supabaseService';

const DataImport: React.FC = () => {
   const [step, setStep] = useState<1 | 2 | 3>(1);
   const [entityType, setEntityType] = useState<'Staff' | 'Clients'>('Staff');
   const [file, setFile] = useState<File | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [validationResult, setValidationResult] = useState<any>(null);
   const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

   const handleUpload = async () => {
      if (!file) return;
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
         const text = e.target?.result as string;
         if (!text) {
            setIsProcessing(false);
            return;
         }

         const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);

         try {
            const result = await validateImportData(rows, entityType);
            setValidationResult(result);
            setStep(2);
         } catch (error) {
            console.error(error);
            alert('Failed to validate file. Please ensure it is a valid CSV.');
         } finally {
            setIsProcessing(false);
         }
      };

      reader.readAsText(file);
   };

   const handleCommit = async () => {
      if (!validationResult?.mappedData) return;

      const validRows = validationResult.mappedData.filter((r: any) => r.status === 'Valid');
      setImportProgress({ current: 0, total: validRows.length, success: 0, failed: 0 });
      setIsProcessing(true);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validRows.length; i++) {
         const row = validRows[i];
         setImportProgress(prev => ({ ...prev, current: i + 1 }));

         try {
            if (entityType === 'Staff') {
               await staffService.create({
                  name: row.name,
                  email: row.email,
                  phone: row.phone,
                  role: row.role
               });
            } else {
               const age = row.date_of_birth ? new Date().getFullYear() - new Date(row.date_of_birth).getFullYear() : 0;
               await clientService.create({
                  name: row.name,
                  address: row.address,
                  careLevel: row.care_level, // Map to camelCase
                  age: age,
                  // @ts-ignore - Pass raw fields that might exist in DB but not in type
                  date_of_birth: row.date_of_birth,
                  status: 'Active'
               } as any);
            }
            successCount++;
         } catch (error) {
            console.error(`Failed to import ${row.name}:`, error);
            failCount++;
         }
      }

      setImportProgress(prev => ({ ...prev, success: successCount, failed: failCount }));
      setIsProcessing(false);
      setStep(3);
   };

   const reset = () => {
      setFile(null);
      setStep(1);
      setValidationResult(null);
   };

   // --- Render Steps ---

   const renderUpload = () => (
      <div className="max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4">
         <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-6">
               <h3 className="text-lg font-bold text-slate-900">Select Data Type</h3>
               <div className="flex justify-center gap-4 mt-4">
                  <button
                     onClick={() => setEntityType('Staff')}
                     className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${entityType === 'Staff' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'bg-slate-100 text-slate-600'}`}
                  >
                     Staff
                  </button>
                  <button
                     onClick={() => setEntityType('Clients')}
                     className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${entityType === 'Clients' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'bg-slate-100 text-slate-600'}`}
                  >
                     Clients
                  </button>
               </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 bg-slate-50 hover:bg-white transition-colors cursor-pointer">
               <FileSpreadsheet size={48} className="mx-auto text-slate-300 mb-4" />
               <p className="font-medium text-slate-600">Drag & drop CSV file here</p>
               <p className="text-xs text-slate-400 mt-1">or click to browse</p>
               <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  id="file-upload"
               />
               <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
            </div>

            {file && (
               <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg text-left">
                  <div className="flex items-center gap-3">
                     <FileSpreadsheet className="text-blue-600" size={24} />
                     <div>
                        <p className="font-bold text-blue-900 text-sm">{file.name}</p>
                        <p className="text-xs text-blue-700">{(file.size / 1024).toFixed(1)} KB</p>
                     </div>
                  </div>
                  <button onClick={() => setFile(null)} className="p-1 hover:bg-blue-100 rounded text-blue-600">
                     <XCircle size={20} />
                  </button>
               </div>
            )}

            <button
               onClick={handleUpload}
               disabled={!file || isProcessing}
               className="w-full mt-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center gap-2"
            >
               {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-purple-400" />}
               {isProcessing ? 'AI Validating...' : 'Start Import'}
            </button>
         </div>
      </div>
   );

   const renderValidation = () => (
      <div className="animate-in fade-in slide-in-from-bottom-4">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" /> AI Validation Report
               </h3>
               <p className="text-sm text-slate-500 mt-1">
                  We found {validationResult?.mappedData?.filter((r: any) => r.status === 'Invalid').length} issues in your file.
               </p>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                     <tr>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Email</th>
                        <th className="px-6 py-3 font-medium">Role</th>
                        <th className="px-6 py-3 font-medium">Phone</th>
                        <th className="px-6 py-3 font-medium text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {validationResult?.mappedData?.map((row: any, idx: number) => (
                        <tr key={idx} className={row.status === 'Invalid' ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                           <td className="px-6 py-3 text-slate-900">{row.name}</td>
                           <td className={`px-6 py-3 ${row.email.includes('@') ? 'text-slate-600' : 'text-red-600 font-bold'}`}>
                              {row.email}
                           </td>
                           <td className="px-6 py-3 text-slate-600">{row.role}</td>
                           <td className="px-6 py-3 text-slate-600">{row.phone}</td>
                           <td className="px-6 py-3 text-right">
                              <span className={`text-xs font-bold px-2 py-1 rounded uppercase inline-flex items-center gap-1
                               ${row.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                            `}>
                                 {row.status === 'Valid' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                 {row.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
               <button onClick={reset} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
               <button
                  onClick={handleCommit}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-70"
               >
                  {isProcessing ? (
                     <>
                        <Loader2 className="animate-spin" size={16} />
                        Importing {importProgress.current}/{importProgress.total}...
                     </>
                  ) : (
                     <>Import Valid Rows <ArrowRight size={16} /></>
                  )}
               </button>
            </div>
         </div>
      </div>
   );

   const renderSuccess = () => (
      <div className="max-w-md mx-auto text-center py-12 animate-in zoom-in duration-300">
         <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/10">
            <CheckCircle2 size={48} />
         </div>
         <h2 className="text-2xl font-bold text-slate-900 mb-2">Import Complete!</h2>
         <p className="text-slate-500 mb-8">
            Successfully imported {importProgress.success} records.
            {importProgress.failed > 0 && <span className="text-red-500 ml-2">({importProgress.failed} failed)</span>}
            You can now view them in the People directory.
         </p>
         <button
            onClick={reset}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2 mx-auto"
         >
            <RefreshCw size={18} /> Import More
         </button>
      </div>
   );

   return (
      <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Data Import & Migration</h1>
               <p className="text-slate-500 text-sm">Bulk upload new records from external systems.</p>
            </div>
         </div>

         {/* Stepper */}
         {step !== 3 && (
            <div className="flex items-center justify-center mb-8">
               <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-slate-400'}`}>
                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">1</div>
                  <span className="font-bold text-sm">Upload</span>
               </div>
               <div className="w-16 h-0.5 bg-slate-200 mx-4"></div>
               <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-slate-400'}`}>
                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">2</div>
                  <span className="font-bold text-sm">Validate</span>
               </div>
               <div className="w-16 h-0.5 bg-slate-200 mx-4"></div>
               <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary-600' : 'text-slate-400'}`}>
                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">3</div>
                  <span className="font-bold text-sm">Finish</span>
               </div>
            </div>
         )}

         <div className="flex-1">
            {step === 1 && renderUpload()}
            {step === 2 && renderValidation()}
            {step === 3 && renderSuccess()}
         </div>
      </div>
   );
};

export default DataImport;
