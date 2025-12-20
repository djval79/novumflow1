
import React, { useState, useEffect } from 'react';
import {
   ClipboardCheck, Plus, Search, FileText, CheckCircle2,
   AlertCircle, Sparkles, Loader2, Calendar, ChevronRight, Play,
   Save, X, Zap, Target, History, ShieldAlert, Cpu
} from 'lucide-react';
import { formService } from '../services/supabaseService';
import { FormTemplate, FormSubmission } from '../types';
import { generateFormTemplate } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { toast } from 'sonner';

const FormsPage: React.FC = () => {
   const { user } = useAuth();
   const { currentTenant } = useTenant();
   const [activeTab, setActiveTab] = useState<'library' | 'submissions'>('library');
   const [templates, setTemplates] = useState<FormTemplate[]>([]);
   const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   const [isGenerating, setIsGenerating] = useState(false);
   const [generationPrompt, setGenerationPrompt] = useState('');
   const [showGenerator, setShowGenerator] = useState(false);

   const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
   const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});

   useEffect(() => {
      if (currentTenant) {
         loadData();
      }
   }, [currentTenant, activeTab]);

   const loadData = async () => {
      setIsLoading(true);
      try {
         if (activeTab === 'library') {
            const data = await formService.getTemplates();
            setTemplates(data);
         } else {
            const data = await formService.getSubmissions();
            setSubmissions(data);
         }
      } catch (error) {
         toast.error("Bridge failure: Could not retrieve audit data");
      } finally {
         setIsLoading(false);
      }
   };

   const handleGenerateForm = async () => {
      if (!generationPrompt.trim() || !currentTenant) return;
      setIsGenerating(true);
      const genToast = toast.loading('Calibrating Neural Form Synthesis...');
      try {
         const newTemplate = await generateFormTemplate(generationPrompt);

         await formService.createTemplate({
            tenantId: currentTenant.id,
            title: newTemplate.title,
            category: newTemplate.category,
            questions: newTemplate.questions
         });

         toast.success("Audit Manifest Synthesized and Archived", { id: genToast });
         setShowGenerator(false);
         setGenerationPrompt('');

         const data = await formService.getTemplates();
         setTemplates(data);

      } catch (error) {
         toast.error("Synthesis Failure", { id: genToast });
      } finally {
         setIsGenerating(false);
      }
   };

   const handleStartAudit = (template: FormTemplate) => {
      setActiveTemplate(template);
      setFormAnswers({});
      toast.info(`Initializing Audit Sequence: ${template.title}`);
   };

   const handleSubmitAudit = async () => {
      if (!activeTemplate || !user || !currentTenant) return;

      const hasFailures = Object.entries(formAnswers).some(([k, v]) => v === false);
      const status = hasFailures ? 'Flagged' : 'Submitted';
      const subToast = toast.loading('Dispatching Audit Telemetry...');

      try {
         await formService.submitForm({
            tenantId: currentTenant.id,
            formName: activeTemplate.title,
            formType: activeTemplate.category,
            responses: formAnswers,
            status: status
         });

         toast.success("Audit Payload Securely Arrived", { id: subToast });
         setActiveTemplate(null);
         setActiveTab('submissions');
         loadData();
      } catch (error) {
         toast.error("Telemetry Dispatch Failure", { id: subToast });
      }
   };

   const updateAnswer = (qId: string, value: any) => {
      setFormAnswers(prev => ({ ...prev, [qId]: value }));
   };

   const renderLibrary = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-5">
         <div
            onClick={() => setShowGenerator(true)}
            className="bg-slate-900 border-4 border-white border-dashed text-white rounded-[4rem] shadow-2xl flex flex-col items-center justify-center p-12 group h-[300px] relative overflow-hidden cursor-pointer active:scale-95 transition-all"
         >
            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
            <div className="p-8 bg-white/10 rounded-[2.5rem] mb-6 group-hover:bg-primary-600 transition-all duration-500 relative z-10 shadow-2xl">
               <Sparkles size={48} className="text-white" />
            </div>
            <span className="font-black uppercase tracking-[0.5em] text-[12px] relative z-10">AI Neural Builder</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] mt-2 relative z-10 text-slate-500">Synthesize Audit Protocol</span>
         </div>

         {templates.map(tpl => (
            <div key={tpl.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col justify-between hover:shadow-primary-500/10 transition-all group h-[300px] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-[60px] -mr-16 -mt-16" />
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className={`p-5 rounded-[1.75rem] shadow-xl ${tpl.category === 'Safety' ? 'bg-rose-900 text-rose-400' : 'bg-primary-900 text-primary-400'}`}>
                        <ClipboardCheck size={32} />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widestAlpha bg-slate-50 text-slate-400 px-4 py-2 rounded-xl border border-slate-100">{tpl.category}</span>
                  </div>
                  <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase leading-none mb-2">{tpl.title}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tpl.questions.length} Reactive Nodes • Tier 1 Protocol</p>
               </div>
               <button
                  onClick={() => handleStartAudit(tpl)}
                  className="w-full mt-8 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-[2rem] hover:bg-black flex items-center justify-center gap-6 transition-all shadow-xl active:scale-95 relative z-10"
               >
                  <Play size={20} className="text-primary-500" /> Initialize
               </button>
            </div>
         ))}
      </div>
   );

   const renderSubmissions = () => (
      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5">
         <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-50">
               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                  <th className="px-12 py-10 font-black">Audit Manifest</th>
                  <th className="px-12 py-10 font-black">Operator Node</th>
                  <th className="px-12 py-10 font-black">Epoch Cycle</th>
                  <th className="px-12 py-10 font-black">Integrity Status</th>
                  <th className="px-12 py-10 font-black text-right">Telemetry</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-all group">
                     <td className="px-12 py-8 font-black text-slate-900 text-lg uppercase tracking-tight group-hover:text-primary-600 transition-colors">{sub.templateTitle}</td>
                     <td className="px-12 py-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-[10px] font-black uppercase shadow-xl">
                              {(sub.submittedBy || 'U').charAt(0)}
                           </div>
                           <span className="text-[11px] font-black text-slate-700 uppercase tracking-widestAlpha">{sub.submittedBy || 'Unknown Engine'}</span>
                        </div>
                     </td>
                     <td className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                     <td className="px-12 py-8">
                        <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center w-fit gap-3 shadow-xl ${sub.status === 'Flagged' ? 'bg-rose-900 text-rose-400 border border-rose-500' : 'bg-emerald-900 text-emerald-400 border border-emerald-500'
                           }`}>
                           {sub.status === 'Flagged' ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                           {sub.status === 'Flagged' ? 'HAZARD DETECTED' : 'CLEAR'}
                        </span>
                     </td>
                     <td className="px-12 py-8 text-right">
                        <button className="p-4 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-white rounded-2xl transition-all shadow-sm hover:shadow-xl"><History size={20} /></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         {submissions.length === 0 && <div className='p-20 text-center grayscale opacity-10 flex flex-col items-center gap-10'>
            <FileText size={100} className="text-slate-900" />
            <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Submission Ledger</p>
         </div>}
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Quality <span className="text-primary-600">Core</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Neural Audits • Safety Manifests • Clinical Integrity Tracking
               </p>
            </div>
         </div>

         {/* Navigation Deck */}
         <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
            <button
               onClick={() => {
                  setActiveTab('library');
                  toast.info('Accessing Protocol Library Spectrum');
               }}
               className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'library' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <FileText size={20} /> Protocol Library
            </button>
            <button
               onClick={() => {
                  setActiveTab('submissions');
                  toast.info('Accessing Submission Ledger Spectrum');
               }}
               className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'submissions' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <CheckCircle2 size={20} /> Submission Ledger
            </button>
         </div>

         <div className="flex-1">
            {activeTab === 'library' && (isLoading ? <div className="flex flex-col items-center justify-center h-64 gap-6 grayscale opacity-20"><Loader2 className="animate-spin text-slate-900" size={48} /><p className="font-black tracking-[0.5em] text-[10px]">Retrieving Manifests...</p></div> : renderLibrary())}
            {activeTab === 'submissions' && (isLoading ? <div className="flex flex-col items-center justify-center h-64 gap-6 grayscale opacity-20"><Loader2 className="animate-spin text-slate-900" size={48} /><p className="font-black tracking-[0.5em] text-[10px]">Retrieving Ledger...</p></div> : renderSubmissions())}
         </div>

         {/* AI Generator Modal */}
         {showGenerator && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-2xl">
               <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] p-16 animate-in zoom-in-95 duration-500 relative border border-white/20">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none flex items-center gap-6">
                        <Sparkles className="text-primary-600" size={40} /> Neural Builder
                     </h3>
                     <button onClick={() => setShowGenerator(false)} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-white rounded-full transition-all shadow-xl"><X size={32} /></button>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widestAlpha mb-10 leading-relaxed max-w-lg">Describe the audit framework required (E.G. "Clinical Waste Protocol" or "Domiciliary Safety Alpha") for neural synthesis.</p>

                  <div className="relative mb-12">
                     <Target className="absolute left-8 top-10 text-slate-200" size={24} />
                     <textarea
                        className="w-full pl-20 pr-10 py-10 bg-slate-50 border-4 border-slate-50 rounded-[3rem] h-[250px] focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 text-lg uppercase tracking-tight placeholder:text-slate-200 shadow-inner"
                        placeholder="E.G. SYNTHESIZE MEDICATIONS SPOT CHECK PROTOCOL..."
                        value={generationPrompt}
                        onChange={(e) => setGenerationPrompt(e.target.value)}
                     />
                  </div>

                  <button
                     onClick={handleGenerateForm}
                     disabled={isGenerating || !generationPrompt}
                     className="w-full py-8 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-[2.5rem] hover:bg-black flex items-center justify-center gap-6 disabled:opacity-30 shadow-2xl active:scale-95 transition-all"
                  >
                     {isGenerating ? <Loader2 className="animate-spin text-primary-500" size={24} /> : <Sparkles size={24} className="text-primary-500" />}
                     {isGenerating ? 'Synthesizing...' : 'Deploy Synthesis'}
                  </button>
               </div>
            </div>
         )}

         {/* Form Runner Modal */}
         {activeTemplate && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-2xl">
               <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[5rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
                  <div className="p-16 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center relative z-20">
                     <div className="flex items-center gap-8">
                        <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl"><Target size={40} className="text-primary-500" /></div>
                        <div className="space-y-1">
                           <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTemplate.title}</h3>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">{activeTemplate.category} Integration Protocol</span>
                        </div>
                     </div>
                     <button onClick={() => {
                        setActiveTemplate(null);
                        toast.warning('Audit sequence aborted. No data archived.');
                     }} className="p-4 bg-white/20 hover:bg-white text-slate-300 hover:text-slate-900 rounded-full transition-all shadow-xl"><X size={32} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-16 space-y-10 bg-white scrollbar-hide relative z-10">
                     <div className="absolute inset-0 bg-grid-slate-900/[0.01] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                     {activeTemplate.questions.map((q, idx) => (
                        <div key={idx} className="bg-slate-50/50 p-12 rounded-[3.5rem] border-2 border-slate-50 shadow-inner relative z-10 hover:bg-white hover:shadow-2xl transition-all group/q">
                           <label className="block font-black text-slate-900 text-xl uppercase tracking-tight mb-8 leading-tight group-hover/q:text-primary-600 transition-colors">
                              <span className="text-slate-200 mr-4 tabular-nums">0{idx + 1}.</span>
                              {q.text}
                           </label>

                           {q.type === 'Text' && (
                              <div className="relative">
                                 <Cpu className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                 <input
                                    type="text"
                                    className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widestAlpha focus:border-primary-500 outline-none transition-all shadow-sm"
                                    placeholder="ARCHIVE OBSERVATION DETAILS..."
                                    onChange={(e) => updateAnswer(q.id || `q${idx}`, e.target.value)}
                                 />
                              </div>
                           )}

                           {q.type === 'YesNo' && (
                              <div className="flex gap-8">
                                 <button
                                    onClick={() => {
                                       updateAnswer(q.id || `q${idx}`, true);
                                       toast.success(`Node 0${idx + 1} logic: PASS`, { position: 'bottom-center' });
                                    }}
                                    className={`flex-1 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] border-4 transition-all shadow-xl ${formAnswers[q.id || `q${idx}`] === true ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-50 hover:border-emerald-500 hover:text-emerald-500'}`}
                                 >
                                    YES / CLEAR
                                 </button>
                                 <button
                                    onClick={() => {
                                       updateAnswer(q.id || `q${idx}`, false);
                                       toast.error(`Node 0${idx + 1} logic: HAZARD`, { position: 'bottom-center' });
                                    }}
                                    className={`flex-1 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] border-4 transition-all shadow-xl ${formAnswers[q.id || `q${idx}`] === false ? 'bg-rose-600 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-50 hover:border-rose-500 hover:text-rose-500'}`}
                                 >
                                    NO / HAZARD
                                 </button>
                              </div>
                           )}

                           {q.type === 'Rating' && (
                              <div className="flex justify-between gap-4">
                                 {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                       key={num}
                                       onClick={() => {
                                          updateAnswer(q.id || `q${idx}`, num);
                                          toast.info(`Node 0${idx + 1} score: ${num}`, { position: 'bottom-center' });
                                       }}
                                       className={`flex-1 py-6 rounded-2xl font-black text-lg border-4 transition-all shadow-lg ${formAnswers[q.id || `q${idx}`] === num ? 'bg-slate-900 text-primary-500 border-slate-900' : 'bg-white text-slate-300 border-slate-50 hover:border-primary-500 hover:text-primary-600'}`}
                                    >
                                       {num}
                                    </button>
                                 ))}
                              </div>
                           )}

                           {q.type === 'Date' && (
                              <div className="relative">
                                 <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                 <input
                                    type="date"
                                    className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widestAlpha focus:border-primary-500 outline-none transition-all shadow-sm"
                                    onChange={(e) => updateAnswer(q.id || `q${idx}`, e.target.value)}
                                 />
                              </div>
                           )}
                        </div>
                     ))}
                  </div>

                  <div className="p-12 border-t border-slate-50 bg-slate-50/20 flex justify-end gap-10 relative z-20">
                     <button
                        onClick={() => setActiveTemplate(null)}
                        className="px-12 py-6 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] hover:text-slate-900 transition-all active:scale-95"
                     >
                        De-initialize
                     </button>
                     <button
                        onClick={handleSubmitAudit}
                        className="px-16 py-6 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-[2rem] hover:bg-black flex items-center gap-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] active:scale-95 group/submit"
                     >
                        <CheckCircle2 size={24} className="text-primary-500 group-hover/submit:scale-125 transition-transform" /> Commit Audit Manifest
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default FormsPage;
