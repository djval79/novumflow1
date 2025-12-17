
import React, { useState } from 'react';
import { 
  CheckSquare, Plus, Brain, Sparkles, Loader2, Calendar, 
  Tag, MoreHorizontal, CheckCircle2, Circle, Clock
} from 'lucide-react';
import { MOCK_TASKS } from '../services/mockData';
import { OfficeTask } from '../types';
import { parseNaturalLanguageTasks } from '../services/geminiService';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<OfficeTask[]>(MOCK_TASKS);
  const [brainDump, setBrainDump] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handlers
  const handleSmartAdd = async () => {
    if (!brainDump.trim()) return;
    setIsProcessing(true);
    try {
      const newTasks = await parseNaturalLanguageTasks(brainDump);
      setTasks([...tasks, ...newTasks]);
      setBrainDump('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const moveTask = (id: string, status: OfficeTask['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  // Render Column
  const renderColumn = (title: string, status: OfficeTask['status']) => {
    const columnTasks = tasks.filter(t => t.status === status);
    
    return (
      <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{title}</h3>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{columnTasks.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {columnTasks.map(task => (
             <div key={task.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                   </span>
                   <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={16} />
                   </button>
                </div>
                
                <h4 className="font-bold text-slate-900 text-sm mb-1">{task.title}</h4>
                {task.description && <p className="text-xs text-slate-500 mb-3">{task.description}</p>}
                
                <div className="flex flex-wrap gap-2 mb-3">
                   {task.tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                         <Tag size={10} /> {tag}
                      </span>
                   ))}
                   {task.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-medium">
                         <Calendar size={10} /> {task.dueDate}
                      </span>
                   )}
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-2 border-t border-slate-50">
                   {status === 'To Do' && (
                      <button onClick={() => moveTask(task.id, 'In Progress')} className="text-xs font-bold text-primary-600 hover:underline">Start</button>
                   )}
                   {status === 'In Progress' && (
                      <button onClick={() => moveTask(task.id, 'Done')} className="text-xs font-bold text-green-600 hover:underline">Complete</button>
                   )}
                   {status === 'Done' && (
                      <button onClick={() => moveTask(task.id, 'To Do')} className="text-xs font-bold text-slate-500 hover:underline">Reopen</button>
                   )}
                </div>
             </div>
          ))}
          {columnTasks.length === 0 && (
             <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-xs">No tasks</p>
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Tasks & Reminders</h1>
             <p className="text-slate-500 text-sm">Manage office workload and daily duties.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="font-bold text-slate-800">{tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length}</span> High Priority
             </div>
             <div className="w-px h-4 bg-slate-200"></div>
             <div className="flex items-center gap-2">
                <Clock size={14} />
                <span className="font-bold text-slate-800">{tasks.filter(t => t.status !== 'Done').length}</span> Pending
             </div>
          </div>
       </div>

       {/* Smart Input */}
       <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
             <div className="flex items-center gap-2 mb-2">
                <Brain className="text-indigo-600" size={18} />
                <h3 className="font-bold text-indigo-900 text-sm">AI Brain Dump</h3>
             </div>
             <textarea 
               className="w-full p-3 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
               placeholder="Type anything... e.g. 'Call Sarah regarding the invoice tomorrow, also check stock for gloves urgently'"
               value={brainDump}
               onChange={(e) => setBrainDump(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleSmartAdd()}
             />
             <p className="text-[10px] text-indigo-500 mt-1 ml-1">Press Ctrl+Enter to process</p>
          </div>
          <button 
            onClick={handleSmartAdd}
            disabled={isProcessing || !brainDump.trim()}
            className="h-full self-end mb-5 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-70"
          >
             {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
             Process Tasks
          </button>
       </div>

       {/* Kanban Board */}
       <div className="flex-1 flex gap-6 overflow-hidden pb-2">
          {renderColumn('To Do', 'To Do')}
          {renderColumn('In Progress', 'In Progress')}
          {renderColumn('Completed', 'Done')}
       </div>
    </div>
  );
};

export default Tasks;
