
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, CheckSquare, AlertTriangle, FileText, Key, ShieldAlert, ChevronLeft, Save, Loader2, Navigation, Star, Activity, User, ShieldCheck } from 'lucide-react';
import { analyzeRiskScenario } from '../services/geminiService';
import { visitService } from '../services/supabaseService';
import { toast } from 'sonner';
import MedicationLog from '../components/MedicationLog';

interface Task {
  id: string;
  label: string;
  completed: boolean;
}

interface VisitDetail {
  id: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    address: string;
    postcode: string;
    care_level: string;
    key_safe_code?: string;
  };
  visit_date: string;
  start_time: string;
  end_time: string;
  visit_type: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Missed' | 'Cancelled';
  tasks: Task[];
  notes: string;
}

export default function VisitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showKeySafe, setShowKeySafe] = useState(false);
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // AI Incident Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchVisit();
  }, [id]);

  const fetchVisit = async () => {
    setLoading(true);
    try {
      const data = await visitService.getById(id!); // Use service
      setVisit(data as any);
      setTasks(data.tasks || []);
      setNotes(data.notes || '');
    } catch (error) {
      toast.error("Failed to load clinical visit parameters");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    toast.success('Vector state updated');
  };

  const handleStatusChange = async () => {
    if (!visit) return;
    setSaving(true);

    try {
      if (visit.status === 'Scheduled') {
        const startToast = toast.loading('Initializing Mission Protocol...');
        await visitService.updateStatus(visit.id, 'In Progress', 'actual_start');
        setVisit(prev => prev ? { ...prev, status: 'In Progress' } : null);
        toast.success("Visit Sync Initialized", { id: startToast });
      } else if (visit.status === 'In Progress') {
        const now = new Date().toISOString();
        const endToast = toast.loading('Synchronizing Data Core...');
        await visitService.updateDetails(visit.id, {
          status: 'Completed',
          actual_end: now,
          tasks_completed: tasks,
          notes: notes
        });
        setVisit(prev => prev ? { ...prev, status: 'Completed' } : null);
        toast.success("Visit Successfully Archived", { id: endToast });
      }
    } catch (error) {
      toast.error("Synchronization Failure", {
        description: 'Failed to update visit status in the clinical cloud.'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      await visitService.updateDetails(visit.id, { notes, tasks_completed: tasks });
      toast.success('Clinical notes synchronized');
    } catch (error) {
      toast.error('Failed to sync notes');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeIncident = async () => {
    if (!notes.trim()) return;
    setIsAnalyzing(true);
    const analysisToast = toast.loading('AI Neural Analysis in progress...');
    try {
      const result = await analyzeRiskScenario(notes);
      setAiAnalysis(result);
      toast.success('Neural Risk Assessment Ready', { id: analysisToast });
    } catch (error) {
      toast.error('Neural Logic Error', { id: analysisToast });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
      <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
      <p className="font-black uppercase tracking-[0.4em] text-[10px] text-slate-400">Loading Clinical Interface...</p>
    </div>
  );

  if (!visit) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
      <div className="p-8 bg-white rounded-[3rem] shadow-2xl border border-slate-200">
        <AlertTriangle size={64} className="text-rose-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Visit Not Detected</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4">The requested visit vector does not exist in the active core.</p>
        <button onClick={() => navigate(-1)} className="mt-10 px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-black transition-all">Return to Command</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
            <ChevronLeft size={20} />
          </div>
          <span className="font-black uppercase tracking-[0.2em] text-[10px]">Return to Ops</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <ShieldCheck size={16} className="text-primary-600" />
          </div>
          <span className="font-black uppercase tracking-widest text-[10px] text-primary-600">Encrypted Session</span>
        </div>
      </div>

      {/* Main Visit Card */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />

        <div className="p-10 border-b border-slate-50 bg-slate-50/30 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-2xl">
                {visit.client.first_name[0]}
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                  {visit.client.first_name} {visit.client.last_name}
                </h1>
                <div className="flex items-center gap-3 text-slate-500 mt-2 font-bold text-xs uppercase tracking-widest">
                  <MapPin size={18} className="text-primary-500" />
                  {visit.client.address}
                </div>
              </div>
            </div>
            <div className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 shadow-lg ${visit.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                visit.status === 'In Progress' ? 'bg-primary-50 text-primary-700 border-primary-200 animate-pulse' :
                  'bg-white text-slate-400 border-slate-100'
              }`}>
              {visit.visit_type} Protocol
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                setShowKeySafe(!showKeySafe);
                if (!showKeySafe) toast.info('Key safe code revealed');
              }}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-6 py-4 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
            >
              <Key size={16} />
              {showKeySafe ? `CODE: ${visit.client.key_safe_code || '1234'}` : 'Reveal Access Vector'}
            </button>
            <div className="flex items-center gap-4 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">
                  {visit.start_time.slice(0, 5)} - {visit.end_time.slice(0, 5)}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-100" />
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{visit.client.care_level} Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Terminal */}
        <div className="p-12 flex flex-col items-center justify-center bg-white border-b border-slate-50">
          <button
            onClick={handleStatusChange}
            disabled={visit.status === 'Completed' || saving}
            className={`w-full max-w-md py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-4 border-b-4
                            ${visit.status === 'Scheduled'
                ? 'bg-primary-600 text-white hover:bg-primary-700 border-primary-800 shadow-primary-500/30'
                : visit.status === 'In Progress'
                  ? 'bg-rose-600 text-white hover:bg-rose-700 border-rose-800 shadow-rose-500/30'
                  : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none border-b-0'
              }`}
          >
            {saving ? <Loader2 className="animate-spin w-6 h-6" /> : (
              <>
                {visit.status === 'Scheduled' && <><Navigation size={24} /> Initialize Visit</>}
                {visit.status === 'In Progress' && <><Clock size={24} /> Terminate Session</>}
                {visit.status === 'Completed' && <><CheckSquare size={24} /> Finalized</>}
              </>
            )}
          </button>
          {visit.status === 'In Progress' && (
            <div className="flex flex-col items-center gap-2 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                <p className="text-[10px] text-rose-600 font-black uppercase tracking-[0.2em]">
                  Clinical Time Tracking Active
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Implementation Grid */}
        <div className="p-10 bg-slate-50/30">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <CheckSquare size={24} className="text-primary-600" />
              Operational Tasks
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {tasks.filter(t => t.completed).length}/{tasks.length} Verified
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-300">
              <ListTodo size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase tracking-widest text-xs">No Directive Vectors Assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer group
                                        ${task.completed
                      ? 'bg-green-50 border-green-200 shadow-inner'
                      : 'bg-white border-slate-100 hover:border-primary-200 hover:shadow-xl'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all group-hover:scale-110
                                            ${task.completed ? 'bg-green-600 border-green-600 shadow-lg' : 'bg-white border-slate-200'}`}>
                      {task.completed && <CheckSquare size={16} className="text-white" />}
                    </div>
                    <span className={`text-sm font-black uppercase tracking-tight ${task.completed ? 'text-green-800/50 line-through' : 'text-slate-700'}`}>
                      {task.label}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    disabled={visit.status === 'Completed'}
                    className="hidden"
                  />
                  {!task.completed && (
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-primary-400">Verify</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Medication (eMAR) - Clinical Integration */}
      {visit && (
        <div className="animate-in fade-in duration-1000 slide-in-from-bottom-8">
          <MedicationLog
            visitId={visit.id}
            clientId={visit.client.id}
            isReadOnly={visit.status === 'Completed'}
          />
        </div>
      )}

      {/* Logic & Neural Reporting Unit */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600" />

        <div className="flex justify-between items-center mb-10">
          <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 text-xl">
            <FileText size={28} className="text-primary-600" />
            Clinical Observation Feed
          </h3>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Brain size={16} className="text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Audit Active</span>
          </div>
        </div>

        <textarea
          className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-bold text-slate-900 text-lg placeholder:text-slate-300 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none min-h-[200px] mb-8 transition-all shadow-inner"
          placeholder="Document daily observations, clinical changes, or high-risk incidents here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={visit.status === 'Completed'}
        ></textarea>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <button
            onClick={saveNotes}
            disabled={saving || visit.status === 'Completed'}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black disabled:opacity-30 transition-all shadow-xl active:scale-95"
          >
            <Save size={18} /> Synchronize Data
          </button>

          <button
            onClick={handleAnalyzeIncident}
            disabled={!notes || isAnalyzing}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95
                        ${isAnalyzing ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30'}`}
          >
            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
            Vector Risk Analysis
          </button>
        </div>

        {/* AI Analysis Diagnostic Terminal */}
        {aiAnalysis && (
          <div className="mt-12 bg-slate-900 p-8 rounded-[2rem] shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <ShieldAlert size={18} className="text-white" />
              </div>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI NEURAL RISK ASSESSMENT</h4>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-white font-bold leading-relaxed whitespace-pre-line text-sm border-l-4 border-indigo-600 pl-6 ml-1">
                {aiAnalysis}
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">CareFlow Engine v2.0 // Logic Processed</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-slate-300 font-black uppercase tracking-[0.4em] text-[8px] pt-10 pb-20">
        Clinical Protocol // Authorized Care Professional Access Only
      </p>
    </div>
  );
}