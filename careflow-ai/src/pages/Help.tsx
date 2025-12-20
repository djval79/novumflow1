
import React, { useState } from 'react';
import {
   HelpCircle, Search, MessageSquare, Send, Book,
   Server, CheckCircle2, Loader2, ExternalLink, Zap, Globe, Shield, Target, History, Cpu
} from 'lucide-react';
import { askSystemHelp } from '../services/geminiService';
import { toast } from 'sonner';

const Help: React.FC = () => {
   const [query, setQuery] = useState('');
   const [isAsking, setIsAsking] = useState(false);
   const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot', text: string }[]>([
      { role: 'bot', text: 'HANDSHAKE ESTABLISHED. RUNNING CAREFLOW NEURAL ASSISTANT (V2.4). HOW CAN I CALIBRATE YOUR EXPERIENCE TODAY?' }
   ]);

   const handleAsk = async () => {
      if (!query.trim()) return;

      const userMsg = query;
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setQuery('');
      setIsAsking(true);
      toast.info('Dispatching Neural Inquiry to Core Engine...');

      try {
         const response = await askSystemHelp(userMsg);
         setChatHistory(prev => [...prev, { role: 'bot', text: response.toUpperCase() }]);
         toast.success('Response Synthesized');
      } catch (error) {
         setChatHistory(prev => [...prev, { role: 'bot', text: 'SYSTEM ERROR: NEURAL LINK INTERRUPTED. PLEASE RE-INITIALIZE PROTOCOL.' }]);
         toast.error('Synthesis Failure');
      } finally {
         setIsAsking(false);
      }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Support <span className="text-primary-600">Core</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  System Diagnostics • Knowledge Lattice • Neural Assistant
               </p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch h-full min-h-[700px]">
            {/* Left: Knowledge Base & Status */}
            <div className="lg:col-span-2 flex flex-col gap-10">

               {/* Quick Guides Matrix */}
               <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-[60px] -mr-16 -mt-16" />
                  <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.6em] mb-12 flex items-center gap-6 relative z-10">
                     <Book size={32} className="text-primary-600" /> Protocol Library
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     {['Unit Authentication Reset', 'Tactical Visit Scheduling', 'Mobile Satellite Sync', 'Fiscal Remuneration Ledger'].map(topic => (
                        <button key={topic} className="p-8 bg-slate-50 border-2 border-slate-50 rounded-[2rem] hover:bg-white hover:shadow-2xl hover:border-primary-500 cursor-pointer transition-all flex justify-between items-center group/item active:scale-95 text-left">
                           <span className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover/item:text-primary-600 transition-colors">{topic}</span>
                           <ExternalLink size={20} className="text-slate-300 group-hover/item:text-primary-500 group-hover/item:rotate-12 transition-all" />
                        </button>
                     ))}
                  </div>
               </div>

               {/* System Health Monitor */}
               <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-[0_45px_100px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                  <h3 className="text-[12px] font-black text-primary-500 uppercase tracking-[0.6em] mb-12 flex items-center gap-6 relative z-10">
                     <Server size={32} /> Lattice Integrity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                     <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group/cell">
                        <div className="flex items-center gap-6">
                           <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl animate-pulse group-hover/cell:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase tracking-widestAlpha">API Infrastructure</p>
                              <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Operational Range</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">99.9% Uptime</span>
                     </div>
                     <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group/cell">
                        <div className="flex items-center gap-6">
                           <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl animate-pulse group-hover/cell:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase tracking-widestAlpha">Data Vault Cluster</p>
                              <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Operational Range</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">12MS Latency</span>
                     </div>
                  </div>
               </div>

               {/* Contact Overrides */}
               <div className="bg-primary-600 p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                  <div className="relative z-10 text-center md:text-left">
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-3">Manual Override Required?</h3>
                     <p className="text-[10px] font-black text-primary-100 uppercase tracking-[0.4em]">Administrative human support available for Tier 1 escalation.</p>
                  </div>
                  <button onClick={() => toast.info('Human support queue initialized. Wait time: 4 mins.')} className="px-12 py-6 bg-white text-primary-600 border-4 border-primary-500 font-black uppercase tracking-[0.4em] text-[11px] rounded-[2rem] shadow-2xl hover:bg-slate-900 hover:text-white hover:border-slate-800 transition-all active:scale-95 group/btn relative z-10">
                     Initiate Comms <MessageSquare size={18} className="inline ml-4 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>

            {/* Right: AI Neural Hub */}
            <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden h-[750px] relative group/ai">
               <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between relative z-20">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-primary-500 shadow-2xl border-2 border-white/5 animate-spin-slow">
                        <HelpCircle size={32} />
                     </div>
                     <div className="space-y-1">
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-widest leading-none">Neural Hub</h3>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em]">Active AI Simulation</p>
                     </div>
                  </div>
                  <div className="p-4 bg-primary-600/10 rounded-2xl"><Zap size={20} className="text-primary-600 animate-pulse" /></div>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30 scrollbar-hide relative z-10">
                  <div className="absolute inset-0 bg-grid-slate-900/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                  {chatHistory.map((msg, i) => (
                     <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-5`}>
                        <div className={`max-w-[85%] p-6 rounded-[2rem] text-[11px] font-black uppercase tracking-tight leading-relaxed shadow-2xl border-4 ${msg.role === 'user'
                              ? 'bg-slate-900 border-slate-800 text-white rounded-tr-none shadow-primary-900/10'
                              : 'bg-white border-white text-slate-800 rounded-tl-none border-l-[12px] border-l-primary-600'
                           }`}>
                           {msg.text}
                        </div>
                     </div>
                  ))}
                  {isAsking && (
                     <div className="flex justify-start animate-pulse">
                        <div className="bg-white border-white p-6 rounded-[2rem] rounded-tl-none shadow-2xl border-l-[12px] border-l-primary-600">
                           <div className="flex gap-2">
                              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               <div className="p-10 border-t border-slate-50 bg-white relative z-20">
                  <div className="flex items-center gap-6">
                     <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                        <input
                           type="text"
                           className="w-full pl-16 pr-10 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-200"
                           placeholder="Enter Neural Target..."
                           value={query}
                           onChange={(e) => setQuery(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                        />
                     </div>
                     <button
                        onClick={handleAsk}
                        disabled={isAsking || !query.trim()}
                        className="p-6 bg-slate-900 text-white rounded-[1.75rem] hover:bg-black disabled:opacity-20 shadow-xl active:scale-95 transition-all group/send"
                     >
                        <Send size={28} className="text-primary-500 group-hover/send:-translate-y-1 group-hover/send:translate-x-1 transition-transform" />
                     </button>
                  </div>
                  <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.6em] mt-6 leading-none">AI Response Synthesis Active</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Help;
