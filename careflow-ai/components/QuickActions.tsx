import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, X, FileHeart, Pill, Calendar, Users,
    Map, ClipboardCheck, ShieldAlert, MessageSquare,
    Video, GraduationCap
} from 'lucide-react';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    href: string;
    description?: string;
}

const quickActions: QuickAction[] = [
    {
        id: 'start-visit',
        label: 'Start Visit',
        icon: <FileHeart className="w-5 h-5" />,
        color: 'bg-cyan-500',
        href: '/rostering',
        description: 'Begin a care visit'
    },
    {
        id: 'add-medication',
        label: 'Record Medication',
        icon: <Pill className="w-5 h-5" />,
        color: 'bg-purple-500',
        href: '/medication',
        description: 'Log medication administration'
    },
    {
        id: 'new-shift',
        label: 'Create Shift',
        icon: <Calendar className="w-5 h-5" />,
        color: 'bg-blue-500',
        href: '/rostering',
        description: 'Schedule a new shift'
    },
    {
        id: 'add-client',
        label: 'Add Client',
        icon: <Users className="w-5 h-5" />,
        color: 'bg-green-500',
        href: '/people',
        description: 'Register new service user'
    },
    {
        id: 'report-incident',
        label: 'Report Incident',
        icon: <ShieldAlert className="w-5 h-5" />,
        color: 'bg-red-500',
        href: '/incidents',
        description: 'Log safeguarding concern'
    },
    {
        id: 'view-routes',
        label: 'View Routes',
        icon: <Map className="w-5 h-5" />,
        color: 'bg-emerald-500',
        href: '/routes',
        description: 'See optimized visit routes'
    },
    {
        id: 'fill-form',
        label: 'Quick Form',
        icon: <ClipboardCheck className="w-5 h-5" />,
        color: 'bg-amber-500',
        href: '/forms',
        description: 'Complete care form'
    },
    {
        id: 'start-call',
        label: 'Telehealth Call',
        icon: <Video className="w-5 h-5" />,
        color: 'bg-indigo-500',
        href: '/telehealth',
        description: 'Start video consultation'
    },
];

export default function QuickActions() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleAction(action: QuickAction) {
        navigate(action.href);
        setIsOpen(false);
    }

    return (
        <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
            {/* Expanded Menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                    <div className="p-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
                        <h3 className="font-semibold">Quick Actions</h3>
                        <p className="text-xs text-cyan-100">Common tasks at your fingertips</p>
                    </div>

                    <div className="p-2 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                        {quickActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleAction(action)}
                                className="flex flex-col items-center p-3 rounded-xl text-center hover:bg-slate-50 transition group"
                            >
                                <div className={`${action.color} text-white p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
                                    {action.icon}
                                </div>
                                <span className="text-xs font-medium text-slate-700">{action.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <a
                            href="#/settings"
                            className="text-xs text-slate-500 hover:text-slate-700"
                        >
                            Customize actions →
                        </a>
                    </div>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen
                        ? 'bg-slate-700 rotate-45'
                        : 'bg-gradient-to-br from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <Plus className="w-6 h-6 text-white" />
                )}
            </button>
        </div>
    );
}
