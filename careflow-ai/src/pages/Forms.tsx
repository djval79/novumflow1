
import React, { useState, useEffect } from 'react';
import {
   ClipboardCheck, Plus, Search, FileText, CheckCircle2,
   AlertCircle, Sparkles, Loader2, Calendar, ChevronRight, Play,
   Save, X
} from 'lucide-react';
import { formService } from '../services/supabaseService';
import { FormTemplate, FormSubmission } from '../types';
import { generateFormTemplate } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { toast } from 'sonner';

const FormsPage: React.FC = () => {
   const { user } = useAuth();
   const { currentTenant } = useTenant();
   const [activeTab, setActiveTab] = useState<'library' | 'submissions'>('library');
   const [templates, setTemplates] = useState<FormTemplate[]>([]);
   const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   // AI Generator State
   const [isGenerating, setIsGenerating] = useState(false);
   const [generationPrompt, setGenerationPrompt] = useState('');
   const [showGenerator, setShowGenerator] = useState(false);

   // Form Runner State
   const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
   const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});

   useEffect(() => {
      if (currentTenant) {
         loadData();
      }
   }, [currentTenant, activeTab]);

   const loadData = async () => {
      setIsLoading(true);
      try {
         if (activeTab === 'library') {
            const data = await formService.getTemplates();
            setTemplates(data);
         } else {
            const data = await formService.getSubmissions();
            setSubmissions(data);
         }
      } catch (error) {
         console.error("Error loading forms data", error);
         toast.error("Failed to load data");
      } finally {
         setIsLoading(false);
      }
   };

   // --- Handlers ---

   const handleGenerateForm = async () => {
      if (!generationPrompt.trim() || !currentTenant) return;
      setIsGenerating(true);
      try {
         const newTemplate = await generateFormTemplate(generationPrompt);

         // Save the generated template to DB
         await formService.createTemplate({
            tenantId: currentTenant.id,
            title: newTemplate.title,
            category: newTemplate.category,
            questions: newTemplate.questions
         });

         toast.success("Template generated and saved!");
         setShowGenerator(false);
         setGenerationPrompt('');

         // Reload templates
         const data = await formService.getTemplates();
         setTemplates(data);

      } catch (error) {
         console.error(error);
         toast.error("Failed to generate form");
      } finally {
         setIsGenerating(false);
      }
   };

   const handleStartAudit = (template: FormTemplate) => {
      setActiveTemplate(template);
      setFormAnswers({});
   };

   const handleSubmitAudit = async () => {
      if (!activeTemplate || !user || !currentTenant) return;

      // Auto-detect status based on answers (simple logic: checks for any "No" on Yes/No questions)
      // Actually, let's keep it simple for now as 'Submitted'
      // But if we want to flag, we could inspect answers.
      const hasFailures = Object.entries(formAnswers).some(([k, v]) => v === false);
      const status = hasFailures ? 'Flagged' : 'Submitted';

      try {
         await formService.submitForm({
            tenantId: currentTenant.id,
            formName: activeTemplate.title,
            formType: activeTemplate.category,
            responses: formAnswers,
            status: status
         });

         toast.success("Audit submitted successfully");
         setActiveTemplate(null);
         setActiveTab('submissions');
      } catch (error) {
         console.error("Error submitting audit", error);
         toast.error("Failed to submit audit");
      }
   };

   const updateAnswer = (qId: string, value: any) => {
      setFormAnswers(prev => ({ ...prev, [qId]: value }));
   };

   // --- Renderers ---

   const renderLibrary = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
         {/* Create New Card */}
         <div
            onClick={() => setShowGenerator(true)}
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer min-h-[200px] group"
         >
            <div className="p-3 bg-white rounded-full mb-3 group-hover:shadow-md transition-shadow">
               <Sparkles size={24} />
            </div>
            <span className="font-bold">Create with AI</span>
            <span className="text-xs mt-1">Generate checklist from topic</span>
         </div>

         {/* Template Cards */}
         {templates.map(tpl => (
            <div key={tpl.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
               <div>
                  <div className="flex justify-between items-start mb-3">
                     <div className={`p-2 rounded-lg ${tpl.category === 'Safety' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <ClipboardCheck size={24} />
                     </div>
                     <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{tpl.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{tpl.title}</h3>
                  <p className="text-xs text-slate-500">{tpl.questions.length} Questions • Created by AI</p>
               </div>
               <button
                  onClick={() => handleStartAudit(tpl)}
                  className="w-full mt-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 flex items-center justify-center gap-2 transition-colors"
               >
                  <Play size={16} /> Start Audit
               </button>
            </div>
         ))}
      </div>
   );

   const renderSubmissions = () => (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
         <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
               <tr>
                  <th className="px-6 py-3 font-medium">Audit Name</th>
                  <th className="px-6 py-3 font-medium">Submitted By</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-bold text-slate-900">{sub.templateTitle}</td>
                     <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                           {(sub.submittedBy || '?').charAt(0)}
                        </div>
                        {sub.submittedBy || 'Unknown'}
                     </td>
                     <td className="px-6 py-4 text-slate-600">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase flex items-center w-fit gap-1 ${sub.status === 'Flagged' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                           }`}>
                           {sub.status === 'Flagged' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                           {sub.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button className="text-primary-600 font-medium hover:underline text-xs">View Details</button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         {submissions.length === 0 && <div className='p-8 text-center text-slate-400'>No submissions yet</div>}
      </div>
   );

   return (
      <div className="space-y-6 relative">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Forms & Quality Assurance</h1>
            <p className="text-slate-500 text-sm">Conduct audits, safety checks, and assessments.</p>
         </div>

         {/* Tabs */}
         <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
            <button
               onClick={() => setActiveTab('library')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <FileText size={16} /> Template Library
            </button>
            <button
               onClick={() => setActiveTab('submissions')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'submissions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <CheckCircle2 size={16} /> Submissions
            </button>
         </div>

         {activeTab === 'library' && (isLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> : renderLibrary())}
         {activeTab === 'submissions' && (isLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> : renderSubmissions())}

         {/* AI Generator Modal */}
         {showGenerator && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={20} /> AI Form Builder
                     </h3>
                     <button onClick={() => setShowGenerator(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Describe the form you need (e.g., "Monthly Fire Safety Check" or "New Client Onboarding Checklist") and AI will generate it.</p>

                  <textarea
                     className="w-full p-3 border border-slate-300 rounded-lg h-24 mb-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                     placeholder="e.g. Create a spot check form for medication administration..."
                     value={generationPrompt}
                     onChange={(e) => setGenerationPrompt(e.target.value)}
                  />

                  <button
                     onClick={handleGenerateForm}
                     disabled={isGenerating || !generationPrompt}
                     className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                     {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                     {isGenerating ? 'Generating Template...' : 'Generate Form'}
                  </button>
               </div>
            </div>
         )}

         {/* Form Runner Modal */}
         {activeTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">{activeTemplate.title}</h3>
                        <span className="text-xs text-slate-500 uppercase font-bold">{activeTemplate.category} Audit</span>
                     </div>
                     <button onClick={() => setActiveTemplate(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                     {activeTemplate.questions.map((q, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                           <label className="block font-bold text-slate-800 mb-3">
                              <span className="text-slate-400 mr-2">{idx + 1}.</span>
                              {q.text}
                              {q.required && <span className="text-red-500 ml-1">*</span>}
                           </label>

                           {q.type === 'Text' && (
                              <input
                                 type="text"
                                 className="w-full p-3 border border-slate-300 rounded-lg"
                                 placeholder="Enter details..."
                                 onChange={(e) => updateAnswer(q.id || `q${idx}`, e.target.value)}
                              />
                           )}

                           {q.type === 'YesNo' && (
                              <div className="flex gap-4">
                                 <button
                                    onClick={() => updateAnswer(q.id || `q${idx}`, true)}
                                    className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${formAnswers[q.id || `q${idx}`] === true ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                 >
                                    Yes / Pass
                                 </button>
                                 <button
                                    onClick={() => updateAnswer(q.id || `q${idx}`, false)}
                                    className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${formAnswers[q.id || `q${idx}`] === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                 >
                                    No / Fail
                                 </button>
                              </div>
                           )}

                           {q.type === 'Rating' && (
                              <div className="flex justify-between gap-2">
                                 {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                       key={num}
                                       onClick={() => updateAnswer(q.id || `q${idx}`, num)}
                                       className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${formAnswers[q.id || `q${idx}`] === num ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                       {num}
                                    </button>
                                 ))}
                              </div>
                           )}

                           {q.type === 'Date' && (
                              <input
                                 type="date"
                                 className="w-full p-3 border border-slate-300 rounded-lg"
                                 onChange={(e) => updateAnswer(q.id || `q${idx}`, e.target.value)}
                              />
                           )}
                        </div>
                     ))}
                  </div>

                  <div className="p-6 border-t border-slate-100 flex justify-end gap-4">
                     <button onClick={() => setActiveTemplate(null)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                     <button
                        onClick={handleSubmitAudit}
                        className="px-8 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-900/20"
                     >
                        <CheckCircle2 size={20} /> Submit Audit
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default FormsPage;
