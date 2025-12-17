
import React, { useState, useEffect } from 'react';
import { 
  X, Bell, Check, AlertTriangle, Info, CheckCircle2, 
  Sparkles, Loader2, ArrowRight, Trash2 
} from 'lucide-react';
import { AppNotification } from '../types';
import { MOCK_NOTIFICATIONS } from '../services/mockData';
import { generateDailyBriefing } from '../services/geminiService';
import { Link } from 'react-router-dom';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [briefing, setBriefing] = useState<{ summary: string, focusAreas: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (isOpen && !briefing && unreadCount > 0) {
      handleGenerateBriefing();
    }
  }, [isOpen]);

  const handleGenerateBriefing = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDailyBriefing(notifications);
      setBriefing(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setBriefing(null);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Critical': return <AlertTriangle size={18} className="text-red-500" />;
      case 'Warning': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'Success': return <CheckCircle2 size={18} className="text-green-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-600" />
              <h3 className="font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                 <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
           </div>
           <div className="flex items-center gap-2">
              <button onClick={clearAll} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full hover:text-red-500 transition-colors" title="Clear All">
                 <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                 <X size={20} />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {/* AI Briefing */}
           <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold flex items-center gap-2 text-sm">
                       <Sparkles size={14} className="text-yellow-400" /> AI Daily Briefing
                    </h4>
                    {!briefing && !isGenerating && (
                       <button 
                         onClick={handleGenerateBriefing}
                         className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                       >
                          Refresh
                       </button>
                    )}
                 </div>
                 
                 {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-4 text-indigo-200">
                       <Loader2 size={24} className="animate-spin mb-2" />
                       <span className="text-xs">Analyzing alerts...</span>
                    </div>
                 ) : briefing ? (
                    <div className="space-y-3 animate-in fade-in">
                       <p className="text-sm font-medium leading-relaxed opacity-90">{briefing.summary}</p>
                       <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-[10px] font-bold uppercase text-indigo-300 mb-1">Top Focus Areas</p>
                          <ul className="text-xs space-y-1 list-disc list-inside text-indigo-100">
                             {briefing.focusAreas.map((area, i) => <li key={i}>{area}</li>)}
                          </ul>
                       </div>
                    </div>
                 ) : (
                    <p className="text-xs text-indigo-300">No critical updates requiring immediate attention.</p>
                 )}
              </div>
           </div>

           {/* Actions */}
           {unreadCount > 0 && (
              <div className="flex justify-end">
                 <button onClick={markAllRead} className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                    <Check size={14} /> Mark all read
                 </button>
              </div>
           )}

           {/* Notification List */}
           <div className="space-y-2">
              {notifications.length === 0 ? (
                 <div className="text-center py-12 text-slate-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">All caught up!</p>
                 </div>
              ) : (
                 notifications.map(notif => (
                    <div 
                       key={notif.id} 
                       className={`p-3 rounded-xl border transition-all relative group
                          ${notif.isRead ? 'bg-white border-slate-100' : 'bg-blue-50/30 border-blue-100'}
                       `}
                    >
                       <div className="flex gap-3">
                          <div className={`mt-1 ${notif.isRead ? 'opacity-50' : ''}`}>
                             {getIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between items-start">
                                <h5 className={`text-sm ${notif.isRead ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                                   {notif.title}
                                </h5>
                                {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></span>}
                             </div>
                             <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                             <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-slate-400">{notif.time}</span>
                                {notif.link && (
                                   <Link 
                                     to={notif.link} 
                                     onClick={() => { markRead(notif.id); onClose(); }}
                                     className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:underline"
                                   >
                                      View <ArrowRight size={10} />
                                   </Link>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
