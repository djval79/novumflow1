
import React, { useState } from 'react';
import { 
  Store, TrendingUp, Clock, MapPin, BadgePoundSterling, 
  CheckCircle2, Loader2, Sparkles, UserPlus, Users, AlertCircle,
  Plus
} from 'lucide-react';
import { MOCK_MARKET_SHIFTS } from '../services/mockData';
import { MarketShift, MarketPrediction, UserRole } from '../types';
import { predictShiftFillChance } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

const ShiftMarket: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const [shifts, setShifts] = useState<MarketShift[]>(MOCK_MARKET_SHIFTS);
  const [selectedShift, setSelectedShift] = useState<MarketShift | null>(null);
  const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Handlers
  const handleClaim = (id: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'Pending', applicants: s.applicants + 1 } : s));
  };

  const handleApprove = (id: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'Filled' } : s));
  };

  const handlePredict = async (shift: MarketShift) => {
    setIsPredicting(true);
    setPrediction(null);
    try {
      const details = `${shift.role} shift at ${shift.location} on ${shift.date} ${shift.time}. Rate £${shift.baseRate}/hr. Current applicants: ${shift.applicants}`;
      const result = await predictShiftFillChance(details);
      setPrediction(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPredicting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Filled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Shift Marketplace</h1>
             <p className="text-slate-500 text-sm">Pick up extra shifts or manage open cover.</p>
          </div>
          {isAdmin && (
             <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
                <Plus size={18} /> Post Shift
             </button>
          )}
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: Shift Listings */}
          <div className="w-full md:w-2/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Available Shifts</h3>
                <div className="flex gap-2">
                   <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                      <TrendingUp size={12}/> Surge Active
                   </span>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {shifts.map(shift => (
                   <div 
                      key={shift.id}
                      onClick={() => { setSelectedShift(shift); setPrediction(null); }}
                      className={`p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md relative overflow-hidden
                         ${selectedShift?.id === shift.id ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/30' : 'border-slate-200 bg-white'}
                         ${shift.status === 'Filled' ? 'opacity-60 grayscale' : ''}
                      `}
                   >
                      {shift.surgeBonus > 0 && shift.status === 'Open' && (
                         <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
                            <TrendingUp size={10} /> +£{shift.surgeBonus}/hr
                         </div>
                      )}

                      <div className="flex justify-between items-start mb-2">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getStatusColor(shift.status)}`}>
                            {shift.status}
                         </span>
                         <span className="text-xs font-mono text-slate-400">{shift.date}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-lg mb-1">{shift.role}</h3>
                      <div className="space-y-1 mb-4">
                         <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock size={14} className="text-slate-400"/> {shift.time}
                         </div>
                         <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin size={14} className="text-slate-400"/> {shift.location} • {shift.clientName}
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                         <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Total Rate</p>
                            <p className="text-lg font-bold text-primary-700">£{(shift.baseRate + shift.surgeBonus).toFixed(2)}<span className="text-xs text-slate-400 font-normal">/hr</span></p>
                         </div>
                         {shift.status === 'Open' && (
                            isAdmin ? (
                               <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50">Manage</button>
                            ) : (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleClaim(shift.id); }}
                                 className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 shadow-sm"
                               >
                                  Claim Shift
                               </button>
                            )
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Right: Detail & Manager Tools */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
             {/* Prediction Card (Admin Only) */}
             {isAdmin && selectedShift && selectedShift.status === 'Open' && (
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold flex items-center gap-2"><Sparkles size={18} className="text-yellow-400"/> AI Fill Predictor</h3>
                   </div>
                   
                   {!prediction ? (
                      <div className="text-center py-4">
                         <p className="text-sm text-indigo-200 mb-4">Predict likelihood of internal fill vs agency cost.</p>
                         <button 
                           onClick={() => handlePredict(selectedShift)}
                           disabled={isPredicting}
                           className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                           {isPredicting ? <Loader2 className="animate-spin" size={16}/> : 'Analyze Probability'}
                        </button>
                      </div>
                   ) : (
                      <div className="space-y-4 animate-in fade-in">
                         <div className="flex items-center justify-between">
                            <span className="text-indigo-200 text-sm font-bold uppercase">Fill Chance</span>
                            <span className={`text-2xl font-bold ${prediction.fillProbability > 70 ? 'text-green-400' : 'text-amber-400'}`}>
                               {prediction.fillProbability}%
                            </span>
                         </div>
                         <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${prediction.fillProbability > 70 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${prediction.fillProbability}%` }}></div>
                         </div>
                         
                         <p className="text-xs text-indigo-100 italic">"{prediction.reasoning}"</p>
                         
                         <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-xs text-indigo-200 font-bold uppercase">AI Recommendation</p>
                            <p className="text-sm font-bold mt-1">Set Surge Bonus to £{prediction.recommendedSurge.toFixed(2)}</p>
                         </div>
                      </div>
                   )}
                </div>
             )}

             {/* Details / Applicants */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                {selectedShift ? (
                   <>
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                         <h3 className="font-bold text-slate-800">Shift Details</h3>
                      </div>
                      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                         <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Role</span>
                               <span className="font-bold text-slate-800">{selectedShift.role}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Client</span>
                               <span className="font-bold text-slate-800">{selectedShift.clientName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Base Rate</span>
                               <span className="font-bold text-slate-800">£{selectedShift.baseRate.toFixed(2)}/hr</span>
                            </div>
                            <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Surge Bonus</span>
                               <span className="font-bold text-green-600">+£{selectedShift.surgeBonus.toFixed(2)}/hr</span>
                            </div>
                         </div>

                         {isAdmin && (
                            <div className="pt-4 border-t border-slate-100">
                               <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                                  <Users size={16}/> Applicants ({selectedShift.applicants})
                               </h4>
                               {selectedShift.applicants === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No bids yet.</p>
                               ) : (
                                  <div className="space-y-2">
                                     <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                                        <span className="text-sm font-medium">Mike Ross</span>
                                        <button 
                                          onClick={() => handleApprove(selectedShift.id)}
                                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200"
                                        >
                                           Approve
                                        </button>
                                     </div>
                                  </div>
                               )}
                            </div>
                         )}
                      </div>
                      {isAdmin && selectedShift.status === 'Open' && (
                         <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 text-sm flex items-center justify-center gap-2">
                               <UserPlus size={16} /> Send to Agency
                            </button>
                         </div>
                      )}
                   </>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <Store size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">Select a shift to view details or manage bids.</p>
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default ShiftMarket;