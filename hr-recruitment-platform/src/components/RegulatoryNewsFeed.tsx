import React from 'react';
import {
    Newspaper,
    ExternalLink,
    Clock,
    ShieldAlert,
    TrendingUp,
    ChevronRight,
    Megaphone
} from 'lucide-react';

const NEWS = [
    {
        id: '1',
        title: 'CQC Single Assessment Framework Update',
        summary: 'New guidelines released for home care providers regarding digital evidence submissions.',
        source: 'CQC Official',
        date: '2h ago',
        urgency: 'high',
        url: 'https://cqc.org.uk'
    },
    {
        id: '2',
        title: 'Home Office Visa Sponsorship Caps 2026',
        summary: 'Allocations for Health & Care Worker visas to be reviewed next quarter.',
        source: 'GOV.UK',
        date: '5h ago',
        urgency: 'medium',
        url: 'https://gov.uk'
    },
    {
        id: '3',
        title: 'GDPR-2 Compliance Grace Period Ending',
        summary: 'Ensure your data residency logs are encrypted and partitioned before June.',
        source: 'ICO',
        date: '1d ago',
        urgency: 'low',
        url: 'https://ico.org.uk'
    }
];

const RegulatoryNewsFeed: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-indigo-600" /> Regulatory Feed
                </h3>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Live</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {NEWS.map((item) => (
                    <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${item.urgency === 'high' ? 'bg-rose-100 text-rose-600' :
                                    item.urgency === 'medium' ? 'bg-amber-100 text-amber-600' :
                                        'bg-slate-100 text-slate-500'
                                }`}>
                                {item.urgency}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.date}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm leading-snug">
                            {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {item.summary}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>{item.source}</span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </a>
                ))}
            </div>

            <button className="p-4 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 border-t border-slate-50 transition-all">
                View All Intelligence
            </button>
        </div>
    );
};

export default RegulatoryNewsFeed;
