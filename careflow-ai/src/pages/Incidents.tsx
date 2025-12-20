
import React, { useState, useEffect } from 'react';
import {
   ShieldAlert, AlertTriangle, CheckCircle2, Search, Plus,
   FileText, Microscope, Sparkles, Loader2, ChevronRight, X, Brain, Activity, ShieldCheck, History, Landmark
} from 'lucide-react';
import { incidentService, clientService, staffService } from '../services/supabaseService';
import { generateIncidentInvestigation } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { toast } from 'sonner';

// Define localized type here to avoid type mismatch issues if types.ts isn't fully updated yet
interface Incident {
   id: string;
   date: string;
   clientName: string;
   staffName: string;
   type: string;
   severity: string;
   description: string;
   status: string;
   rootCause?: string;
   actionsTaken?: string;
   investigationNotes?: string;
   reportedToCQC?: boolean;
}

const IncidentsPage: React.FC = () => {
   const { currentTenant } = useTenant();
   const { user } = useAuth();

   const [incidents, setIncidents] = useState<Incident[]>([]);
   const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);

   // Creation Form State
   const [clients, setClients] = useState<any[]>([]);
   const [staff, setStaff] = useState<any[]>([]);
   const [formData, setFormData] = useState({
      clientId: '',
      type: 'Fall',
      severity: 'Medium',
      date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
      description: ''
   });

   useEffect(() => {
      loadData();
   }, [currentTenant]);

   const loadData = async () => {
      setIsLoading(true);
      try {
         if (currentTenant) {
            const [incidentsData, clientsData, staffData] = await Promise.all([
               incidentService.getAll(),
               clientService.getByTenant(currentTenant.id),
               staffService.getAll()
            ]);
            setIncidents(incidentsData);
            setClients(clientsData);
            setStaff(staffData);
         }
      } catch (error) {
         toast.error('Risk ledger synchronization failure', {
            description: 'Failed to synchronize incident database.'
         });
      } finally {
         setIsLoading(false);
      }
   };

   // Handler for AI Investigation
   const handleInvestigate = async () => {
      if (!selectedIncident) return;
      setIsAnalyzing(true);
      const investigationToast = toast.loading('Initializing Neural Investigation Sequence...');
      try {
         const analysis = await generateIncidentInvestigation(
            selectedIncident.description,
            selectedIncident.type
         );

         const actionsTaken = analysis.recommendedActions.join('. ');
         const nodes = `Risk Score: ${analysis.riskScore}/10. Prevention: ${analysis.preventionStrategy}`;

         const updatedIncident = {
            ...selectedIncident,
            rootCause: analysis.rootCause,
            actionsTaken: actionsTaken,
            investigationNotes: nodes,
            status: 'Resolved'
         };

         // Save to DB
         await incidentService.update(selectedIncident.id, {
            status: 'Resolved' as any,
            rootCause: analysis.rootCause,
            actionsTaken: actionsTaken,
            investigationNotes: nodes
         });

         setIncidents(prev => prev.map(inc => inc.id === updatedIncident.id ? updatedIncident : inc));
         setSelectedIncident(updatedIncident);
         toast.success('Neural Investigation Complete', {
            id: investigationToast,
            description: 'Root cause analysis and prevention strategy identified.'
         });
      } catch (error) {
         toast.error('Neural Scan Error', { id: investigationToast });
      } finally {
         setIsAnalyzing(false);
      }
   };

   const handleCreateIncident = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentTenant) return;

      const createToast = toast.loading('Emitting Incident Protocol...');
      try {
         await incidentService.create({
            tenant_id: currentTenant.id,
            client_id: formData.clientId,
            type: formData.type as any,
            severity: formData.severity as any,
            date: new Date(formData.date).toISOString(),
            description: formData.description
         });

         toast.success('Incident Formalized', {
            id: createToast,
            description: 'Protocol successfully recorded in the Risk Ledger.'
         });
         setIsModalOpen(false);
         setFormData({
            clientId: '',
            type: 'Fall',
            severity: 'Medium',
            date: new Date().toISOString().slice(0, 16),
            description: ''
         });
         loadData();
      } catch (error) {
         toast.error('Failed to emit incident protocol', { id: createToast });
      }
   };

   const getSeverityColor = (severity: string) => {
      const s = severity?.toLowerCase() || 'low';
      switch (s) {
         case 'critical': return 'bg-rose-50 text-rose-700 border-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
         case 'high': return 'bg-orange-50 text-orange-700 border-orange-100';
         case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
         default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      }
   };

   if (isLoading) return (
      <div className="flex flex-col h-full items-center justify-center gap-6 bg-slate-50">
         <Loader2 className="animate-spin text-primary-600" size={48} />
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Risk Core...</p>
      </div>
   );

   return (
      <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Risk <span className="text-rose-600">Terminal</span></h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">Regulatory Compliance & Safeguarding Oversight</p>
            </div>

            <div className="flex gap-4">
               <div className="hidden lg:flex items-center gap-6 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm pr-6">
                  <div className="flex items-center gap-3 ml-4">
                     <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Critical Vectors</span>
                     <span className="text-lg font-black text-slate-900 tracking-tight">{incidents.filter(i => i.severity === 'Critical').length}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100"></div>
                  <div className="flex items-center gap-3">
                     <Activity size={18} className="text-indigo-500" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Audit</span>
                     <span className="text-lg font-black text-slate-900 tracking-tight">{incidents.filter(i => i.status !== 'Resolved').length}</span>
                  </div>
               </div>

               <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-5 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95">
                  <Plus size={24} /> Report New Incident
               </button>
            </div>
         </div>

         <div className="flex-1 flex gap-10 overflow-hidden">
            {/* Left: Incident List */}
            <div className={`w-full md:w-[400px] bg-white rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden ${selectedIncident ? 'hidden md:flex' : 'flex'}`}>
               <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                  <div className="relative">
                     <Search className="absolute left-6 top-5 text-slate-400" size={20} />
                     <input
                        type="text"
                        placeholder="Search Risk Ledger..."
                        className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-300 transition-all shadow-sm"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
                  {incidents.length === 0 ? (
                     <div className="p-20 text-center flex flex-col items-center">
                        <ShieldAlert size={48} className="text-slate-100 mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Risk Ledger Empty</p>
                     </div>
                  ) : incidents.map(inc => (
                     <div
                        key={inc.id}
                        onClick={() => {
                           setSelectedIncident(inc);
                           toast.info(`Analyzing incident protocol ${inc.id.substring(0, 8)}`);
                        }}
                        className={`mx-4 p-6 mb-2 rounded-[2rem] border transition-all cursor-pointer group
                        ${selectedIncident?.id === inc.id ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white border-transparent hover:bg-slate-50'}
                     `}
                     >
                        <div className="flex justify-between items-start mb-4">
                           <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${getSeverityColor(inc.severity)}`}>
                              {inc.severity}
                           </span>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${selectedIncident?.id === inc.id ? 'text-slate-500' : 'text-slate-300'}`}>
                              {new Date(inc.date).toLocaleDateString()}
                           </span>
                        </div>
                        <h3 className={`font-black text-base uppercase tracking-tight mb-2 ${selectedIncident?.id === inc.id ? 'text-white' : 'text-slate-900'}`}>{inc.type} Incident</h3>
                        <p className={`text-xs font-bold line-clamp-2 mb-4 ${selectedIncident?.id === inc.id ? 'text-slate-400' : 'text-slate-500'}`}>{inc.description}</p>
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-inner ${selectedIncident?.id === inc.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {inc.clientName[0]}
                           </div>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${selectedIncident?.id === inc.id ? 'text-slate-400' : 'text-slate-500'}`}>{inc.clientName}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Right: Detail View - Futuristic Terminal */}
            <div className={`flex-1 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative ${selectedIncident ? 'flex' : 'hidden md:flex'}`}>
               {selectedIncident ? (
                  <>
                     {/* Header Terminal */}
                     <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-slate-50/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                        <div className="relative z-10 flex items-center gap-8">
                           <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center text-white shadow-2xl">
                              <FileText size={40} className="mb-1" />
                           </div>
                           <div>
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{selectedIncident.type}</h2>
                                 <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase border-2 shadow-lg ${getSeverityColor(selectedIncident.severity)}`}>
                                    {selectedIncident.severity} Severity Vector
                                 </span>
                              </div>
                              <div className="flex flex-wrap gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <span className="flex items-center gap-2"><History size={14} className="text-slate-300" /> Identity: <strong className="text-slate-900">{selectedIncident.clientName}</strong></span>
                                 <span className="flex items-center gap-2">Staff Target: <strong className="text-slate-900">{selectedIncident.staffName}</strong></span>
                                 <span className="flex items-center gap-2">Epoch: <strong className="text-slate-900 tabular-nums">{new Date(selectedIncident.date).toLocaleString()}</strong></span>
                              </div>
                           </div>
                        </div>
                        <button
                           onClick={() => setSelectedIncident(null)}
                           className="p-4 bg-white hover:bg-rose-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-all shadow-sm active:scale-95"
                        >
                           <X size={24} />
                        </button>
                     </div>

                     {/* Content Hub */}
                     <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                           <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
                           <h3 className="text-[10px] font-black text-rose-500 mb-6 uppercase tracking-[0.4em] flex items-center gap-3">
                              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                              Incident Narrative
                           </h3>
                           <p className="text-white text-lg font-bold leading-relaxed">{selectedIncident.description}</p>
                        </div>

                        {/* Investigation Integrated terminal */}
                        <div className="space-y-8">
                           <div className="flex items-center gap-4 mb-2">
                              <div className="p-3 bg-indigo-50 rounded-2xl">
                                 <Microscope className="text-indigo-600" size={28} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Diagnostic Investigation</h3>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Root Cause & Preventive Logic</p>
                              </div>
                           </div>

                           {selectedIncident.rootCause ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-500">
                                 <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-8 shadow-xl hover:border-indigo-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-6">
                                       <div className="p-2 bg-indigo-50 rounded-xl">
                                          <Landmark size={18} className="text-indigo-600" />
                                       </div>
                                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Root Cause Logic</span>
                                    </div>
                                    <p className="text-slate-900 text-base font-black leading-snug tracking-tight">{selectedIncident.rootCause}</p>
                                 </div>

                                 <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-8 shadow-xl hover:border-green-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-6">
                                       <div className="p-2 bg-green-50 rounded-xl">
                                          <ShieldCheck size={18} className="text-green-600" />
                                       </div>
                                       <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em]">Remediative Action</span>
                                    </div>
                                    <p className="text-slate-800 text-sm font-bold leading-relaxed">{selectedIncident.actionsTaken}</p>
                                 </div>

                                 <div className="bg-slate-900 lg:col-span-2 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                                    <div className="flex items-center gap-3 mb-6">
                                       <div className="p-2 bg-indigo-600 rounded-xl">
                                          <Brain size={18} className="text-white" />
                                       </div>
                                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI Strategy & Analytics</span>
                                    </div>
                                    <p className="text-white text-sm font-bold leading-relaxed border-l-4 border-indigo-600 pl-8 ml-2">{selectedIncident.investigationNotes}</p>

                                    {selectedIncident.reportedToCQC && (
                                       <div className="mt-10 flex items-center gap-4 bg-rose-500 p-6 rounded-[1.5rem] shadow-2xl">
                                          <AlertTriangle size={24} className="text-white animate-bounce" />
                                          <div>
                                             <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Mandatory Regulatory Notification</p>
                                             <p className="text-white font-black text-sm uppercase">Formalized with Regulator (CQC/Integrated Care)</p>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ) : (
                              <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                                 <ShieldAlert className="text-slate-200 mb-8" size={80} />
                                 <p className="text-slate-400 font-bold max-w-sm mb-10 text-sm">Diagnostic sequence not yet initialized. Evidence requires neural processing for root cause identification.</p>
                                 <button
                                    onClick={handleInvestigate}
                                    disabled={isAnalyzing}
                                    className="px-12 py-6 bg-slate-900 text-white rounded-[1.75rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 group disabled:opacity-30 disabled:cursor-not-allowed"
                                 >
                                    {isAnalyzing ? <Loader2 className="animate-spin" size={24} /> : <Brain className="group-hover:rotate-12 transition-transform" size={24} />}
                                    {isAnalyzing ? 'Processing Clinical Model...' : 'Trigger AI Neural Diagnostic'}
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Footer Terminal Actions */}
                     <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-end gap-6">
                        {selectedIncident.status !== 'Closed' && (
                           <button className="px-10 py-5 bg-green-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.25rem] hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3">
                              <CheckCircle2 size={18} /> Finalize Case Archive
                           </button>
                        )}
                        <button className="px-10 py-5 bg-white border border-slate-200 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.25rem] hover:bg-slate-50 transition-all">Download Protocol PDF</button>
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                     <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                        <Activity size={48} className="text-slate-200" />
                     </div>
                     <h2 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Null Selection</h2>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4 max-w-xs">Select an active incident vector from the risk ledger to initiate analysis</p>
                  </div>
               )}
            </div>
         </div>

         {/* Futuristic Report Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6">
               <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-none">
                  <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Incident Protocol</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-2">
                           <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                           Initiating Regulatory Report Capture
                        </p>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"><X size={24} className="text-slate-400" /></button>
                  </div>

                  <form onSubmit={handleCreateIncident} className="p-12 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Clinical Identity Involved</label>
                           <select
                              required
                              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                              value={formData.clientId}
                              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                           >
                              <option value="">Search Profiles...</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Incident Taxonomy</label>
                           <select
                              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                              value={formData.type}
                              onChange={e => setFormData({ ...formData, type: e.target.value })}
                           >
                              <option>Fall</option>
                              <option>Medication Error</option>
                              <option>Safeguarding</option>
                              <option>Injury</option>
                              <option>Behavioral</option>
                              <option>Other</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Risk Severity Vector</label>
                           <select
                              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                              value={formData.severity}
                              onChange={e => setFormData({ ...formData, severity: e.target.value })}
                           >
                              <option>Low</option>
                              <option>Medium</option>
                              <option>High</option>
                              <option>Critical</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Incident Epoch (UTC)</label>
                           <input
                              type="datetime-local"
                              required
                              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all tabular-nums"
                              value={formData.date}
                              onChange={e => setFormData({ ...formData, date: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Clinical Observation Feed</label>
                        <textarea
                           required
                           rows={4}
                           className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none shadow-inner"
                           placeholder="Document exhaustive details of the sequence of events..."
                           value={formData.description}
                           onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                     </div>

                     <div className="pt-6 flex justify-end gap-6">
                        <button
                           type="button"
                           onClick={() => setIsModalOpen(false)}
                           className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-[1.5rem] transition-all"
                        >
                           Abort Report
                        </button>
                        <button
                           type="submit"
                           className="px-12 py-5 bg-rose-600 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-[1.5rem] hover:bg-black shadow-2xl shadow-rose-600/20 active:scale-95 transition-all"
                        >
                           Finalize Pulse Emission
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default IncidentsPage;
