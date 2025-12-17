
import React, { useState } from 'react';
import { 
  HelpCircle, Search, MessageSquare, Send, Book, 
  Server, CheckCircle2, Loader2, ExternalLink 
} from 'lucide-react';
import { askSystemHelp } from '../services/geminiService';

const Help: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am your CareFlow Support Assistant. How can I help you today?' }
  ]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    const userMsg = query;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setIsAsking(true);

    try {
      const response = await askSystemHelp(userMsg);
      setChatHistory(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Sorry, I encountered an error connecting to support.' }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
             <p className="text-slate-500 text-sm">Documentation, system status, and AI assistance.</p>
          </div>
       </div>

       <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left: Knowledge Base & Status */}
          <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">
             
             {/* Quick Links */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Book size={20} className="text-primary-600"/> Quick Guides</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {['Resetting your Password', 'How to Schedule a Visit', 'Syncing Mobile App', 'Understanding Payroll'].map(topic => (
                      <div key={topic} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group">
                         <span className="text-sm font-medium text-slate-700">{topic}</span>
                         <ExternalLink size={16} className="text-slate-400 group-hover:text-primary-600" />
                      </div>
                   ))}
                </div>
             </div>

             {/* System Status */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Server size={20} className="text-primary-600"/> System Health</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                         <CheckCircle2 className="text-green-600" size={20} />
                         <div>
                            <p className="text-sm font-bold text-green-900">API Services</p>
                            <p className="text-xs text-green-700">Operational</p>
                         </div>
                      </div>
                      <span className="text-xs font-mono text-green-800">99.99% Uptime</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                         <CheckCircle2 className="text-green-600" size={20} />
                         <div>
                            <p className="text-sm font-bold text-green-900">Database Cluster</p>
                            <p className="text-xs text-green-700">Operational</p>
                         </div>
                      </div>
                      <span className="text-xs font-mono text-green-800">12ms Latency</span>
                   </div>
                </div>
             </div>

             {/* Contact Support */}
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-blue-900">Still need help?</h3>
                   <p className="text-sm text-blue-800">Our support team is available Mon-Fri, 9am-5pm.</p>
                </div>
                <button className="px-6 py-2 bg-white text-blue-700 font-bold rounded-lg shadow-sm hover:bg-blue-50">
                   Contact Us
                </button>
             </div>
          </div>

          {/* Right: AI Chatbot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px] lg:h-auto">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
                   <HelpCircle size={18} />
                </div>
                <div>
                   <h3 className="font-bold text-slate-900 text-sm">CareFlow Assistant</h3>
                   <p className="text-[10px] text-slate-500">Ask me anything about the system</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {chatHistory.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                         msg.role === 'user' 
                         ? 'bg-primary-600 text-white rounded-tr-none' 
                         : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                      }`}>
                         {msg.text}
                      </div>
                   </div>
                ))}
                {isAsking && (
                   <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm">
                         <Loader2 className="animate-spin text-slate-400" size={18} />
                      </div>
                   </div>
                )}
             </div>

             <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                   <input 
                     type="text" 
                     className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                     placeholder="How do I create a new user?"
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                   />
                   <button 
                     onClick={handleAsk}
                     disabled={isAsking || !query.trim()}
                     className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                   >
                      <Send size={18} />
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Help;
