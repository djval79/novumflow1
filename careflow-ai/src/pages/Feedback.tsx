
import React, { useState, useEffect } from 'react';
import {
   ThumbsUp, ThumbsDown, MessageSquare, Star, TrendingUp,
   Sparkles, Loader2, CheckCircle2, AlertCircle, Search, Zap, Target, History, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { feedbackService } from '../services/supabaseService';
import { FeedbackRecord, SentimentSummary } from '../types';
import { analyzeFeedbackTrends } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Feedback: React.FC = () => {
   const { profile } = useAuth();
   const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);
   const [isAnalyzing, setIsAnalyzing] = useState(false);

   useEffect(() => {
      async function loadFeedback() {
         setLoading(true);
         try {
            const data = await feedbackService.getAll(profile?.tenant_id);
            if (data.length > 0) {
               const mapped = data.map((f: any) => ({
                  id: f.id,
                  source: f.submittedByName || f.source || 'Anonymous',
                  rating: f.rating || 3,
                  comment: f.content,
                  category: (f.type || 'Praise') as 'Praise' | 'Complaint' | 'Suggestion',
                  date: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Recent',
                  status: (f.status === 'open' ? 'New' : 'Reviewed') as 'New' | 'Reviewed',
                  response: f.response || null
               }));
               setFeedback(mapped);
            } else {
               setFeedback([
                  { id: '1', source: 'Family - Mrs Smith', rating: 5, comment: 'The carers are wonderful and very patient with my mother.', category: 'Praise' as const, date: 'Today', status: 'New' as const, response: null },
                  { id: '2', source: 'Client - Mr Jones', rating: 4, comment: 'Very happy with the care. Just wish visits were a bit longer.', category: 'Suggestion' as const, date: 'Yesterday', status: 'New' as const, response: null },
                  { id: '3', source: 'Survey - Q4 2024', rating: 4, comment: 'Good overall service quality.', category: 'Praise' as const, date: 'Dec 2024', status: 'Reviewed' as const, response: 'Thank you for your feedback!' }
               ]);
            }
         } catch (error) {
            toast.error("Bridge failure: Feedback data retrieval interrupted");
            setFeedback([]);
         } finally {
            setLoading(false);
         }
      }
      loadFeedback();
   }, [profile?.tenant_id]);

   const totalReviews = feedback.length;
   const averageRating = totalReviews > 0 ? feedback.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews : 0;
   const positiveCount = feedback.filter(f => f.rating >= 4).length;
   const negativeCount = feedback.filter(f => f.rating <= 2).length;

   const handleAnalyze = async () => {
      setIsAnalyzing(true);
      const anaToast = toast.loading('Initiating Neural Sentiment Synthesis...');
      try {
         const comments = feedback.map(f => f.comment);
         const result = await analyzeFeedbackTrends(comments);
         setSentiment(result);
         toast.success('Sentiment Matrix Synthesized', { id: anaToast });
      } catch (error) {
         toast.error('Synthesis Failure', { id: anaToast });
      } finally {
         setIsAnalyzing(false);
      }
   };

   const renderStars = (rating: number) => {
      return (
         <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
               <Star key={i} size={16} fill={i <= rating ? "#EAB308" : "none"} className={i <= rating ? "text-yellow-500" : "text-slate-200"} />
            ))}
         </div>
      );
   };

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Feedback <span className="text-primary-600">Core</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Client Satisfaction Index • Neural Sentiment Matrix • Quality Assurance Hub
               </p>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-10 items-stretch h-full min-h-[750px]">
            {/* Left Column: Intelligence Matrix */}
            <div className="w-full lg:w-[450px] flex flex-col gap-10">
               {/* Global Satisfaction Score */}
               <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl text-center space-y-10 animate-in slide-in-from-left-10 duration-700">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Global Integrity Score</p>
                  <div className="flex items-center justify-center relative group">
                     <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="96" cy="96" r="88" stroke="#f8fafc" strokeWidth="16" fill="none" />
                           <circle
                              cx="96" cy="96" r="88" stroke="#2563eb" strokeWidth="16" fill="none"
                              strokeDasharray={553}
                              strokeDashoffset={553 - (553 * (averageRating / 5))}
                              className="transition-all duration-1000 ease-out shadow-2xl"
                           />
                        </svg>
                        <div className="absolute text-center">
                           <span className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">{averageRating.toFixed(1)}</span>
                           <span className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">/ 5.0 EPOCH</span>
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-emerald-900/5 p-6 rounded-[2rem] border-2 border-emerald-500/10 hover:bg-emerald-900 hover:text-white transition-all group/stat cursor-default">
                        <ThumbsUp size={32} className="mx-auto text-emerald-500 mb-4 group-hover/stat:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-widest">{positiveCount} PRAISE</span>
                     </div>
                     <div className="bg-rose-900/5 p-6 rounded-[2rem] border-2 border-rose-500/10 hover:bg-rose-900 hover:text-white transition-all group/stat cursor-default">
                        <ThumbsDown size={32} className="mx-auto text-rose-500 mb-4 group-hover/stat:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-widest">{negativeCount} CONCERN</span>
                     </div>
                  </div>
               </div>

               {/* AI Neural Sentiment Processor */}
               <div className="bg-slate-900 p-12 rounded-[4.5rem] text-white shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden group/ana animate-in slide-in-from-bottom-10 duration-1000">
                  <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                  <div className="flex justify-between items-center mb-12 relative z-10">
                     <h3 className="text-[12px] font-black uppercase tracking-[0.5em] flex items-center gap-6 text-primary-500"><Sparkles size={32} /> Neural Analyst</h3>
                  </div>

                  {!sentiment ? (
                     <div className="text-center space-y-10 relative z-10">
                        <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed">Analyze global feedback spectrum to detect emerging satisfaction trends and clinical themes.</p>
                        </div>
                        <button
                           onClick={handleAnalyze}
                           disabled={isAnalyzing}
                           className="w-full py-8 bg-white text-slate-900 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95 group/btn"
                        >
                           {isAnalyzing ? <Loader2 className="animate-spin text-primary-600" size={24} /> : <Zap size={24} className="text-primary-600 group-hover/btn:scale-125 transition-transform" />}
                           Authorize Analysis
                        </button>
                     </div>
                  ) : (
                     <div className="space-y-10 animate-in fade-in relative z-10">
                        <div className="flex items-center justify-between text-white p-8 bg-white/5 rounded-[3rem] border border-white/5">
                           <span className="text-slate-400 text-[10px] font-black uppercase tracking-widestAlpha">Sentiment Index</span>
                           <span className={`text-4xl font-black tracking-tighter tabular-nums ${sentiment.overallScore > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {sentiment.overallScore > 0 ? '+' : ''}{sentiment.overallScore}
                           </span>
                        </div>

                        <div className="space-y-6">
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] ml-6">Theme Spectrum</p>
                           <div className="flex flex-wrap gap-4">
                              {sentiment.keyThemes.map((t, i) => (
                                 <span key={i} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widestAlpha text-indigo-200">{t}</span>
                              ))}
                           </div>
                        </div>

                        <div className="bg-emerald-900/20 p-8 rounded-[3rem] border border-emerald-500/20 space-y-4">
                           <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.4em] flex items-center gap-4"><CheckCircle2 size={16} /> Global Highlights</p>
                           <ul className="text-[11px] space-y-3 pl-6 list-disc text-emerald-100 font-black uppercase tracking-tight">
                              {sentiment.positiveHighlights.map((h, i) => <li key={i} className="opacity-80 hover:opacity-100 transition-opacity">"{h}"</li>)}
                           </ul>
                        </div>

                        <div className="bg-rose-900/20 p-8 rounded-[3rem] border border-rose-500/20 space-y-4">
                           <p className="text-[9px] text-rose-400 font-black uppercase tracking-[0.4em] flex items-center gap-4"><AlertCircle size={16} /> Critical Issues</p>
                           <ul className="text-[11px] space-y-3 pl-6 list-disc text-rose-100 font-black uppercase tracking-tight">
                              {sentiment.areasForImprovement.map((h, i) => <li key={i} className="opacity-80 hover:opacity-100 transition-opacity">"{h}"</li>)}
                           </ul>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Right Column: Review Feed Spectrum */}
            <div className="flex-1 bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-1000">
               <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
                  <div className="space-y-1">
                     <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter leading-none">Review Spectrum</h3>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">Real-time Feed of Client Metadata</p>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                     <input
                        type="text"
                        placeholder="SEARCH ARCHIVE..."
                        className="pl-16 pr-8 py-4 bg-white border-4 border-slate-50 rounded-[2rem] text-[10px] font-black uppercase tracking-widestAlpha focus:border-primary-500 outline-none transition-all shadow-inner placeholder:text-slate-200"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
                  {feedback.map(fb => (
                     <div key={fb.id} className="p-12 hover:bg-slate-50 transition-all group relative">
                        <div className="flex justify-between items-start mb-8 relative z-10">
                           <div className="flex items-center gap-8">
                              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:rotate-6 transition-transform
                                 ${fb.rating >= 4 ? 'bg-emerald-600' : fb.rating <= 2 ? 'bg-rose-600' : 'bg-amber-600'}
                              `}>
                                 {fb.rating}
                              </div>
                              <div className="space-y-1">
                                 <h4 className="font-black text-2xl text-slate-900 uppercase tracking-tighter leading-none group-hover:text-primary-600 transition-colors">{fb.source}</h4>
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widestAlpha">{fb.date.toUpperCase()}</p>
                              </div>
                           </div>
                           <span className={`text-[9px] font-black px-6 py-2 rounded-xl uppercase border shadow-xl
                             ${fb.status === 'New' ? 'bg-primary-900 text-primary-400 border-primary-500 animate-pulse' : 'bg-slate-900 text-slate-400 border-slate-500'}
                          `}>
                              {fb.status}
                           </span>
                        </div>

                        <div className="mb-8 pl-28 relative z-10 transition-transform group-hover:translate-x-2">
                           {renderStars(fb.rating)}
                        </div>

                        <div className="bg-slate-50/50 p-10 rounded-[3.5rem] border-2 border-slate-50 relative z-10 group-hover:bg-white group-hover:shadow-2xl transition-all">
                           <p className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight italic">
                              "{fb.comment.toUpperCase()}"
                           </p>
                        </div>

                        {fb.response && (
                           <div className="ml-28 mt-8 pl-10 border-l-8 border-primary-600 relative z-10 bg-primary-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
                              <p className="text-[10px] font-black text-primary-400 mb-2 uppercase tracking-[0.4em]">UNIT RESPONSE PROTOCOL:</p>
                              <p className="text-[12px] font-black uppercase tracking-tight leading-relaxed">"{fb.response.toUpperCase()}"</p>
                           </div>
                        )}

                        <div className="flex justify-end gap-6 mt-10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 relative z-10">
                           <button onClick={() => toast.warning('Metadata archived without response')} className="px-10 py-5 bg-white border-4 border-slate-50 rounded-[1.5rem] text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-slate-900 hover:border-slate-200 transition-all shadow-xl">
                              Decommission
                           </button>
                           <button onClick={() => toast.info('Accessing Response Comms Deck')} className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black flex items-center gap-4 transition-all shadow-2xl active:scale-95">
                              <MessageSquare size={20} className="text-primary-500" /> Dispatch Reply
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default Feedback;
