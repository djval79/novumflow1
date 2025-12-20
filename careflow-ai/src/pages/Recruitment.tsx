
import React, { useState } from 'react';
import {
   Briefcase, Users, Plus, MoreHorizontal, MapPin, Clock,
   Sparkles, Loader2, CheckCircle2, X, ArrowRight, Search,
   UserCheck, AlertCircle, TrendingUp, Target, Activity, Brain, ShieldCheck
} from 'lucide-react';
import { Candidate, ApplicationStage, CandidateAnalysis, JobPosting } from '../types';
import { analyzeCandidateProfile } from '../services/geminiService';
import { toast } from 'sonner';

// Default demo data
const DEFAULT_CANDIDATES: Candidate[] = [
   { id: '1', name: 'Jane Smith', email: 'jane@example.com', appliedFor: 'Care Worker', appliedDate: 'Today', stage: 'New', experienceYears: 3, skills: ['Personal Care', 'Medication'], bio: 'Experienced carer with 3 years in domiciliary care.' },
   { id: '2', name: 'Mike Johnson', email: 'mike@example.com', appliedFor: 'Senior Carer', appliedDate: 'Yesterday', stage: 'Screening', experienceYears: 5, skills: ['Dementia Care', 'Team Lead'], bio: 'Senior carer looking for new opportunities.' },
   { id: '3', name: 'Sarah Williams', email: 'sarah@example.com', appliedFor: 'Care Worker', appliedDate: '3 days ago', stage: 'Interview', experienceYears: 2, skills: ['End of Life', 'First Aid'], bio: 'Compassionate carer with EOL experience.' }
];

const DEFAULT_JOBS: JobPosting[] = [
   { id: '1', title: 'Care Worker', location: 'Liverpool', type: 'Full-Time', status: 'Active', applicantsCount: 8, postedDate: '2024-12-15' },
   { id: '2', title: 'Senior Carer', location: 'Manchester', type: 'Full-Time', status: 'Active', applicantsCount: 5, postedDate: '2024-12-10' },
   { id: '3', title: 'Night Care Worker', location: 'Wirral', type: 'Part-Time', status: 'Active', applicantsCount: 3, postedDate: '2024-12-18' }
];

const Recruitment: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'board' | 'jobs'>('board');
   const [candidates, setCandidates] = useState<Candidate[]>(DEFAULT_CANDIDATES);
   const [jobs, setJobs] = useState<JobPosting[]>(DEFAULT_JOBS);
   const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
   const [analysis, setAnalysis] = useState<CandidateAnalysis | null>(null);
   const [isAnalyzing, setIsAnalyzing] = useState(false);

   // Stages for Kanban
   const stages: ApplicationStage[] = ['New', 'Screening', 'Interview', 'Offer', 'Hired'];

   // Handlers
   const moveCandidate = (id: string, stage: ApplicationStage) => {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
      toast.success(`Candidate transition: ${stage}`, {
         description: `Applicant has been successfully re-indexed to the ${stage} vector.`
      });
      if (selectedCandidate?.id === id) {
         setSelectedCandidate(prev => prev ? { ...prev, stage } : null);
      }
   };

   const handleAnalyze = async (candidate: Candidate) => {
      setIsAnalyzing(true);
      setAnalysis(null);
      const analysisToast = toast.loading('Initializing neural profile scanning...');
      try {
         const result = await analyzeCandidateProfile(candidate.bio, candidate.appliedFor);
         setAnalysis(result);
         toast.success('Neural Profile Scan Complete', { id: analysisToast });
      } catch (error) {
         toast.error('Neural Logic Error', { id: analysisToast });
      } finally {
         setIsAnalyzing(false);
      }
   };

   const openCandidate = (c: Candidate) => {
      setSelectedCandidate(c);
      setAnalysis(null);
      toast.info(`Retrieving dossier: ${c.name}`);
   };

   // Render Kanban Board
   const renderBoard = () => (
      <div className="flex gap-8 h-full overflow-x-auto pb-10 px-2 scrollbar-hide">
         {stages.map(stage => {
            const stageCandidates = candidates.filter(c => c.stage === stage);
            return (
               <div key={stage} className="min-w-[340px] w-[340px] bg-white rounded-[3rem] p-6 flex flex-col h-full max-h-[calc(100vh-14rem)] border border-slate-100 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                  <div className="flex justify-between items-center mb-6 relative z-10 px-2">
                     <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${stageCandidates.length > 0 ? 'bg-primary-600 animate-pulse' : 'bg-slate-300'}`} />
                        {stage}
                     </h3>
                     <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-1 rounded-xl shadow-lg leading-tight">{stageCandidates.length}</span>
                  </div>

                  <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-hide">
                     {stageCandidates.map(c => (
                        <div
                           key={c.id}
                           onClick={() => openCandidate(c)}
                           className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all active:scale-95 group"
                        >
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="font-black text-slate-900 text-base uppercase tracking-tight group-hover:text-primary-600 transition-colors">{c.name}</h4>
                              <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-widest">{c.experienceYears}y Exp</span>
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{c.appliedFor}</p>
                           <div className="flex gap-2 flex-wrap">
                              {c.skills.slice(0, 2).map((s, i) => (
                                 <span key={i} className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest">{s}</span>
                              ))}
                              {c.skills.length > 2 && <span className="text-[10px] font-black text-slate-300 px-1 mt-1">+ {c.skills.length - 2}</span>}
                           </div>
                        </div>
                     ))}
                     {stageCandidates.length === 0 && (
                        <div className="h-40 flex flex-col items-center justify-center text-center p-8 border-4 border-dashed border-slate-50 rounded-[2.5rem]">
                           <Users size={32} className="text-slate-100 mb-4" />
                           <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-300">Null Pipeline Segment</p>
                        </div>
                     )}
                  </div>
               </div>
            );
         })}
      </div>
   );

   // Render Jobs List
   const renderJobs = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-10">
         {jobs.map(job => (
            <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between group">
               <div>
                  <div className="flex justify-between items-start mb-8">
                     <div className="p-5 bg-slate-900 text-white rounded-[1.75rem] shadow-2xl group-hover:scale-110 transition-transform">
                        <Briefcase size={28} />
                     </div>
                     <button className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"><MoreHorizontal size={20} /></button>
                  </div>
                  <h3 className="font-black text-2xl text-slate-900 mb-2 uppercase tracking-tight">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                     <span className="flex items-center gap-2"><MapPin size={16} className="text-primary-500" /> {job.location}</span>
                     <span className="flex items-center gap-2"><Clock size={16} className="text-primary-500" /> {job.type}</span>
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-8 mt-4">
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Size</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter"><span className="text-2xl">{job.applicantsCount}</span> Active Units</p>
                     </div>
                     <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 shadow-lg ${job.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {job.status}
                     </span>
                  </div>
                  <button className="w-full mt-10 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-[1.5rem] hover:bg-black transition-all shadow-xl active:scale-95">
                     Access Job Dossier
                  </button>
               </div>
            </div>
         ))}
         <div
            onClick={() => toast.info('Accessing Job Architecture terminal')}
            className="bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-slate-300 hover:border-primary-100 hover:text-primary-600 hover:bg-white transition-all cursor-pointer min-h-[300px] group shadow-inner"
         >
            <div className="p-6 bg-white rounded-[2rem] shadow-sm mb-6 group-hover:scale-110 transition-transform group-hover:shadow-xl">
               <Plus size={48} />
            </div>
            <span className="font-black uppercase tracking-[0.5em] text-xs">Initialize Job Deployment</span>
         </div>
      </div>
   );

   return (
      <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-3">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Talent <span className="text-primary-600">Grid</span></h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">Candidate Lifecycle & Algorithmic Screening Hub</p>
            </div>

            <div className="flex p-2 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
               <button
                  onClick={() => {
                     setActiveTab('board');
                     toast.info('Switching to Pipeline Visualization');
                  }}
                  className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'board' ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
               >
                  Pipeline Board
               </button>
               <button
                  onClick={() => {
                     setActiveTab('jobs');
                     toast.info('Accessing Active Requisitions');
                  }}
                  className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'jobs' ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
               >
                  Active Deployments
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto scrollbar-hide">
            {activeTab === 'board' ? renderBoard() : renderJobs()}
         </div>

         {/* Futuristic Candidate Modal - Dossier View */}
         {selectedCandidate && (
            <div className="fixed inset-0 z-[100] flex justify-end p-6">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setSelectedCandidate(null)}></div>
               <div className="relative w-full max-w-4xl bg-white rounded-[4rem] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                  {/* Dossier Header */}
                  <div className="p-12 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-slate-50/20 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                     <div className="relative z-10 flex items-center gap-10">
                        <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl border-4 border-white">
                           <UserCheck size={48} />
                        </div>
                        <div>
                           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">{selectedCandidate.name}</h2>
                           <div className="flex flex-wrap gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-2"><Target size={14} className="text-primary-500" /> Target Role: <strong className="text-slate-900">{selectedCandidate.appliedFor}</strong></span>
                              <span className="flex items-center gap-2"><Activity size={14} className="text-primary-500" /> Index Epoch: <strong className="text-slate-900">{selectedCandidate.appliedDate}</strong></span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedCandidate(null)} className="p-5 bg-white hover:bg-rose-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-all shadow-sm active:scale-95"><X size={28} /></button>
                  </div>

                  {/* Dossier Hub */}
                  <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                     {/* Bio / Skills Terminal */}
                     <div className="space-y-6">
                        <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight flex items-center gap-3">
                           <ShieldCheck size={28} className="text-primary-600" />
                           Candidate Dossier Summary
                        </h3>
                        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-xl hover:border-primary-100 transition-all">
                           <p className="text-slate-900 text-lg font-black leading-relaxed tracking-tight underline decoration-primary-500/10 decoration-8 underline-offset-[-2px]">{selectedCandidate.bio}</p>
                           <div className="flex flex-wrap gap-4 mt-10">
                              {selectedCandidate.skills.map(s => (
                                 <span key={s} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform hover:scale-105 transition-all">{s}</span>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* AI Profile Analysis Matrix */}
                     <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50" />
                        <div className="flex justify-between items-center mb-12">
                           <h3 className="text-[10px] font-black text-primary-400 flex items-center gap-4 uppercase tracking-[0.4em]">
                              <Brain size={28} />
                              Neural Recruitment Audit
                           </h3>
                           {!analysis && (
                              <button
                                 onClick={() => handleAnalyze(selectedCandidate)}
                                 disabled={isAnalyzing}
                                 className="px-8 py-5 bg-primary-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-primary-600 transition-all shadow-2xl active:scale-95 flex items-center gap-4"
                              >
                                 {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                 Initialize Screening Logic
                              </button>
                           )}
                        </div>

                        {analysis ? (
                           <div className="space-y-12 animate-in zoom-in duration-500">
                              <div className="flex items-center gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                                 <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-primary-500/30 bg-white/5 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <span className="text-3xl font-black text-primary-400">{analysis.matchScore}%</span>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-white text-xl font-black uppercase tracking-tight">Algorithmic Match Score</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cross-referenced with organization prerequisites</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="bg-green-500/10 p-8 rounded-[2.5rem] border border-green-500/20 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                       <TrendingUp className="text-green-500" size={18} />
                                       <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Core Capabilities</p>
                                    </div>
                                    <ul className="space-y-3">
                                       {analysis.strengths.map((s, i) => (
                                          <li key={i} className="text-white text-sm font-black flex items-center gap-3">
                                             <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                             {s}
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                                 <div className="bg-rose-500/10 p-8 rounded-[2.5rem] border border-rose-500/20 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                       <AlertCircle className="text-rose-500" size={18} />
                                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Potential Risk Vectors</p>
                                    </div>
                                    <ul className="space-y-3">
                                       {analysis.concerns.map((s, i) => (
                                          <li key={i} className="text-white text-sm font-black flex items-center gap-3 opacity-90">
                                             <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                             {s}
                                          </li>
                                       ))}
                                       {analysis.concerns.length === 0 && <li className="text-white font-black text-sm opacity-50">No critical anomalies detected.</li>}
                                    </ul>
                                 </div>
                              </div>

                              <div className="bg-indigo-600/10 p-10 rounded-[2.5rem] border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
                                 <div className="flex items-center gap-3 mb-6">
                                    <Activity className="text-indigo-400" size={20} />
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Strategic Interview Directives</p>
                                 </div>
                                 <ul className="space-y-6">
                                    {analysis.interviewQuestions.map((q, i) => (
                                       <li key={i} className="text-white text-base font-black flex gap-6 group/q">
                                          <span className="text-indigo-600 font-black tabular-nums transition-transform group-hover/q:scale-125">{i + 1}.</span>
                                          <span className="opacity-90 leading-snug">{q}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           </div>
                        ) : (
                           <div className="text-center py-20 flex flex-col items-center gap-6 border-4 border-dashed border-white/5 rounded-[3rem]">
                              <Brain size={64} className="text-white/5" />
                              <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] max-w-sm leading-relaxed">Neural Core Disengaged. Execute screening logic to generate match score and interview directives.</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Footer Transition Matrix */}
                  <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-center gap-8">
                     <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[1.5rem] shadow-xl border border-slate-100">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pipeline Matrix Node:</span>
                        <span className="px-5 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">{selectedCandidate.stage}</span>
                     </div>
                     <div className="flex flex-wrap gap-4 justify-center">
                        {selectedCandidate.stage !== 'Hired' && (
                           <>
                              <button
                                 onClick={() => moveCandidate(selectedCandidate.id, 'Screening')}
                                 className="px-8 py-4 bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              >
                                 Transition to Screen
                              </button>
                              <button
                                 onClick={() => moveCandidate(selectedCandidate.id, 'Interview')}
                                 className="px-8 py-4 bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              >
                                 Authorize Interview
                              </button>
                              <button
                                 onClick={() => moveCandidate(selectedCandidate.id, 'Hired')}
                                 className="px-10 py-5 bg-green-600 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95"
                              >
                                 Execute Final Hire
                              </button>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Recruitment;
