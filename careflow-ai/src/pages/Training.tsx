
import React, { useState } from 'react';
import {
   GraduationCap, BookOpen, CheckCircle2, Circle, PlayCircle,
   Award, Sparkles, Loader2, Plus, AlertCircle, Trophy
} from 'lucide-react';
import { MOCK_TRAINING_MODULES, MOCK_ONBOARDING_TASKS } from '../services/mockData';
import { generateTrainingQuiz } from '../services/geminiService';
import { GeneratedQuiz, QuizQuestion } from '../types';

import { useAuth } from '../context/AuthContext';
import { staffService } from '../services/supabaseService';

const ClockIcon = ({ size }: { size: number }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
   </svg>
);

const TrainingPage: React.FC = () => {
   const { user } = useAuth();
   const [activeTab, setActiveTab] = useState<'learning' | 'onboarding' | 'quiz'>('learning');

   // Quiz State
   const [quizTopic, setQuizTopic] = useState('');
   const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
   const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
   const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
   const [showScore, setShowScore] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   // Handlers
   const handleGenerateQuiz = async () => {
      if (!quizTopic.trim()) return;
      setIsGeneratingQuiz(true);
      setShowScore(false);
      setGeneratedQuiz(null);
      setUserAnswers({});

      try {
         const quiz = await generateTrainingQuiz(quizTopic);
         setGeneratedQuiz(quiz);
      } catch (error) {
         console.error(error);
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
      try {
         const expiryDate = new Date();
         expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Valid for 1 year

         await staffService.addTrainingRecord({
            userId: user.id,
            trainingName: quizTopic,
            expiryDate: expiryDate.toISOString().split('T')[0],
            status: 'Valid'
         });

         alert('Assessment saved to your training record!');
         setGeneratedQuiz(null); // Reset
      } catch (error) {
         console.error('Error saving result:', error);
         alert('Failed to save result. Please try again.');
      } finally {
         setIsSaving(false);
      }
   };

   // --- Renderers ---

   const renderLearning = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
         {MOCK_TRAINING_MODULES.map(module => (
            <div key={module.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className={`h-32 ${module.thumbnailColor} flex items-center justify-center`}>
                  <PlayCircle className="text-white/80" size={48} />
               </div>
               <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{module.category}</span>
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border
                     ${module.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                           module.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'}
                  `}>
                        {module.status}
                     </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{module.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                     <ClockIcon size={14} /> {module.duration}
                  </p>

                  <div className="mt-auto">
                     <div className="flex justify-between text-xs mb-1 font-medium">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                     </div>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                           className={`h-full rounded-full ${module.status === 'Completed' ? 'bg-green-500' : 'bg-primary-500'}`}
                           style={{ width: `${module.progress}%` }}
                        ></div>
                     </div>
                     {module.status !== 'Completed' && (
                        <button className="w-full mt-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm">
                           {module.status === 'Not Started' ? 'Start Course' : 'Continue'}
                        </button>
                     )}
                  </div>
               </div>
            </div>
         ))}
      </div>
   );

   const renderOnboarding = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">New Hire Checklists</h3>
               <button className="text-primary-600 text-sm font-bold hover:underline flex items-center gap-1">
                  <Plus size={16} /> Assign Task
               </button>
            </div>
            <div className="divide-y divide-slate-100">
               {MOCK_ONBOARDING_TASKS.map(task => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                     <div className="flex items-center gap-4">
                        <button className={`p-1 rounded-full ${task.completed ? 'text-green-600' : 'text-slate-300 hover:text-slate-400'}`}>
                           {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        <div>
                           <p className={`font-bold text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {task.task}
                           </p>
                           <p className="text-xs text-slate-500">Assignee: <span className="font-medium text-slate-700">{task.staffName}</span> • Due: {task.dueDate}</p>
                        </div>
                     </div>
                     <span className={`text-xs font-bold px-2 py-1 rounded ${task.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {task.completed ? 'Done' : 'Pending'}
                     </span>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );

   const renderQuiz = () => (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
         {!generatedQuiz ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-6">
               <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles size={40} />
               </div>
               <div>
                  <h2 className="text-2xl font-bold text-slate-900">CQC Knowledge Check</h2>
                  <p className="text-slate-500 mt-2">Generate a mandatory compliance assessment. Questions are auto-generated by AI to ensure variety.</p>
               </div>

               <div className="relative max-w-md mx-auto text-left">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Assessment Topic</label>
                  <select
                     className="w-full p-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                     value={quizTopic}
                     onChange={(e) => setQuizTopic(e.target.value)}
                  >
                     <option value="">-- Select Topic --</option>
                     <option value="Safeguarding Adults">Safeguarding Adults</option>
                     <option value="Infection Prevention & Control">Infection Prevention & Control</option>
                     <option value="Fire Safety">Fire Safety</option>
                     <option value="Medication Administration">Medication Administration</option>
                     <option value="GDPR & Data Protection">GDPR & Data Protection</option>
                     <option value="Mental Capacity Act">Mental Capacity Act</option>
                     <option value="Health & Safety">Health & Safety</option>
                     <option value="Dementia Care">Dementia Care</option>
                     <option value="Moving & Handling">Moving & Handling</option>
                  </select>
                  <button
                     onClick={handleGenerateQuiz}
                     disabled={isGeneratingQuiz || !quizTopic}
                     className="w-full mt-4 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     {isGeneratingQuiz ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> Generate Assessment</>}
                  </button>
               </div>
            </div>
         ) : (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-slate-900">{generatedQuiz.title}</h2>
                     <button onClick={() => setGeneratedQuiz(null)} className="text-sm text-slate-500 hover:text-slate-900">Quit</button>
                  </div>

                  <div className="space-y-8">
                     {generatedQuiz.questions.map((q, idx) => (
                        <div key={idx} className="space-y-3">
                           <p className="font-bold text-slate-800"><span className="text-slate-400 mr-2">{idx + 1}.</span>{q.question}</p>
                           <div className="space-y-2 pl-6">
                              {q.options.map((opt, optIdx) => {
                                 let style = "border-slate-200 hover:bg-slate-50";
                                 if (showScore) {
                                    if (optIdx === q.correctOptionIndex) style = "bg-green-100 border-green-500 text-green-900 font-bold";
                                    else if (userAnswers[idx] === optIdx) style = "bg-red-100 border-red-300 text-red-800";
                                    else style = "border-slate-200 opacity-50";
                                 } else if (userAnswers[idx] === optIdx) {
                                    style = "bg-purple-50 border-purple-500 text-purple-900 font-bold";
                                 }

                                 return (
                                    <button
                                       key={optIdx}
                                       disabled={showScore}
                                       onClick={() => handleAnswerSelect(idx, optIdx)}
                                       className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${style}`}
                                    >
                                       {opt}
                                    </button>
                                 );
                              })}
                           </div>
                        </div>
                     ))}
                  </div>

                  {!showScore ? (
                     <button
                        onClick={() => setShowScore(true)}
                        className="w-full mt-8 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-900/20"
                     >
                        Submit Answers
                     </button>
                  ) : (
                     <div className="mt-8 p-6 bg-slate-900 text-white rounded-xl text-center animate-in zoom-in">
                        <Trophy className="mx-auto text-yellow-400 mb-2" size={32} />
                        <h3 className="text-2xl font-bold mb-1">You scored {calculateScore()} / 5</h3>
                        <p className="text-slate-400 mb-4">
                           {calculateScore() >= 4 ? 'Great job! You passed.' : 'Review the material and try again.'}
                        </p>

                        <div className="flex gap-3 justify-center">
                           <button
                              onClick={() => setGeneratedQuiz(null)}
                              className="px-6 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20"
                           >
                              Try Another
                           </button>
                           {calculateScore() >= 4 && (
                              <button
                                 onClick={handleSaveResult}
                                 disabled={isSaving}
                                 className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2"
                              >
                                 {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                 Save to Record
                              </button>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Training Academy</h1>
            <p className="text-slate-500 text-sm">Staff onboarding, compliance training, and knowledge checks.</p>
         </div>

         <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
            <button
               onClick={() => setActiveTab('learning')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'learning' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <BookOpen size={16} /> My Learning
            </button>
            <button
               onClick={() => setActiveTab('onboarding')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'onboarding' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <Award size={16} /> Onboarding
            </button>
            <button
               onClick={() => setActiveTab('quiz')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'quiz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <Sparkles size={16} /> AI Quiz
            </button>
         </div>

         {activeTab === 'learning' && renderLearning()}
         {activeTab === 'onboarding' && renderOnboarding()}
         {activeTab === 'quiz' && renderQuiz()}
      </div>
   );
};

export default TrainingPage;
