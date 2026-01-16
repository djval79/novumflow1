import React, { useState, useRef, useEffect } from 'react';
import {
    MessageSquare,
    X,
    Send,
    Sparkles,
    User,
    Bot,
    ChevronDown,
    Loader2,
    ShieldCheck
} from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const AIComplianceAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your AI Compliance Assistant. How can I help you today? You can ask me about CQC standards, Home Office regulations, or specific staff records.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        // Simulated AI response
        setTimeout(() => {
            let response = "I've analyzed our current compliance data. Based on your query about '" + userMsg + "', everything looks stable locally, but I recommend checking the latest Home Office 'Right to Work' updates which were released this morning.";

            if (userMsg.toLowerCase().includes('cqc')) {
                response = "For CQC compliance, our current gap analysis shows we are 94% ready. The primary area for improvement is 'Safe' recruitment evidence parity across our sync nodes.";
            } else if (userMsg.toLowerCase().includes('staff') || userMsg.toLowerCase().includes('employee')) {
                response = "I've found 4 staff members with expiring DBS certificates in the next 30 days. I have automatically flagged them in the Compliance Hub.";
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 hover:scale-110 hover:bg-indigo-700 transition-all group"
                >
                    <div className="relative">
                        <MessageSquare className="w-8 h-8" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-indigo-600 rounded-full" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute right-20 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        AI Assistant Online
                    </div>
                </button>
            ) : (
                <div className="w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest">Compliance AI</h3>
                                <p className="text-[10px] text-indigo-100 opacity-80">v2.0 Enterprise Agent</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-white border border-slate-200 shadow-sm'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <div className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200 shadow-lg'
                                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Assistant is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Suggestions */}
                    <div className="px-6 py-3 flex gap-2 overflow-x-auto border-t border-slate-100 bg-white">
                        {['CQC Readiness', 'Staff Risks', 'Audit Trail'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setInput(tag)}
                                className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-full hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 transition-all whitespace-nowrap"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-6 bg-white">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about compliance..."
                                className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <button
                                onClick={handleSend}
                                className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 opacity-50">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Encrypted Secure Agent</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIComplianceAssistant;
