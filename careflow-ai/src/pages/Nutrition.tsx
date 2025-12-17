
import React, { useState } from 'react';
import { 
  Utensils, Droplet, AlertTriangle, Sparkles, Loader2, 
  Calendar, ChevronRight, Check, User, ChefHat
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_MEALS, MOCK_HYDRATION, MOCK_CLIENTS } from '../services/mockData';
import { MealPlan, HydrationLog, Client } from '../types';
import { generateWeeklyMenu } from '../services/geminiService';

const Nutrition: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'hydration' | 'profiles'>('menu');
  const [meals, setMeals] = useState<MealPlan[]>(MOCK_MEALS);
  const [selectedClient, setSelectedClient] = useState<Client>(MOCK_CLIENTS[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Hydration Data processing
  const hydrationData = MOCK_HYDRATION.map(log => ({
    name: log.clientName.split(' ')[0],
    amount: log.amountMl,
    target: log.targetMl,
    status: log.status
  }));

  // Handlers
  const handleGenerateMenu = async () => {
    if (!selectedClient.dietaryRequirements) return;
    setIsGenerating(true);
    try {
      const newMenu = await generateWeeklyMenu(selectedClient.dietaryRequirements);
      if (newMenu.length > 0) {
        setMeals(newMenu);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Renderers ---

  const renderMenu = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
       {/* Sidebar Control */}
       <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <label className="block text-sm font-bold text-slate-700 mb-2">Select Resident</label>
             <select 
               className="w-full p-2 border border-slate-300 rounded-lg text-sm mb-4"
               value={selectedClient.id}
               onChange={(e) => setSelectedClient(MOCK_CLIENTS.find(c => c.id === e.target.value) || MOCK_CLIENTS[0])}
             >
                {MOCK_CLIENTS.map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                ))}
             </select>

             <div className="space-y-3">
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                   <p className="text-xs font-bold text-amber-700 uppercase mb-1">Dietary Needs</p>
                   <div className="flex flex-wrap gap-1">
                      {selectedClient.dietaryRequirements?.map((req, i) => (
                         <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-amber-200 text-amber-900">{req}</span>
                      ))}
                      {(!selectedClient.dietaryRequirements || selectedClient.dietaryRequirements.length === 0) && <span className="text-xs text-amber-800">None</span>}
                   </div>
                </div>

                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                   <p className="text-xs font-bold text-red-700 uppercase mb-1">Allergies</p>
                   <div className="flex flex-wrap gap-1">
                      {selectedClient.allergies?.map((alg, i) => (
                         <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-red-200 text-red-900 font-bold">{alg}</span>
                      ))}
                      {(!selectedClient.allergies || selectedClient.allergies.length === 0) && <span className="text-xs text-red-800">None</span>}
                   </div>
                </div>
             </div>

             <button 
               onClick={handleGenerateMenu}
               disabled={isGenerating}
               className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
             >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isGenerating ? 'Planning Menu...' : 'AI Menu Planner'}
             </button>
          </div>
       </div>

       {/* Menu Grid */}
       <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-lg">Weekly Meal Plan</h3>
             <span className="text-sm text-slate-500">Calories shown are estimates</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {meals.map((meal, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                   <div className="bg-orange-50 p-3 border-b border-orange-100 flex justify-between items-center">
                      <span className="font-bold text-orange-900">{meal.day}</span>
                      <span className="text-xs font-bold bg-white text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">{meal.calories} kcal</span>
                   </div>
                   <div className="p-4 space-y-4 flex-1">
                      <div>
                         <p className="text-xs text-slate-400 uppercase font-bold mb-1">Breakfast</p>
                         <p className="text-sm font-medium text-slate-800">{meal.breakfast}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400 uppercase font-bold mb-1">Lunch</p>
                         <p className="text-sm font-medium text-slate-800">{meal.lunch}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400 uppercase font-bold mb-1">Dinner</p>
                         <p className="text-sm font-medium text-slate-800">{meal.dinner}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-50">
                         <p className="text-xs text-slate-400 uppercase font-bold mb-1">Snacks</p>
                         <p className="text-xs text-slate-600">{meal.snacks}</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  const renderHydration = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Droplet className="text-blue-500" size={20} /> Daily Fluid Intake (mL)
          </h3>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hydrationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
                      {hydrationData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.amount < 1000 ? '#ef4444' : entry.amount < 1500 ? '#f59e0b' : '#3b82f6'} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs text-slate-500">
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded"></div> Good ({'>'}1500ml)</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded"></div> Warning (1000-1500ml)</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded"></div> Critical ({'<'}1000ml)</div>
          </div>
       </div>

       <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
             <h4 className="font-bold text-blue-900 mb-2">Why Hydration Matters</h4>
             <p className="text-sm text-blue-800 mb-4">
                Dehydration in elderly clients can lead to confusion, falls, and UTIs. Ensure regular fluid offers are recorded.
             </p>
             <button className="w-full py-2 bg-white text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-100">Log Intake</button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h4 className="font-bold text-slate-800 text-sm">Alerts (Today)</h4>
             </div>
             <div className="divide-y divide-slate-100">
                {MOCK_HYDRATION.filter(h => h.status !== 'Good').map(h => (
                   <div key={h.id} className="p-4 flex items-start gap-3">
                      <AlertTriangle size={16} className={h.status === 'Critical' ? 'text-red-500' : 'text-amber-500'} />
                      <div>
                         <p className="text-sm font-bold text-slate-900">{h.clientName}</p>
                         <p className="text-xs text-slate-500">Only {h.amountMl}ml consumed. Target {h.targetMl}ml.</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );

  const renderProfiles = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
       <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
             <tr>
                <th className="px-6 py-3 font-medium">Resident</th>
                <th className="px-6 py-3 font-medium">Dietary Needs</th>
                <th className="px-6 py-3 font-medium">Allergies</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
             {MOCK_CLIENTS.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs">
                            {client.name.charAt(0)}
                         </div>
                         <span className="font-bold text-slate-900">{client.name}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                         {client.dietaryRequirements?.length ? client.dietaryRequirements.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded text-xs">{r}</span>
                         )) : <span className="text-slate-400">-</span>}
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                         {client.allergies?.length ? client.allergies.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-100 rounded text-xs font-bold">{a}</span>
                         )) : <span className="text-slate-400">-</span>}
                      </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <button className="text-primary-600 hover:underline text-xs font-bold">Edit Profile</button>
                   </td>
                </tr>
             ))}
          </tbody>
       </table>
    </div>
  );

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-slate-900">Food & Nutrition</h1>
          <p className="text-slate-500 text-sm">Meal planning, hydration tracking, and dietary compliance.</p>
       </div>

       <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
          <button 
             onClick={() => setActiveTab('menu')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'menu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
             <ChefHat size={16} /> Menu Planner
          </button>
          <button 
             onClick={() => setActiveTab('hydration')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'hydration' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
             <Droplet size={16} /> Hydration
          </button>
          <button 
             onClick={() => setActiveTab('profiles')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'profiles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
             <User size={16} /> Dietary Profiles
          </button>
       </div>

       {activeTab === 'menu' && renderMenu()}
       {activeTab === 'hydration' && renderHydration()}
       {activeTab === 'profiles' && renderProfiles()}
    </div>
  );
};

export default Nutrition;
