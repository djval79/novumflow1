
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Sparkles, Loader2, CheckCircle2, User, Clock, Car, ArrowRight } from 'lucide-react';
import { MOCK_CLIENTS } from '../services/mockData';
import { optimizeRouteSequence } from '../services/geminiService';

const RouteOptimizer: React.FC = () => {
  const [selectedStaff, setSelectedStaff] = useState('Sarah Jenkins');
  const [currentRoute, setCurrentRoute] = useState(MOCK_CLIENTS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [stats, setStats] = useState({ distanceSaved: 0, timeSaved: 0 });

  // Reset stats when changing manually
  const handleReset = () => {
    setCurrentRoute(MOCK_CLIENTS);
    setStats({ distanceSaved: 0, timeSaved: 0 });
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const locations = MOCK_CLIENTS.map(c => ({ 
        name: c.name, 
        x: c.coordinates?.x || 50, 
        y: c.coordinates?.y || 50 
      }));

      const result = await optimizeRouteSequence(locations);

      // Reorder clients based on AI result
      const optimizedClients = result.optimizedOrder
        .map(name => MOCK_CLIENTS.find(c => c.name === name))
        .filter(Boolean) as typeof MOCK_CLIENTS;

      if (optimizedClients.length > 0) {
        setCurrentRoute(optimizedClients);
        setStats({
          distanceSaved: result.savedDistance,
          timeSaved: Math.round(result.savedDistance * 1.2) // Mock time calc
        });
      }
    } catch (error) {
      console.error("Optimization failed", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Map Visualization Helpers
  const MAP_SIZE = 100; // 100x100 grid
  const OFFICE_POS = { x: 50, y: 50 };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Route Optimization</h1>
           <p className="text-slate-500 text-sm">Smart travel planning to reduce travel time and fuel costs.</p>
        </div>
        <div className="flex items-center gap-3">
           <select 
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none"
           >
              <option>Sarah Jenkins</option>
              <option>Mike Ross</option>
           </select>
           <button 
              onClick={handleOptimize}
              disabled={isOptimizing || stats.distanceSaved > 0}
              className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all
                 ${stats.distanceSaved > 0 
                    ? 'bg-green-100 text-green-700 cursor-default' 
                    : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:shadow-md'}`}
           >
              {isOptimizing ? <Loader2 className="animate-spin" size={18}/> : stats.distanceSaved > 0 ? <CheckCircle2 size={18}/> : <Sparkles size={18}/>}
              {isOptimizing ? 'Optimizing...' : stats.distanceSaved > 0 ? 'Optimized' : 'Optimize Route'}
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
         {/* Interactive Map Card */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="text-primary-600" size={18} /> Live Map View
               </h3>
               {stats.distanceSaved > 0 && (
                  <div className="flex gap-4 text-xs font-bold">
                     <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                        {stats.distanceSaved}% Distance Saved
                     </span>
                     <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        {stats.timeSaved} mins Saved
                     </span>
                  </div>
               )}
            </div>
            
            <div className="flex-1 bg-slate-50 relative p-4 flex items-center justify-center overflow-hidden">
               {/* SVG Map Layer */}
               <svg viewBox="0 0 100 100" className="w-full h-full max-h-[500px] bg-white rounded-xl border border-slate-200 shadow-inner">
                  <defs>
                     <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
                     </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />

                  {/* Connections (Route Lines) */}
                  <path
                     d={`M ${OFFICE_POS.x} ${OFFICE_POS.y} ${currentRoute.map(c => `L ${c.coordinates?.x} ${c.coordinates?.y}`).join(' ')}`}
                     fill="none"
                     stroke="#3b82f6"
                     strokeWidth="0.8"
                     strokeDasharray="2"
                     className="animate-[dash_20s_linear_infinite]"
                  />

                  {/* Office Marker */}
                  <circle cx={OFFICE_POS.x} cy={OFFICE_POS.y} r="3" fill="#0f172a" />
                  <text x={OFFICE_POS.x} y={OFFICE_POS.y - 4} fontSize="3" textAnchor="middle" fill="#0f172a" fontWeight="bold">Office</text>

                  {/* Client Markers */}
                  {currentRoute.map((client, idx) => (
                     <g key={client.id}>
                        <circle 
                           cx={client.coordinates?.x} 
                           cy={client.coordinates?.y} 
                           r="2.5" 
                           fill={idx === 0 ? '#22c55e' : '#3b82f6'} 
                           stroke="white"
                           strokeWidth="0.5"
                        />
                        <text 
                           x={client.coordinates?.x} 
                           y={(client.coordinates?.y || 0) + 5} 
                           fontSize="2.5" 
                           textAnchor="middle" 
                           fill="#475569"
                           className="pointer-events-none select-none"
                        >
                           {idx + 1}. {client.name.split(' ')[0]}
                        </text>
                     </g>
                  ))}
               </svg>
            </div>
         </div>

         {/* Timeline / Route List */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Navigation className="text-primary-600" size={18} /> Itinerary
               </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-0">
               {/* Start Point */}
               <div className="flex gap-4 pb-6 relative">
                  <div className="flex flex-col items-center">
                     <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-sm z-10">
                        <User size={14} />
                     </div>
                     <div className="w-0.5 h-full bg-slate-200 absolute top-8"></div>
                  </div>
                  <div className="pt-1">
                     <p className="text-sm font-bold text-slate-900">Start: Office</p>
                     <p className="text-xs text-slate-500">07:45 AM</p>
                  </div>
               </div>

               {/* Clients */}
               {currentRoute.map((client, idx) => (
                  <div key={client.id} className="flex gap-4 pb-6 relative group">
                     <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm z-10 border-2 border-white
                           ${idx === 0 ? 'bg-green-500' : 'bg-primary-500'}
                        `}>
                           <span className="text-xs font-bold">{idx + 1}</span>
                        </div>
                        {idx !== currentRoute.length - 1 && (
                           <div className="w-0.5 h-full bg-slate-200 absolute top-8 group-hover:bg-primary-200 transition-colors"></div>
                        )}
                     </div>
                     <div className="pt-0.5 flex-1">
                        <div className="flex justify-between items-start">
                           <p className="text-sm font-bold text-slate-900">{client.name}</p>
                           <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {client.coordinates?.x}, {client.coordinates?.y}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{client.address}</p>
                        
                        <div className="flex gap-2">
                           <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600 flex items-center gap-1">
                              <Clock size={10} /> 45m Visit
                           </div>
                           <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600 flex items-center gap-1">
                              <Car size={10} /> 12m Drive
                           </div>
                        </div>
                     </div>
                  </div>
               ))}

               {stats.distanceSaved > 0 && (
                  <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-lg">
                     <div className="flex items-start gap-3">
                        <Sparkles className="text-primary-600 mt-1" size={16} />
                        <div>
                           <p className="text-sm font-bold text-primary-900">Route Optimized</p>
                           <p className="text-xs text-primary-700 mt-1">
                              The AI has reordered {currentRoute.length} stops to minimize crossing paths.
                              Estimated annual fuel saving: £420.
                           </p>
                           <button onClick={handleReset} className="text-xs text-primary-600 underline mt-2">Reset to original</button>
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
