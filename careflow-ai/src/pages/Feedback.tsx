
import React, { useState } from 'react';
import { 
  ThumbsUp, ThumbsDown, MessageSquare, Star, TrendingUp, 
  Sparkles, Loader2, CheckCircle2, AlertCircle, Search
} from 'lucide-react';
import { MOCK_FEEDBACK } from '../services/mockData';
import { FeedbackRecord, SentimentSummary } from '../types';
import { analyzeFeedbackTrends } from '../services/geminiService';

const Feedback: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>(MOCK_FEEDBACK);
  const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Derived Stats
  const totalReviews = feedback.length;
  const averageRating = feedback.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews;
  const positiveCount = feedback.filter(f => f.rating >= 4).length;
  const negativeCount = feedback.filter(f => f.rating <= 2).length;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const comments = feedback.map(f => f.comment);
      const result = await analyzeFeedbackTrends(comments);
      setSentiment(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={12} fill={i <= rating ? "currentColor" : "none"} className={i <= rating ? "" : "text-slate-300"} />
        ))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Feedback & Quality</h1>
             <p className="text-slate-500 text-sm">Monitor client satisfaction and sentiment.</p>
          </div>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Column: Stats & Analysis */}
          <div className="w-full md:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
             {/* Score Card */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-sm text-slate-500 font-bold uppercase mb-4">Overall Satisfaction</p>
                <div className="flex items-center justify-center gap-6">
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle cx="64" cy="64" r="60" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                         <circle 
                           cx="64" cy="64" r="60" stroke="#22c55e" strokeWidth="8" fill="none" 
                           strokeDasharray={377} 
                           strokeDashoffset={377 - (377 * (averageRating / 5))} 
                           className="transition-all duration-1000 ease-out"
                         />
                      </svg>
                      <div className="absolute text-center">
                         <span className="text-3xl font-bold text-slate-900">{averageRating.toFixed(1)}</span>
                         <span className="block text-xs text-slate-400">/ 5.0</span>
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                   <div className="bg-green-50 p-3 rounded-lg">
                      <ThumbsUp size={20} className="mx-auto text-green-600 mb-1" />
                      <span className="font-bold text-green-700">{positiveCount} Positive</span>
                   </div>
                   <div className="bg-red-50 p-3 rounded-lg">
                      <ThumbsDown size={20} className="mx-auto text-red-600 mb-1" />
                      <span className="font-bold text-red-700">{negativeCount} Negative</span>
                   </div>
                </div>
             </div>

             {/* AI Insight Card */}
             <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold flex items-center gap-2"><Sparkles size={18} className="text-yellow-400"/> AI Sentiment Analyst</h3>
                </div>
                
                {!sentiment ? (
                   <div className="text-center py-6">
                      <p className="text-indigo-200 text-sm mb-4">Analyze recent feedback to detect emerging themes and satisfaction trends.</p>
                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                         {isAnalyzing ? <Loader2 className="animate-spin" size={16}/> : 'Run Analysis'}
                      </button>
                   </div>
                ) : (
                   <div className="space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between">
                         <span className="text-indigo-200 text-sm font-bold uppercase">Sentiment Score</span>
                         <span className={`text-xl font-bold ${sentiment.overallScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {sentiment.overallScore > 0 ? '+' : ''}{sentiment.overallScore}
                         </span>
                      </div>
                      
                      <div className="space-y-2">
                         <p className="text-xs text-indigo-300 font-bold uppercase">Key Themes</p>
                         <div className="flex flex-wrap gap-1">
                            {sentiment.keyThemes.map((t, i) => (
                               <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs">{t}</span>
                            ))}
                         </div>
                      </div>

                      <div className="bg-white/10 rounded-lg p-3">
                         <p className="text-xs text-green-300 font-bold uppercase mb-1 flex items-center gap-1"><CheckCircle2 size={10}/> Highlights</p>
                         <ul className="text-xs space-y-1 pl-3 list-disc text-indigo-100">
                            {sentiment.positiveHighlights.map((h, i) => <li key={i}>{h}</li>)}
                         </ul>
                      </div>

                      <div className="bg-white/10 rounded-lg p-3">
                         <p className="text-xs text-red-300 font-bold uppercase mb-1 flex items-center gap-1"><AlertCircle size={10}/> Issues</p>
                         <ul className="text-xs space-y-1 pl-3 list-disc text-indigo-100">
                            {sentiment.areasForImprovement.map((h, i) => <li key={i}>{h}</li>)}
                         </ul>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* Right Column: Review Feed */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Recent Reviews</h3>
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                   <input 
                      type="text" 
                      placeholder="Search reviews..." 
                      className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                   />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto">
                {feedback.map(fb => (
                   <div key={fb.id} className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                               ${fb.rating >= 4 ? 'bg-green-500' : fb.rating <= 2 ? 'bg-red-500' : 'bg-amber-500'}
                            `}>
                               {fb.rating}
                            </div>
                            <div>
                               <h4 className="font-bold text-slate-900 text-sm">{fb.source}</h4>
                               <p className="text-xs text-slate-500">{fb.date}</p>
                            </div>
                         </div>
                         <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border
                            ${fb.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'}
                         `}>
                            {fb.status}
                         </span>
                      </div>
                      
                      <div className="pl-13 mb-2">
                         {renderStars(fb.rating)}
                      </div>
                      
                      <p className="text-sm text-slate-700 leading-relaxed mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100 italic">
                         "{fb.comment}"
                      </p>

                      {fb.response && (
                         <div className="ml-4 pl-4 border-l-2 border-slate-200 mb-4">
                            <p className="text-xs font-bold text-slate-500 mb-1">Agency Response:</p>
                            <p className="text-xs text-slate-600">{fb.response}</p>
                         </div>
                      )}

                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50">
                            Ignore
                         </button>
                         <button className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs font-bold hover:bg-primary-700 flex items-center gap-1">
                            <MessageSquare size={12}/> Reply
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
