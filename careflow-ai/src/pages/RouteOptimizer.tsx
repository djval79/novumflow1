
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Sparkles, Loader2, CheckCircle2, User, Clock, Car, ArrowRight, ShieldCheck, Activity, Target, Zap, Globe } from 'lucide-react';
import { clientService } from '../services/supabaseService';
import { optimizeRouteSequence } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface RouteClient {
   id: string;
   name: string;
   address: string;
   coordinates?: { x: number; y: number };
}

const RouteOptimizer: React.FC = () => {
   const { profile } = useAuth();
   const [selectedStaff, setSelectedStaff] = useState('Sarah Jenkins');
   const [allClients, setAllClients] = useState<RouteClient[]>([]);
   const [currentRoute, setCurrentRoute] = useState<RouteClient[]>([]);
   const [isOptimizing, setIsOptimizing] = useState(false);
   const [stats, setStats] = useState({ distanceSaved: 0, timeSaved: 0 });

   useEffect(() => {
      async function loadClients() {
         try {
            const data = await clientService.getAll();
            if (data.length > 0) {
               const mapped = data.map((c: any, idx: number) => ({
                  id: c.id,
                  name: c.fullName || c.name || 'Unknown',
                  address: c.address || 'No address',
                  coordinates: { x: 20 + (idx * 15) % 60, y: 20 + (idx * 10) % 60 }
               }));
               setAllClients(mapped);
               setCurrentRoute(mapped);
            } else {
               const demo = [
                  { id: '1', name: 'Mrs. Smith', address: '12 Oak Lane, L1 1AB', coordinates: { x: 30, y: 20 } },
                  { id: '2', name: 'Mr. Jones', address: '45 Elm Street, L2 2CD', coordinates: { x: 65, y: 35 } },
                  { id: '3', name: 'Mrs. Williams', address: '78 Pine Road, L3 3EF', coordinates: { x: 25, y: 70 } },
                  { id: '4', name: 'Mr. Brown', address: '91 Cedar Ave, L4 4GH', coordinates: { x: 80, y: 60 } }
               ];
               setAllClients(demo);
               setCurrentRoute(demo);
            }
         } catch (error) {
            toast.error('Geospatial Data Failure');
         }
      }
      loadClients();
   }, [profile?.tenant_id]);

   const handleReset = () => {
      setCurrentRoute(allClients);
      setStats({ distanceSaved: 0, timeSaved: 0 });
      toast.info('Route Reverted', {
         description: 'Geospatial vectors restored to original operational manifest.'
      });
   };

   const handleOptimize = async () => {
      setIsOptimizing(true);
      const optimizeToast = toast.loading('Calculated optimal geospatial trajectory...');
      try {
         const locations = allClients.map(c => ({
            name: c.name,
            x: c.coordinates?.x || 50,
            y: c.coordinates?.y || 50
         }));

         const result = await optimizeRouteSequence(locations);

         const optimizedClients = result.optimizedOrder
            .map(name => allClients.find(c => c.name === name))
            .filter(Boolean) as RouteClient[];

         if (optimizedClients.length > 0) {
            setCurrentRoute(optimizedClients);
            setStats({
               distanceSaved: result.savedDistance,
               timeSaved: Math.round(result.savedDistance * 1.2)
            });
            toast.success('Kinetic Optimization Complete', { id: optimizeToast });
         }
      } catch (error) {
         toast.error('Neural Logic Failure', { id: optimizeToast });
      } finally {
         setIsOptimizing(false);
      }
   };

   const OFFICE_POS = { x: 50, y: 50 };

   return (
      <div className="max-w-7xl mx-auto space-y-12 pb-12 animate-in fade-in duration-700 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-6">
                  <Globe className="text-primary-600" size={48} />
                  Route <span className="text-primary-600">Engine</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
                  Neural Pathfinding & Kinetic Logistics Optimization Matrix
               </p>
            </div>
            <div className="flex items-center gap-6">
               <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-w-[240px]">
                  <select
                     value={selectedStaff}
                     onChange={(e) => {
                        setSelectedStaff(e.target.value);
                        toast.info(`Switching to logistics profile: ${e.target.value}`);
                     }}
                     className="w-full px-6 py-4 bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
                  >
                     <option>Sarah Jenkins</option>
                     <option>Mike Ross</option>
                  </select>
               </div>
               <button
                  onClick={handleOptimize}
                  disabled={isOptimizing || stats.distanceSaved > 0}
                  className={`px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 transition-all active:scale-95 disabled:opacity-30
                  ${stats.distanceSaved > 0
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-900 text-white hover:bg-black'}`}
               >
                  {isOptimizing ? <Loader2 className="animate-spin" size={20} /> : stats.distanceSaved > 0 ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                  {isOptimizing ? 'Computing Path...' : stats.distanceSaved > 0 ? 'Optimization Active' : 'Authorize Pathfinding'}
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Tactical Map Display */}
            <div className="lg:col-span-2 bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden h-[600px] relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
               <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 relative z-10">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
                     <MapPin className="text-primary-600" size={24} />
                     Live Tactical Vector Grid
                  </h3>
                  {stats.distanceSaved > 0 && (
                     <div className="flex gap-6">
                        <div className="flex flex-col items-end">
                           <span className="text-2xl font-black text-green-600 tracking-tighter leading-none">{stats.distanceSaved}%</span>
                           <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Efficiency GAIN</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-2xl font-black text-primary-600 tracking-tighter leading-none">{stats.timeSaved}m</span>
                           <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Time Recouped</span>
                        </div>
                     </div>
                  )}
               </div>

               <div className="flex-1 bg-slate-50/10 relative p-12 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

                  {/* Neural Map Layer */}
                  <svg viewBox="0 0 100 100" className="w-full h-full max-h-[500px] bg-white rounded-[3rem] border border-slate-200 shadow-2xl relative z-10">
                     <defs>
                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                           <stop offset="0%" stopColor="#2563eb" />
                           <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                     </defs>

                     {/* Kinetic Path */}
                     <path
                        d={`M ${OFFICE_POS.x} ${OFFICE_POS.y} ${currentRoute.map(c => `L ${c.coordinates?.x} ${c.coordinates?.y}`).join(' ')}`}
                        fill="none"
                        stroke="url(#routeGradient)"
                        strokeWidth="1.2"
                        strokeDasharray="4"
                        className="animate-[dash_30s_linear_infinite]"
                     />

                     {/* HQ Node */}
                     <g transform={`translate(${OFFICE_POS.x},${OFFICE_POS.y})`}>
                        <circle r="4" fill="#0f172a" className="animate-pulse" />
                        <text y="-6" fontSize="4" textAnchor="middle" fill="#0f172a" className="font-black uppercase tracking-widest">Base</text>
                     </g>

                     {/* Tactical Targets */}
                     {currentRoute.map((client, idx) => (
                        <g key={client.id} transform={`translate(${client.coordinates?.x},${client.coordinates?.y})`}>
                           <circle
                              r="3.5"
                              fill={idx === 0 ? '#10b981' : '#2563eb'}
                              stroke="white"
                              strokeWidth="0.8"
                              className="shadow-xl"
                           />
                           <text
                              y="8"
                              fontSize="3.5"
                              textAnchor="middle"
                              fill="#475569"
                              className="font-black uppercase tracking-widest pointer-events-none select-none"
                           >
                              {idx + 1}. {client.name.split(' ')[0]}
                           </text>
                        </g>
                     ))}
                  </svg>
               </div>
            </div>

            {/* Kinetic Itinerary */}
            <div className="bg-slate-900 rounded-[4rem] shadow-2xl flex flex-col overflow-hidden h-[600px]">
               <div className="p-10 border-b border-white/5 bg-white/5">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-4">
                     <Navigation className="text-primary-500" size={24} /> Sequence Matrix
                  </h3>
               </div>
               <div className="flex-1 overflow-y-auto p-10 space-y-0 scrollbar-hide relative">
                  <div className="absolute left-[3.25rem] top-10 bottom-10 w-0.5 bg-white/5" />

                  {/* Start Point */}
                  <div className="flex gap-8 pb-10 relative">
                     <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl border-4 border-slate-900">
                           <User size={20} />
                        </div>
                     </div>
                     <div className="pt-1.5">
                        <p className="text-lg font-black text-white uppercase tracking-tight">Deployment Start</p>
                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.3em]">07:45 Zulu • Base HQ</p>
                     </div>
                  </div>

                  {/* Dynamic Nodes */}
                  {currentRoute.map((client, idx) => (
                     <div key={client.id} className="flex gap-8 pb-10 relative group">
                        <div className="flex flex-col items-center relative z-10">
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xl border-4 border-slate-900 transition-transform group-hover:scale-110
                           ${idx === 0 ? 'bg-green-500 shadow-green-500/20' : 'bg-primary-600 shadow-primary-500/20'}
                        `}>
                              <span className="text-sm font-black">{idx + 1}</span>
                           </div>
                        </div>
                        <div className="pt-1 flex-1">
                           <div className="flex justify-between items-start mb-2">
                              <p className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary-400 transition-colors">{client.name}</p>
                              <span className="text-[8px] font-black bg-white/5 px-3 py-1.5 rounded-xl text-slate-500 border border-white/5 uppercase tracking-widestAlpha">
                                 {client.coordinates?.x}°N, {client.coordinates?.y}°E
                              </span>
                           </div>
                           <p className="text-[9px] font-black text-slate-500 mb-6 uppercase tracking-widest leading-relaxed leading-snug">{client.address}</p>

                           <div className="flex gap-4">
                              <div className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                                 <Clock size={12} className="text-primary-500" /> 45m Protocol
                              </div>
                              <div className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                                 <Car size={12} className="text-indigo-500" /> 12m Transit
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}

                  {stats.distanceSaved > 0 && (
                     <div className="mt-4 p-8 bg-primary-600/10 border border-primary-500/20 rounded-[2.5rem] relative overflow-hidden group/opt">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl" />
                        <div className="flex items-start gap-6 relative z-10">
                           <Sparkles className="text-primary-400 mt-1" size={24} />
                           <div className="space-y-4">
                              <p className="text-base font-black text-white uppercase tracking-tight">Engine Optimization Peak</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                 Neural pathways calibrated. Stop sequence reordered to eliminate trajectory redundancy. Projected fiscal saving: £420/Ann.
                              </p>
                              <button onClick={handleReset} className="text-[9px] font-black text-primary-400 uppercase tracking-widest hover:text-white transition-colors underline decoration-primary-500/30 underline-offset-4">Reset Kinetic Manifest</button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default RouteOptimizer;
