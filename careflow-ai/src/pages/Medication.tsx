
import React, { useState, useEffect } from 'react';
import {
   Pill, Plus, AlertTriangle, CheckCircle2, XCircle, Sparkles, Loader2,
   AlertOctagon, History, User as UserIcon, Zap, Target, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { medicationService, clientService } from '../services/supabaseService';
import { analyzeMedicationSafety } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { Medication, MarRecord, Client } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ShieldCheckIcon = ({ size, className }: { size: number, className?: string }) => (
   <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
   >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
   </svg>
);

const MedicationPage: React.FC = () => {
   const { user } = useAuth();
   const { currentTenant } = useTenant();
   const [activeTab, setActiveTab] = useState<'emar' | 'stock' | 'safety'>('emar');

   const [clients, setClients] = useState<Client[]>([]);
   const [selectedClientId, setSelectedClientId] = useState<string>('');
   const [medications, setMedications] = useState<Medication[]>([]);
   const [marRecords, setMarRecords] = useState<MarRecord[]>([]);

   const [loading, setLoading] = useState(true);
   const [safetyReport, setSafetyReport] = useState<string | null>(null);
   const [isChecking, setIsChecking] = useState(false);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);

   useEffect(() => {
      if (currentTenant) {
         loadClients();
      }
   }, [currentTenant]);

   useEffect(() => {
      if (selectedClientId) {
         loadMedicationData();
      }
   }, [selectedClientId]);

   const loadClients = async () => {
      if (!currentTenant) return;
      try {
         const data = await clientService.getByTenant(currentTenant.id);
         setClients(data);
         if (data.length > 0) setSelectedClientId(data[0].id);
      } catch (error) {
         toast.error('Bridge failure: Client spectrum data retrieval interrupted');
      } finally {
         setLoading(false);
      }
   };

   const loadMedicationData = async () => {
      setLoading(true);
      try {
         const [medsData, marData] = await Promise.all([
            medicationService.getByClient(selectedClientId),
            medicationService.getMar(selectedClientId, format(new Date(), 'yyyy-MM-dd'))
         ]);
         setMedications(medsData);
         setMarRecords(marData);
      } catch (error) {
         toast.error('Bridge failure: Clinical data retrieval interrupted');
      } finally {
         setLoading(false);
      }
   };

   const handleSignMar = async (medId: string, timeSlot: string, status: 'Taken' | 'Refused' | 'Missed') => {
      if (!user) return;
      const signToast = toast.loading('Authorizing clinical administration record...');
      try {
         await medicationService.signMar({
            clientId: selectedClientId,
            medicationId: medId,
            date: format(new Date(), 'yyyy-MM-dd'),
            timeSlot,
            status,
            staffId: user.id,
            note: status === 'Refused' ? 'Refused by client' : ''
         });
         toast.success('Administration Authorized', { id: signToast });
         loadMedicationData();
      } catch (error) {
         toast.error('Authorization Failure', { id: signToast });
      }
   };

   const handleAddMedication = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const addToast = toast.loading('Synchronizing prescription protocol...');
      const formData = new FormData(e.currentTarget);
      try {
         await medicationService.create({
            clientId: selectedClientId,
            name: formData.get('name'),
            dosage: formData.get('dosage'),
            frequency: formData.get('frequency'),
            route: formData.get('route'),
            startDate: formData.get('startDate'),
            instructions: formData.get('instructions'),
            stockLevel: parseInt(formData.get('stockLevel') as string) || 0
         });
         toast.success('Prescription Protocol Synchronized', { id: addToast });
         setIsAddModalOpen(false);
         loadMedicationData();
      } catch (error) {
         toast.error('Synchronization Failure', { id: addToast });
      }
   };

   const clientCondition = "Type 2 Diabetes, High Blood Pressure, Early Dementia";

   const handleSafetyCheck = async () => {
      setIsChecking(true);
      const safetyToast = toast.loading('Initiating Neural Polypharmacy Analysis...');
      try {
         const report = await analyzeMedicationSafety(medications, clientCondition);
         setSafetyReport(report);
         toast.success('Clinical Safety Prognosis Synthesized', { id: safetyToast });
      } catch (error) {
         toast.error('Analysis Synthesis Failure', { id: safetyToast });
      } finally {
         setIsChecking(false);
      }
   };

   const getMarStatusStyle = (status: string) => {
      switch (status) {
         case 'Taken': return 'bg-emerald-900 border-emerald-500 text-emerald-400';
         case 'Refused': return 'bg-rose-900 border-rose-500 text-rose-400';
         case 'Missed': return 'bg-amber-900 border-amber-500 text-amber-400';
         default: return 'bg-slate-900 border-slate-700 text-slate-500';
      }
   };

   const renderEMAR = () => (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20 flex flex-col lg:flex-row justify-between items-center gap-10">
               <div className="space-y-1">
                  <h3 className="font-black text-[12px] text-slate-900 uppercase tracking-[0.5em] flex items-center gap-6">
                     <History size={24} className="text-primary-600" /> Administration Ledger <span className="text-slate-400 tracking-tighter tabular-nums">{format(new Date(), 'dd.MM.yyyy')}</span>
                  </h3>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widestAlpha">Real-time Clinical Telemetry Log</p>
               </div>
               <div className="flex items-center gap-6 w-full lg:w-auto">
                  <UserIcon size={24} className="text-slate-300" />
                  <select
                     value={selectedClientId}
                     onChange={(e) => {
                        setSelectedClientId(e.target.value);
                        toast.info(`Retrieving clinical spectrum for recipient node`);
                     }}
                     className="w-full lg:w-96 p-6 bg-white border-4 border-slate-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widestAlpha text-slate-900 focus:border-primary-500 outline-none transition-all shadow-inner"
                  >
                     {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                     ))}
                  </select>
               </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-50">
                     <tr>
                        <th className="px-12 py-8">Clinical Node details</th>
                        <th className="px-8 py-8 text-center">Morning Epoch</th>
                        <th className="px-8 py-8 text-center">Solar Epoch</th>
                        <th className="px-8 py-8 text-center">Vesper Epoch</th>
                        <th className="px-8 py-8 text-center">Nocturnal Epoch</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {medications.length === 0 ? (
                        <tr><td colSpan={5} className="p-32 text-center text-slate-900 grayscale opacity-10 flex flex-col items-center gap-10">
                           <Pill size={120} />
                           <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Clinical Prescription Matrix</p>
                        </td></tr>
                     ) : medications.map(med => {
                        const morningRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Morning');
                        const lunchRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Lunch');
                        const teaRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Tea');
                        const bedRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Bed');

                        const renderSlot = (slotName: string, record?: MarRecord) => {
                           if (!med.frequency.toLowerCase().includes(slotName.toLowerCase()) && med.frequency !== 'OD') {
                              return <span className="text-slate-100 font-black tracking-widest opacity-20">NULL</span>;
                           }

                           if (record) {
                              return (
                                 <div className={`inline-flex flex-col items-center px-10 py-4 rounded-2xl border-4 shadow-2xl transition-all scale-105 ${getMarStatusStyle(record.status)}`}>
                                    <span className="font-black text-[10px] uppercase tracking-[0.4em]">{record.status}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mt-1">{record.administeredBy?.split(' ')[0]} DISPATCH</span>
                                 </div>
                              );
                           }

                           return (
                              <button
                                 onClick={() => handleSignMar(med.id, slotName, 'Taken')}
                                 className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-black transition-all shadow-2xl active:scale-95 border-b-4 border-primary-600"
                              >
                                 Sign Manifest
                              </button>
                           );
                        };

                        return (
                           <tr key={med.id} className="hover:bg-slate-50/50 transition-all group">
                              <td className="px-12 py-10">
                                 <div className="font-black text-slate-900 text-2xl tracking-tighter leading-none group-hover:text-primary-600 transition-colors">{med.name.toUpperCase()}</div>
                                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">{med.dosage.toUpperCase()} • {med.route.toUpperCase()} SPECTRUM</div>
                                 <div className="text-[11px] font-black text-primary-600 mt-4 px-6 py-3 bg-primary-900 text-white rounded-2xl w-fit shadow-xl border border-primary-500 uppercase tracking-widestAlpha">{med.instructions.toUpperCase()}</div>
                              </td>
                              <td className="px-8 py-10 text-center">{renderSlot('Morning', morningRec)}</td>
                              <td className="px-8 py-10 text-center">{renderSlot('Lunch', lunchRec)}</td>
                              <td className="px-8 py-10 text-center">{renderSlot('Tea', teaRec)}</td>
                              <td className="px-8 py-10 text-center">{renderSlot('Bed', bedRec)}</td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="bg-rose-900 p-12 rounded-[4rem] border border-rose-500/30 flex items-start gap-10 shadow-[0_50px_100px_rgba(225,29,72,0.2)] text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
            <div className="p-6 bg-white/10 rounded-[2rem] text-rose-400 shadow-2xl relative z-10 group-hover:rotate-12 transition-transform">
               <AlertTriangle size={36} />
            </div>
            <div className="space-y-4 relative z-10">
               <h4 className="font-black text-2xl uppercase tracking-tighter leading-none">Integrity Escalation Protocol</h4>
               <p className="text-[11px] font-black text-rose-200 uppercase tracking-[0.4em] leading-relaxed max-w-4xl opacity-80">
                  Refusal of clinical medication must be archived with mission-critical discrepancy context. Escalation protocols (authorized GP handover) are automatically triggered after 3 consecutive refusals or 2 missed doses within a 24-hour neural cycle.
               </p>
            </div>
         </div>
      </div>
   );

   const renderStock = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
         {medications.map(med => {
            const percentage = (med.stockLevel / (med.totalStock || 28)) * 100;
            const isLow = percentage < 25;

            return (
               <div key={med.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col justify-between hover:shadow-[0_50px_100px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-primary-50 transition-colors" />
                  <div className="flex justify-between items-start mb-12 relative z-10">
                     <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-[2rem] shadow-2xl transition-transform group-hover:rotate-6 ${isLow ? 'bg-rose-900 text-rose-400' : 'bg-slate-900 text-white'}`}>
                           <Pill size={32} className={isLow ? '' : 'text-primary-500'} />
                        </div>
                        <div className="space-y-1">
                           <h3 className="font-black text-slate-900 text-2xl tracking-tighter leading-none group-hover:text-primary-600 transition-colors">{med.name.toUpperCase()}</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">{med.dosage.toUpperCase()} SPECTRA</p>
                        </div>
                     </div>
                     {isLow && (
                        <div className="px-6 py-2 bg-rose-900 text-rose-400 text-[9px] font-black uppercase rounded-xl border border-rose-500 tracking-[0.3em] animate-pulse shadow-2xl">CRITICAL DISCREPANCY</div>
                     )}
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em]">
                        <span className="text-slate-400">Inventory Lattice Status</span>
                        <span className={`px-4 py-1 rounded-xl shadow-xl transition-all ${isLow ? 'text-rose-400 bg-rose-900 border border-rose-500' : 'text-slate-900 bg-slate-50 border border-slate-100'}`}>{med.stockLevel} / {med.totalStock || 28} NODES</span>
                     </div>
                     <div className="h-6 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner border border-slate-200">
                        <div
                           className={`h-full rounded-full transition-all duration-1000 shadow-2xl ${isLow ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-slate-900 to-primary-600'}`}
                           style={{ width: `${percentage}%` }}
                        />
                     </div>
                  </div>

                  <div className="flex gap-4 mt-12 pt-10 border-t border-slate-50 relative z-10">
                     <button onClick={() => toast.info('Initiating Clinical Audit Sequence')} className="flex-1 py-5 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95">Audit</button>
                     <button onClick={() => toast.success('Replenishment Protocol Dispatched')} className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 hover:bg-black border-b-4 border-primary-600">Refill Node</button>
                  </div>
               </div>
            );
         })}
         <div
            onClick={() => {
               setIsAddModalOpen(true);
               toast.info('Initializing New Prescription Protocol');
            }}
            className="bg-slate-50 border-8 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center p-12 text-slate-300 hover:border-primary-500 hover:text-primary-600 hover:bg-white transition-all duration-500 cursor-pointer group min-h-[400px] shadow-inner"
         >
            <div className="p-10 bg-white rounded-full shadow-2xl mb-8 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
               <Plus size={64} className="text-primary-600" />
            </div>
            <span className="font-black uppercase tracking-[0.6em] text-[11px]">Inject Prescription Manifest</span>
         </div>
      </div>
   );

   const renderSafety = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700 h-full min-h-[750px] items-stretch">
         <div className="lg:col-span-1 space-y-10 flex flex-col h-full">
            <div className="bg-slate-900 p-16 rounded-[4.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden group/ana flex-1 flex flex-col justify-between">
               <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
               <div className="relative z-10">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-[12px] font-black uppercase tracking-[0.5em] flex items-center gap-6 text-primary-500"><Sparkles size={32} /> Neural Analyst</h3>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed mb-12 opacity-80">
                     Execute clinical-grade polypharmacy analysis against historical health conditions even with disconnected clinical datasets.
                  </p>
               </div>
               <button
                  onClick={handleSafetyCheck}
                  disabled={isChecking}
                  className="w-full py-8 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-6 disabled:opacity-30 active:scale-95 group/btn relative z-10"
               >
                  {isChecking ? <Loader2 className="animate-spin text-primary-600" size={24} /> : <Zap size={24} className="text-primary-600 group-hover/btn:scale-125 transition-transform" />}
                  {isChecking ? 'Computing Prognosis...' : 'Authorize Safety Audit'}
               </button>
            </div>

            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-left-10 duration-1000">
               <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.5em] mb-4 border-b border-slate-50 pb-6 flex items-center gap-4">
                  <ShieldAlert size={18} className="text-rose-600" /> Discrepancy Manifest
               </h4>
               <div className="flex flex-wrap gap-4">
                  <span className="px-8 py-3 bg-rose-900 text-rose-400 border border-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widestAlpha shadow-xl">PENICILLIN SENSITIVITY</span>
                  <span className="px-8 py-3 bg-rose-900 text-rose-400 border border-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widestAlpha shadow-xl">LATEX DISCREPANCY</span>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl flex flex-col h-full overflow-hidden animate-in zoom-in-95 duration-1000">
            <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
               <div className="space-y-1">
                  <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter leading-none">Intelligence Handshake Report</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">Real-time Clinical Prognosis Extract</p>
               </div>
               <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xl flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safe Link Active</span>
               </div>
            </div>
            <div className="p-16 flex-1 bg-white overflow-y-auto scrollbar-hide relative">
               <div className="absolute inset-0 bg-grid-slate-900/[0.01] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
               {safetyReport ? (
                  <div className="animate-in fade-in duration-1000 relative z-10">
                     <div className="flex items-center gap-6 mb-12 text-emerald-600 font-black uppercase tracking-[0.4em] text-[11px] bg-emerald-900/5 p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl">
                        <CheckCircle2 size={32} /> Analysis Successfully Synthesized
                     </div>
                     <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                        <pre className="whitespace-pre-wrap font-mono text-[12px] text-primary-400 font-black leading-relaxed bg-transparent p-0 border-none m-0 uppercase tracking-tight relative z-10">
                           {safetyReport}
                        </pre>
                     </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-900 p-20 text-center grayscale opacity-10 gap-10 relative z-10">
                     <div className="p-16 bg-white shadow-2xl rounded-[3rem] border border-slate-50 translate-y-4">
                        <ShieldCheckIcon size={120} />
                     </div>
                     <div className="space-y-2">
                        <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Intelligence Spectrum</p>
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em]">Authorize audit to initialize AI extraction sequence</p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Clinical <span className="text-primary-600">eMAR</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Medication Intelligence • Pharmacy Polypharmacy Matrix • eMAR Continuity Hub
               </p>
            </div>
            <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
               {[
                  { id: 'emar', label: 'eMAR System', icon: History },
                  { id: 'stock', label: 'Inventory Matrix', icon: Pill },
                  { id: 'safety', label: 'Safety Lab', icon: AlertOctagon },
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => {
                        setActiveTab(tab.id as any);
                        toast.info(`Retrieving ${tab.label.toUpperCase()} spectrum`);
                     }}
                     className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                  >
                     <tab.icon size={20} className={activeTab === tab.id ? 'text-primary-500' : ''} /> {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {loading ? (
            <div className="flex flex-col items-center justify-center p-40 gap-10 animate-pulse">
               <Cpu className="animate-spin text-primary-600 w-24 h-24" />
               <p className="font-black uppercase tracking-[0.8em] text-[14px] text-slate-400">Synchronizing clinical spectra...</p>
            </div>
         ) : (
            <div className="animate-in fade-in duration-1000">
               {activeTab === 'emar' && renderEMAR()}
               {activeTab === 'stock' && renderStock()}
               {activeTab === 'safety' && renderSafety()}
            </div>
         )}

         {/* Add Medication Modal */}
         {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xl p-8">
               <div className="bg-white rounded-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] border border-white/20">
                  <div className="px-16 py-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                     <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none flex items-center gap-6">
                        <Plus size={40} className="text-primary-600" /> New Prescription
                     </h3>
                     <button onClick={() => setShowScanner(false)} className="p-4 bg-white border border-slate-100 text-slate-300 hover:text-slate-900 rounded-3xl transition-all shadow-xl"><XCircle size={32} /></button>
                  </div>
                  <form onSubmit={handleAddMedication} className="px-16 py-12 space-y-8 overflow-y-auto scrollbar-hide">
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Medication Entity</label>
                        <input name="name" required type="text" className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] font-black text-xl uppercase tracking-tighter focus:border-primary-500 transition-all outline-none shadow-inner" placeholder="E.G. ATORVASTATIN" />
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Magnitude</label>
                           <input name="dosage" required type="text" className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] font-black uppercase tracking-widestAlpha focus:border-primary-500 transition-all outline-none shadow-inner text-[11px]" placeholder="20MG" />
                        </div>
                        <div className="space-y-4">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Transmission route</label>
                           <select name="route" className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] font-black uppercase text-[11px] tracking-widestAlpha focus:border-primary-500 transition-all outline-none cursor-pointer shadow-inner appearance-none">
                              <option>ORAL</option>
                              <option>TOPICAL</option>
                              <option>INJECTION</option>
                              <option>INHALER</option>
                           </select>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Administration cycle</label>
                        <input name="frequency" required type="text" className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] font-black uppercase tracking-widestAlpha focus:border-primary-500 transition-all outline-none shadow-inner text-[11px]" placeholder="E.G. MORNING, EVENING" />
                     </div>
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Clinical Guidance</label>
                        <textarea name="instructions" rows={3} className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] font-black uppercase tracking-tight text-[11px] focus:border-primary-500 transition-all outline-none resize-none shadow-inner" placeholder="E.G. TAKE 30 MINUTES BEFORE NUTRITION WITH HYDRATION..." />
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Commencement</label>
                           <input name="startDate" type="date" required className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] font-black uppercase tracking-widestAlpha focus:border-primary-500 transition-all outline-none shadow-inner text-[11px]" />
                        </div>
                        <div className="space-y-4">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Unit Inventory</label>
                           <input name="stockLevel" type="number" className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] font-black uppercase tracking-widestAlpha focus:border-primary-500 transition-all outline-none shadow-inner text-[11px]" defaultValue="28" />
                        </div>
                     </div>
                     <button className="w-full py-8 bg-slate-900 text-white font-black uppercase tracking-[0.5em] text-[11px] rounded-[2.5rem] mt-6 hover:bg-black shadow-2xl transition-all active:scale-95 border-b-8 border-primary-600">
                        Authorize Prescription Protocol
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default MedicationPage;
