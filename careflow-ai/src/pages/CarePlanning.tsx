
import React, { useState, useEffect } from 'react';
import { generateCarePlanAI, generateProgressReview } from '../services/geminiService';
import { GeneratedCarePlan, UserRole, CareGoal, ProgressLog, Client } from '../types';
import {
  Sparkles, Check, AlertTriangle, Loader2, Save, Printer, FileText, Lock,
  TrendingUp, Activity, Calendar, CheckCircle2, PlayCircle, PauseCircle, User, Brain, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { carePlanService, clientService } from '../services/supabaseService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const CarePlanning: React.FC = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'care-plan' | 'reablement'>('care-plan');

  // --- Data State ---
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  // --- Care Plan State ---
  const [clientDetails, setClientDetails] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedCarePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Reablement State ---
  const [goals, setGoals] = useState<CareGoal[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [progressReview, setProgressReview] = useState<string | null>(null);

  const isReadOnly = user?.role === UserRole.FAMILY || user?.role === UserRole.CLIENT;

  // --- Effects ---
  useEffect(() => {
    async function loadClients() {
      if (currentTenant) {
        try {
          const data = await clientService.getByTenant(currentTenant.id);
          setClients(data);
          if (data.length > 0) setSelectedClientId(data[0].id);
        } catch (e) {
          toast.error('Client synchronization failure');
        }
      }
    }
    loadClients();
  }, [currentTenant]);

  useEffect(() => {
    async function loadReablementData() {
      if (!selectedClientId) return;
      try {
        const [fetchedGoals, fetchedLogs] = await Promise.all([
          carePlanService.getGoals(selectedClientId),
          carePlanService.getProgressLogs(selectedClientId)
        ]);
        setGoals(fetchedGoals);
        setLogs(fetchedLogs);
      } catch (e) {
        toast.error('Progress data synchronization error');
      }
    }
    if (activeTab === 'reablement') {
      loadReablementData();
    }
  }, [selectedClientId, activeTab]);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!clientDetails || !medicalHistory) {
      toast.warning('Incomplete assessment data', {
        description: 'Please provide client details and medical history for neural analysis.'
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    const generationToast = toast.loading('Initializing neural care architect...');
    try {
      const plan = await generateCarePlanAI(clientDetails, medicalHistory);
      setGeneratedPlan(plan);
      toast.success('Care Plan Synthesis Complete', { id: generationToast });
    } catch (e) {
      toast.error('Neural Logic Error', { id: generationToast });
      setError("Failed to generate plan. Please verify clinical parameters.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !selectedClientId || !currentTenant) return;
    const saveToast = toast.loading('Synchronizing plan with clinical profile...');
    try {
      await carePlanService.savePlan({
        tenantId: currentTenant.id,
        clientId: selectedClientId,
        summary: generatedPlan.summary,
        needs: generatedPlan.needs,
        risks: generatedPlan.risks,
        goals: generatedPlan.goals
      });
      toast.success("Clinical manifest archived successfully", { id: saveToast });
    } catch (e) {
      toast.error("Archive failure", { id: saveToast });
    }
  };

  const handleAnalyzeProgress = async () => {
    setReviewLoading(true);
    const analysisToast = toast.loading('Executing diagnostic progress review...');
    try {
      const review = await generateProgressReview(logs, goals);
      setProgressReview(review);
      toast.success('Diagnostic Review Ready', { id: analysisToast });
    } catch (e) {
      toast.error('Analysis Logic Failure', { id: analysisToast });
    } finally {
      setReviewLoading(false);
    }
  };

  // --- Components ---

  const renderPlan = (plan: GeneratedCarePlan) => (
    <div className="bg-white h-full rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-500 border border-slate-100 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

      <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/20 relative z-10 gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl"><FileText size={24} /></div>
          <h2 className="font-black text-2xl text-slate-900 tracking-tighter uppercase">Clinical Manifest</h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => toast.info('Initiating print sequence')}
            className="p-4 text-slate-400 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-95"
          >
            <Printer size={20} />
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSavePlan}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95"
            >
              <Save size={18} /> Archive to Profile
            </button>
          )}
        </div>
      </div>

      <div className="p-12 overflow-y-auto space-y-12 scrollbar-hide max-h-[800px]">
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-50 shadow-xl hover:border-primary-100 transition-all">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><Activity size={18} className="text-primary-600" /> Executive Summary</h3>
          <p className="text-slate-900 text-lg font-black leading-relaxed tracking-tight underline decoration-primary-500/10 decoration-8 underline-offset-[-2px]">{plan.summary}</p>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 ml-4 flex items-center gap-3"><TrendingUp size={18} className="text-primary-600" /> Key Clinical Needs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan.needs.map((need, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-primary-600 transition-colors">{need.category}</span>
                  <span className="text-[8px] font-black px-3 py-1 bg-white border border-slate-100 rounded-xl text-slate-500 uppercase tracking-widest shadow-sm">{need.frequency}</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">{need.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 ml-4 flex items-center gap-3"><ShieldCheck size={18} className="text-rose-600" /> Risk Vector Audit</h3>
          <div className="space-y-6">
            {plan.risks.map((item, i) => (
              <div key={i} className="flex gap-8 p-10 rounded-[2.5rem] bg-white border-2 border-slate-50 shadow-xl relative overflow-hidden group hover:border-rose-100 transition-all">
                <div className={`absolute left-0 top-0 bottom-0 w-3 transition-opacity duration-1000 ${item.score >= 4 ? 'bg-rose-500' : item.score >= 3 ? 'bg-amber-500' : 'bg-green-500'}`} />
                <div className="flex-1 space-y-3">
                  <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">{item.risk}</h4>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Response Protocol:</p>
                    <p className="text-slate-600 font-bold text-sm tracking-tight leading-relaxed">{item.mitigation}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-[2rem] min-w-[100px] shadow-inner group-hover:scale-110 transition-transform">
                  <div className={`text-4xl font-black tabular-nums tracking-tighter ${item.score >= 4 ? 'text-rose-600' : 'text-slate-900'}`}>{item.score}</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Hazard Index</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl opacity-50" />
          <h3 className="text-[10px] font-black text-green-400 uppercase tracking-[0.5em] mb-10 flex items-center gap-3">
            <Zap size={24} className="text-green-400" /> Strategic Care Goals
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plan.goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-6 p-6 bg-white/5 rounded-[1.75rem] border border-white/10 hover:bg-white/10 transition-all group">
                <div className="mt-1 p-2 bg-green-500 rounded-xl text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] group-hover:scale-125 transition-transform"><Check size={18} /></div>
                <span className="text-white font-black text-sm tracking-tight opacity-90 leading-snug uppercase">{goal}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );

  const renderReablement = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in zoom-in duration-500">
      {/* Left Column: Goals & Status */}
      <div className="lg:col-span-2 space-y-10">
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-12 flex items-center gap-4 relative z-10 px-2">
            <TrendingUp size={24} className="text-primary-600" />
            Active Reablement Vectors
          </h3>
          {goals.length === 0 ? (
            <div className="p-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
              <Activity size={48} className="text-slate-100 mx-auto mb-6" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Null Recovery data detected for this identity.</p>
            </div>
          ) : (
            <div className="space-y-12 relative z-10">
              {goals.map((goal) => (
                <div key={goal.id} className="group">
                  <div className="flex justify-between items-end mb-4 px-2">
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-black text-2xl text-slate-900 tracking-tighter uppercase group-hover:text-primary-600 transition-colors">{goal.category}</span>
                        <span className={`text-[8px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-lg border-2 ${goal.status === 'In Progress' ? 'bg-primary-50 text-primary-600 border-primary-50' :
                            goal.status === 'Achieved' ? 'bg-green-50 text-green-600 border-green-50 shadow-green-100' :
                              'bg-amber-50 text-amber-600 border-amber-50'
                          }`}>{goal.status}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xl">{goal.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-4xl font-black text-primary-600 tracking-tighter tabular-nums mb-1">{goal.progress}%</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Progress Vector</span>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden shadow-inner p-1 border border-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 shadow-sm ${goal.status === 'Stalled' ? 'bg-amber-400' : 'bg-primary-600'}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-end mt-3 px-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar size={12} className="text-primary-400" /> Target Epoch: {goal.targetDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Chart Terminal */}
        <div className="bg-slate-900 p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl opacity-50" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-12 flex items-center gap-4 relative z-10">
            <Activity className="text-primary-500" size={24} />
            Neural Sentiment Trend Matrix
          </h3>
          <div className="h-80 relative z-10 mt-6 -mx-4 group-hover:scale-[1.02] transition-transform duration-1000">
            {logs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...logs].reverse()}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} dy={20}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} domain={[0, 10]} hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', background: '#0f172a', color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                    itemStyle={{ color: '#3b82f6' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="progressScore" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorScore)" animationDuration={3000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <Activity size={64} className="text-white/5" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Trend Data Buffer Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Review & Logs */}
      <div className="space-y-10">
        <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl opacity-50" />
          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-4 relative z-10">
            <Brain size={28} className="text-indigo-400" />
            Neural Assessment Terminal
          </h3>

          {progressReview ? (
            <div className="animate-in zoom-in duration-500 relative z-10">
              <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] border-l-4 border-l-indigo-600 mb-8">
                <p className="text-white text-base font-black italic tracking-tight opacity-90 leading-relaxed uppercase">"{progressReview}"</p>
              </div>
              <button
                onClick={() => {
                  setProgressReview(null);
                  toast.info('Recalibrating Neural Model');
                }}
                className="w-full py-4 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                Trigger Diagnostic Rerun
              </button>
            </div>
          ) : (
            <div className="text-center py-12 relative z-10">
              <div className="p-8 bg-white/5 rounded-[2rem] mb-8 inline-block shadow-inner">
                <Activity size={48} className="text-slate-700" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 leading-relaxed max-w-[240px] mx-auto">Analyze recent clinical vectors to detect recovery anomalies and psychosocial trends.</p>
              <button
                onClick={handleAnalyzeProgress}
                disabled={reviewLoading || logs.length === 0}
                className="w-full py-6 bg-indigo-600 text-white rounded-[1.75rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
              >
                {reviewLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                {reviewLoading ? 'Computing Logic...' : 'Initialize Analysis'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3"><Activity size={18} className="text-primary-600" /> Clinical Log Matrix</h3>
            <button
              onClick={() => toast.info('Accessing clinical note entry')}
              className="text-primary-600 text-[10px] font-black uppercase tracking-widest hover:underline">+ New Protocol</button>
          </div>
          <div className="divide-y divide-slate-50 overflow-y-auto scrollbar-hide flex-1">
            {logs.length > 0 ? logs.map((log) => (
              <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[8px] font-black text-primary-600 uppercase tracking-[0.3em] shadow-sm bg-white px-3 py-1 rounded-xl border border-primary-50">{log.category}</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{log.date}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mb-6 tracking-tight group-hover:text-primary-600 transition-colors uppercase leading-tight">{log.note}</p>
                <div className="flex items-center gap-4">
                  <span className={`text-[8px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border shadow-sm ${log.mood === 'Happy' ? 'bg-green-50 text-green-600 border-green-50' :
                      log.mood === 'Sad' ? 'bg-indigo-50 text-indigo-600 border-indigo-50' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>{log.mood} Target</span>
                  <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100">
                    <div className="h-full bg-slate-900 rounded-full opacity-30" style={{ width: `${log.progressScore * 10}%` }}></div>
                  </div>
                </div>
              </div>
            )) : <div className="p-20 text-center flex flex-col items-center gap-6"><Activity size={48} className="text-slate-100" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Null Log Buffer</p></div>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12 animate-in fade-in duration-700 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-6">
            <Activity className="text-primary-600" size={48} />
            Care <span className="text-primary-600">Architect</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
            Clinical Strategy Synthesis & Reablement Vector Tracking Matrix
          </p>
        </div>
        <div className="flex p-2 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden min-w-[320px]">
          <select
            className="w-full px-6 py-4 bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              toast.info('Synchronizing with new client identity');
            }}
          >
            <option value="">Null Identity...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Futuristic Navigation Console */}
      <div className="flex p-2 bg-white border border-slate-100 rounded-[2.5rem] w-fit shadow-2xl relative z-10">
        <button
          onClick={() => {
            setActiveTab('care-plan');
            toast.info('Accessing Clinical Planner Terminal');
          }}
          className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${activeTab === 'care-plan' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Zap size={18} /> Protocol Architect
        </button>
        <button
          onClick={() => {
            setActiveTab('reablement');
            toast.info('Accessing Recovery Vector Hub');
          }}
          className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${activeTab === 'reablement' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <TrendingUp size={18} /> Recovery Tracking
        </button>
      </div>

      {activeTab === 'care-plan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-10">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-12 flex items-center gap-4 relative z-10 px-2">
                <Brain size={24} className="text-primary-600" />
                Input Clinical Parameters
              </h2>

              <div className="space-y-10 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Subject identity & Environment Matrix</label>
                  <textarea
                    className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 min-h-[160px] text-base font-black tracking-tight transition-all placeholder:text-slate-300 uppercase scrollbar-hide"
                    placeholder="E.G., JOHN DOE, 82 YEARS. LIVES INDEPENDENTLY WITH LIMITED MOBILITY..."
                    value={clientDetails}
                    onChange={(e) => setClientDetails(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Diagnostic Profile & Neural Health Vectors</label>
                  <textarea
                    className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 min-h-[160px] text-base font-black tracking-tight transition-all placeholder:text-slate-300 uppercase scrollbar-hide"
                    placeholder="E.G., EARLY-STAGE COGNITIVE DECLINE, TYPE 2 DIABETES PROTOCOL..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !clientDetails || !medicalHistory || !selectedClientId}
                    className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-black transition-all flex items-center justify-center gap-6 group disabled:opacity-30 active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles className="group-hover:rotate-12 transition-transform" size={24} />}
                    {isLoading ? 'Synthesizing Protocol Strategy...' : 'Authorize AI Protocol Generation'}
                  </button>
                </div>
                {!selectedClientId && <p className="text-[8px] font-black text-rose-500 text-center uppercase tracking-widest bg-rose-50 py-3 rounded-2xl border border-rose-100">Null Client Selected: Blocked from Generation</p>}

                {error && (
                  <div className="p-8 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-[2rem] flex items-center gap-4 border border-rose-200 shadow-xl border-l-8 border-l-rose-500">
                    <AlertTriangle size={24} /> {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100 p-2 min-h-[700px] relative overflow-hidden">
            {!generatedPlan && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 gap-8 animate-in fade-in duration-1000">
                <div className="p-12 bg-white rounded-[3rem] shadow-sm transform hover:rotate-6 transition-transform">
                  <FileText size={64} className="text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter">Plan Architecture IDLE</h3>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest max-w-[240px]">Define clinical parameters and authorize AI synthesis to generate a therapeutic manifest.</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-10">
                <div className="relative">
                  <Loader2 size={80} className="animate-spin text-primary-600" />
                  <Activity className="absolute inset-0 m-auto text-primary-300 animate-pulse" size={32} />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-black text-slate-900 uppercase tracking-[0.4em] text-sm">Consulting Neural Clinical Core...</p>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Optimizing psychosocial vectors for targeted outcomes</span>
                </div>
              </div>
            )}

            {generatedPlan && renderPlan(generatedPlan)}
          </div>
        </div>
      ) : (
        renderReablement()
      )}
    </div>
  );
};

export default CarePlanning;
