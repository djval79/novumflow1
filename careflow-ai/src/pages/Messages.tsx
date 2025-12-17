
import React, { useState } from 'react';
import { 
  Search, Send, Paperclip, MoreVertical, Sparkles, Loader2, 
  User, Clock, ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, UserRole } from '../types';
import { MOCK_CONVERSATIONS } from '../services/mockData';
import { generateSmartReplies } from '../services/geminiService';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [newMessage, setNewMessage] = useState('');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const otherParticipant = activeConversation?.participants.find(p => p !== user?.name) || 'User';

  // Handlers
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !activeConversationId || !user) return;

    const newMsg = {
      id: `m${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      role: user.role,
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
  };

  const handleGenerateAIReplies = async () => {
    if (!activeConversation) return;
    setIsGeneratingReplies(true);
    
    // Construct simple history string
    const history = activeConversation.messages.slice(-3).map(m => `${m.senderName}: ${m.content}`).join('\n');
    
    try {
      const replies = await generateSmartReplies(history);
      setSmartReplies(replies);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReplies(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Messages</h2>
          <div className="relative">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
             <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
             />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
           {conversations.map(conv => {
             // Determine styling based on read status
             const isUnread = conv.unreadCount > 0;
             const isActive = conv.id === activeConversationId;
             
             return (
               <div 
                 key={conv.id}
                 onClick={() => setActiveConversationId(conv.id)}
                 className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors
                   ${isActive ? 'bg-primary-50/50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}
                 `}
               >
                 <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                       {conv.participants.filter(p => p !== user?.name).join(', ')}
                    </h3>
                    <span className="text-xs text-slate-400">{conv.lastMessageTime}</span>
                 </div>
                 <p className={`text-xs truncate ${isUnread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                 </p>
                 <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border
                       ${conv.category === 'Urgent' ? 'bg-red-50 text-red-700 border-red-100' : 
                         conv.category === 'Scheduling' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                         'bg-slate-100 text-slate-600 border-slate-200'
                       }
                    `}>
                       {conv.category}
                    </span>
                    {isUnread && <span className="w-2 h-2 bg-primary-600 rounded-full"></span>}
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className={`flex-1 flex flex-col ${activeConversationId ? 'flex' : 'hidden md:flex'}`}>
        {activeConversationId ? (
          <>
             {/* Chat Header */}
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <button className="md:hidden p-1 hover:bg-slate-200 rounded-full" onClick={() => setActiveConversationId(null)}>
                      <ArrowLeft size={20} className="text-slate-600" />
                   </button>
                   <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                      <User size={20} />
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-900">{otherParticipant}</h3>
                      <p className="text-xs text-slate-500">{activeConversation?.subject}</p>
                   </div>
                </div>
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                   <MoreVertical size={20} />
                </button>
             </div>

             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {activeConversation?.messages.map(msg => {
                   const isMe = msg.senderId === user?.id;
                   return (
                     <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl p-3 shadow-sm
                           ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}
                        `}>
                           {!isMe && <p className="text-[10px] font-bold mb-1 opacity-70">{msg.senderName}</p>}
                           <p className="text-sm leading-relaxed">{msg.content}</p>
                           <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-primary-100 justify-end' : 'text-slate-400'}`}>
                              <Clock size={10} /> {msg.timestamp}
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Smart Replies */}
             <div className="px-4 py-2 bg-white border-t border-slate-100">
               {smartReplies.length > 0 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                     {smartReplies.map((reply, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleSendMessage(reply)}
                          className="whitespace-nowrap px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
                        >
                           <Sparkles size={10} /> {reply}
                        </button>
                     ))}
                  </div>
               )}
               <div className="flex justify-end">
                 <button 
                   onClick={handleGenerateAIReplies} 
                   disabled={isGeneratingReplies}
                   className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                 >
                    {isGeneratingReplies ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                    {isGeneratingReplies ? 'Drafting...' : 'AI Smart Reply'}
                 </button>
               </div>
             </div>

             {/* Input Area */}
             <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><Paperclip size={20} /></button>
                <input 
                   type="text" 
                   className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                   placeholder="Type your message..."
                   value={newMessage}
                   onChange={(e) => setNewMessage(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
                />
                <button 
                   onClick={() => handleSendMessage(newMessage)}
                   disabled={!newMessage.trim()}
                   className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                   <Send size={18} />
                </button>
             </div>
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Send size={24} className="opacity-30 -ml-1" />
              </div>
              <p className="font-medium">Select a conversation to start messaging</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
