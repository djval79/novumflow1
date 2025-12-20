
import React, { useState, useEffect } from 'react';
import {
   Plus, Brain, Sparkles, Loader2, Calendar,
   Tag, MoreHorizontal, CheckCircle2, Circle, Clock, Layout, ListTodo, CheckCircle
} from 'lucide-react';
import { officeTaskService } from '../services/supabaseService';
import { OfficeTask } from '../types';
import { parseNaturalLanguageTasks } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Tasks: React.FC = () => {
   const { profile } = useAuth();
   const [tasks, setTasks] = useState<OfficeTask[]>([]);
   const [loading, setLoading] = useState(true);
   const [brainDump, setBrainDump] = useState('');
   const [isProcessing, setIsProcessing] = useState(false);

   // Fetch from database
   useEffect(() => {
      async function loadTasks() {
         setLoading(true);
         try {
            const data = await officeTaskService.getAll(profile?.tenant_id || undefined);
            if (data.length > 0) {
               const mapped = data.map((t: any) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  priority: t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1) || 'Medium',
                  status: (t.status === 'pending' ? 'To Do' : t.status === 'in_progress' ? 'In Progress' : 'Done') as OfficeTask['status'],
                  dueDate: t.dueDate,
                  tags: t.tags || [t.category || 'General'].filter(Boolean)
               }));
               setTasks(mapped);
            } else {
               // Fallback demo data
               setTasks([
                  { id: '1', title: 'Complete weekly timesheet review', description: '', priority: 'High', status: 'To Do', tags: ['Admin'], dueDate: 'Today' },
                  { id: '2', title: 'Update staff rota for next week', description: '', priority: 'Medium', status: 'In Progress', tags: ['Scheduling'], dueDate: 'Tomorrow' },
                  { id: '3', title: 'Send client invoices', description: '', priority: 'High', status: 'To Do', tags: ['Finance'], dueDate: 'Friday' }
               ]);
            }
         } catch (error) {
            toast.error('Failed to load tasks');
            setTasks([]);
         } finally {
            setLoading(false);
         }
      }
      loadTasks();
   }, [profile?.tenant_id]);

   // Handlers
   const handleSmartAdd = async () => {
      if (!brainDump.trim()) return;
      setIsProcessing(true);
      try {
         const newTasks = await parseNaturalLanguageTasks(brainDump);
         if (newTasks && newTasks.length > 0) {
            setTasks([...tasks, ...newTasks]);
            setBrainDump('');
            toast.success(`Successfully extrapolated ${newTasks.length} tasks`);
         } else {
            toast.error('AI failed to identify any tasks');
         }
      } catch (error) {
         toast.error('AI Processing Error', {
            description: 'Could not parse the natural language input.'
         });
      } finally {
         setIsProcessing(false);
      }
   };

   const moveTask = (id: string, status: OfficeTask['status']) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      toast.success(`Task moved to ${status}`);
   };

   const getPriorityColor = (p: string) => {
      switch (p) {
         case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
         case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
         default: return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      }
   };

   // Render Column
   const renderColumn = (title: string, status: OfficeTask['status'], icon: React.ElementType) => {
      const columnTasks = tasks.filter(t => t.status === status);
      const Icon = icon;

      return (
         <div className="flex-1 bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 flex flex-col h-full shadow-inner">
            <div className="flex justify-between items-center mb-6 px-2">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                     <Icon size={18} className="text-slate-900" />
                  </div>
                  <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">{title}</h3>
               </div>
               <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">{columnTasks.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
               {columnTasks.map(task => (
                  <div key={task.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                     <div className="flex justify-between items-start mb-4">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                           {task.priority}
                        </span>
                        <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                           <MoreHorizontal size={18} />
                        </button>
                     </div>

                     <h4 className="font-black text-slate-900 text-base leading-snug mb-2">{task.title}</h4>
                     {task.description && <p className="text-xs text-slate-500 font-bold mb-4 line-clamp-2">{task.description}</p>}

                     <div className="flex flex-wrap gap-2 mb-6">
                        {task.tags.map((tag, i) => (
                           <span key={i} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-200/50">
                              <Tag size={10} /> {tag}
                           </span>
                        ))}
                        {task.dueDate && (
                           <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 px-3 py-1.5 rounded-xl border border-rose-100">
                              <Calendar size={10} /> {task.dueDate}
                           </span>
                        )}
                     </div>

                     {/* Actions */}
                     <div className="pt-4 border-t border-slate-100 flex justify-center">
                        {status === 'To Do' && (
                           <button onClick={() => moveTask(task.id, 'In Progress')} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">Launch Task</button>
                        )}
                        {status === 'In Progress' && (
                           <button onClick={() => moveTask(task.id, 'Done')} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-50 rounded-2xl transition-all">Mark Complete</button>
                        )}
                        {status === 'Done' && (
                           <button onClick={() => moveTask(task.id, 'To Do')} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Re-Sync</button>
                        )}
                     </div>
                  </div>
               ))}
               {columnTasks.length === 0 && (
                  <div className="text-center py-16 text-slate-300 border-2 border-dashed border-slate-200 rounded-[2rem]">
                     <ListTodo className="mx-auto mb-3 opacity-20" size={32} />
                     <p className="text-[10px] font-black uppercase tracking-widest">No Active Vectors</p>
                  </div>
               )}
            </div>
         </div>
      );
   };

   return (
      <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-8 animate-in fade-in duration-500 pb-8">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Board <span className="text-indigo-600">Control</span></h1>
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-3">Operational Intelligence & Vector Management</p>
            </div>
            <div className="flex items-center gap-6 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm pr-6">
               <div className="flex items-center gap-3 ml-4">
                  <div className="w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Critical</span>
                  <span className="text-lg font-black text-slate-900 tracking-tight">{tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length}</span>
               </div>
               <div className="w-px h-8 bg-slate-100"></div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl">
                     <Clock size={16} className="text-slate-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pending</span>
                  <span className="text-lg font-black text-slate-900 tracking-tight">{tasks.filter(t => t.status !== 'Done').length}</span>
               </div>
            </div>
         </div>

         {/* Smart Input - AI Section */}
         <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-[100px] group-hover:bg-indigo-600/30 transition-all duration-1000"></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center">
               <div className="flex-1 w-full scale-100 group-hover:scale-[1.01] transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                        <Brain className="text-indigo-400" size={24} />
                     </div>
                     <div>
                        <h3 className="font-black text-white text-xl uppercase tracking-tight">AI Neural Processor</h3>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Natural Language Task Extrapolation</p>
                     </div>
                  </div>
                  <textarea
                     className="w-full p-8 bg-white/5 border border-white/10 rounded-[2rem] text-white font-bold text-lg placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all resize-none min-h-[120px] shadow-inner"
                     placeholder="Dump your thoughts... e.g. 'Review the care plan for Thomas, call the pharmacy about insulin, and check hygiene stock'"
                     value={brainDump}
                     onChange={(e) => setBrainDump(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleSmartAdd()}
                  />
                  <div className="flex items-center gap-2 mt-4 ml-6 text-slate-500">
                     <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase">Ctrl + Enter</div>
                     <p className="text-[10px] font-black uppercase tracking-widest">To initiate neural scan</p>
                  </div>
               </div>

               <button
                  onClick={handleSmartAdd}
                  disabled={isProcessing || !brainDump.trim()}
                  className="w-full lg:w-64 py-8 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[2rem] shadow-2xl hover:bg-primary-500 hover:shadow-indigo-600/30 transition-all flex flex-col items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed group active:scale-95"
               >
                  <div className="p-4 bg-white/20 rounded-2xl group-hover:rotate-12 transition-transform">
                     {isProcessing ? <Loader2 className="animate-spin" size={32} /> : <Sparkles size={32} />}
                  </div>
                  <span>{isProcessing ? 'Computing...' : 'Sync Tasks'}</span>
               </button>
            </div>
         </div>

         {/* Kanban Board */}
         <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
            {renderColumn('Staging', 'To Do', ListTodo)}
            {renderColumn('Active Session', 'In Progress', Layout)}
            {renderColumn('Archived Sync', 'Done', CheckCircle2)}
         </div>
      </div>
   );
};

export default Tasks;
