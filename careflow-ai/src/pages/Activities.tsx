
import React, { useState } from 'react';
import { 
  Calendar, MapPin, Users, Clock, CheckCircle2, 
  Sparkles, Loader2, Coffee, Plus, X
} from 'lucide-react';
import { MOCK_EVENTS } from '../services/mockData';
import { SocialEvent, ActivitySuggestion, UserRole } from '../types';
import { generateActivityIdeas } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

const Activities: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SocialEvent[]>(MOCK_EVENTS);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);

  // Handlers
  const handleGenerate = async () => {
    setIsGenerating(true);
    const interests = ["Classic Movies", "Gardening", "Music from the 60s", "Light Exercise"];
    try {
      const result = await generateActivityIdeas(interests);
      setSuggestions(result);
    } catch (error) {
      console.error(error);
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
    // Remove from suggestions to avoid duplicates
    setSuggestions(suggestions.filter(s => s.title !== suggestion.title));
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Exercise': return 'bg-green-100 text-green-700 border-green-200';
      case 'Creative': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Outing': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Activities & Community</h1>
             <p className="text-slate-500 text-sm">Social events, wellbeing sessions, and community engagement.</p>
          </div>
          {user?.role === UserRole.ADMIN && (
             <button 
               onClick={() => setShowPlanner(true)}
               className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2"
             >
                <Plus size={18} /> Plan Event
             </button>
          )}
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: Calendar / Feed */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Upcoming Events</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {events.map(evt => (
                   <div key={evt.id} className="flex flex-col md:flex-row gap-4 p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow bg-white">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-3 w-20 shrink-0 border border-slate-100">
                         <span className="text-xs font-bold text-slate-500 uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                         <span className="text-2xl font-bold text-slate-900">{new Date(evt.date).getDate()}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-lg text-slate-900">{evt.title}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getTypeColor(evt.type)}`}>
                               {evt.type}
                            </span>
                         </div>
                         <p className="text-sm text-slate-600 mb-3">{evt.description}</p>
                         <div className="flex gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock size={14}/> {evt.time}</span>
                            <span className="flex items-center gap-1"><MapPin size={14}/> {evt.location}</span>
                            <span className="flex items-center gap-1"><Users size={14}/> {evt.attendeesCount} Attending</span>
                         </div>
                      </div>

                      {/* Action */}
                      <div className="flex flex-col justify-center">
                         <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm">
                            View
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Right: AI Planner (Admin/Carer) */}
          {user?.role !== UserRole.FAMILY && user?.role !== UserRole.CLIENT && (
             <div className={`w-full md:w-1/3 flex flex-col gap-6 ${showPlanner ? 'block' : 'hidden md:flex'}`}>
                <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-6 shadow-sm flex flex-col h-full">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-purple-900 flex items-center gap-2"><Sparkles size={18}/> AI Activity Planner</h3>
                      <button onClick={() => setShowPlanner(false)} className="md:hidden p-1 hover:bg-purple-100 rounded"><X size={20}/></button>
                   </div>
                   <p className="text-sm text-purple-800 mb-6">
                      Generate inclusive activity ideas tailored to current residents' interests and abilities.
                   </p>
                   
                   {!isGenerating && suggestions.length === 0 && (
                      <div className="text-center py-12">
                         <Coffee size={48} className="text-purple-200 mx-auto mb-4"/>
                         <button 
                           onClick={handleGenerate}
                           className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-lg flex items-center justify-center gap-2 mx-auto"
                         >
                            <Sparkles size={18}/> Generate Ideas
                         </button>
                      </div>
                   )}

                   {isGenerating && (
                      <div className="flex-1 flex items-center justify-center text-purple-600">
                         <Loader2 size={32} className="animate-spin"/>
                      </div>
                   )}

                   {suggestions.length > 0 && (
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                         {suggestions.map((s, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                               <h4 className="font-bold text-slate-900 text-sm mb-1">{s.title}</h4>
                               <p className="text-xs text-slate-500 mb-2">{s.description}</p>
                               <div className="bg-purple-50 p-2 rounded text-xs text-purple-800 mb-3">
                                  <strong>Why:</strong> {s.suitabilityReason}
                               </div>
                               <button 
                                 onClick={() => handleAddEvent(s)}
                                 className="w-full py-1.5 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 flex items-center justify-center gap-1"
                               >
                                  <Plus size={12}/> Add to Calendar
                               </button>
                            </div>
                         ))}
                         <button 
                           onClick={() => setSuggestions([])}
                           className="w-full py-2 text-xs text-purple-600 font-bold hover:underline"
                         >
                            Clear & Start Over
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
