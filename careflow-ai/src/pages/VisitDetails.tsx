
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, CheckSquare, AlertTriangle, FileText, Key, ShieldAlert, ChevronLeft, Save, Loader2, Navigation } from 'lucide-react';
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
      console.error('Error fetching visit:', error);
      toast.error("Failed to load visit details");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleStatusChange = async () => {
    if (!visit) return;
    setSaving(true);

    try {
      if (visit.status === 'Scheduled') {
        await visitService.updateStatus(visit.id, 'In Progress', 'actual_start');
        setVisit(prev => prev ? { ...prev, status: 'In Progress' } : null);
        toast.success("Visit started");
      } else if (visit.status === 'In Progress') {
        const now = new Date().toISOString();
        await visitService.updateDetails(visit.id, {
          status: 'Completed',
          actual_end: now,
          tasks_completed: tasks,
          notes: notes
        });
        setVisit(prev => prev ? { ...prev, status: 'Completed' } : null);
        toast.success("Visit completed");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      await visitService.updateDetails(visit.id, { notes, tasks_completed: tasks });
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeIncident = async () => {
    if (!notes.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeRiskScenario(notes);
      setAiAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>;
  if (!visit) return <div className="text-center py-10">Visit not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header / Navigation */}
      <div className="flex items-center gap-2 text-slate-500 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-medium">Back to Schedule</span>
      </div>

      {/* Main Visit Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {visit.client.first_name} {visit.client.last_name}
              </h1>
              <div className="flex items-center gap-2 text-slate-600 mt-1 text-sm">
                <MapPin size={16} />
                {visit.client.address}, {visit.client.postcode}
              </div>
            </div>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {visit.visit_type}
            </div>
          </div>

          {/* Key Safe Toggle */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setShowKeySafe(!showKeySafe)}
              className="flex items-center gap-2 text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition-colors"
            >
              <Key size={14} />
              {showKeySafe ? `Code: 1234` : 'Show Access Code'}
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={14} />
              {visit.start_time.slice(0, 5)} - {visit.end_time.slice(0, 5)}
            </div>
          </div>
        </div>

        {/* Check In / Out Action */}
        <div className="p-6 flex flex-col items-center justify-center bg-white border-b border-slate-100">
          <button
            onClick={handleStatusChange}
            disabled={visit.status === 'Completed' || saving}
            className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3
                            ${visit.status === 'Scheduled'
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-900/20'
                : visit.status === 'In Progress'
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
          >
            {saving ? <Loader2 className="animate-spin" /> : (
              <>
                {visit.status === 'Scheduled' && <><Clock /> CHECK IN</>}
                {visit.status === 'In Progress' && <><Clock /> CHECK OUT</>}
                {visit.status === 'Completed' && <><CheckSquare /> VISIT COMPLETED</>}
              </>
            )}
          </button>
          {visit.status === 'In Progress' && (
            <p className="text-xs text-green-600 font-medium mt-3 animate-pulse">
              ● Time tracking active
            </p>
          )}
        </div>

        {/* Tasks */}
        <div className="p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckSquare size={20} className="text-primary-600" />
            Care Tasks
          </h3>
          {tasks.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No specific tasks listed.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                                        ${task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-slate-200 hover:border-primary-300'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                    {task.completed && <CheckSquare size={14} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    disabled={visit.status === 'Completed'}
                    className="hidden"
                  />
                  <span className={`text-sm font-medium ${task.completed ? 'text-green-800 line-through decoration-green-800/30' : 'text-slate-700'}`}>
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Medication (eMAR) */}
      {visit && (
        <MedicationLog
          visitId={visit.id}
          clientId={visit.client.id}
          isReadOnly={visit.status === 'Completed'}
        />
      )}

      {/* Notes & Incident Reporting */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary-600" />
          Visit Notes & Incidents
        </h3>

        <textarea
          className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-h-[120px] mb-4"
          placeholder="Record general notes or describe an incident here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={visit.status === 'Completed'}
        ></textarea>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={saveNotes}
            disabled={saving || visit.status === 'Completed'}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Save size={16} /> Save Notes
          </button>
          <button
            onClick={handleAnalyzeIncident}
            disabled={!notes || isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-200 disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
            Analyze Risk
          </button>
        </div>

        {/* AI Analysis Result */}
        {aiAnalysis && (
          <div className="mt-6 bg-slate-800 text-slate-100 p-5 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold uppercase text-xs tracking-wider">
              <ShieldAlert size={14} /> AI Risk Assessment
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
          </div>
        )}
      </div>
    </div>
  );
}