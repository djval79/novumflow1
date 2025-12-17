
import React, { useState } from 'react';
import { 
  Building2, ShieldCheck, CreditCard, BookOpen, Plus, Trash2, 
  Save, Sparkles, Loader2, FileText, Download, Users 
} from 'lucide-react';
import { generatePolicyDocument } from '../services/geminiService';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'compliance' | 'finance' | 'policies'>('compliance');
  
  // --- State for Compliance ---
  const [trainingModules, setTrainingModules] = useState([
    { id: 1, name: 'DBS Check', renewal: 36, required: true },
    { id: 2, name: 'Safeguarding Adults L2', renewal: 12, required: true },
    { id: 3, name: 'Manual Handling', renewal: 12, required: true },
    { id: 4, name: 'Medication Administration', renewal: 12, required: true },
    { id: 5, name: 'Fire Safety', renewal: 24, required: false },
  ]);
  const [newModule, setNewModule] = useState('');

  // --- State for Policies ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPolicy, setGeneratedPolicy] = useState<string | null>(null);

  // --- Handlers ---
  const toggleRequired = (id: number) => {
    setTrainingModules(prev => prev.map(m => m.id === id ? { ...m, required: !m.required } : m));
  };

  const deleteModule = (id: number) => {
    setTrainingModules(prev => prev.filter(m => m.id !== id));
  };

  const addModule = () => {
    if (newModule.trim()) {
      setTrainingModules([...trainingModules, { id: Date.now(), name: newModule, renewal: 12, required: true }]);
      setNewModule('');
    }
  };

  const handleGeneratePolicy = async () => {
    setIsGenerating(true);
    const requiredList = trainingModules.filter(m => m.required).map(m => m.name);
    const policy = await generatePolicyDocument(requiredList, "CareFlow AI Services");
    setGeneratedPolicy(policy);
    setIsGenerating(false);
  };

  // --- Render Methods ---

  const renderCompliance = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm flex gap-3">
          <ShieldCheck className="shrink-0" size={20} />
          <p>These settings control the <strong>Compliance Traffic Light</strong> system on staff profiles. Staff missing these modules will be flagged as non-compliant.</p>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                   <th className="px-6 py-4 font-medium">Training / Check Name</th>
                   <th className="px-6 py-4 font-medium">Renewal Period (Months)</th>
                   <th className="px-6 py-4 font-medium text-center">Mandatory?</th>
                   <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {trainingModules.map(m => (
                   <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{m.name}</td>
                      <td className="px-6 py-4 text-slate-600">Every {m.renewal} Months</td>
                      <td className="px-6 py-4 text-center">
                         <button 
                           onClick={() => toggleRequired(m.id)}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.required ? 'bg-primary-600' : 'bg-slate-200'}`}
                         >
                           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${m.required ? 'translate-x-6' : 'translate-x-1'}`} />
                         </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => deleteModule(m.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors">
                            <Trash2 size={18} />
                         </button>
                      </td>
                   </tr>
                ))}
                <tr className="bg-slate-50">
                   <td className="px-6 py-3" colSpan={3}>
                      <input 
                        type="text" 
                        placeholder="Add new training module..." 
                        className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400"
                        value={newModule}
                        onChange={(e) => setNewModule(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addModule()}
                      />
                   </td>
                   <td className="px-6 py-3 text-right">
                      <button onClick={addModule} className="text-primary-600 font-bold text-sm hover:underline flex items-center justify-end gap-1 w-full">
                         <Plus size={16} /> Add
                      </button>
                   </td>
                </tr>
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Staff Pay Rates */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18}/> Standard Pay Rates</h3>
            <div className="space-y-4">
               {['Care Assistant', 'Senior Carer', 'Nurse', 'Coordinator'].map(role => (
                  <div key={role} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <span className="text-sm font-medium text-slate-700">{role}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">£/hr</span>
                        <input type="number" className="w-20 p-1 text-right border border-slate-300 rounded text-sm" defaultValue={role === 'Nurse' ? 25 : 12} />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Client Charge Rates */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard size={18}/> Client Charge Rates</h3>
            <div className="space-y-4">
               {[
                 { name: 'Private (Weekday)', val: 28 },
                 { name: 'Private (Weekend)', val: 32 },
                 { name: 'Local Authority', val: 22.50 },
                 { name: 'NHS Continuing Care', val: 25 },
               ].map(rate => (
                  <div key={rate.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <span className="text-sm font-medium text-slate-700">{rate.name}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">£/hr</span>
                        <input type="number" className="w-20 p-1 text-right border border-slate-300 rounded text-sm" defaultValue={rate.val.toFixed(2)} />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
      <div className="flex justify-end">
         <button className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
            <Save size={18} /> Save Rates
         </button>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 h-[calc(100vh-16rem)]">
       <div className="col-span-1 space-y-4">
          <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 text-purple-900">
             <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Sparkles size={18}/> AI Policy Writer</h3>
             <p className="text-sm mb-4">
                Generate a compliant "Staff Training Policy" document automatically based on the modules configured in the Compliance tab.
             </p>
             <button 
               onClick={handleGeneratePolicy}
               disabled={isGenerating}
               className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold shadow-md hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
             >
                {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18}/>}
                {isGenerating ? 'Drafting Policy...' : 'Generate Policy'}
             </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
             <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase">Previous Drafts</div>
             <div className="divide-y divide-slate-100">
                <div className="p-3 text-sm hover:bg-slate-50 cursor-pointer text-slate-600">Safeguarding_Policy_v2.pdf</div>
                <div className="p-3 text-sm hover:bg-slate-50 cursor-pointer text-slate-600">Lone_Worker_Policy_2023.pdf</div>
             </div>
          </div>
       </div>

       <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Document Preview</h3>
             {generatedPolicy && (
                <button className="text-slate-500 hover:text-primary-600"><Download size={20}/></button>
             )}
          </div>
          <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
             {generatedPolicy ? (
                <div className="prose prose-slate max-w-none">
                   <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                      {generatedPolicy}
                   </pre>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <BookOpen size={48} className="mb-4 opacity-20" />
                   <p>No document generated yet.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
         <h1 className="text-2xl font-bold text-slate-900">Settings & Configuration</h1>
         <p className="text-slate-500 text-sm">Manage organization rules, compliance requirements, and automated document generation.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
         {[
            { id: 'general', label: 'General', icon: Building2 },
            { id: 'compliance', label: 'Compliance Rules', icon: ShieldCheck },
            { id: 'finance', label: 'Finance & Rates', icon: CreditCard },
            { id: 'policies', label: 'AI Policies', icon: BookOpen },
         ].map((tab) => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                  ? 'border-primary-500 text-primary-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
               }`}
            >
               <tab.icon size={16} />
               {tab.label}
            </button>
         ))}
      </div>

      <div className="flex-1">
         {activeTab === 'general' && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl animate-in fade-in">
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                     <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="CareFlow AI Services" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">CQC Provider ID</label>
                     <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="1-123456789" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                     <textarea className="w-full p-2 border border-slate-300 rounded-lg h-24" defaultValue="123 Care Avenue, London, SW1A 1AA" />
                  </div>
                  <button className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700">
                     Update Profile
                  </button>
               </div>
            </div>
         )}
         {activeTab === 'compliance' && renderCompliance()}
         {activeTab === 'finance' && renderFinance()}
         {activeTab === 'policies' && renderPolicies()}
      </div>
    </div>
  );
};

export default Settings;
