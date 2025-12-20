
import React, { useState } from 'react';
import {
   Building2, ShieldCheck, CreditCard, BookOpen, Plus, Trash2,
   Save, Sparkles, Loader2, FileText, Download, Users, Mail, Zap, Target, ArrowRight, Shield, Globe, History
} from 'lucide-react';
import { generatePolicyDocument } from '../services/geminiService';
import EmailTemplateCustomizer from '../components/EmailTemplateCustomizer';
import { toast } from 'sonner';

const Settings: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'general' | 'compliance' | 'finance' | 'policies' | 'emails'>('compliance');

   const [trainingModules, setTrainingModules] = useState([
      { id: 1, name: 'DBS Check', renewal: 36, required: true },
      { id: 2, name: 'Safeguarding Adults L2', renewal: 12, required: true },
      { id: 3, name: 'Manual Handling', renewal: 12, required: true },
      { id: 4, name: 'Medication Administration', renewal: 12, required: true },
      { id: 5, name: 'Fire Safety', renewal: 24, required: false },
   ]);
   const [newModule, setNewModule] = useState('');

   const [isGenerating, setIsGenerating] = useState(false);
   const [generatedPolicy, setGeneratedPolicy] = useState<string | null>(null);

   const toggleRequired = (id: number, name: string) => {
      setTrainingModules(prev => prev.map(m => m.id === id ? { ...m, required: !m.required } : m));
      toast.info(`Compliance protocol updated: ${name}`);
   };

   const deleteModule = (id: number, name: string) => {
      setTrainingModules(prev => prev.filter(m => m.id !== id));
      toast.warning(`Protocol decommissioned: ${name}`);
   };

   const addModule = () => {
      if (newModule.trim()) {
         setTrainingModules([...trainingModules, { id: Date.now(), name: newModule, renewal: 12, required: true }]);
         toast.success(`New compliance vector initialized: ${newModule}`);
         setNewModule('');
      }
   };

   const handleGeneratePolicy = async () => {
      setIsGenerating(true);
      const policyToast = toast.loading('Calibrating AI Policy Synthesis...');
      try {
         const requiredList = trainingModules.filter(m => m.required).map(m => m.name);
         const policy = await generatePolicyDocument(requiredList, "CareFlow AI Services");
         setGeneratedPolicy(policy);
         toast.success('Policy Manifest Generated', { id: policyToast });
      } catch (error) {
         toast.error('Synthesis Failure', { id: policyToast });
      } finally {
         setIsGenerating(false);
      }
   };

   const renderCompliance = () => (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 text-white flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
            <div className="p-6 bg-primary-600 text-white rounded-[2rem] shadow-2xl border-4 border-white/5 shrink-0 animate-pulse">
               <ShieldCheck size={32} />
            </div>
            <div className="space-y-2 relative z-10">
               <p className="text-xl font-black uppercase tracking-tighter leading-tight italic">"Active Compliance Matrix Control"</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">These configurations dictate the <span className="text-primary-400">Clinical Hazard Response</span> system across all staff identity nodes.</p>
            </div>
         </div>

         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden group">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                  <tr>
                     <th className="px-10 py-8">Training / Protocol Identifier</th>
                     <th className="px-10 py-8">Renewal Cycle</th>
                     <th className="px-10 py-8 text-center">Mandatory Tier</th>
                     <th className="px-10 py-8 text-right">Operational Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {trainingModules.map(m => (
                     <tr key={m.id} className="hover:bg-slate-50/50 transition-all group/row">
                        <td className="px-10 py-8 font-black text-slate-900 text-lg uppercase tracking-tight">{m.name}</td>
                        <td className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.renewal} Months Epoch</td>
                        <td className="px-10 py-8 text-center flex justify-center items-center h-full">
                           <button
                              onClick={() => toggleRequired(m.id, m.name)}
                              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all border-4 shadow-inner ${m.required ? 'bg-primary-600 border-primary-500/20' : 'bg-slate-200 border-slate-100'}`}
                           >
                              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-xl transition-all duration-300 ${m.required ? 'translate-x-[42px]' : 'translate-x-1.5'}`} />
                           </button>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <button onClick={() => deleteModule(m.id, m.name)} className="text-slate-300 hover:text-rose-600 p-4 rounded-2xl hover:bg-rose-50 transition-all shadow-sm hover:shadow-rose-100/50">
                              <Trash2 size={24} />
                           </button>
                        </td>
                     </tr>
                  ))}
                  <tr className="bg-slate-50/30">
                     <td className="px-10 py-8" colSpan={3}>
                        <div className="relative group/add">
                           <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover/add:text-primary-500 transition-colors" size={20} />
                           <input
                              type="text"
                              placeholder="Initialize New Compliance Vector..."
                              className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-50 rounded-[2rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-[11px] font-black text-slate-900 uppercase tracking-widestAlpha transition-all shadow-inner placeholder:text-slate-300"
                              value={newModule}
                              onChange={(e) => setNewModule(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addModule()}
                           />
                        </div>
                     </td>
                     <td className="px-10 py-8 text-right">
                        <button
                           onClick={addModule}
                           disabled={!newModule.trim()}
                           className="bg-slate-900 text-white px-10 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 disabled:opacity-20"
                        >
                           <Plus size={20} /> Deploy
                        </button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
   );

   const renderFinance = () => (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Staff Pay Rates */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl" />
               <h3 className="text-[10px] font-black text-slate-900 mb-10 uppercase tracking-[0.5em] flex items-center gap-4 relative z-10">
                  <Users size={24} className="text-primary-600" /> Operational Pay Matrix
               </h3>
               <div className="space-y-6 relative z-10">
                  {['Care Assistant', 'Senior Carer', 'Nurse', 'Coordinator'].map(role => (
                     <div key={role} className="flex justify-between items-center p-6 bg-slate-50/50 rounded-[1.75rem] border border-slate-50 hover:bg-white hover:shadow-xl transition-all group/cell">
                        <span className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover/cell:text-primary-600 transition-colors">{role}</span>
                        <div className="flex items-center gap-4">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">£ GPP/HR</span>
                           <input type="number" className="w-24 p-4 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black text-slate-900 focus:border-primary-500 transition-all outline-none shadow-inner text-right" defaultValue={role === 'Nurse' ? 25 : 12} />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Client Charge Rates */}
            <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group border border-white/5">
               <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
               <h3 className="text-[10px] font-black text-primary-400 mb-10 uppercase tracking-[0.5em] flex items-center gap-4 relative z-10">
                  <CreditCard size={24} className="text-primary-500" /> Fiscal Charge Manifest
               </h3>
               <div className="space-y-6 relative z-10">
                  {[
                     { name: 'Private (Weekday)', val: 28 },
                     { name: 'Private (Weekend)', val: 32 },
                     { name: 'Local Authority', val: 22.50 },
                     { name: 'NHS Continuing Care', val: 25 },
                  ].map(rate => (
                     <div key={rate.name} className="flex justify-between items-center p-6 bg-white/5 rounded-[1.75rem] border border-white/5 hover:bg-white/10 transition-all group/cell">
                        <span className="text-lg font-black text-white uppercase tracking-tight group-hover/cell:text-primary-400 transition-colors">{rate.name}</span>
                        <div className="flex items-center gap-4">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha">£ GPP/HR</span>
                           <input type="number" className="w-24 p-4 bg-slate-800 border-2 border-white/5 rounded-2xl text-[11px] font-black text-white focus:border-primary-500 transition-all outline-none shadow-inner text-right" defaultValue={rate.val.toFixed(2)} />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         <div className="flex justify-center pt-6">
            <button
               onClick={() => toast.success('Fiscal parameters synchronized with core')}
               className="px-16 py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_45px_100px_rgba(0,0,0,0.4)] hover:bg-black transition-all flex items-center gap-6 active:scale-95 group/save"
            >
               <Save size={28} className="text-primary-500 group-hover:scale-125 transition-transform" /> Commit Fiscal Lattice
            </button>
         </div>
      </div>
   );

   const renderPolicies = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-14rem)] pb-10">
         <div className="col-span-1 space-y-8 flex flex-col h-full">
            <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl space-y-10 relative overflow-hidden group border border-white/5 text-white flex flex-col justify-between">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
               <div className="space-y-6 relative z-10">
                  <div className="p-6 bg-primary-600 text-white rounded-[2rem] shadow-2xl border-4 border-white/10 shrink-0 w-fit mx-auto animate-bounce">
                     <Sparkles size={32} />
                  </div>
                  <div className="text-center space-y-2">
                     <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">AI Neural Writer</h3>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
                        Synthesize compliant <span className="text-primary-400">Clinical Protocol</span> documents automatically based on active matrix configurations.
                     </p>
                  </div>
               </div>
               <button
                  onClick={handleGeneratePolicy}
                  disabled={isGenerating}
                  className="w-full py-8 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-primary-50 transition-all flex items-center justify-center gap-6 disabled:opacity-30 shadow-2xl active:scale-95 relative z-10 group/btn"
               >
                  {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <FileText size={24} className="text-primary-600 group-hover/btn:rotate-6 transition-transform" />}
                  {isGenerating ? 'Synthesizing...' : 'Generate Manifest'}
               </button>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col flex-1">
               <div className="p-8 bg-slate-50/50 border-b border-slate-50 font-black text-slate-900 text-[10px] uppercase tracking-[0.6em] flex items-center gap-4">
                  <History size={18} className="text-primary-600" /> Archival Drafts
               </div>
               <div className="divide-y divide-slate-50 overflow-y-auto scrollbar-hide">
                  <div className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                     <div>
                        <p className="text-[12px] font-black text-slate-900 uppercase tracking-widestAlpha">Safeguarding_Protocol_v2</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">DEC 12, 2024 • RAW PDF</p>
                     </div>
                     <Download size={18} className="text-slate-200 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <div className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group border-b-0">
                     <div>
                        <p className="text-[12px] font-black text-slate-900 uppercase tracking-widestAlpha">Lone_Worker_Manifest_2023</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">NOV 04, 2024 • RAW PDF</p>
                     </div>
                     <Download size={18} className="text-slate-200 group-hover:text-primary-600 transition-colors" />
                  </div>
               </div>
            </div>
         </div>

         <div className="col-span-1 lg:col-span-2 bg-white rounded-[4.5rem] border border-slate-100 flex flex-col shadow-2xl overflow-hidden h-full group">
            <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
               <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em] flex items-center gap-4">
                     <Target size={24} className="text-primary-600" /> Manifest Visualizer
                  </h3>
               </div>
               {generatedPolicy && (
                  <button onClick={() => toast.success('Dispatching manifest to local storage')} className="p-4 bg-slate-900 text-white hover:bg-black transition-all rounded-3xl shadow-xl active:scale-90"><Download size={24} /></button>
               )}
            </div>
            <div className="flex-1 p-16 overflow-y-auto bg-slate-50/30 scrollbar-hide relative">
               <div className="absolute inset-0 bg-grid-slate-900/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
               {generatedPolicy ? (
                  <div className="prose prose-slate max-w-none relative z-10">
                     <div className="p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100 border-l-[16px] border-l-primary-600 font-bold text-slate-700 leading-loose uppercase tracking-tight text-sm">
                        {generatedPolicy}
                     </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-10 opacity-10 grayscale">
                     <BookOpen size={128} className="text-slate-900" />
                     <p className="font-black uppercase tracking-[0.8em] text-[14px]">Simulation Null</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-12 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Lattice <span className="text-primary-600">Config</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Systemic Architecture • Fiscal remunration • autonomous policy generation
               </p>
            </div>
         </div>

         {/* Navigation Deck */}
         <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
            {[
               { id: 'general', label: 'Nodes', icon: Building2 },
               { id: 'compliance', label: 'Protocol', icon: ShieldCheck },
               { id: 'finance', label: 'Fiscal', icon: CreditCard },
               { id: 'policies', label: 'Neural', icon: BookOpen },
               { id: 'emails', label: 'Comms', icon: Mail },
            ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => {
                     setActiveTab(tab.id as any);
                     toast.info(`Synchronizing lattice segment: ${tab.label}`);
                  }}
                  className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
               >
                  <tab.icon size={20} />
                  {tab.label}
               </button>
            ))}
         </div>

         <div className="flex-1 animate-in fade-in duration-700">
            {activeTab === 'general' && (
               <div className="bg-white p-16 rounded-[4.5rem] border border-slate-100 shadow-2xl max-w-4xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="space-y-12 relative z-10">
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em] mb-12 flex items-center gap-4">
                        <Globe className="text-primary-600" size={24} /> Identity Node Parameters
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Organic Identifier</label>
                           <input type="text" className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] text-[11px] font-black text-slate-900 focus:border-primary-500 transition-all outline-none shadow-inner" defaultValue="CareFlow AI Services" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">CQC Regulatory Key</label>
                           <input type="text" className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] text-[11px] font-black text-slate-900 focus:border-primary-500 transition-all outline-none shadow-inner" defaultValue="1-123456789" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Geospatial Station Address</label>
                        <textarea className="w-full p-8 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] text-[11px] font-black text-slate-900 focus:border-primary-500 transition-all outline-none shadow-inner min-h-[160px]" defaultValue="123 Care Avenue, London, SW1A 1AA" />
                     </div>
                     <button
                        onClick={() => toast.success('Identity node parameters archived')}
                        className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-6"
                     >
                        <Shield size={20} className="text-primary-500" /> Update Identification
                     </button>
                  </div>
               </div>
            )}
            {activeTab === 'compliance' && renderCompliance()}
            {activeTab === 'finance' && renderFinance()}
            {activeTab === 'policies' && renderPolicies()}
            {activeTab === 'emails' && <EmailTemplateCustomizer />}
         </div>
      </div>
   );
};

export default Settings;
