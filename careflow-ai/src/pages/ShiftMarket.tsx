
import React, { useState, useEffect } from 'react';
import {
   Store, TrendingUp, Clock, MapPin, BadgePoundSterling,
   CheckCircle2, Loader2, Sparkles, UserPlus, Users, AlertCircle,
   Plus, Zap, Target, History, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { shiftMarketService } from '../services/supabaseService';
import { MarketShift, MarketPrediction, UserRole } from '../types';
import { predictShiftFillChance } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ShiftMarket: React.FC = () => {
   const { user, profile } = useAuth();
   const isAdmin = user?.role === UserRole.ADMIN || profile?.role === 'admin';
   const [loading, setLoading] = useState(true);

   const [shifts, setShifts] = useState<MarketShift[]>([]);
   const [selectedShift, setSelectedShift] = useState<MarketShift | null>(null);
   const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
   const [isPredicting, setIsPredicting] = useState(false);

   useEffect(() => {
      async function loadShifts() {
         setLoading(true);
         try {
            const data = await shiftMarketService.getOpenShifts();
            if (data.length > 0) {
               const mapped = data.map((s: any) => ({
                  id: s.id,
                  date: s.date,
                  time: `${s.startTime} - ${s.endTime}`,
                  clientName: s.clientName || 'Open Shift',
                  location: s.description || 'TBC',
                  role: s.role || 'Carer',
                  baseRate: s.rate || 12.00,
                  surgeBonus: 0,
                  status: s.status === 'open' ? 'Open' : s.status === 'claimed' ? 'Pending' : 'Filled',
                  applicants: 0
               }));
               setShifts(mapped);
            } else {
               setShifts([
                  { id: '1', date: 'Tomorrow', time: '07:00 - 14:00', clientName: 'Mrs. Smith', location: 'Liverpool L1', role: 'Senior Carer', baseRate: 14.50, surgeBonus: 2.00, status: 'Open', applicants: 0 },
                  { id: '2', date: 'Tomorrow', time: '14:00 - 22:00', clientName: 'Mr. Jones', location: 'Liverpool L8', role: 'Carer', baseRate: 12.00, surgeBonus: 0, status: 'Open', applicants: 1 },
                  { id: '3', date: 'Sat 21 Dec', time: '08:00 - 16:00', clientName: 'Mrs. Williams', location: 'Liverpool L17', role: 'HCA', baseRate: 13.50, surgeBonus: 1.50, status: 'Pending', applicants: 2 }
               ]);
            }
         } catch (error) {
            toast.error("Bridge failure: Shift market data retrieval interrupted");
            setShifts([
               { id: '1', date: 'Tomorrow', time: '07:00 - 14:00', clientName: 'Mrs. Smith', location: 'Liverpool L1', role: 'Senior Carer', baseRate: 14.50, surgeBonus: 2.00, status: 'Open', applicants: 0 }
            ]);
         } finally {
            setLoading(false);
         }
      }
      loadShifts();
   }, []);

   const handleClaim = (id: string, role: string) => {
      setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'Pending', applicants: s.applicants + 1 } : s));
      toast.success(`Unit bid dispatched for ${role} assignment`);
   };

   const handleApprove = (id: string) => {
      setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'Filled' } : s));
      toast.success("Command node: Assignment authorization granted");
   };

   const handlePredict = async (shift: MarketShift) => {
      setIsPredicting(true);
      setPrediction(null);
      const predToast = toast.loading('Calculating Neural Fill Probability...');
      try {
         const details = `${shift.role} shift at ${shift.location} on ${shift.date} ${shift.time}. Rate £${shift.baseRate}/hr. Current applicants: ${shift.applicants}`;
         const result = await predictShiftFillChance(details);
         setPrediction(result);
         toast.success('Simulation Complete', { id: predToast });
      } catch (error) {
         toast.error('Simulation Failure', { id: predToast });
      } finally {
         setIsPredicting(false);
      }
   };

   const getStatusStyle = (status: string) => {
      switch (status) {
         case 'Open': return 'bg-emerald-900/40 text-emerald-400 border-emerald-500';
         case 'Pending': return 'bg-amber-900/40 text-amber-400 border-amber-500';
         case 'Filled': return 'bg-slate-900/40 text-slate-500 border-slate-700';
         default: return 'bg-slate-900/40 text-slate-500';
      }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Shift <span className="text-primary-600">Market</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Tactical Cover Exchange • Neural Fill Predictions • Surge Intelligence
               </p>
            </div>
            {isAdmin && (
               <button onClick={() => toast.info('Integrations restricted. Contact Admin.')} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black flex items-center gap-6 active:scale-95 transition-all">
                  <Plus size={20} className="text-primary-500" /> Post Shift Protocol
               </button>
            )}
         </div>

         <div className="flex flex-col lg:flex-row gap-10 items-stretch h-full min-h-[700px]">
            {/* Left: Shift Listings Spectrum */}
            <div className="lg:col-span-2 flex-1 flex flex-col gap-10">
               <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col h-full overflow-hidden">
                  <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
                     <div className="space-y-1">
                        <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter leading-none">Live Spectrum</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">Active Deployment Opportunities</p>
                     </div>
                     <div className="flex gap-4">
                        <span className="px-6 py-2 rounded-xl bg-emerald-900 text-emerald-400 border border-emerald-500 text-[9px] font-black uppercase tracking-widestAlpha flex items-center gap-3 shadow-xl animate-pulse">
                           <TrendingUp size={16} /> Surge Protocol Active
                        </span>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 gap-10 scrollbar-hide">
                     {shifts.map(shift => (
                        <div
                           key={shift.id}
                           onClick={() => {
                              setSelectedShift(shift);
                              setPrediction(null);
                              toast.info(`Retrieving Unit Data: ${shift.role}`);
                           }}
                           className={`p-10 rounded-[3.5rem] border-4 cursor-pointer transition-all hover:shadow-2xl relative overflow-hidden group h-fit
                                ${selectedShift?.id === shift.id ? 'border-primary-500 bg-primary-50/30 shadow-primary-500/10' : 'border-slate-50 bg-white hover:border-slate-100'}
                                ${shift.status === 'Filled' ? 'opacity-40 grayscale pointer-events-none' : ''}
                                `}
                        >
                           <div className="absolute inset-0 bg-grid-slate-900/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                           {shift.surgeBonus > 0 && shift.status === 'Open' && (
                              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widestAlpha px-6 py-3 rounded-bl-[1.5rem] shadow-xl flex items-center gap-3 z-10 animate-bounce">
                                 <TrendingUp size={16} /> +£{shift.surgeBonus}/HR SURGE
                              </div>
                           )}

                           <div className="flex justify-between items-start mb-6 relative z-10">
                              <span className={`text-[9px] font-black px-6 py-2 rounded-xl uppercase border shadow-xl ${getStatusStyle(shift.status)}`}>
                                 {shift.status}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{shift.date}</span>
                           </div>

                           <h3 className="font-black text-3xl text-slate-900 tracking-tighter uppercase leading-none mb-4 group-hover:text-primary-600 transition-colors relative z-10">{shift.role}</h3>
                           <div className="space-y-4 mb-10 relative z-10">
                              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <Clock size={18} className="text-primary-600" /> {shift.time}
                              </div>
                              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <MapPin size={18} className="text-primary-600" /> {shift.location} • {shift.clientName}
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-8 border-t border-slate-50 relative z-10">
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Fiscal Yield</p>
                                 <p className="text-3xl font-black text-slate-900 tracking-tighter">£{(shift.baseRate + shift.surgeBonus).toFixed(2)}<span className="text-xs text-slate-400 uppercase tracking-widest font-black ml-2">/HR</span></p>
                              </div>
                              {shift.status === 'Open' && (
                                 isAdmin ? (
                                    <button className="px-8 py-4 bg-white border-4 border-slate-50 text-slate-900 text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:border-primary-500 transition-all shadow-xl">Manage</button>
                                 ) : (
                                    <button
                                       onClick={(e) => { e.stopPropagation(); handleClaim(shift.id, shift.role); }}
                                       className="px-10 py-5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-black shadow-2xl active:scale-95 transition-all"
                                    >
                                       Claim Node
                                    </button>
                                 )
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right: Intelligence Console */}
            <div className="w-full lg:w-[450px] flex flex-col gap-10">
               {/* AI Neural Predictor (Admin Only) */}
               {isAdmin && selectedShift && selectedShift.status === 'Open' && (
                  <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden group animate-in slide-in-from-right-10 duration-700">
                     <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                     <div className="flex justify-between items-center mb-12 relative z-10">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.5em] flex items-center gap-6"><Sparkles size={32} className="text-primary-500" /> Neural Fill Predictor</h3>
                     </div>

                     {!prediction ? (
                        <div className="text-center space-y-10 relative z-10">
                           <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed">Predict likelihood of internal fill protocol vs agency escalation cost metrics.</p>
                           </div>
                           <button
                              onClick={() => handlePredict(selectedShift)}
                              disabled={isPredicting}
                              className="w-full py-8 bg-white text-slate-900 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95 group/pred"
                           >
                              {isPredicting ? <Loader2 className="animate-spin text-primary-600" size={24} /> : <Zap size={24} className="text-primary-600 group-hover/pred:scale-125 transition-transform" />}
                              Authorize Analysis
                           </button>
                        </div>
                     ) : (
                        <div className="space-y-10 animate-in fade-in relative z-10">
                           <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6">
                              <div className="flex items-center justify-between">
                                 <span className="text-slate-400 text-[10px] font-black uppercase tracking-widestAlpha">Integration Probability</span>
                                 <span className={`text-4xl font-black tracking-tighter tabular-nums ${prediction.fillProbability > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {prediction.fillProbability}%
                                 </span>
                              </div>
                              <div className="h-4 bg-black/40 rounded-full overflow-hidden p-1 border border-white/5">
                                 <div className={`h-full rounded-full transition-all duration-1000 shadow-2xl ${prediction.fillProbability > 70 ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-amber-500 shadow-amber-500/40'}`} style={{ width: `${prediction.fillProbability}%` }}></div>
                              </div>
                           </div>

                           <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5">
                              <p className="text-[11px] font-black text-indigo-100 italic leading-relaxed">"{prediction.reasoning.toUpperCase()}"</p>
                           </div>

                           <div className="bg-primary-600 p-10 rounded-[3rem] shadow-2xl space-y-4">
                              <p className="text-[9px] text-primary-100 font-black uppercase tracking-[0.4em]">Neural Recommendation</p>
                              <p className="text-2xl font-black uppercase tracking-tighter">Set Surge Bonus: <span className="text-white">£{prediction.recommendedSurge.toFixed(2)}</span></p>
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {/* Unit Metadata & Bids */}
               <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex-1 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-1000">
                  {selectedShift ? (
                     <>
                        <div className="px-10 py-10 border-b border-slate-50 bg-slate-50/20">
                           <h3 className="font-black text-[12px] text-slate-900 uppercase tracking-[0.5em]">Unit Metadata</h3>
                        </div>
                        <div className="p-12 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
                           <div className="space-y-6">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widestAlpha">
                                 <span className="text-slate-400">Assigned Role</span>
                                 <span className="text-slate-900">{selectedShift.role}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widestAlpha">
                                 <span className="text-slate-400">Recipient Unit</span>
                                 <span className="text-slate-900">{selectedShift.clientName}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widestAlpha">
                                 <span className="text-slate-400">Base Fiscal Rate</span>
                                 <span className="text-slate-900">£{selectedShift.baseRate.toFixed(2)}/HR</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widestAlpha">
                                 <span className="text-slate-400">Surge Multiplier</span>
                                 <span className="text-emerald-600">+£{selectedShift.surgeBonus.toFixed(2)}/HR</span>
                              </div>
                           </div>

                           {isAdmin && (
                              <div className="pt-10 border-t border-slate-50 space-y-6">
                                 <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.4em] flex items-center gap-6">
                                    <Users size={24} className="text-primary-600" /> Authorized Bids ({selectedShift.applicants})
                                 </h4>
                                 {selectedShift.applicants === 0 ? (
                                    <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha italic">Null Bid Manifest Active</p>
                                    </div>
                                 ) : (
                                    <div className="space-y-4">
                                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center group/bid hover:bg-white hover:shadow-xl transition-all">
                                          <div className="flex items-center gap-6">
                                             <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-[11px] font-black">MR</div>
                                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-widestAlpha">Mike Ross</span>
                                          </div>
                                          <button
                                             onClick={() => handleApprove(selectedShift.id)}
                                             className="px-6 py-3 bg-emerald-900 text-emerald-400 border border-emerald-500 text-[9px] font-black uppercase tracking-widestAlpha rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-xl"
                                          >
                                             Authorize
                                          </button>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                        {isAdmin && selectedShift.status === 'Open' && (
                           <div className="p-10 border-t border-slate-50 bg-slate-50/20">
                              <button onClick={() => toast.warning('External Agency Handshake Restricted')} className="w-full py-6 bg-white border-4 border-slate-100 text-slate-900 font-black uppercase tracking-[0.4em] text-[10px] rounded-[2rem] hover:border-primary-500 transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95">
                                 <UserPlus size={24} className="text-primary-600" /> Agency Escalation
                              </button>
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-20 text-center grayscale opacity-10 gap-10">
                        <Store size={100} className="text-slate-900" />
                        <p className="font-black uppercase tracking-[0.5em] text-[12px] leading-relaxed">Select Deployment Node to View Detailed Metadata</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default ShiftMarket;