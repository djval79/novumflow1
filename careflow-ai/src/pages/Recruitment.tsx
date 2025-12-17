
import React, { useState } from 'react';
import { 
  Briefcase, Users, Plus, MoreHorizontal, MapPin, Clock, 
  Sparkles, Loader2, CheckCircle2, X, ArrowRight, Search,
  UserCheck, AlertCircle
} from 'lucide-react';
import { MOCK_JOBS, MOCK_CANDIDATES } from '../services/mockData';
import { Candidate, ApplicationStage, CandidateAnalysis, JobPosting } from '../types';
import { analyzeCandidateProfile } from '../services/geminiService';

const Recruitment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'board' | 'jobs'>('board');
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [analysis, setAnalysis] = useState<CandidateAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Stages for Kanban
  const stages: ApplicationStage[] = ['New', 'Screening', 'Interview', 'Offer', 'Hired'];

  // Handlers
  const moveCandidate = (id: string, stage: ApplicationStage) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
  };

  const handleAnalyze = async (candidate: Candidate) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeCandidateProfile(candidate.bio, candidate.appliedFor);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openCandidate = (c: Candidate) => {
    setSelectedCandidate(c);
    setAnalysis(null); // Reset previous analysis
  };

  // Render Kanban Board
  const renderBoard = () => (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {stages.map(stage => {
        const stageCandidates = candidates.filter(c => c.stage === stage);
        return (
          <div key={stage} className="min-w-[280px] w-80 bg-slate-100 rounded-xl p-4 flex flex-col h-full max-h-[calc(100vh-12rem)]">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{stage}</h3>
               <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{stageCandidates.length}</span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
               {stageCandidates.map(c => (
                 <div 
                   key={c.id} 
                   onClick={() => openCandidate(c)}
                   className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
                 >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-900">{c.name}</h4>
                       <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded border border-primary-100">{c.experienceYears}y Exp</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{c.appliedFor}</p>
                    <div className="flex gap-1 flex-wrap">
                       {c.skills.slice(0,2).map((s, i) => (
                          <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">{s}</span>
                       ))}
                       {c.skills.length > 2 && <span className="text-[10px] text-slate-400 px-1">+ {c.skills.length - 2}</span>}
                    </div>
                 </div>
               ))}
               {stageCandidates.length === 0 && (
                 <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                    No candidates
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {MOCK_JOBS.map(job => (
         <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                     <Briefcase size={24} />
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
               </div>
               <h3 className="font-bold text-lg text-slate-900 mb-1">{job.title}</h3>
               <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                  <span className="flex items-center gap-1"><Clock size={14}/> {job.type}</span>
               </div>
            </div>
            <div>
               <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-4 mt-2">
                  <span className="text-slate-600"><span className="font-bold text-slate-900">{job.applicantsCount}</span> Applicants</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                     {job.status}
                  </span>
               </div>
               <button className="w-full mt-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm">
                  View Details
               </button>
            </div>
         </div>
       ))}
       <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer min-h-[200px] group">
          <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform"/>
          <span className="font-bold">Post New Job</span>
       </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Recruitment & ATS</h1>
             <p className="text-slate-500 text-sm">Manage job postings and applicant pipeline.</p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setActiveTab('board')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'board' ? 'bg-white shadow-sm text-primary-700 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
             >
                Pipeline Board
             </button>
             <button 
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'jobs' ? 'bg-white shadow-sm text-primary-700 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
             >
                Active Jobs
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-hidden">
          {activeTab === 'board' ? renderBoard() : renderJobs()}
       </div>

       {/* Candidate Modal */}
       {selectedCandidate && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)}></div>
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
               {/* Header */}
               <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900">{selectedCandidate.name}</h2>
                     <p className="text-slate-500 text-sm">Applied for <strong className="text-slate-700">{selectedCandidate.appliedFor}</strong> • {selectedCandidate.appliedDate}</p>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Bio Section */}
                  <div>
                     <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><UserCheck size={18} className="text-slate-400"/> Candidate Summary</h3>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-slate-700 text-sm leading-relaxed">{selectedCandidate.bio}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                           {selectedCandidate.skills.map(s => (
                              <span key={s} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600">{s}</span>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* AI Analysis Section */}
                  <div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={18} className="text-purple-600"/> AI Profile Analysis</h3>
                        {!analysis && (
                           <button 
                              onClick={() => handleAnalyze(selectedCandidate)}
                              disabled={isAnalyzing}
                              className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-bold hover:bg-purple-100 flex items-center gap-2 disabled:opacity-50"
                           >
                              {isAnalyzing ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                              Run Screening
                           </button>
                        )}
                     </div>
                     
                     {analysis ? (
                        <div className="space-y-4 animate-in fade-in">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-purple-100 bg-white">
                                 <span className="text-xl font-bold text-purple-700">{analysis.matchScore}%</span>
                              </div>
                              <div>
                                 <p className="font-bold text-slate-900">Match Score</p>
                                 <p className="text-xs text-slate-500">Based on role requirements</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                 <p className="text-xs font-bold text-green-700 uppercase mb-2">Key Strengths</p>
                                 <ul className="text-sm text-green-900 space-y-1 list-disc list-inside">
                                    {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                 </ul>
                              </div>
                              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                 <p className="text-xs font-bold text-amber-700 uppercase mb-2">Potential Concerns</p>
                                 <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside">
                                    {analysis.concerns.map((s, i) => <li key={i}>{s}</li>)}
                                    {analysis.concerns.length === 0 && <li>No major concerns identified.</li>}
                                 </ul>
                              </div>
                           </div>

                           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <p className="text-xs font-bold text-blue-700 uppercase mb-2">Suggested Interview Questions</p>
                              <ul className="space-y-2">
                                 {analysis.interviewQuestions.map((q, i) => (
                                    <li key={i} className="text-sm text-blue-900 flex gap-2">
                                       <span className="font-bold text-blue-400">{i+1}.</span> {q}
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                           <p className="text-sm text-slate-400">Click 'Run Screening' to analyze this candidate against the job description.</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Footer Actions */}
               <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-500 uppercase">Current Stage:</span>
                     <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold">{selectedCandidate.stage}</span>
                  </div>
                  <div className="flex gap-2">
                     {selectedCandidate.stage !== 'Hired' && (
                        <>
                           <button 
                             onClick={() => moveCandidate(selectedCandidate.id, 'Screening')}
                             className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm"
                           >
                             Move to Screen
                           </button>
                           <button 
                             onClick={() => moveCandidate(selectedCandidate.id, 'Interview')}
                             className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm"
                           >
                             Interview
                           </button>
                           <button 
                             onClick={() => moveCandidate(selectedCandidate.id, 'Hired')}
                             className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 text-sm"
                           >
                             Hire Candidate
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
