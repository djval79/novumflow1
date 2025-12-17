
import React, { useState } from 'react';
import { generateCarePlanAI, generateProgressReview } from '../services/geminiService';
import { GeneratedCarePlan, UserRole, CareGoal, ProgressLog } from '../types';
import { 
  Sparkles, Check, AlertTriangle, Loader2, Save, Printer, FileText, Lock, 
  TrendingUp, Activity, Calendar, CheckCircle2, PlayCircle, PauseCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_GOALS, MOCK_PROGRESS_LOGS } from '../services/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for read-only view
const MOCK_EXISTING_PLAN: GeneratedCarePlan = {
  summary: "The client requires daily assistance with personal hygiene and medication management due to early-onset dementia. Mobility is generally good, but supervision is needed during outdoor activities.",
  needs: [
    { category: "Personal Care", description: "Assistance with morning wash and dressing.", frequency: "Daily" },
    { category: "Medication", description: "Prompting required for blister pack medication.", frequency: "Twice Daily" },
    { category: "Nutrition", description: "Preparation of hot midday meal.", frequency: "Daily" }
  ],
  risks: [
    { risk: "Wandering", mitigation: "Door sensors installed; supervision required outdoors.", score: 4 },
    { risk: "Falls", mitigation: "Remove loose rugs; ensure well-lit pathways.", score: 2 }
  ],
  goals: ["Maintain current weight", "Attend day center twice weekly"]
};

const CarePlanning: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'care-plan' | 'reablement'>('care-plan');
  
  // --- Care Plan State ---
  const [clientDetails, setClientDetails] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedCarePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Reablement State ---
  const [reviewLoading, setReviewLoading] = useState(false);
  const [progressReview, setProgressReview] = useState<string | null>(null);

  const isReadOnly = user?.role === UserRole.FAMILY || user?.role === UserRole.CLIENT;

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!clientDetails || !medicalHistory) return;
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateCarePlanAI(clientDetails, medicalHistory);
      setGeneratedPlan(plan);
    } catch (e) {
      setError("Failed to generate plan. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeProgress = async () => {
    setReviewLoading(true);
    try {
      const review = await generateProgressReview(MOCK_PROGRESS_LOGS, MOCK_GOALS);
      setProgressReview(review);
    } catch (e) {
      console.error(e);
    } finally {
      setReviewLoading(false);
    }
  };

  // --- Components ---

  const renderPlan = (plan: GeneratedCarePlan) => (
    <div className="bg-white h-full rounded-lg shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Care Plan Details</h2>
          <div className="flex gap-2">
            <button className="p-2 text-slate-600 hover:bg-white rounded border border-transparent hover:border-slate-200"><Printer size={18}/></button>
            {!isReadOnly && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"><Save size={16}/> Save to Profile</button>
            )}
          </div>
      </div>
      
      <div className="p-6 overflow-y-auto space-y-8 max-h-[700px]">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed">{plan.summary}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Identified Needs</h3>
            <div className="grid grid-cols-1 gap-3">
              {plan.needs.map((need, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800">{need.category}</span>
                      <span className="text-xs font-medium px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-500">{need.frequency}</span>
                    </div>
                    <p className="text-sm text-slate-600">{need.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Risk Assessment</h3>
            <div className="space-y-3">
              {plan.risks.map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg border border-l-4 border-slate-100" style={{ borderLeftColor: item.score >= 4 ? '#ef4444' : item.score >= 3 ? '#f59e0b' : '#22c55e' }}>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{item.risk}</h4>
                        <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Mitigation:</span> {item.mitigation}</p>
                    </div>
                    <div className="text-center">
                        <div className={`text-xl font-bold ${item.score >= 4 ? 'text-red-600' : 'text-slate-600'}`}>{item.score}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Risk Score</div>
                    </div>
                  </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Care Goals</h3>
            <ul className="space-y-2">
              {plan.goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="mt-0.5 text-green-500"><Check size={16} /></div>
                  {goal}
                </li>
              ))}
            </ul>
          </section>
      </div>
    </div>
  );

  const renderReablement = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Left Column: Goals & Status */}
      <div className="lg:col-span-2 space-y-6">
        {/* Goal Trackers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={20} /> Reablement Goals
          </h3>
          <div className="space-y-6">
            {MOCK_GOALS.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{goal.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                        goal.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                        goal.status === 'Achieved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>{goal.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{goal.description}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">{goal.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${goal.status === 'Stalled' ? 'bg-amber-400' : 'bg-primary-500'}`} 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">Target: {goal.targetDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="text-primary-600" size={20} /> Progress Sentiment Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_PROGRESS_LOGS}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} 
                  tickFormatter={(val) => val.split('-')[2] + ' Oct'}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 10]} hide />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="progressScore" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Column: Review & Logs */}
      <div className="space-y-6">
        {/* AI Review Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg">
           <h3 className="font-bold mb-4 flex items-center gap-2">
             <Sparkles size={18} className="text-amber-400" /> AI Clinical Review
           </h3>
           
           {progressReview ? (
             <div className="prose prose-invert prose-sm">
               <p className="leading-relaxed">{progressReview}</p>
               <button onClick={() => setProgressReview(null)} className="mt-4 text-xs text-slate-400 underline">Refresh Analysis</button>
             </div>
           ) : (
             <div className="text-center py-6">
               <p className="text-sm text-slate-400 mb-4">Analyze recent logs to detect trends and get care recommendations.</p>
               <button 
                 onClick={handleAnalyzeProgress}
                 disabled={reviewLoading}
                 className="w-full py-2 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2"
               >
                 {reviewLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                 Run Analysis
               </button>
             </div>
           )}
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-sm">Recent Logs</h3>
             <button className="text-primary-600 text-xs font-bold uppercase hover:underline">+ Add Note</button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
             {MOCK_PROGRESS_LOGS.map((log) => (
               <div key={log.id} className="p-4 hover:bg-slate-50">
                 <div className="flex justify-between items-start mb-1">
                   <span className="text-xs font-bold text-slate-500 uppercase">{log.category}</span>
                   <span className="text-xs text-slate-400">{log.date}</span>
                 </div>
                 <p className="text-sm text-slate-700 mb-2">{log.note}</p>
                 <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      log.mood === 'Happy' ? 'bg-green-50 text-green-600 border-green-100' :
                      log.mood === 'Sad' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>{log.mood}</span>
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-slate-300" style={{ width: `${log.progressScore * 10}%` }}></div>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Activity className="text-primary-600" /> Care Planning & Reablement
           </h1>
           <p className="text-slate-500 text-sm mt-1">
             Manage care plans and track recovery progress over time.
           </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('care-plan')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'care-plan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <FileText size={16} /> Care Plan Generator
        </button>
        <button 
          onClick={() => setActiveTab('reablement')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'reablement' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <TrendingUp size={16} /> Reablement Tracker
        </button>
      </div>

      {activeTab === 'care-plan' ? (
        isReadOnly ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            {renderPlan(MOCK_EXISTING_PLAN)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Client Assessment Data</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client Details (Age, Living Situation)</label>
                    <textarea 
                      className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px] text-sm"
                      placeholder="e.g., John Doe, 82 years old. Lives alone..."
                      value={clientDetails}
                      onChange={(e) => setClientDetails(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Conditions & Medical History</label>
                    <textarea 
                      className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px] text-sm"
                      placeholder="e.g., Early stage dementia, Type 2 Diabetes..."
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={isLoading || !clientDetails || !medicalHistory}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    {isLoading ? 'Analyzing & Generating...' : 'Generate Care Plan'}
                  </button>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                      <AlertTriangle size={16} /> {error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-1 min-h-[600px]">
              {!generatedPlan && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>Fill in the details and click Generate.</p>
                </div>
              )}

              {isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-primary-600">
                  <Loader2 size={48} className="animate-spin mb-4" />
                  <p className="font-medium">Consulting guidelines...</p>
                </div>
              )}

              {generatedPlan && renderPlan(generatedPlan)}
            </div>
          </div>
        )
      ) : (
        renderReablement()
      )}
    </div>
  );
};

export default CarePlanning;
