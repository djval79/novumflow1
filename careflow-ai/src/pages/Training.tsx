
import React, { useState, useEffect } from 'react';
import {
   GraduationCap, BookOpen, CheckCircle2, Circle, PlayCircle,
   Award, Sparkles, Loader2, Plus, AlertCircle, Trophy, X, Target, Zap, ShieldCheck, History
} from 'lucide-react';
import { generateTrainingQuiz } from '../services/geminiService';
import { GeneratedQuiz } from '../types';
import { trainingService, onboardingService, staffService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const TrainingPage: React.FC = () => {
   const { user, profile } = useAuth();
   const [activeTab, setActiveTab] = useState<'learning' | 'onboarding' | 'quiz'>('learning');
   const [isLoading, setIsLoading] = useState(true);

   const [quizTopic, setQuizTopic] = useState('');
   const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
   const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
   const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
   const [showScore, setShowScore] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   const [modules, setModules] = useState<any[]>([]);
   const [onboardingTasks, setOnboardingTasks] = useState<any[]>([]);
   const [showPlayer, setShowPlayer] = useState(false);
   const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

   useEffect(() => {
      async function loadData() {
         setIsLoading(true);
         try {
            const tenantId = profile?.tenant_id;
            const fetchedModules = await trainingService.getModules(tenantId || undefined);
            if (fetchedModules.length > 0) {
               const mappedModules = fetchedModules.map((m: any) => ({
                  id: m.id,
                  title: m.title,
                  category: m.category?.toUpperCase() || 'GENERAL',
                  duration: `${m.duration || 30} mins`,
                  status: 'Not Started',
                  progress: 0,
                  thumbnailColor: m.category === 'mandatory' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                     m.category === 'refresher' ? 'bg-gradient-to-br from-green-500 to-teal-600' :
                        'bg-gradient-to-br from-purple-500 to-pink-600'
               }));
               setModules(mappedModules);
            } else {
               setModules([
                  { id: '1', title: 'Safeguarding Adults', category: 'MANDATORY', duration: '45 mins', status: 'Not Started', progress: 0, thumbnailColor: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
                  { id: '2', title: 'Fire Safety', category: 'MANDATORY', duration: '30 mins', status: 'Not Started', progress: 0, thumbnailColor: 'bg-gradient-to-br from-rose-500 to-orange-600' },
                  { id: '3', title: 'Infection Control', category: 'MANDATORY', duration: '40 mins', status: 'Not Started', progress: 0, thumbnailColor: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
                  { id: '4', title: 'Moving & Handling', category: 'MANDATORY', duration: '50 mins', status: 'Not Started', progress: 0, thumbnailColor: 'bg-gradient-to-br from-violet-500 to-pink-600' }
               ]);
            }

            const fetchedTasks = await onboardingService.getTasks(tenantId || undefined);
            if (fetchedTasks.length > 0) {
               const mappedTasks = fetchedTasks.map((t: any) => ({
                  id: t.id,
                  task: t.title,
                  staffName: 'New Hire',
                  dueDate: `Day ${t.dueDays || 7}`,
                  completed: false
               }));
               setOnboardingTasks(mappedTasks);
            } else {
               setOnboardingTasks([
                  { id: '1', task: 'Complete Right to Work check', staffName: 'New Hire', dueDate: 'Day 1', completed: false },
                  { id: '2', task: 'Submit DBS application', staffName: 'New Hire', dueDate: 'Day 1', completed: false },
                  { id: '3', task: 'Complete mandatory training modules', staffName: 'New Hire', dueDate: 'Day 7', completed: false },
                  { id: '4', task: 'Shadow experienced carer', staffName: 'New Hire', dueDate: 'Day 14', completed: false }
               ]);
            }
         } catch (error) {
            toast.error('Academy core sync failure');
         } finally {
            setIsLoading(false);
         }
      }
      loadData();
   }, [profile?.tenant_id]);

   const handleStartModule = (moduleId: string, title: string) => {
      setActiveModuleId(moduleId);
      setModules(prev => prev.map(m =>
         m.id === moduleId ? { ...m, status: 'In Progress', progress: 5 } : m
      ));
      setShowPlayer(true);
      toast.info('Initializing Mission Session', { description: `Module: ${title}` });
   };

   const handleCompleteModule = () => {
      if (activeModuleId) {
         setModules(prev => prev.map(m =>
            m.id === activeModuleId ? { ...m, status: 'Completed', progress: 100 } : m
         ));
         toast.success('Competency Verified', { description: 'Module credentials archived successfully.' });
      }
      setShowPlayer(false);
      setActiveModuleId(null);
   };

   const handleGenerateQuiz = async () => {
      if (!quizTopic.trim()) return;
      setIsGeneratingQuiz(true);
      setShowScore(false);
      setGeneratedQuiz(null);
      setUserAnswers({});

      const quizToast = toast.loading('Calibrating AI Assessment Vectors...');
      try {
         const quiz = await generateTrainingQuiz(quizTopic);
         if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            throw new Error('Neural manifest failure');
         }
         setGeneratedQuiz(quiz);
         toast.success('Assessment Initialized', { id: quizToast });
      } catch (error) {
         toast.error('Neural Logic Failure', { id: quizToast });
      } finally {
         setIsGeneratingQuiz(false);
      }
   };

   const handleAnswerSelect = (qIndex: number, optionIndex: number) => {
      setUserAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
   };

   const calculateScore = () => {
      if (!generatedQuiz) return 0;
      let correct = 0;
      generatedQuiz.questions.forEach((q, idx) => {
         if (userAnswers[idx] === q.correctOptionIndex) correct++;
      });
      return correct;
   };

   const handleSaveResult = async () => {
      if (!user || !generatedQuiz) return;
      setIsSaving(true);
      const saveToast = toast.loading('Archiving assessment credentials...');
      try {
         const expiryDate = new Date();
         expiryDate.setFullYear(expiryDate.getFullYear() + 1);

         await staffService.addTrainingRecord({
            userId: user.id,
            trainingName: quizTopic,
            expiryDate: expiryDate.toISOString().split('T')[0],
            status: 'Valid'
         });

         toast.success('Record Encrypted', { id: saveToast, description: 'Neural assessment verified and archived.' });
         setGeneratedQuiz(null);
      } catch (error) {
         toast.error('Archive Failure', { id: saveToast });
      } finally {
         setIsSaving(false);
      }
   };

   const renderLearning = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
         {modules.map(module => (
            <div key={module.id} className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col hover:shadow-primary-500/10 transition-all group relative">
               <div className={`h-48 ${module.thumbnailColor} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                  <div className="p-8 bg-white/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 shadow-2xl transition-transform group-hover:scale-125 group-hover:rotate-6">
                     <PlayCircle className="text-white" size={64} />
                  </div>
               </div>
               <div className="p-10 flex-1 flex flex-col relative z-20">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">{module.category} TIER</span>
                     <span className={`text-[8px] px-4 py-1.5 rounded-xl font-black uppercase tracking-widest border shadow-sm
                     ${module.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                           module.status === 'In Progress' ? 'bg-primary-50 text-primary-700 border-primary-100' :
                              'bg-slate-50 text-slate-400 border-slate-100'}
                  `}>
                        {module.status}
                     </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-2xl tracking-tighter mb-4 uppercase">{module.title}</h3>
                  <div className="flex items-center gap-4 mb-10 overflow-hidden">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha flex items-center gap-3 whitespace-nowrap">
                        <Target size={14} className="text-primary-600" /> {module.duration} Runtime
                     </p>
                     <div className="h-px bg-slate-100 w-full" />
                  </div>

                  <div className="mt-auto space-y-6">
                     <div className="space-y-3">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                           <span>Retention Matrix</span>
                           <span className="text-primary-600">{module.progress}%</span>
                        </div>
                        <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 shadow-inner border border-slate-100">
                           <div
                              className={`h-full rounded-full transition-all duration-1000 shadow-lg ${module.status === 'Completed' ? 'bg-green-500' : 'bg-primary-600'}`}
                              style={{ width: `${module.progress}%` }}
                           ></div>
                        </div>
                     </div>
                     {module.status !== 'Completed' && (
                        <button
                           onClick={() => handleStartModule(module.id, module.title)}
                           className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-[1.5rem] hover:bg-black transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4"
                        >
                           {module.status === 'Not Started' ? 'Initialize Knowledge' : 'Resume Signal'}
                           <Zap size={18} className="text-primary-500" />
                        </button>
                     )}
                  </div>
               </div>
            </div>
         ))}
      </div>
   );

   const renderOnboarding = () => (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-5xl mx-auto">
         <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5"><GraduationCap size={128} className="text-slate-900" /></div>
            <div className="p-12 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center relative z-10">
               <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em] flex items-center gap-4">
                     <History size={24} className="text-primary-600" /> Onboarding Pipeline Vectors
                  </h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Mandatory Progression Audit Manifest</p>
               </div>
               <button className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-4">
                  <Plus size={20} /> Deploy Vector
               </button>
            </div>
            <div className="divide-y divide-slate-50 relative z-10 bg-white">
               {onboardingTasks.map(task => (
                  <div key={task.id} className="p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all group border-l-[12px] border-l-transparent hover:border-l-primary-600">
                     <div className="flex items-center gap-10">
                        <button
                           onClick={() => toast.info('Task verification pending administrative audit')}
                           className={`p-4 rounded-2xl shadow-xl transition-all border-4 border-white ${task.completed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300 hover:scale-110'}`}
                        >
                           {task.completed ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                        </button>
                        <div className="space-y-2">
                           <p className={`font-black text-2xl tracking-tighter uppercase transition-colors ${task.completed ? 'text-slate-300 line-through' : 'text-slate-900 group-hover:text-primary-600'}`}>
                              {task.task}
                           </p>
                           <div className="flex items-center gap-6 overflow-hidden">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Assigned Unit: {task.staffName}</span>
                              <div className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                              <span className="text-[9px] font-black text-primary-600 uppercase tracking-[0.3em] whitespace-nowrap">Target Epoch: {task.dueDate}</span>
                              <div className="h-px bg-slate-100 w-full" />
                           </div>
                        </div>
                     </div>
                     <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-6 py-2.5 rounded-xl border-2 shadow-sm ${task.completed ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {task.completed ? 'Verified' : 'In Flight'}
                     </span>
                  </div>
               ))}
               {onboardingTasks.length === 0 && (
                  <div className="p-32 text-center flex flex-col items-center gap-8 bg-slate-50/20">
                     <div className="p-8 bg-slate-100 rounded-[3rem] opacity-20"><AlertCircle size={64} className="text-slate-900" /></div>
                     <p className="font-black uppercase tracking-[0.5em] text-[10px] text-slate-300">Null Deployment Buffer</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   const renderQuiz = () => (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
         {!generatedQuiz ? (
            <div className="bg-slate-900 p-24 rounded-[4.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] text-center space-y-12 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64 transition-opacity group-hover:opacity-100 opacity-60"></div>
               <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>

               <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl backdrop-blur-3xl relative z-10 transition-transform group-hover:rotate-12 group-hover:scale-110">
                  <Sparkles size={64} className="text-primary-400" />
               </div>
               <div className="relative z-10 space-y-4">
                  <h2 className="text-6xl font-black tracking-tighter uppercase text-white leading-none">AI Neural <span className="text-primary-500">Audit</span></h2>
                  <p className="text-primary-500/60 font-black uppercase tracking-[0.5em] text-[10px] max-w-sm mx-auto">Autonomous Compliance Assessment Infrastructure</p>
               </div>

               <div className="relative max-w-md mx-auto text-left z-20 space-y-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-6">Specialized Ontology</label>
                     <div className="relative">
                        <select
                           className="w-full p-8 bg-white/5 border-2 border-white/5 rounded-[2.5rem] shadow-2xl focus:border-primary-500 outline-none text-white font-black uppercase tracking-widestAlpha transition-all cursor-pointer appearance-none text-[11px]"
                           value={quizTopic}
                           onChange={(e) => setQuizTopic(e.target.value)}
                        >
                           <option value="" className="bg-slate-900 text-slate-600">-- SELECT PROTOCOL TIER --</option>
                           <option value="Safeguarding Adults" className="bg-slate-900">Safeguarding Adults</option>
                           <option value="Infection Prevention & Control" className="bg-slate-900">Infection Control</option>
                           <option value="Fire Safety" className="bg-slate-900">Fire Safety</option>
                           <option value="Medication Administration" className="bg-slate-900">Medication Ops</option>
                           <option value="GDPR & Data Protection" className="bg-slate-900">Data Integrity</option>
                           <option value="Mental Capacity Act" className="bg-slate-900">MCA Layer</option>
                           <option value="Health & Safety" className="bg-slate-900">Health & Safety</option>
                           <option value="Dementia Care" className="bg-slate-900">Dementia Spec</option>
                           <option value="Moving & Handling" className="bg-slate-900">Logistics (Moving)</option>
                        </select>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-primary-500"><Zap size={20} /></div>
                     </div>
                  </div>
                  <button
                     onClick={handleGenerateQuiz}
                     disabled={isGeneratingQuiz || !quizTopic}
                     className="w-full py-8 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-primary-50 transition-all disabled:opacity-30 flex items-center justify-center gap-6 shadow-2xl active:scale-95 group/auth"
                  >
                     {isGeneratingQuiz ? <Loader2 className="animate-spin" size={24} /> : <><Sparkles size={24} className="text-primary-600 group-hover/auth:rotate-12 transition-transform" /> Synthesize Assessment</>}
                  </button>
               </div>
            </div>
         ) : (
            <div className="space-y-12 pb-20 relative">
               <div className="bg-white p-16 rounded-[4.5rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl -mr-48 -mt-48" />
                  <div className="flex justify-between items-center mb-16 border-b border-slate-50 pb-10 relative z-10">
                     <div className="space-y-1">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{generatedQuiz.title}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Section: Clinical Audit Protocol 2.0</p>
                     </div>
                     <button onClick={() => setGeneratedQuiz(null)} className="p-4 hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all bg-slate-50 rounded-3xl">
                        <X size={32} />
                     </button>
                  </div>

                  <div className="space-y-20 relative z-10">
                     {generatedQuiz?.questions?.map((q, idx) => (
                        <div key={idx} className="space-y-10 group/q">
                           <div className="flex items-start gap-8">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-2xl border-4 border-slate-50 group-hover/q:bg-primary-600 transition-colors shrink-0">
                                 {idx + 1}
                              </div>
                              <p className="font-black text-slate-900 text-2xl tracking-tight leading-tight pt-1 lowercase first-letter:uppercase">
                                 {q.question}
                              </p>
                           </div>
                           <div className="space-y-4 pl-20">
                              {q.options?.map((opt, optIdx) => {
                                 let style = "bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-900 hover:bg-white";
                                 if (showScore) {
                                    if (optIdx === q.correctOptionIndex) style = "bg-green-50 border-green-500 text-green-900 shadow-2xl scale-[1.05] z-10";
                                    else if (userAnswers[idx] === optIdx) style = "bg-rose-50 border-rose-300 text-rose-800 opacity-60";
                                    else style = "border-slate-50 opacity-40 grayscale-[0.8]";
                                 } else if (userAnswers[idx] === optIdx) {
                                    style = "bg-primary-50 border-primary-600 text-primary-900 shadow-2xl scale-[1.05] z-10";
                                 }

                                 return (
                                    <button
                                       key={optIdx}
                                       disabled={showScore}
                                       onClick={() => {
                                          handleAnswerSelect(idx, optIdx);
                                          toast.info(`Selection cached for Index ${idx + 1}`);
                                       }}
                                       className={`w-full text-left p-6 rounded-[1.75rem] border-4 text-[13px] font-black uppercase tracking-widest transition-all duration-300 ${style}`}
                                    >
                                       {opt}
                                    </button>
                                 );
                              })}
                           </div>
                           <div className="h-px bg-slate-50 w-full" />
                        </div>
                     ))}
                  </div>

                  {!showScore ? (
                     <button
                        onClick={() => {
                           setShowScore(true);
                           toast.success('Batch Processing Complete');
                        }}
                        className="w-full mt-24 py-10 bg-slate-900 text-white font-black uppercase tracking-[0.5em] text-[12px] rounded-[3rem] hover:bg-black shadow-[0_45px_100px_rgba(0,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-8 group/commit"
                     >
                        Commit Assessment Cipher <Zap size={28} className="text-primary-500 group-hover:scale-125 transition-transform" />
                     </button>
                  ) : (
                     <div className="mt-24 p-20 bg-slate-900 text-white rounded-[4rem] text-center animate-in zoom-in duration-700 relative overflow-hidden shadow-[0_45px_100px_rgba(0,0,0,0.4)]">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full -mr-64 -mt-64 blur-[100px]" />
                        <div className="relative z-10 space-y-10">
                           <Trophy className="mx-auto text-primary-400 drop-shadow-[0_0_30px_rgba(37,99,235,0.5)] animate-bounce" size={80} />
                           <div className="space-y-2">
                              <h3 className="text-8xl font-black tracking-tighter tabular-nums leading-none">{calculateScore()} / 5</h3>
                              <p className={`text-[12px] font-black uppercase tracking-[0.6em] ${calculateScore() >= 4 ? 'text-green-400' : 'text-rose-500'}`}>
                                 {calculateScore() >= 4 ? 'AUTHENTICITY VERIFIED' : 'CALIBRATION REQUIRED'}
                              </p>
                           </div>

                           <div className="h-px bg-white/10 w-full" />

                           <div className="flex gap-8 justify-center items-center">
                              <button
                                 onClick={() => setGeneratedQuiz(null)}
                                 className="px-12 py-6 bg-white/5 border-2 border-white/10 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                              >
                                 Flush Session
                              </button>
                              {calculateScore() >= 4 && (
                                 <button
                                    onClick={handleSaveResult}
                                    disabled={isSaving}
                                    className="px-14 py-6 bg-primary-600 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl hover:bg-primary-500 transition-all flex items-center gap-6 shadow-[0_20px_50px_rgba(37,99,235,0.4)] active:scale-95"
                                 >
                                    {isSaving ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
                                    Vault to Record
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );

   const renderCoursePlayer = () => {
      const activeModule = modules.find(m => m.id === activeModuleId);
      if (!activeModule) return null;

      return (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl p-10 animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-7xl rounded-[5rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] border border-white/10 relative">
               <div className="flex justify-between items-center p-12 bg-slate-900 text-white relative z-10">
                  <div className="flex items-center gap-10">
                     <div className="p-6 bg-primary-600 rounded-[2.5rem] shadow-2xl border-4 border-white/5 animate-pulse">
                        <PlayCircle className="text-white" size={40} />
                     </div>
                     <div className="space-y-1">
                        <h3 className="font-black text-4xl uppercase tracking-tighter leading-none">{activeModule.title}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">SECURE TRAINING CHANNEL • SIMULATION ACTIVE</p>
                     </div>
                  </div>
                  <button onClick={() => setShowPlayer(false)} className="p-5 hover:bg-white hover:text-slate-900 transition-all bg-white/5 rounded-3xl group">
                     <X size={40} className="group-hover:rotate-90 transition-transform" />
                  </button>
               </div>

               <div className="flex-1 bg-slate-950 flex items-center justify-center relative aspect-video shadow-inner overflow-hidden border-y-[12px] border-slate-900">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10 opacity-60" />
                  <div className="text-center text-white space-y-10 relative z-10">
                     <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto border-4 border-white/5 backdrop-blur-3xl shadow-2xl animate-pulse cursor-pointer hover:scale-110 transition-transform">
                        <PlayCircle size={64} className="text-primary-500" />
                     </div>
                     <div className="space-y-2">
                        <p className="font-black uppercase tracking-[0.6em] text-[12px] text-slate-500">KINETIC FEED INITIALIZED</p>
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] animate-pulse">Establishing Clinical Handshake...</p>
                     </div>
                  </div>

                  <div className="absolute bottom-16 left-20 right-20 h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1 z-20 shadow-2xl">
                     <div className="h-full bg-primary-600 rounded-full w-1/3 shadow-[0_0_30px_rgba(37,99,235,0.8)] animate-[shimmer_2s_infinite]"></div>
                  </div>
               </div>

               <div className="p-16 bg-white grid lg:grid-cols-3 gap-20 items-end">
                  <div className="lg:col-span-2 space-y-8">
                     <div className="flex items-center gap-6">
                        <span className="px-6 py-2 bg-slate-900 text-white font-black text-[10px] uppercase rounded-xl tracking-widest shadow-xl">Mission Briefing</span>
                        <div className="flex-1 h-px bg-slate-100" />
                     </div>
                     <p className="text-slate-900 font-extrabold text-2xl leading-relaxed uppercase tracking-tight opacity-70">
                        "SYNCHRONIZE WITH CLINICAL PROTOCOL. MANDATORY SESSION IN PROGRESS. ENSURE FULL TEMPORAL ENGAGEMENT BEFORE INITIATING NEURAL ASSESSMENT VECTORS."
                     </p>
                  </div>
                  <div className="flex items-end justify-end">
                     <button
                        onClick={handleCompleteModule}
                        className="w-full py-8 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[12px] rounded-[2.5rem] hover:bg-black transition-all flex items-center justify-center gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.3)] active:scale-95 group/complete"
                     >
                        <ShieldCheck size={28} className="text-green-500 group-hover:scale-125 transition-transform" /> VERIFY MISSION COMPLETE
                     </button>
                  </div>
               </div>
            </div>
         </div>
      );
   };

   return (
      <div className="max-w-7xl mx-auto space-y-12 pb-20 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
         <div className="flex flex-col md:flex-row justify-between items-end gap-12">
            <div className="space-y-4">
               <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Academy <span className="text-primary-600">Core</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Clinical Intelligence Hub • Autonomous Onboarding • neural assessment
               </p>
            </div>

            <div className="flex p-2 bg-white border border-slate-100 rounded-[2.5rem] w-fit shadow-2xl relative z-50">
               {[
                  { id: 'learning', label: 'Modules', icon: BookOpen },
                  { id: 'onboarding', label: 'Pipeline', icon: GraduationCap },
                  { id: 'quiz', label: 'Audit Lab', icon: Sparkles },
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => {
                        setActiveTab(tab.id as any);
                        toast.info(`Retrieving deck: ${tab.label}`);
                     }}
                     className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                     <tab.icon size={20} /> {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center p-40 gap-10">
               <Loader2 className="animate-spin text-primary-600 w-24 h-24" />
               <p className="font-black uppercase tracking-[0.6em] text-[12px] text-slate-300 animate-pulse">Initializing Academy Mesh Grid...</p>
            </div>
         ) : (
            <div className="animate-in fade-in duration-700">
               {activeTab === 'learning' && renderLearning()}
               {activeTab === 'onboarding' && renderOnboarding()}
               {activeTab === 'quiz' && renderQuiz()}
            </div>
         )}

         {showPlayer && renderCoursePlayer()}
      </div>
   );
};

export default TrainingPage;
