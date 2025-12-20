
import React, { useState } from 'react';
import {
   Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
   ArrowRight, Sparkles, Loader2, XCircle, RefreshCw, Zap, Target, History, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { toast } from 'sonner';
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
      const valToast = toast.loading('Initiating Neural Document Validation...');

      const reader = new FileReader();
      reader.onload = async (e) => {
         const text = e.target?.result as string;
         if (!text) {
            setIsProcessing(false);
            toast.error('Null Data Matrix Detected', { id: valToast });
            return;
         }

         const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);

         try {
            const result = await validateImportData(rows, entityType);
            setValidationResult(result);
            setStep(2);
            toast.success('Document Matrix Validated and Synthesized', { id: valToast });
         } catch (error) {
            toast.error('Validation Logic Failure', { id: valToast });
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
      const comToast = toast.loading('Authorizing Global Data Dispatch...');

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
                  careLevel: row.care_level,
                  age: age,
                  // @ts-ignore
                  date_of_birth: row.date_of_birth,
                  status: 'Active'
               } as any);
            }
            successCount++;
         } catch (error) {
            failCount++;
         }
      }

      setImportProgress(prev => ({ ...prev, success: successCount, failed: failCount }));
      setIsProcessing(false);
      setStep(3);
      toast.success(`Migration Sequence Complete: ${successCount} entries archived.`, { id: comToast });
   };

   const reset = () => {
      setFile(null);
      setStep(1);
      setValidationResult(null);
      toast.info('Sequence Reset: Awaiting New Data Manifest');
   };

   const renderUpload = () => (
      <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-10 duration-700">
         <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-slate-900/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

            <div className="mb-12 relative z-10">
               <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 mb-8">Target Entity Selection</h3>
               <div className="flex justify-center gap-6">
                  <button
                     onClick={() => {
                        setEntityType('Staff');
                        toast.info('Protocol Set: STAFF ENTITY MATRIX');
                     }}
                     className={`px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all border-4 shadow-2xl ${entityType === 'Staff' ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-400 border-slate-50 hover:border-primary-500'}`}
                  >
                     Staff Lattice
                  </button>
                  <button
                     onClick={() => {
                        setEntityType('Clients');
                        toast.info('Protocol Set: CLIENT ENTITY MATRIX');
                     }}
                     className={`px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all border-4 shadow-2xl ${entityType === 'Clients' ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-400 border-slate-50 hover:border-primary-500'}`}
                  >
                     Recipient Lattice
                  </button>
               </div>
            </div>

            <div className="border-8 border-dashed border-slate-50 rounded-[3rem] p-20 bg-slate-50/50 hover:bg-white hover:border-primary-500 transition-all duration-500 cursor-pointer relative group/upload shadow-inner active:scale-95">
               <div className="absolute inset-0 bg-grid-slate-900/[0.01] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
               <FileSpreadsheet size={80} className="mx-auto text-slate-200 mb-8 group-hover/upload:scale-110 group-hover/upload:text-primary-600 transition-all duration-500" />
               <p className="font-black text-2xl text-slate-900 uppercase tracking-tighter">Drag & Drop Global Manifest</p>
               <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-widestAlpha">Supports CSV • XLSX • JSON CALIBRATIONS</p>
               <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                     setFile(e.target.files?.[0] || null);
                     if (e.target.files?.[0]) toast.success(`Document Cached: ${e.target.files[0].name.toUpperCase()}`);
                  }}
                  id="file-upload"
               />
               <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
            </div>

            {file && (
               <div className="mt-12 flex items-center justify-between p-8 bg-slate-900 text-white rounded-[2.5rem] text-left animate-in zoom-in-95 shadow-2xl relative z-10 border border-white/10">
                  <div className="flex items-center gap-6">
                     <div className="p-4 bg-white/10 rounded-2xl"><FileSpreadsheet className="text-primary-500" size={32} /></div>
                     <div className="space-y-1">
                        <p className="font-black text-lg uppercase tracking-tight leading-none">{file.name.toUpperCase()}</p>
                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.4em]">{(file.size / 1024).toFixed(1)} KB METADATA</p>
                     </div>
                  </div>
                  <button onClick={() => {
                     setFile(null);
                     toast.warning('Document Purged from Cache');
                  }} className="p-4 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                     <XCircle size={32} />
                  </button>
               </div>
            )}

            <button
               onClick={handleUpload}
               disabled={!file || isProcessing}
               className="w-full mt-12 py-8 bg-slate-900 text-white font-black uppercase tracking-[0.5em] text-[11px] rounded-[2.5rem] hover:bg-black disabled:opacity-30 flex items-center justify-center gap-6 transition-all shadow-2xl active:scale-95 relative z-10"
            >
               {isProcessing ? <Loader2 className="animate-spin text-primary-500" size={24} /> : <Sparkles size={24} className="text-primary-500" />}
               {isProcessing ? 'Neural Validating...' : 'Initialize Migration'}
            </button>
         </div>
      </div>
   );

   const renderValidation = () => (
      <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
         <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[700px]">
            <div className="px-12 py-12 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center group">
               <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none flex items-center gap-6">
                     <Sparkles size={40} className="text-primary-600 transition-transform group-hover:rotate-12" /> Neural Diagnosis
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Found {validationResult?.mappedData?.filter((r: any) => r.status === 'Invalid').length} logical discrepancies in data spectrum.</p>
               </div>
               <div className="flex gap-4">
                  <span className="px-8 py-3 bg-slate-900 text-primary-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">Integrity Check Active</span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-50">
                     <tr>
                        <th className="px-12 py-8">Entity Name</th>
                        <th className="px-12 py-8">Comms Link</th>
                        <th className="px-12 py-8">Metadata Role</th>
                        <th className="px-12 py-8">Mobile Protocol</th>
                        <th className="px-12 py-8 text-right">Integrity</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {validationResult?.mappedData?.map((row: any, idx: number) => (
                        <tr key={idx} className={`transition-all ${row.status === 'Invalid' ? 'bg-rose-900/5' : 'hover:bg-slate-50 group'}`}>
                           <td className="px-12 py-6 font-black text-lg text-slate-900 uppercase tracking-tight leading-none group-hover:text-primary-600">{row.name.toUpperCase()}</td>
                           <td className="px-12 py-6">
                              <span className={`text-[11px] font-black uppercase tracking-widest tabular-nums ${row.email.includes('@') ? 'text-slate-600' : 'text-rose-600'}`}>
                                 {row.email.toUpperCase()}
                              </span>
                           </td>
                           <td className="px-12 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">{row.role.toUpperCase()}</td>
                           <td className="px-12 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{row.phone}</td>
                           <td className="px-12 py-6 text-right">
                              <span className={`text-[9px] font-black px-6 py-2 rounded-xl uppercase flex items-center justify-center gap-3 w-fit ml-auto shadow-xl border ${row.status === 'Valid' ? 'bg-emerald-900 text-emerald-400 border-emerald-500' : 'bg-rose-900 text-rose-400 border-rose-500'
                                 }`}>
                                 {row.status === 'Valid' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                 {row.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="p-12 bg-slate-50/20 border-t border-slate-50 flex justify-end gap-10">
               <button onClick={reset} className="px-12 py-6 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] hover:text-slate-900 transition-all active:scale-95">Abort Mission</button>
               <button
                  onClick={handleCommit}
                  disabled={isProcessing}
                  className="px-16 py-6 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-[2rem] hover:bg-black flex items-center gap-8 shadow-2xl active:scale-95 group/commit"
               >
                  {isProcessing ? (
                     <>
                        <Loader2 className="animate-spin text-primary-500" size={24} />
                        DISPATCHING {importProgress.current}/{importProgress.total}...
                     </>
                  ) : (
                     <>COMMIT VALID MANIFEST <ArrowRight size={24} className="text-primary-600 group-hover/commit:translate-x-2 transition-transform" /></>
                  )}
               </button>
            </div>
         </div>
      </div>
   );

   const renderSuccess = () => (
      <div className="max-w-2xl mx-auto text-center py-24 animate-in zoom-in duration-500 space-y-12">
         <div className="w-48 h-48 bg-emerald-900/10 text-emerald-600 rounded-[4rem] flex items-center justify-center mx-auto border-8 border-emerald-500/10 shadow-[0_50px_100px_rgba(16,185,129,0.2)] animate-pulse">
            <CheckCircle2 size={100} />
         </div>
         <div className="space-y-4">
            <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Migration Succeeded</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] max-w-lg mx-auto leading-relaxed">
               Successfully archived {importProgress.success} entities into the neural lattice.
               {importProgress.failed > 0 && <span className="text-rose-600"> {importProgress.failed} discrepancy errors logged.</span>}
            </p>
         </div>
         <button
            onClick={reset}
            className="px-20 py-8 bg-slate-900 text-white font-black uppercase tracking-[0.5em] text-[12px] rounded-[3rem] hover:bg-black flex items-center gap-6 mx-auto shadow-2xl active:scale-95 transition-all"
         >
            <RefreshCw size={24} className="text-primary-500" /> New Data Epoch
         </button>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Data <span className="text-primary-600">Fusion</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  System Migration Hub • Neural Entity Validation • Global Data Dispatch
               </p>
            </div>
         </div>

         {step !== 3 && (
            <div className="flex items-center justify-center py-10">
               <div className="flex bg-white p-4 rounded-full border border-slate-50 shadow-2xl relative z-20">
                  <div className={`flex items-center gap-6 px-10 py-5 rounded-full transition-all ${step === 1 ? 'bg-slate-900 text-white shadow-xl scale-[1.05]' : 'text-slate-300'}`}>
                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs ${step === 1 ? 'border-primary-500 text-primary-500' : 'border-slate-200'}`}>1</div>
                     <span className="font-black text-[10px] uppercase tracking-[0.4em]">Dispatch</span>
                  </div>
                  <div className="w-16 h-px bg-slate-100 self-center"></div>
                  <div className={`flex items-center gap-6 px-10 py-5 rounded-full transition-all ${step === 2 ? 'bg-slate-900 text-white shadow-xl scale-[1.05]' : 'text-slate-300'}`}>
                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs ${step === 2 ? 'border-primary-500 text-primary-500' : 'border-slate-200'}`}>2</div>
                     <span className="font-black text-[10px] uppercase tracking-[0.4em]">Diagnose</span>
                  </div>
                  <div className="w-16 h-px bg-slate-100 self-center"></div>
                  <div className={`flex items-center gap-6 px-10 py-5 rounded-full transition-all ${step === 3 ? 'bg-slate-900 text-white shadow-xl scale-[1.05]' : 'text-slate-300'}`}>
                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs ${step === 3 ? 'border-primary-500 text-primary-500' : 'border-slate-200'}`}>3</div>
                     <span className="font-black text-[10px] uppercase tracking-[0.4em]">Commit</span>
                  </div>
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
