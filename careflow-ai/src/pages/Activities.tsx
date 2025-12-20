
import React, { useState, useEffect } from 'react';
import {
   Calendar, MapPin, Users, Clock, CheckCircle2,
   Sparkles, Loader2, Coffee, Plus, X, Heart, Activity, Star, Music, Palette, Dumbbell
} from 'lucide-react';
import { eventService } from '../services/supabaseService';
import { SocialEvent, ActivitySuggestion, UserRole } from '../types';
import { generateActivityIdeas } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Activities: React.FC = () => {
   const { user, profile } = useAuth();
   const [events, setEvents] = useState<SocialEvent[]>([]);
   const [loading, setLoading] = useState(true);
   const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
   const [isGenerating, setIsGenerating] = useState(false);
   const [showPlanner, setShowPlanner] = useState(false);

   useEffect(() => {
      async function loadEvents() {
         setLoading(true);
         try {
            const data = await eventService.getAll(profile?.tenant_id);
            if (data.length > 0) {
               const mapped = data.map((e: any) => ({
                  id: e.id,
                  title: e.title,
                  type: e.type || 'Social',
                  date: e.startDatetime ? new Date(e.startDatetime).toISOString().split('T')[0] : 'TBC',
                  time: e.startDatetime ? new Date(e.startDatetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'TBC',
                  location: e.location || 'TBC',
                  attendeesCount: e.participants?.length || 0,
                  status: 'Upcoming' as const,
                  description: e.description || ''
               }));
               setEvents(mapped);
            } else {
               // Fallback demo data
               setEvents([
                  { id: '1', title: 'Christmas Carols', type: 'Social', date: '2024-12-22', time: '14:00', location: 'Main Lounge', attendeesCount: 12, status: 'Upcoming', description: 'Join us for festive carol singing.' },
                  { id: '2', title: 'Chair Yoga', type: 'Exercise', date: '2024-12-23', time: '10:00', location: 'Garden Room', attendeesCount: 8, status: 'Upcoming', description: 'Gentle yoga session suitable for all abilities.' }
               ]);
            }
         } catch (error) {
            toast.error('Community event sync failed');
            setEvents([]);
         } finally {
            setLoading(false);
         }
      }
      loadEvents();
   }, [profile?.tenant_id]);

   // Handlers
   const handleGenerate = async () => {
      setIsGenerating(true);
      const activityToast = toast.loading('Synthesizing therapeutic activity vectors...');
      const interests = ["Classic Movies", "Gardening", "Music from the 60s", "Light Exercise"];
      try {
         const result = await generateActivityIdeas(interests);
         setSuggestions(result);
         toast.success('Activity Intelligence Ready', { id: activityToast });
      } catch (error) {
         toast.error('Intelligence Engine Error', { id: activityToast });
      } finally {
         setIsGenerating(false);
      }
   };

   const handleAddEvent = (suggestion: ActivitySuggestion) => {
      const newEvent: SocialEvent = {
         id: `evt_${Date.now()}`,
         title: suggestion.title,
         type: suggestion.type as any,
         date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
         time: '14:00',
         location: 'Common Room',
         attendeesCount: 0,
         status: 'Upcoming',
         description: suggestion.description
      };
      setEvents([...events, newEvent]);
      setSuggestions(suggestions.filter(s => s.title !== suggestion.title));
      toast.success(`Event Protocol Manifested: ${suggestion.title}`, {
         description: 'Synchronized with the Global Social Hub.'
      });
   };

   const getTypeColor = (type: string) => {
      switch (type) {
         case 'Exercise': return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
         case 'Creative': return 'bg-purple-50 text-purple-700 border-purple-100 shadow-[0_0_10px_rgba(147,51,234,0.1)]';
         case 'Outing': return 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-[0_0_10px_rgba(79,70,229,0.1)]';
         default: return 'bg-amber-50 text-amber-700 border-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      }
   };

   const getTypeIcon = (type: string) => {
      switch (type) {
         case 'Exercise': return <Dumbbell size={24} />;
         case 'Creative': return <Palette size={24} />;
         case 'Social': return <Music size={24} />;
         default: return <Star size={24} />;
      }
   }

   return (
      <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-3">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Social <span className="text-primary-600">Sync</span></h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">Therapeutic Activities & Community Wellbeing Matrix</p>
            </div>
            {user?.role === UserRole.ADMIN && (
               <button
                  onClick={() => {
                     setShowPlanner(true);
                     toast.info('Accessing Operational Planning Suite');
                  }}
                  className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95"
               >
                  <Plus size={24} /> New Deployment
               </button>
            )}
         </div>

         <div className="flex-1 flex gap-10 overflow-hidden">
            {/* Left: Interactive Event Feed */}
            <div className={`flex-1 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative ${showPlanner ? 'hidden lg:flex' : 'flex'}`}>
               <div className="p-8 border-b border-slate-50 bg-slate-50/20">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                     <Activity size={18} className="text-primary-600" />
                     Global Community Timeline
                  </h3>
               </div>

               <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
                  {events.map(evt => (
                     <div
                        key={evt.id}
                        className="flex flex-col md:flex-row gap-10 p-10 border-2 border-slate-50 rounded-[3rem] hover:shadow-2xl hover:border-primary-100 transition-all bg-white relative group overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                           {getTypeIcon(evt.type)}
                        </div>

                        {/* High-Contrast Date Matrix */}
                        <div className="flex flex-col items-center justify-center bg-slate-900 rounded-[2.25rem] p-6 w-28 shrink-0 shadow-2xl transform group-hover:scale-110 transition-transform">
                           <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                           <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{new Date(evt.date).getDate()}</span>
                        </div>

                        {/* Clinical Info Hub */}
                        <div className="flex-1 space-y-6">
                           <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                              <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight leading-none">{evt.title}</h3>
                              <span className={`text-[8px] font-black px-4 py-2 rounded-2xl border uppercase tracking-[0.2em] transform transition-transform group-hover:translate-x-2 ${getTypeColor(evt.type)}`}>
                                 {evt.type}
                              </span>
                           </div>
                           <p className="text-slate-500 font-black text-sm uppercase tracking-tight leading-relaxed max-w-2xl">{evt.description}</p>
                           <div className="flex flex-wrap gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-6 border-t border-slate-50">
                              <span className="flex items-center gap-2"><Clock size={16} className="text-primary-500" /> {evt.time}</span>
                              <span className="flex items-center gap-2"><MapPin size={16} className="text-primary-500" /> {evt.location}</span>
                              <span className="flex items-center gap-2 decoration-primary-500/20 underline decoration-4 underline-offset-4"><Users size={16} className="text-primary-500" /> {evt.attendeesCount} Confirmed Participant Tags</span>
                           </div>
                        </div>

                        {/* Diagnostic Action */}
                        <div className="flex flex-col justify-center">
                           <button
                              onClick={() => toast.info(`Retrieving activity dossier: ${evt.title}`)}
                              className="px-10 py-6 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.75rem] transition-all active:scale-95 shadow-inner"
                           >
                              Access Protocol
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Right: AI Activity Architect (Admin/Carer Only) */}
            {user?.role !== UserRole.FAMILY && user?.role !== UserRole.CLIENT && (
               <div className={`w-full lg:w-[450px] flex flex-col gap-10 ${showPlanner ? 'flex' : 'hidden lg:flex'}`}>
                  <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl flex flex-col h-full relative overflow-hidden group">
                     {/* Background Glow */}
                     <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl opacity-50" />

                     <div className="flex justify-between items-center mb-10 relative z-10">
                        <h3 className="text-[10px] font-black text-primary-400 flex items-center gap-4 uppercase tracking-[0.4em]">
                           <Brain size={28} />
                           Neural Wellbeing Architect
                        </h3>
                        <button
                           onClick={() => setShowPlanner(false)}
                           className="lg:hidden p-4 bg-white/10 hover:bg-rose-600 text-white rounded-2xl transition-all active:scale-90"
                        >
                           <X size={24} />
                        </button>
                     </div>
                     <p className="text-sm font-bold text-slate-400 mb-10 leading-relaxed uppercase tracking-tight">
                        Algorithmic synthesis of inclusive activity vectors based on active resident interest parameters.
                     </p>

                     {!isGenerating && suggestions.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-4 border-dashed border-white/5 rounded-[3rem] animate-in fade-in">
                           <div className="p-8 bg-white/5 rounded-[2rem] shadow-sm mb-8">
                              <Coffee size={64} className="text-slate-700" />
                           </div>
                           <button
                              onClick={handleGenerate}
                              className="w-full py-6 bg-primary-600 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-[1.75rem] hover:bg-white hover:text-primary-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"
                           >
                              <Sparkles size={20} /> Initialize Architect
                           </button>
                        </div>
                     )}

                     {isGenerating && (
                        <div className="flex-1 flex flex-col items-center justify-center text-primary-600 gap-6">
                           <Loader2 size={64} className="animate-spin" />
                           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Recalibrating Psychosocial Layers...</p>
                        </div>
                     )}

                     {suggestions.length > 0 && (
                        <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-hide py-4 relative z-10">
                           {suggestions.map((s, i) => (
                              <div
                                 key={i}
                                 className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-primary-500/50 hover:bg-white/10 transition-all group/card shadow-2xl"
                              >
                                 <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-black text-white text-lg uppercase tracking-tight leading-tight">{s.title}</h4>
                                    <div className="p-2 bg-primary-600/20 text-primary-400 rounded-lg"><Activity size={18} /></div>
                                 </div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 leading-relaxed">{s.description}</p>
                                 <div className="bg-primary-600/10 p-5 rounded-2xl border border-primary-500/20 mb-8">
                                    <p className="text-[8px] font-black text-primary-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Heart size={12} /> Therapeutic Rationale</p>
                                    <p className="text-xs font-bold text-white leading-relaxed opacity-90 italic">"{s.suitabilityReason}"</p>
                                 </div>
                                 <button
                                    onClick={() => handleAddEvent(s)}
                                    className="w-full py-5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                                 >
                                    <Plus size={16} /> Deploy Activity Node
                                 </button>
                              </div>
                           ))}
                           <button
                              onClick={() => {
                                 setSuggestions([]);
                                 toast.info('Clearing Architect Cache');
                              }}
                              className="w-full py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-colors"
                           >
                              Wipe Architect Memory
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default Activities;
