
import React, { useState } from 'react';
import {
   Utensils, Droplet, AlertTriangle, Sparkles, Loader2,
   Calendar, ChevronRight, Check, User, ChefHat, Activity, Target, Zap, Waves
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MealPlan } from '../types';
import { generateWeeklyMenu } from '../services/geminiService';
import { toast } from 'sonner';

// Simple client type for this page
interface NutritionClient {
   id: string;
   name: string;
   dietaryRequirements?: string[];
   allergies?: string[];
}

// Default demo data
const DEFAULT_MEALS: MealPlan[] = [
   { id: '1', day: 'Monday', breakfast: 'Porridge with berries', lunch: 'Chicken salad', dinner: 'Fish pie with vegetables', snacks: 'Fruit, Yogurt', calories: 1850 },
   { id: '2', day: 'Tuesday', breakfast: 'Toast with eggs', lunch: 'Soup with bread', dinner: 'Roast chicken', snacks: 'Biscuits, Tea', calories: 1720 },
   { id: '3', day: 'Wednesday', breakfast: 'Cereal with milk', lunch: 'Sandwiches', dinner: 'Shepherd\'s pie', snacks: 'Fruit, Cake', calories: 1900 },
   { id: '4', day: 'Thursday', breakfast: 'Scrambled eggs', lunch: 'Jacket potato', dinner: 'Beef stew', snacks: 'Yogurt, Biscuits', calories: 1680 },
   { id: '5', day: 'Friday', breakfast: 'Porridge', lunch: 'Fish and chips', dinner: 'Pasta bake', snacks: 'Fruit, Ice cream', calories: 2100 }
];

const DEFAULT_CLIENTS: NutritionClient[] = [
   { id: '1', name: 'Mrs. Smith', dietaryRequirements: ['Soft foods', 'Diabetic'], allergies: ['Nuts'] },
   { id: '2', name: 'Mr. Jones', dietaryRequirements: ['Halal'], allergies: ['Shellfish'] },
   { id: '3', name: 'Mrs. Williams', dietaryRequirements: ['Vegetarian'], allergies: [] }
];

const Nutrition: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'menu' | 'hydration' | 'profiles'>('menu');
   const [meals, setMeals] = useState<MealPlan[]>(DEFAULT_MEALS);
   const [clients] = useState<NutritionClient[]>(DEFAULT_CLIENTS);
   const [selectedClient, setSelectedClient] = useState<NutritionClient>(DEFAULT_CLIENTS[0]);
   const [isGenerating, setIsGenerating] = useState(false);

   // Hydration Data (demo for now)
   const hydrationData = [
      { name: 'Mrs Smith', amount: 1200, target: 1500, status: 'on-track' },
      { name: 'Mr Jones', amount: 800, target: 1500, status: 'behind' },
      { name: 'Mrs Williams', amount: 1450, target: 1500, status: 'on-track' }
   ];

   // Handlers
   const handleGenerateMenu = async () => {
      if (!selectedClient.dietaryRequirements || selectedClient.dietaryRequirements.length === 0) {
         toast.warning('Dietary Analysis Blocked', {
            description: 'Client profile must contain valid dietary requirements for neural planning.'
         });
         return;
      }
      setIsGenerating(true);
      const menuToast = toast.loading('Initializing neural culinary architect...');
      try {
         const newMenu = await generateWeeklyMenu(selectedClient.dietaryRequirements);
         if (newMenu.length > 0) {
            setMeals(newMenu);
         }
         toast.success('Gourmet Manifest Synthesized', { id: menuToast });
      } catch (error) {
         toast.error('Culinary Logic Error', { id: menuToast });
      } finally {
         setIsGenerating(false);
      }
   };

   // --- Renderers ---

   const renderMenu = () => (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* Sidebar Control Terminal */}
         <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 px-2">Subject Identity</label>
               <select
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-orange-500/20 transition-all mb-8 shadow-inner cursor-pointer"
                  value={selectedClient.id}
                  onChange={(e) => {
                     setSelectedClient(clients.find(c => c.id === e.target.value) || clients[0]);
                     toast.info('Recalibrating for new subject identity');
                  }}
               >
                  {clients.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
               </select>

               <div className="space-y-6 relative z-10">
                  <div className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-xl border-l-[6px] border-l-orange-500">
                     <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target size={14} /> Dietary Vectors
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {selectedClient.dietaryRequirements?.map((req, i) => (
                           <span key={i} className="text-[9px] font-black bg-orange-50 px-3 py-1.5 rounded-xl text-orange-900 border border-orange-100 uppercase tracking-widest">{req}</span>
                        ))}
                        {(!selectedClient.dietaryRequirements || selectedClient.dietaryRequirements.length === 0) && <span className="text-[9px] font-black text-slate-300 uppercase italic">Null requirements detected</span>}
                     </div>
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-xl border-l-[6px] border-l-rose-500">
                     <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle size={14} /> Hazard Profiles
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {selectedClient.allergies?.map((alg, i) => (
                           <span key={i} className="text-[9px] font-black bg-rose-50 px-3 py-1.5 rounded-xl text-rose-900 border border-rose-100 uppercase tracking-widest">{alg}</span>
                        ))}
                        {(!selectedClient.allergies || selectedClient.allergies.length === 0) && <span className="text-[9px] font-black text-slate-300 uppercase italic">No active hazards</span>}
                     </div>
                  </div>
               </div>

               <button
                  onClick={handleGenerateMenu}
                  disabled={isGenerating}
                  className="w-full mt-10 py-6 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-[1.75rem] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
               >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-orange-400" />}
                  {isGenerating ? 'Synthesizing...' : 'Authorize AI Planner'}
               </button>
            </div>
         </div>

         {/* Menu Stream Terminal */}
         <div className="lg:col-span-3 space-y-8">
            <div className="flex justify-between items-end px-4">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Culinary Weekly Root</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Optimized Nutrient Deployment Cycle</p>
               </div>
               <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-4 py-2 rounded-xl border border-primary-50 shadow-sm uppercase tracking-widest">Calibration Phase: Optimal</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {meals.map((meal, idx) => (
                  <div key={idx} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col group hover:scale-[1.02] transition-transform">
                     <div className="p-8 border-b border-orange-50 bg-slate-50/30 flex justify-between items-center group-hover:bg-slate-900 transition-colors">
                        <span className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px] group-hover:text-white">{meal.day}</span>
                        <div className="flex flex-col items-end">
                           <span className="text-xl font-black text-orange-600 tracking-tighter tabular-nums leading-none group-hover:text-white">{meal.calories || 1850}</span>
                           <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/50">Kilocalories</span>
                        </div>
                     </div>
                     <div className="p-10 space-y-8 flex-1">
                        <div className="space-y-2">
                           <p className="text-[9px] text-orange-500 uppercase font-black tracking-widest">0800 - Breakfast Vector</p>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">{meal.breakfast}</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] text-primary-500 uppercase font-black tracking-widest">1300 - Lunch Matrix</p>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">{meal.lunch}</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] text-indigo-500 uppercase font-black tracking-widest">1830 - Dinner Manifest</p>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">{meal.dinner}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-50">
                           <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2">Interim Nutrients</p>
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed opacity-70 italic">{meal.snacks}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );

   const renderHydration = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] mb-12 flex items-center gap-4 relative z-10 px-2">
               <Waves className="text-primary-600" size={28} /> Fluid Saturation Matrix (mL)
            </h3>
            <div className="h-96 relative z-10 -mx-4">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hydrationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                     <Tooltip
                        cursor={{ fill: 'rgba(37,99,235,0.05)' }}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                     />
                     <Bar dataKey="amount" radius={[12, 12, 0, 0]} barSize={50} animationDuration={2000}>
                        {hydrationData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.amount < 1000 ? '#ef4444' : entry.amount < 1500 ? '#f59e0b' : '#3b82f6'} shadow="0 10px 15px rgba(0,0,0,0.1)" />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-10 mt-10 text-[8px] font-black uppercase tracking-[0.3em]">
               <div className="flex items-center gap-3"><div className="w-4 h-4 bg-primary-600 rounded-lg shadow-lg"></div> Optimal Range (+1500)</div>
               <div className="flex items-center gap-3"><div className="w-4 h-4 bg-amber-500 rounded-lg shadow-lg"></div> Warning Threshold (1000+)</div>
               <div className="flex items-center gap-3"><div className="w-4 h-4 bg-rose-500 rounded-lg shadow-lg"></div> Critical Failure (-1000)</div>
            </div>
         </div>

         <div className="space-y-10">
            <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />
               <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                  <ShieldCheck size={24} /> Clinical Rationale
               </h4>
               <p className="text-sm font-bold text-white leading-relaxed opacity-90 uppercase tracking-tight italic">
                  "Systemic fluid deficiency in geriatric cohorts propagates acute cognitive anomalies, structural fragility, and clinical complications. Rigorous monitoring is non-negotiable."
               </p>
               <button
                  onClick={() => toast.info('Accessing manual hydration telemetry interface')}
                  className="w-full mt-10 py-5 bg-white text-slate-900 font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-2xl active:scale-95"
               >
                  Initiate Telemetry Log
               </button>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
               <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                  <Activity size={20} className="text-rose-600" />
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em]">Active Hazard Alerts</h4>
               </div>
               <div className="divide-y divide-slate-50">
                  {hydrationData.filter(h => h.status !== 'on-track').map((h, idx) => (
                     <div key={idx} className="p-8 flex items-start gap-6 hover:bg-slate-50 transition-colors group">
                        <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl group-hover:scale-110 transition-transform">
                           <AlertTriangle size={24} />
                        </div>
                        <div className="space-y-1">
                           <p className="text-base font-black text-slate-900 uppercase tracking-tight">{h.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                              Deficit detected: {h.amount}ml of {h.target}ml. Critical intervention suggested.
                           </p>
                        </div>
                     </div>
                  ))}
                  {hydrationData.filter(h => h.status !== 'on-track').length === 0 && (
                     <div className="p-12 text-center flex flex-col items-center gap-4">
                        <Check className="text-green-500" size={32} />
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widestAlpha">All identities within safe range</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );

   const renderProfiles = () => (
      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
         <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
               <tr>
                  <th className="px-10 py-8">Subject Identity</th>
                  <th className="px-10 py-8">Nutritional Constraints</th>
                  <th className="px-10 py-8">Active Hazards</th>
                  <th className="px-10 py-8 text-right">Operation</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {clients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl group-hover:scale-110 transition-transform border-4 border-white">
                              {client.name.charAt(0)}
                           </div>
                           <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">{client.name}</span>
                        </div>
                     </td>
                     <td className="px-10 py-8">
                        <div className="flex flex-wrap gap-2">
                           {client.dietaryRequirements?.length ? client.dietaryRequirements.map((r, i) => (
                              <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">{r}</span>
                           )) : <span className="text-slate-300 uppercase text-[9px] italic">Unspecified</span>}
                        </div>
                     </td>
                     <td className="px-10 py-8">
                        <div className="flex flex-wrap gap-2">
                           {client.allergies?.length ? client.allergies.map((a, i) => (
                              <span key={i} className="px-4 py-2 bg-rose-50 text-rose-800 border-2 border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">{a}</span>
                           )) : <span className="text-slate-300 uppercase text-[9px] italic">Safe Spectrum</span>}
                        </div>
                     </td>
                     <td className="px-10 py-8 text-right">
                        <button
                           onClick={() => toast.info('Initiating profile audit sequence')}
                           className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:underline transition-all active:scale-95"
                        >
                           Modify Ledger
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-12 pb-12 animate-in fade-in duration-700 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-6">
                  <ChefHat className="text-orange-500" size={48} />
                  Dietary <span className="text-orange-500">Core</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
                  Metabolic Support, Hydration Telemetry & AI Culinary Synthesis Matrix
               </p>
            </div>
         </div>

         {/* Futuristic Navigation Hub */}
         <div className="flex p-2 bg-white border border-slate-100 rounded-[2.5rem] w-fit shadow-2xl relative z-20">
            <button
               onClick={() => {
                  setActiveTab('menu');
                  toast.info('Accessing Culinary Planning Wing');
               }}
               className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${activeTab === 'menu' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <ChefHat size={18} /> Menu Synthesis
            </button>
            <button
               onClick={() => {
                  setActiveTab('hydration');
                  toast.info('Accessing Fluid Saturation Deck');
               }}
               className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${activeTab === 'hydration' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <Droplet size={18} /> Hydration Grid
            </button>
            <button
               onClick={() => {
                  setActiveTab('profiles');
                  toast.info('Accessing Subject Nutrient Ledgers');
               }}
               className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${activeTab === 'profiles' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <User size={18} /> Subject Ledgers
            </button>
         </div>

         {activeTab === 'menu' && renderMenu()}
         {activeTab === 'hydration' && renderHydration()}
         {activeTab === 'profiles' && renderProfiles()}
      </div>
   );
};

export default Nutrition;
