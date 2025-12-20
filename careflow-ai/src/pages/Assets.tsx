
import React, { useState, useEffect } from 'react';
import {
   Box, Search, Plus, Wrench, AlertTriangle, CheckCircle2,
   User, Calendar, Sparkles, Loader2, Tablet, Activity, Lock, Zap, Target, History, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { assetService } from '../services/supabaseService';
import { Asset, AssetAnalysis } from '../types';
import { predictAssetMaintenance } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Assets: React.FC = () => {
   const { profile } = useAuth();
   const [assets, setAssets] = useState<Asset[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
   const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);
   const [isAnalyzing, setIsAnalyzing] = useState(false);

   useEffect(() => {
      async function loadAssets() {
         setLoading(true);
         try {
            const data = await assetService.getAll(profile?.tenant_id);
            if (data.length > 0) {
               const mapped = data.map((a: any) => ({
                  id: a.id,
                  name: a.name,
                  type: a.category || 'Other',
                  serialNumber: a.serialNumber || 'N/A',
                  status: (a.status === 'available' ? 'Active' : a.status === 'maintenance' ? 'Repair' : 'Retired') as 'Active' | 'Repair' | 'Retired',
                  assignedTo: a.location || 'Unassigned',
                  assignedType: 'Office' as const,
                  purchaseDate: a.purchaseDate || 'Unknown',
                  value: a.purchaseCost || 0,
                  nextInspectionDate: a.nextMaintenance || null
               }));
               setAssets(mapped);
            } else {
               setAssets([
                  { id: '1', name: 'Patient Hoist', type: 'Mobility', serialNumber: 'PH-2024-001', status: 'Active', assignedTo: 'Unit A', assignedType: 'Office' as const, purchaseDate: '2024-01-15', value: 2500, nextInspectionDate: '2024-12-28' },
                  { id: '2', name: 'Medical Bed', type: 'Mobility', serialNumber: 'MB-2023-045', status: 'Active', assignedTo: 'Mrs Smith', assignedType: 'Client' as const, purchaseDate: '2023-06-20', value: 1800, nextInspectionDate: null },
                  { id: '3', name: 'Tablet Device', type: 'IT', serialNumber: 'TAB-2024-012', status: 'Repair', assignedTo: 'Reception', assignedType: 'Office' as const, purchaseDate: '2024-03-01', value: 450, nextInspectionDate: null }
               ]);
            }
         } catch (error) {
            toast.error("Bridge failure: Asset data retrieval interrupted");
            setAssets([]);
         } finally {
            setLoading(false);
         }
      }
      loadAssets();
   }, [profile?.tenant_id]);

   const handleAnalyze = async (asset: Asset) => {
      setIsAnalyzing(true);
      setAnalysis(null);
      const anaToast = toast.loading('Initiating Neural Maintenance Synthesis...');
      try {
         const result = await predictAssetMaintenance(asset.name, asset.type, asset.purchaseDate);
         setAnalysis(result);
         toast.success('Maintenance Prognosis Synthesized', { id: anaToast });
      } catch (error) {
         toast.error('Synthesis Failure', { id: anaToast });
      } finally {
         setIsAnalyzing(false);
      }
   };

   const getAssetIcon = (type: string) => {
      switch (type) {
         case 'IT': return <Tablet size={24} />;
         case 'Mobility': return <Activity size={24} />;
         case 'Safety': return <Lock size={24} />;
         default: return <Box size={24} />;
      }
   };

   const calculateTotalValue = () => assets.reduce((acc, curr) => acc + curr.value, 0);

   const getStatusStyle = (status: string) => {
      switch (status) {
         case 'Active': return 'bg-emerald-900 border-emerald-500 text-emerald-400';
         case 'Repair': return 'bg-rose-900 border-rose-500 text-rose-400';
         default: return 'bg-slate-900 border-slate-700 text-slate-500';
      }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Inventory <span className="text-primary-600">Archiver</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Asset Tracking • Maintenance Intelligence • LOLER Compliance Hub
               </p>
            </div>
            <div className="flex gap-10 items-center">
               <div className="bg-white px-12 py-6 rounded-[2rem] border border-slate-100 shadow-2xl space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Asset Capital</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">£{calculateTotalValue().toLocaleString()}</p>
               </div>
               <button onClick={() => toast.info('New Asset Sequence: Contact Unit Command')} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black flex items-center gap-6 active:scale-95 transition-all">
                  <Plus size={20} className="text-primary-500" /> New Asset Manifest
               </button>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-10 items-stretch h-full min-h-[750px]">
            {/* Left: Asset Matrix Spectrum */}
            <div className="lg:col-span-1 w-full lg:w-[450px] bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-10 duration-700">
               <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20">
                  <div className="relative">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <input
                        type="text"
                        placeholder="SEARCH EQUIPMENT NODE..."
                        className="w-full pl-16 pr-8 py-6 bg-white border-4 border-slate-50 rounded-[2rem] text-[10px] font-black uppercase tracking-widestAlpha focus:border-primary-500 outline-none transition-all shadow-inner placeholder:text-slate-200"
                     />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
                  {assets.map(asset => (
                     <div
                        key={asset.id}
                        onClick={() => {
                           setSelectedAsset(asset);
                           setAnalysis(null);
                           toast.info(`Retrieving Unit Metadata: ${asset.name}`);
                        }}
                        className={`p-10 cursor-pointer transition-all hover:bg-slate-50/50 group relative
                          ${selectedAsset?.id === asset.id ? 'bg-primary-50 shadow-inner' : ''}
                       `}
                     >
                        {selectedAsset?.id === asset.id && <div className="absolute left-0 top-0 bottom-0 w-3 bg-primary-600 rounded-r-3xl" />}
                        <div className="flex justify-between items-start mb-4 relative z-10">
                           <div className="flex items-center gap-6">
                              <div className={`p-4 rounded-2xl shadow-xl transition-transform group-hover:scale-110
                                    ${asset.type === 'IT' ? 'bg-blue-900 text-blue-400' :
                                    asset.type === 'Mobility' ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'}
                                `}>
                                 {getAssetIcon(asset.type)}
                              </div>
                              <div className="space-y-1">
                                 <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight leading-none group-hover:text-primary-600 transition-colors">{asset.name}</h3>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">S/N: {asset.serialNumber}</p>
                              </div>
                           </div>
                           <span className={`text-[9px] font-black px-6 py-2 rounded-xl uppercase border shadow-xl ${getStatusStyle(asset.status)}`}>
                              {asset.status}
                           </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">
                           <span className="flex items-center gap-3"><User size={16} className="text-primary-600" /> {asset.assignedTo}</span>
                           {asset.nextInspectionDate && (
                              <span className="flex items-center gap-3 text-amber-600"><Calendar size={16} className="text-amber-600" /> {asset.nextInspectionDate}</span>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Right: Technical Metadata Console */}
            <div className="flex-1 bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-700">
               {selectedAsset ? (
                  <>
                     <div className="px-16 py-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 relative z-20">
                        <div className="flex items-center gap-8">
                           <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl group-hover:rotate-6 transition-transform">
                              <Box size={40} className="text-primary-500" />
                           </div>
                           <div className="space-y-2">
                              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedAsset.name}</h2>
                              <div className="flex items-center gap-6">
                                 <span className="px-6 py-2 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border border-slate-300 shadow-xl">{selectedAsset.type} SPECTRUM</span>
                                 <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">FISCAL VALUE: <span className="text-slate-900">£{selectedAsset.value}</span></span>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => toast.warning('Metadata Lock Active')} className="p-6 bg-white border-4 border-slate-50 hover:border-primary-500 text-slate-400 hover:text-primary-600 rounded-3xl transition-all shadow-xl active:scale-95"><ShieldAlert size={32} /></button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-16 space-y-12 scrollbar-hide relative z-10 bg-white">
                        <div className="absolute inset-0 bg-grid-slate-900/[0.01] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

                        {/* Assignment Metadata */}
                        <div className="bg-slate-50/50 p-12 rounded-[3.5rem] border-2 border-slate-50 shadow-inner flex justify-between items-center relative z-10 hover:bg-white hover:shadow-2xl transition-all group/assign">
                           <div className="flex items-center gap-10">
                              <div className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-2xl group-hover/assign:rotate-6 transition-transform">
                                 {selectedAsset.assignedTo.charAt(0)}
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">DEPLOYMENT NODE</p>
                                 <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedAsset.assignedTo}</p>
                                 <p className="text-[11px] font-black text-primary-600 uppercase tracking-widestAlpha">{selectedAsset.assignedType} SPECTRUM</p>
                              </div>
                           </div>
                           <button onClick={() => toast.info('Request Reassignment Handshake')} className="px-10 py-5 text-primary-600 font-black uppercase tracking-[0.4em] text-[10px] bg-white rounded-2xl border-4 border-slate-50 hover:border-primary-500 transition-all shadow-xl">Re-Deploy</button>
                        </div>

                        {/* AI Maintenance Matrix */}
                        <div className="bg-slate-900 p-16 rounded-[4.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-white/5 relative overflow-hidden group/ana">
                           <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                           <div className="flex justify-between items-center mb-12 relative z-10">
                              <div className="space-y-1">
                                 <h3 className="font-black text-white text-3xl uppercase tracking-tighter leading-none flex items-center gap-6"><Sparkles size={32} className="text-primary-500" /> Neural Maintenance</h3>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Predictive Health Metadata Matrix</p>
                              </div>
                              {!analysis && (
                                 <button
                                    onClick={() => handleAnalyze(selectedAsset)}
                                    disabled={isAnalyzing}
                                    className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all flex items-center gap-6 disabled:opacity-30 shadow-2xl group/btn"
                                 >
                                    {isAnalyzing ? <Loader2 className="animate-spin text-primary-600" size={24} /> : <Zap size={24} className="text-primary-600 group-hover/btn:scale-125 transition-transform" />}
                                    Authorize Analysis
                                 </button>
                              )}
                           </div>

                           {analysis ? (
                              <div className="space-y-10 animate-in fade-in relative z-10">
                                 <div className="grid grid-cols-2 gap-10">
                                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-widestAlpha mb-2">Cycle Interval</p>
                                       <p className="text-2xl font-black text-white tracking-tighter uppercase">{analysis.recommendedMaintenanceInterval}</p>
                                    </div>
                                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-rose-400">
                                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-widestAlpha mb-2">Predicted EOL</p>
                                       <p className="text-2xl font-black tracking-tighter uppercase">{analysis.predictedEndOfLife}</p>
                                    </div>
                                 </div>

                                 <div className="bg-rose-900/40 p-10 rounded-[3rem] border border-rose-500/30 space-y-6">
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-4"><AlertTriangle size={20} /> Neural Hazard Manifest</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {analysis.riskFactors.map((r, i) => (
                                          <div key={i} className="flex items-center gap-4 text-[11px] font-black text-rose-200 uppercase tracking-widest">
                                             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                             {r}
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 <div className="bg-emerald-900/40 p-10 rounded-[3rem] border border-emerald-500/30 space-y-6">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-4"><CheckCircle2 size={20} /> Integrity Optimization</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {analysis.maintenanceTips.map((t, i) => (
                                          <div key={i} className="flex items-center gap-4 text-[11px] font-black text-emerald-200 uppercase tracking-widest">
                                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                             {t}
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="text-center py-20 grayscale opacity-20 flex flex-col items-center gap-10">
                                 <History size={100} className="text-white" />
                                 <p className="text-[12px] font-black uppercase tracking-[0.8em] text-white">Execute Neural Calibration for Prognosis Data</p>
                              </div>
                           )}
                        </div>

                        {/* Spectral Timeline Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                           <div className="bg-slate-50 p-10 rounded-[3.5rem] border-2 border-slate-100 flex items-center justify-between">
                              <div className="space-y-1">
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">INITIATION EPOCH</p>
                                 <p className="text-2xl font-black text-slate-900 tracking-tighter">{selectedAsset.purchaseDate.toUpperCase()}</p>
                              </div>
                              <History size={40} className="text-slate-200" />
                           </div>
                           <div className="bg-slate-50 p-10 rounded-[3.5rem] border-2 border-slate-100 flex items-center justify-between">
                              <div className="space-y-1">
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">INSPECTION CYCLE</p>
                                 <p className="text-2xl font-black text-slate-900 tracking-tighter">{selectedAsset.nextInspectionDate?.toUpperCase() || 'NULL CYCLE'}</p>
                              </div>
                              <Target size={40} className="text-slate-200" />
                           </div>
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-900 p-20 text-center grayscale opacity-10 gap-10">
                     <Box size={120} />
                     <p className="font-black uppercase tracking-[0.8em] text-[18px]">Select Equipment Node for detailed archival metadata</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default Assets;