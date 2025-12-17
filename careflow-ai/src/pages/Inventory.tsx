
import React, { useState } from 'react';
import { 
  Package, Search, Plus, TrendingDown, AlertCircle, CheckCircle2, 
  User, Calendar, Sparkles, Loader2, ShoppingBag, Archive, Box
} from 'lucide-react';
import { MOCK_INVENTORY } from '../services/mockData';
import { InventoryItem, StockPrediction } from '../types';
import { predictStockDepletion } from '../services/geminiService';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Handlers
  const handlePredict = async (item: InventoryItem) => {
    setIsPredicting(true);
    setPrediction(null);
    try {
      // Mock shifts count for next week
      const shiftsCount = 450; 
      const result = await predictStockDepletion(item.quantity, item.name, shiftsCount);
      setPrediction(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleRestock = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 50 } : i));
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'PPE': return 'bg-blue-100 text-blue-700';
      case 'Uniform': return 'bg-purple-100 text-purple-700';
      case 'Cleaning': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Inventory & Supplies</h1>
             <p className="text-slate-500 text-sm">Track PPE stock, cleaning supplies, and uniforms.</p>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
             <Plus size={18} /> Add Item
          </button>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: Item List */}
          <div className="w-full md:w-2/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Stock Levels</h3>
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="text" 
                      placeholder="Search..." 
                      className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                   />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map(item => {
                   const isLow = item.quantity <= item.minLevel;
                   const percentage = Math.min((item.quantity / (item.minLevel * 3)) * 100, 100);

                   return (
                      <div 
                         key={item.id}
                         onClick={() => { setSelectedItem(item); setPrediction(null); }}
                         className={`p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative
                            ${selectedItem?.id === item.id ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/30' : 'border-slate-200 bg-white'}
                         `}
                      >
                         {isLow && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
                               <AlertCircle size={10} /> LOW STOCK
                            </div>
                         )}

                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                  <Package size={24} className="text-slate-600"/>
                               </div>
                               <div>
                                  <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getCategoryColor(item.category)}`}>
                                     {item.category}
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Quantity</span>
                               <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>{item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span></span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-green-500'}`} 
                                  style={{ width: `${percentage}%` }}
                               ></div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-400 flex items-center gap-1"><Archive size={12}/> {item.location}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRestock(item.id); }}
                              className="text-primary-600 text-xs font-bold hover:underline"
                            >
                               Restock (+50)
                            </button>
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>

          {/* Right: AI Panel */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
             {selectedItem ? (
                <>
                   <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold flex items-center gap-2"><Sparkles size={18} className="text-yellow-400"/> AI Stock Forecaster</h3>
                      </div>
                      
                      {!prediction ? (
                         <div className="text-center py-4">
                            <p className="text-sm text-blue-200 mb-4">Predict depletion date based on scheduled visits.</p>
                            <button 
                              onClick={() => handlePredict(selectedItem)}
                              disabled={isPredicting}
                              className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                           >
                              {isPredicting ? <Loader2 className="animate-spin" size={16}/> : 'Run Forecast'}
                           </button>
                         </div>
                      ) : (
                         <div className="space-y-4 animate-in fade-in">
                            <div className="flex items-center justify-between">
                               <span className="text-blue-200 text-sm font-bold uppercase">Days Remaining</span>
                               <span className={`text-2xl font-bold ${prediction.daysRemaining < 7 ? 'text-red-400' : 'text-green-400'}`}>
                                  {prediction.daysRemaining} Days
                               </span>
                            </div>
                            
                            <div className="bg-white/10 rounded-lg p-3">
                               <p className="text-xs text-blue-300 font-bold uppercase mb-1">Depletion Date</p>
                               <p className="font-bold">{prediction.depletionDate}</p>
                            </div>

                            <div className="bg-white/10 rounded-lg p-3">
                               <p className="text-xs text-blue-300 font-bold uppercase mb-1 flex items-center gap-1"><ShoppingBag size={12}/> Suggested Order</p>
                               <p className="font-bold">{prediction.suggestedOrder} units</p>
                            </div>

                            <p className="text-xs text-blue-200 italic leading-relaxed">"{prediction.reasoning}"</p>
                         </div>
                      )}
                   </div>

                   <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-1">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">Recent Movements</h4>
                      <div className="space-y-3">
                         {[
                            { type: 'Out', user: 'Sarah Jenkins', qty: 2, date: 'Today 08:00' },
                            { type: 'Out', user: 'Mike Ross', qty: 1, date: 'Yesterday 14:00' },
                            { type: 'In', user: 'Admin', qty: 50, date: '20 Oct' },
                         ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                               <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${log.type === 'In' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                     {log.type === 'In' ? '+' : '-'}
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-700">{log.user}</p>
                                     <p className="text-xs text-slate-400">{log.date}</p>
                                  </div>
                               </div>
                               <span className="font-mono font-bold text-slate-600">{log.qty}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                   <Box size={48} className="mb-4 opacity-20" />
                   <p className="font-medium">Select an item to forecast stock.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default Inventory;
