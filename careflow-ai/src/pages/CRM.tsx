
import React, { useState, useEffect } from 'react';
import {
   PhoneIncoming, User, Calendar, Clock, PoundSterling,
   ArrowRight, Sparkles, Loader2, CheckCircle2, X,
   MoreHorizontal, Phone, Mail, AlertCircle, Target, TrendingUp, Briefcase, ChevronRight, Activity, Brain
} from 'lucide-react';
import { enquiryService } from '../services/supabaseService';
import { Enquiry, EnquiryStatus, EnquiryAnalysis } from '../types';
import { analyzeEnquiry } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const CRM: React.FC = () => {
   const { profile } = useAuth();
   const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
   const [analysis, setAnalysis] = useState<EnquiryAnalysis | null>(null);
   const [isAnalyzing, setIsAnalyzing] = useState(false);

   useEffect(() => {
      async function loadEnquiries() {
         setLoading(true);
         try {
            const data = await enquiryService.getAll(profile?.tenant_id);
            if (data.length > 0) {
               const mapped = data.map((e: any) => ({
                  id: e.id,
                  prospectName: e.prospectName || 'Unknown',
                  contactName: e.contactName || 'Unknown',
                  contactPhone: e.contactPhone || 'N/A',
                  contactEmail: e.contactEmail || null,
                  receivedDate: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'Recent',
                  source: e.source || 'Direct',
                  status: (e.status || 'New') as EnquiryStatus,
                  initialNotes: e.careNeeds || e.notes || '',
                  estimatedValue: e.estimatedWeeklyHours ? e.estimatedWeeklyHours * 20 : null
               }));
               setEnquiries(mapped);
            } else {
               // Default demo enquiries
               const demoEnquiries: Enquiry[] = [
                  { id: '1', prospectName: 'Mrs. Johnson', contactName: 'Sarah Johnson (Daughter)', contactPhone: '07712 345678', contactEmail: null, receivedDate: 'Today', source: 'Website', status: 'New' as EnquiryStatus, initialNotes: 'Looking for live-in care for mother with dementia. Needs 24/7 supervision.', estimatedValue: 650 },
                  { id: '2', prospectName: 'Mr. Williams', contactName: 'Social Worker', contactPhone: '0151 123 4567', contactEmail: null, receivedDate: 'Yesterday', source: 'Referral', status: 'Contacted' as EnquiryStatus, initialNotes: 'Hospital discharge - needs twice daily visits for medication management.', estimatedValue: 280 }
               ];
               setEnquiries(demoEnquiries);
            }
         } catch (error) {
            toast.error('Pipeline synchronization failure');
            setEnquiries([]);
         } finally {
            setLoading(false);
         }
      }
      loadEnquiries();
   }, [profile?.tenant_id]);

   // Handlers
   const updateStatus = async (id: string, status: EnquiryStatus) => {
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      toast.success(`Pipeline state updated to ${status}`);
   };

   const handleAnalyze = async (enquiry: Enquiry) => {
      setIsAnalyzing(true);
      setAnalysis(null);
      const analysisToast = toast.loading('Initializing neural lead assessment...');
      try {
         const result = await analyzeEnquiry(enquiry.initialNotes);
         setAnalysis(result);
         toast.success('Lead Analysis Complete', { id: analysisToast });
      } catch (error) {
         toast.error('Neural Logic Error', { id: analysisToast });
      } finally {
         setIsAnalyzing(false);
      }
   };

   const getStatusColor = (status: EnquiryStatus) => {
      switch (status) {
         case 'New': return 'bg-blue-50 text-blue-700 border-blue-100 shadow-[0_4px_10px_rgba(59,130,246,0.1)]';
         case 'Contacted': return 'bg-purple-50 text-purple-700 border-purple-100';
         case 'Assessment': return 'bg-amber-50 text-amber-700 border-amber-100';
         case 'Quote': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
         case 'Won': return 'bg-green-50 text-green-700 border-green-100 shadow-[0_4px_10px_rgba(34,197,94,0.1)]';
         case 'Lost': return 'bg-slate-50 text-slate-500 border-slate-200';
         default: return 'bg-slate-50 text-slate-700';
      }
   };

   const renderPipelineList = () => (
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-3">
         {enquiries.map(enq => (
            <div
               key={enq.id}
               onClick={() => {
                  setSelectedEnquiry(enq);
                  setAnalysis(null);
                  toast.info(`Opening protocol: ${enq.prospectName}`);
               }}
               className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden
             ${selectedEnquiry?.id === enq.id ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:bg-slate-50'}
           `}
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                     <h3 className={`font-black text-base uppercase tracking-tight ${selectedEnquiry?.id === enq.id ? 'text-white' : 'text-slate-900'}`}>{enq.prospectName}</h3>
                     <p className={`text-[10px] font-black uppercase tracking-widest ${selectedEnquiry?.id === enq.id ? 'text-slate-500' : 'text-slate-400'}`}>Contact: {enq.contactName}</p>
                  </div>
                  <span className={`text-[8px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.2em] ${selectedEnquiry?.id === enq.id ? 'bg-white/10 text-white border-white/20' : getStatusColor(enq.status)}`}>
                     {enq.status}
                  </span>
               </div>
               <p className={`text-xs font-bold mb-4 line-clamp-2 ${selectedEnquiry?.id === enq.id ? 'text-slate-400' : 'text-slate-500'}`}>{enq.initialNotes}</p>
               <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest">
                  <span className={`flex items-center gap-2 ${selectedEnquiry?.id === enq.id ? 'text-slate-500' : 'text-slate-400'}`}><Calendar size={12} /> {enq.receivedDate}</span>
                  {enq.estimatedValue && (
                     <span className="flex items-center gap-2 font-black text-green-500"><PoundSterling size={12} /> £{enq.estimatedValue}/wk</span>
                  )}
               </div>
            </div>
         ))}
      </div>
   );

   return (
      <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Intake <span className="text-primary-600">Command</span></h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">CRM & Clinical Lead Conversion Matrix</p>
            </div>
            <div className="flex gap-4">
               <div className="hidden lg:flex items-center gap-6 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm pr-8">
                  <div className="flex items-center gap-4 ml-6">
                     <div className="p-3 bg-green-50 text-green-600 rounded-2xl shadow-inner"><TrendingUp size={20} /></div>
                     <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pipeline Value</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">£1,650<span className="text-[10px] text-slate-300">/wk</span></p>
                     </div>
                  </div>
               </div>
               <button className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95">
                  <PhoneIncoming size={24} /> Register New Enquiry
               </button>
            </div>
         </div>

         <div className="flex-1 flex gap-10 overflow-hidden">
            {/* Left: Pipeline List */}
            <div className={`w-full md:w-[400px] bg-white rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden ${selectedEnquiry ? 'hidden md:flex' : 'flex'}`}>
               <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3">
                     <Target size={18} className="text-primary-600" />
                     Operational Stream
                  </h3>
               </div>
               {renderPipelineList()}
            </div>

            {/* Right: Detail View - Futuristic CRM Hub */}
            <div className={`flex-1 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative ${selectedEnquiry ? 'flex' : 'hidden md:flex'}`}>
               {selectedEnquiry ? (
                  <>
                     <div className="p-12 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-slate-50/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                        <div className="relative z-10 flex items-center gap-8">
                           <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl">
                              <User size={40} />
                           </div>
                           <div>
                              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">{selectedEnquiry.prospectName}</h2>
                              <div className="flex flex-wrap gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <span className="flex items-center gap-2"><User size={14} className="text-primary-500" /> Authorized Contact: <strong className="text-slate-900">{selectedEnquiry.contactName}</strong></span>
                                 <span className="flex items-center gap-2"><Phone size={14} className="text-primary-500" /> Comm Vector: <strong className="text-slate-900 tabular-nums">{selectedEnquiry.contactPhone}</strong></span>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => setSelectedEnquiry(null)} className="p-4 bg-white hover:bg-rose-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-all shadow-sm active:scale-95">
                           <X size={24} />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                        {/* Notes Hub */}
                        <div className="bg-white p-10 border-2 border-slate-50 rounded-[2.5rem] shadow-xl hover:border-primary-100 transition-all">
                           <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.4em] flex items-center gap-3">
                              <Activity size={18} className="text-primary-600" />
                              Initial Care Mandate
                           </h3>
                           <p className="text-slate-900 text-lg font-black leading-relaxed tracking-tight underline decoration-primary-500/10 decoration-8 underline-offset-[-2px]">{selectedEnquiry.initialNotes}</p>
                        </div>

                        {/* AI Intake Diagnostic Hub */}
                        <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                           <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                           <div className="flex justify-between items-center mb-10">
                              <h3 className="text-[10px] font-black text-indigo-400 flex items-center gap-3 uppercase tracking-[0.4em]">
                                 <Brain size={24} className="text-indigo-400" />
                                 Neural Intake Assistant
                              </h3>
                              {!analysis && (
                                 <button
                                    onClick={() => handleAnalyze(selectedEnquiry)}
                                    disabled={isAnalyzing}
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
                                 >
                                    {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    Analyze Conversion Potential
                                 </button>
                              )}
                           </div>

                           {analysis ? (
                              <div className="space-y-10 animate-in zoom-in duration-500">
                                 <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] border-l-4 border-l-indigo-600">
                                    <p className="text-white text-lg font-black italic tracking-tight italic opacity-90 leading-relaxed">"{analysis.summary}"</p>
                                 </div>

                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
                                       <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Care Complexity</p>
                                       <p className="font-black text-white text-lg uppercase tracking-tight">{analysis.careLevel}</p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
                                       <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Capacity Vector</p>
                                       <p className="font-black text-white text-lg uppercase tracking-tight">{analysis.estimatedHours}h Pulse</p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
                                       <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Urgency Matrix</p>
                                       <p className={`font-black text-lg uppercase tracking-tight ${analysis.urgency === 'High' ? 'text-rose-500' : 'text-green-500'}`}>{analysis.urgency}</p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
                                       <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Funding Profile</p>
                                       <p className="font-black text-white text-lg uppercase tracking-tight">{analysis.fundingSource}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-start gap-5 bg-indigo-600/20 p-8 rounded-[2rem] border border-indigo-500/30">
                                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-2xl"><CheckCircle2 size={24} className="text-white" /></div>
                                    <div className="space-y-1">
                                       <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Strategy Recommendation:</p>
                                       <p className="text-white font-black text-base opacity-90 leading-normal">{analysis.suggestedAction}</p>
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="text-center py-20 flex flex-col items-center gap-6">
                                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <Brain size={40} className="text-slate-700" />
                                 </div>
                                 <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs max-w-sm">Neural Engine IDLE. Trigger analysis to estimate fiscal potential and clinical suitability.</p>
                              </div>
                           )}
                        </div>

                        {/* Pipeline Stage Matrix */}
                        <div className="space-y-6">
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">
                              <Briefcase size={18} className="text-primary-600" />
                              Conversion Vector Selection
                           </h3>
                           <div className="flex flex-wrap bg-slate-50 rounded-[2.5rem] p-2 border border-slate-100 shadow-inner">
                              {['New', 'Contacted', 'Assessment', 'Quote', 'Won', 'Lost'].map((stage) => (
                                 <button
                                    key={stage}
                                    onClick={() => updateStatus(selectedEnquiry.id, stage as EnquiryStatus)}
                                    className={`flex-1 min-w-[120px] py-6 text-[10px] font-black uppercase tracking-widest rounded-[2rem] transition-all ${selectedEnquiry.status === stage
                                       ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]'
                                       : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
                                       }`}
                                 >
                                    {stage}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-end gap-6">
                        <button className="px-10 py-5 bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.25rem] hover:bg-slate-50 transition-all flex items-center gap-3">
                           <Mail size={18} /> Transmit Document
                        </button>
                        <button className="px-10 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.25rem] hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3">
                           <Calendar size={18} /> Authorize Clinical Assessment
                        </button>
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-6">
                     <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center shadow-inner">
                        <PhoneIncoming size={48} className="text-slate-200" />
                     </div>
                     <h2 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Null Pipeline Selection</h2>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest max-w-xs">Select an active intake enquiry to initiate neural processing and conversion logic.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default CRM;
