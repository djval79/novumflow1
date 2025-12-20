
import React, { useState, useEffect } from 'react';
import {
   Package, Search, Plus, TrendingDown, AlertCircle, CheckCircle2,
   User, Calendar, Sparkles, Loader2, ShoppingBag, Archive, Box, Activity, ShieldCheck, History, ArrowUpRight
} from 'lucide-react';
import { inventoryService } from '../services/supabaseService';
import { InventoryItem, StockPrediction } from '../types';
import { predictStockDepletion } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Inventory: React.FC = () => {
   const { profile } = useAuth();
   const [items, setItems] = useState<InventoryItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
   const [prediction, setPrediction] = useState<StockPrediction | null>(null);
   const [isPredicting, setIsPredicting] = useState(false);

   useEffect(() => {
      async function loadInventory() {
         setLoading(true);
         try {
            const data = await inventoryService.getAll(profile?.tenant_id);
            if (data.length > 0) {
               const mapped = data.map((i: any) => ({
                  id: i.id,
                  name: i.name,
                  category: i.category || 'General',
                  quantity: i.quantity || 0,
                  unit: i.unit || 'units',
                  minLevel: i.reorderLevel || 10,
                  location: i.location || 'Store',
                  lastRestocked: i.updatedAt ? new Date(i.updatedAt).toLocaleDateString() : 'Unknown'
               }));
               setItems(mapped);
            } else {
               // Default demo inventory
               setItems([
                  { id: '1', name: 'Disposable Gloves (M)', category: 'PPE', quantity: 120, unit: 'boxes', minLevel: 20, location: 'Main Store', lastRestocked: '2024-12-15' },
                  { id: '2', name: 'Face Masks', category: 'PPE', quantity: 45, unit: 'boxes', minLevel: 30, location: 'Main Store', lastRestocked: '2024-12-10' },
                  { id: '3', name: 'Hand Sanitizer', category: 'Cleaning', quantity: 15, unit: 'bottles', minLevel: 10, location: 'All Sites', lastRestocked: '2024-12-18' },
                  { id: '4', name: 'Uniform - Tunic', category: 'Uniform', quantity: 8, unit: 'items', minLevel: 15, location: 'Office', lastRestocked: '2024-11-20' }
               ]);
            }
         } catch (error) {
            toast.error('Inventory synchronization failure');
            setItems([]);
         } finally {
            setLoading(false);
         }
      }
      loadInventory();
   }, [profile?.tenant_id]);

   // Handlers
   const handlePredict = async (item: InventoryItem) => {
      setIsPredicting(true);
      setPrediction(null);
      const predictionToast = toast.loading('Calculating depletion vectors...');
      try {
         const shiftsCount = 450;
         const result = await predictStockDepletion(item.quantity, item.name, shiftsCount);
         setPrediction(result);
         toast.success('Neural Stock Forecast Ready', { id: predictionToast });
      } catch (error) {
         toast.error('Forecasting Logic Error', { id: predictionToast });
      } finally {
         setIsPredicting(false);
      }
   };

   const handleRestock = (id: string) => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 50 } : i));
      toast.success('Logistics update: +50 units archived', {
         description: 'Inventory levels have been recalibrated globally.'
      });
   };

   const getCategoryColor = (cat: string) => {
      switch (cat) {
         case 'PPE': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
         case 'Uniform': return 'bg-purple-50 text-purple-700 border-purple-100';
         case 'Cleaning': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
         default: return 'bg-slate-50 text-slate-700 border-slate-100';
      }
   };

   if (loading && items.length === 0) {
      return (
         <div className="flex flex-col h-full items-center justify-center gap-6 bg-slate-50">
            <Loader2 className="animate-spin text-primary-600" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Logistics Core...</p>
         </div>
      );
   }

   return (
      <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-3">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Supply <span className="text-primary-600">Chain</span></h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">Automated Inventory Oversight & Proactive PPE Forecasting</p>
            </div>
            <button
               onClick={() => toast.info('Accessing Procurement Interface')}
               className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95"
            >
               <Plus size={24} /> Initialize Asset Protocol
            </button>
         </div>

         <div className="flex-1 flex gap-10 overflow-hidden">
            {/* Left: Inventory Matrix */}
            <div className="w-full md:w-2/3 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center bg-slate-50/20 gap-6">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3">
                     <Activity size={18} className="text-primary-600" />
                     Operational Stock levels
                  </h3>
                  <div className="relative w-full sm:w-auto">
                     <Search className="absolute left-5 top-4.5 text-slate-400" size={18} />
                     <input
                        type="text"
                        placeholder="Filter Logistic Stream..."
                        className="w-full sm:w-72 pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-300 transition-all shadow-sm"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 scrollbar-hide">
                  {items.map(item => {
                     const isLow = item.quantity <= item.minLevel;
                     const percentage = Math.min((item.quantity / (item.minLevel * 3)) * 100, 100);

                     return (
                        <div
                           key={item.id}
                           onClick={() => {
                              setSelectedItem(item);
                              setPrediction(null);
                              toast.info(`Retrieving asset dossier: ${item.name}`);
                           }}
                           className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] group relative
                            ${selectedItem?.id === item.id ? 'border-primary-500 bg-primary-50/20 shadow-xl' : 'border-slate-50 bg-white hover:border-primary-100'}
                         `}
                        >
                           {isLow && (
                              <div className="absolute top-0 right-10 bg-rose-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-b-xl shadow-2xl animate-pulse z-10">
                                 Critical Depletion Detected
                              </div>
                           )}

                           <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-5">
                                 <div className={`p-4 rounded-2xl transition-all shadow-inner ${selectedItem?.id === item.id ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                    <Package size={28} />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{item.name}</h3>
                                    <span className={`text-[8px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.2em] ${getCategoryColor(item.category)}`}>
                                       {item.category}
                                    </span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4 mb-8">
                              <div className="flex justify-between items-end">
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Units</p>
                                    <span className={`text-3xl font-black tabular-nums ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</span>
                                 </div>
                                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pb-1">{item.unit}</span>
                              </div>
                              <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100">
                                 <div
                                    className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)] ${isLow ? 'bg-rose-500' : 'bg-green-500'}`}
                                    style={{ width: `${percentage}%` }}
                                 ></div>
                              </div>
                           </div>

                           <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Archive size={14} className="text-primary-400" /> Sector: {item.location}</span>
                              <button
                                 onClick={(e) => { e.stopPropagation(); handleRestock(item.id); }}
                                 className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl active:scale-90"
                              >
                                 Replenish Asset
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Right: AI Prediction Terminal */}
            <div className="w-full md:w-1/3 flex flex-col gap-10">
               {selectedItem ? (
                  <>
                     <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />

                        <div className="flex justify-between items-center mb-10 relative z-10">
                           <h3 className="text-[10px] font-black text-indigo-400 flex items-center gap-3 uppercase tracking-[0.4em]">
                              <Brain size={24} className="text-indigo-400" />
                              Neural Forecaster
                           </h3>
                        </div>

                        {!prediction ? (
                           <div className="text-center py-10 flex flex-col items-center gap-8 animate-in fade-in">
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">Simulate depletion vector based on current clinical schedule requirements.</p>
                              <button
                                 onClick={() => handlePredict(selectedItem)}
                                 disabled={isPredicting}
                                 className="w-full py-6 bg-white/5 hover:bg-indigo-600 border-2 border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group"
                              >
                                 {isPredicting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles className="group-hover:rotate-12 transition-transform" size={20} />}
                                 {isPredicting ? 'Computing...' : 'Initialize Forecast'}
                              </button>
                           </div>
                        ) : (
                           <div className="space-y-10 animate-in zoom-in duration-500 relative z-10">
                              <div className="flex flex-col items-center p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl">
                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Availability Window</span>
                                 <span className={`text-6xl font-black tracking-tighter tabular-nums ${prediction.daysRemaining < 7 ? 'text-rose-500' : 'text-green-500'}`}>
                                    {prediction.daysRemaining}
                                 </span>
                                 <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mt-2">Active Trading Days</span>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                 <div className="bg-white/5 rounded-[1.75rem] p-6 border border-white/10 group-hover:bg-white/10 transition-all">
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2">Depletion Epoch</p>
                                    <p className="font-black text-white text-base uppercase tracking-tight">{prediction.depletionDate}</p>
                                 </div>
                                 <div className="bg-white/5 rounded-[1.75rem] p-6 border border-white/10 group-hover:bg-white/10 transition-all">
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2"><ShoppingBag size={12} className="text-primary-500" /> Target Quantity</p>
                                    <p className="font-black text-white text-xl uppercase tracking-tight">{prediction.suggestedOrder}</p>
                                 </div>
                              </div>

                              <div className="p-8 bg-indigo-600/20 border border-indigo-500/30 rounded-[2rem]">
                                 <p className="text-white text-xs font-bold leading-relaxed opacity-90 italic">"{prediction.reasoning}"</p>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-10 flex-1 overflow-hidden flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                           <History size={18} className="text-primary-600" />
                           Logistic Movement Log
                        </h4>
                        <div className="space-y-4 overflow-y-auto scrollbar-hide">
                           {[
                              { type: 'Out', user: 'Sarah Jenkins', qty: 2, date: 'Today 08:00' },
                              { type: 'Out', user: 'Mike Ross', qty: 1, date: 'Yesterday 14:00' },
                              { type: 'In', user: 'Admin', qty: 50, date: '21 Oct' },
                              { type: 'Out', user: 'Admin', qty: 5, date: '19 Oct' },
                           ].map((log, i) => (
                              <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
                                 <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${log.type === 'In' ? 'bg-green-50 text-green-600 shadow-md' : 'bg-rose-50 text-rose-600 shadow-md'}`}>
                                       {log.type === 'In' ? <ArrowUpRight size={14} className="rotate-[-90deg]" /> : <ArrowUpRight size={14} className="rotate-[90deg]" />}
                                    </div>
                                    <div className="space-y-0.5">
                                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{log.user}</p>
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.date}</p>
                                    </div>
                                 </div>
                                 <span className={`text-base font-black tabular-nums ${log.type === 'In' ? 'text-green-600' : 'text-rose-600'}`}>
                                    {log.type === 'In' ? '+' : '-'}{log.qty}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 shadow-inner group">
                     <div className="p-8 bg-slate-50 rounded-[2.5rem] shadow-sm mb-6 group-hover:scale-110 transition-transform">
                        <Box size={64} className="text-slate-200" />
                     </div>
                     <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter">Null Asset Selection</h3>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4 max-w-[180px] leading-relaxed">Select an active inventory vector to initiate neural forecasting and logistics analysis.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default Inventory;
