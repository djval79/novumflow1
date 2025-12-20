
import React, { useState, useEffect } from 'react';
import {
   Search, Send, Paperclip, MoreVertical, Sparkles, Loader2,
   User, Clock, ArrowLeft, Activity, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, UserRole } from '../types';
import { generateSmartReplies } from '../services/geminiService';
import { toast } from 'sonner';

// Default demo conversations for when no real data exists
const DEFAULT_CONVERSATIONS: Conversation[] = [
   {
      id: '1',
      participants: ['Care Coordinator', 'You'],
      subject: 'Shift Change Request',
      category: 'Scheduling',
      lastMessage: 'Hi, can you cover the morning shift tomorrow?',
      lastMessageTime: '2 hours ago',
      unreadCount: 1,
      messages: [
         { id: 'm1', senderId: 'coord', senderName: 'Care Coordinator', role: 'Coordinator' as any, timestamp: '2 hours ago', content: 'Hi, can you cover the morning shift tomorrow?', isRead: false }
      ]
   },
   {
      id: '2',
      participants: ['HR Team', 'You'],
      subject: 'Training Reminder',
      category: 'General',
      lastMessage: 'Your fire safety refresher is due next week.',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
      messages: [
         { id: 'm2', senderId: 'hr', senderName: 'HR Team', role: 'Admin' as any, timestamp: 'Yesterday', content: 'Your fire safety refresher is due next week.', isRead: true }
      ]
   }
];

const Messages: React.FC = () => {
   const { user, profile } = useAuth();
   const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
   const [conversations, setConversations] = useState<Conversation[]>(DEFAULT_CONVERSATIONS);
   const [newMessage, setNewMessage] = useState('');
   const [smartReplies, setSmartReplies] = useState<string[]>([]);
   const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);

   const userName = profile?.full_name || user?.email?.split('@')[0] || 'You';
   const activeConversation = conversations.find(c => c.id === activeConversationId);
   const otherParticipant = activeConversation?.participants.filter(p => p !== userName).join(', ') || 'Protocol Target';

   // Handlers
   const handleSendMessage = (text: string) => {
      if (!text.trim() || !activeConversationId || !user) return;

      const newMsg = {
         id: `m${Date.now()}`,
         senderId: user.id,
         senderName: userName,
         role: (profile?.role || UserRole.CARER) as UserRole,
         timestamp: 'Just now',
         content: text,
         isRead: true
      };

      setConversations(prev => prev.map(c => {
         if (c.id === activeConversationId) {
            return {
               ...c,
               messages: [...c.messages, newMsg],
               lastMessage: text,
               lastMessageTime: 'Just now',
               unreadCount: 0
            };
         }
         return c;
      }));

      setNewMessage('');
      setSmartReplies([]);
      toast.success('Transmission Sent', {
         description: 'Secure communication packet dispatched to participant matrix.'
      });
   };

   const handleGenerateAIReplies = async () => {
      if (!activeConversation) return;
      setIsGeneratingReplies(true);
      const replyToast = toast.loading('Initializing neural reply synthesis...');

      const history = activeConversation.messages.slice(-3).map(m => `${m.senderName}: ${m.content}`).join('\n');

      try {
         const replies = await generateSmartReplies(history);
         setSmartReplies(replies);
         toast.success('Smart Reply Vectors Manifested', { id: replyToast });
      } catch (e) {
         toast.error('Neural Logic Error', { id: replyToast });
      } finally {
         setIsGeneratingReplies(false);
      }
   };

   return (
      <div className="h-[calc(100vh-6.5rem)] flex bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in duration-700 max-w-7xl mx-auto mb-6">

         {/* Sidebar: Unit Stream Matrix */}
         <div className={`w-full md:w-96 border-r border-slate-50 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'} bg-slate-50/20`}>
            <div className="p-10 border-b border-slate-50">
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-8 flex items-center gap-4">
                  <Activity size={24} className="text-primary-600" />
                  Comms <span className="text-primary-600">Grid</span>
               </h2>
               <div className="relative">
                  <Search className="absolute left-6 top-5 text-slate-300" size={18} />
                  <input
                     type="text"
                     placeholder="Filter Grid Stream..."
                     className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-200 shadow-sm transition-all"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-3">
               {conversations.map(conv => {
                  const isUnread = conv.unreadCount > 0;
                  const isActive = conv.id === activeConversationId;
                  const participantName = conv.participants.filter(p => p !== userName).join(', ');

                  return (
                     <div
                        key={conv.id}
                        onClick={() => {
                           setActiveConversationId(conv.id);
                           toast.info(`Synchronizing with channel: ${participantName}`);
                        }}
                        className={`p-6 rounded-[2.25rem] border transition-all cursor-pointer group relative overflow-hidden
                   ${isActive ? 'bg-slate-900 border-slate-900 shadow-2xl' : 'bg-white border-slate-50 hover:bg-slate-100/50'}
                 `}
                     >
                        <div className="flex justify-between items-start mb-3 relative z-10">
                           <h3 className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : isUnread ? 'text-slate-900' : 'text-slate-500'}`}>
                              {participantName}
                           </h3>
                           <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{conv.lastMessageTime}</span>
                        </div>
                        <p className={`text-xs font-bold truncate mb-4 ${isActive ? 'text-slate-400' : isUnread ? 'text-slate-800' : 'text-slate-500'}`}>
                           {conv.lastMessage}
                        </p>
                        <div className="flex items-center justify-between relative z-10">
                           <span className={`text-[8px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.2em]
                       ${conv.category === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100' :
                                 conv.category === 'Scheduling' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-100' :
                                    isActive ? 'bg-white/10 text-white border-white/10' : 'bg-slate-50 text-slate-400 border-slate-50'
                              }
                    `}>
                              {conv.category}
                           </span>
                           {isUnread && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.8)] animate-pulse"></div>}
                        </div>
                        {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl -mr-16 -mt-16" />}
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Main: Protocol Transmit Terminal */}
         <div className={`flex-1 flex flex-col ${activeConversationId ? 'flex' : 'hidden md:flex'} relative`}>
            {activeConversationId ? (
               <>
                  {/* Terminal Header */}
                  <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white relative z-10">
                     <div className="flex items-center gap-8">
                        <button className="md:hidden p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all" onClick={() => setActiveConversationId(null)}>
                           <ArrowLeft size={24} className="text-slate-900" />
                        </button>
                        <div className="w-16 h-16 rounded-[1.75rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl border-4 border-white">
                           <User size={32} />
                        </div>
                        <div className="space-y-1">
                           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{otherParticipant}</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeConversation?.subject}</p>
                        </div>
                     </div>
                     <button className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-95">
                        <MoreVertical size={24} />
                     </button>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide bg-slate-50/10 relative">
                     <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10" />
                     {activeConversation?.messages.map(msg => {
                        const isMe = msg.senderId === user?.id;
                        return (
                           <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                              <div className={`max-w-[70%] rounded-[2.5rem] p-8 shadow-2xl relative
                           ${isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-50 text-slate-900 rounded-tl-none'}
                        `}>
                                 {!isMe && <p className="text-[8px] font-black uppercase tracking-[0.4em] mb-4 text-primary-500">{msg.senderName}</p>}
                                 <p className="text-sm font-bold tracking-tight leading-relaxed">{msg.content}</p>
                                 <div className={`text-[8px] font-black uppercase tracking-widest mt-6 flex items-center gap-2 ${isMe ? 'text-slate-500 justify-end' : 'text-slate-300'}`}>
                                    <Clock size={12} className="text-primary-500" /> {msg.timestamp}
                                 </div>
                                 {isMe && <div className="absolute -bottom-1 -right-1 p-2"><ShieldCheck size={12} className="text-green-500" /></div>}
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* Neural Reply Hub */}
                  <div className="px-10 py-6 bg-white border-t border-slate-50 relative z-20">
                     <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-2">
                           <Brain size={16} className="text-primary-600" />
                           Neural Assist Layer
                        </h4>
                        <button
                           onClick={handleGenerateAIReplies}
                           disabled={isGeneratingReplies}
                           className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 hover:text-black transition-colors disabled:opacity-30 group"
                        >
                           {isGeneratingReplies ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} className="group-hover:rotate-12 transition-transform" />}
                           {isGeneratingReplies ? 'Synthesizing...' : 'Trigger AI Replies'}
                        </button>
                     </div>
                     {smartReplies.length > 0 && (
                        <div className="flex gap-4 mb-4 overflow-x-auto pb-6 scrollbar-hide">
                           {smartReplies.map((reply, i) => (
                              <button
                                 key={i}
                                 onClick={() => handleSendMessage(reply)}
                                 className="whitespace-nowrap px-10 py-5 bg-slate-50 hover:bg-slate-900 hover:text-white border-2 border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-2xl hover:scale-[1.05] active:scale-95 flex items-center gap-3"
                              >
                                 {reply}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>

                  {/* Transmission Terminal */}
                  <div className="p-10 bg-white border-t border-slate-50 flex items-center gap-6 relative z-30">
                     <button className="p-5 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[1.5rem] text-slate-400 transition-all shadow-inner active:scale-90"><Paperclip size={24} /></button>
                     <div className="flex-1 relative">
                        <input
                           type="text"
                           className="w-full pl-8 pr-12 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] text-sm font-black tracking-tight uppercase focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-300 transition-all scrollbar-hide"
                           placeholder="Enter secure communication protocol..."
                           value={newMessage}
                           onChange={(e) => setNewMessage(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
                        />
                     </div>
                     <button
                        onClick={() => handleSendMessage(newMessage)}
                        disabled={!newMessage.trim()}
                        className="p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-black disabled:opacity-30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all active:scale-90"
                     >
                        <Send size={28} />
                     </button>
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-8">
                  <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center shadow-inner relative group transform hover:rotate-12 transition-all">
                     <Send size={48} className="text-slate-200 -ml-2" />
                     <div className="absolute inset-0 bg-primary-600/5 rounded-full blur-3xl group-hover:bg-primary-600/10 transition-colors" />
                  </div>
                  <div className="space-y-3">
                     <h2 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Null Channel Selected</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-[280px] mx-auto leading-relaxed">Select an active communication vector from the primary grid to initiate secure transmission.</p>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default Messages;
