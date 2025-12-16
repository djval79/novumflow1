import React, { useState } from 'react';
import { Plus, X, Briefcase, Users, FileText, Calendar, Settings, Bell, MessageSquare, Clock, Mail, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
    color: string;
    description?: string;
}

export default function QuickActions() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const actions: QuickAction[] = [
        {
            id: 'new-job',
            label: 'Post New Job',
            icon: <Briefcase className="w-5 h-5" />,
            action: () => {
                navigate('/recruitment');
                setIsOpen(false);
            },
            color: 'bg-blue-500 hover:bg-blue-600',
            description: 'Create a new job posting'
        },
        {
            id: 'add-employee',
            label: 'Add Employee',
            icon: <Users className="w-5 h-5" />,
            action: () => {
                navigate('/hr');
                setIsOpen(false);
            },
            color: 'bg-green-500 hover:bg-green-600',
            description: 'Register a new employee'
        },
        {
            id: 'new-document',
            label: 'Upload Document',
            icon: <Upload className="w-5 h-5" />,
            action: () => {
                navigate('/documents');
                setIsOpen(false);
            },
            color: 'bg-purple-500 hover:bg-purple-600',
            description: 'Upload a new document'
        },
        {
            id: 'schedule-interview',
            label: 'Schedule Interview',
            icon: <Calendar className="w-5 h-5" />,
            action: () => {
                navigate('/recruitment');
                setIsOpen(false);
            },
            color: 'bg-orange-500 hover:bg-orange-600',
            description: 'Schedule a new interview'
        },
        {
            id: 'send-message',
            label: 'Send Message',
            icon: <Mail className="w-5 h-5" />,
            action: () => {
                navigate('/messaging');
                setIsOpen(false);
            },
            color: 'bg-pink-500 hover:bg-pink-600',
            description: 'Send a new message'
        },
        {
            id: 'request-leave',
            label: 'Request Leave',
            icon: <Clock className="w-5 h-5" />,
            action: () => {
                navigate('/hr');
                setIsOpen(false);
            },
            color: 'bg-teal-500 hover:bg-teal-600',
            description: 'Submit leave request'
        },
        {
            id: 'export-report',
            label: 'Generate Report',
            icon: <Download className="w-5 h-5" />,
            action: () => {
                navigate('/compliance-dashboard');
                setIsOpen(false);
            },
            color: 'bg-indigo-500 hover:bg-indigo-600',
            description: 'Export compliance report'
        },
        {
            id: 'view-notifications',
            label: 'Notifications',
            icon: <Bell className="w-5 h-5" />,
            action: () => {
                // Open notification center
                setIsOpen(false);
            },
            color: 'bg-yellow-500 hover:bg-yellow-600',
            description: 'View notifications'
        },
    ];

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${isOpen
                            ? 'bg-gray-800 rotate-45'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                        }`}
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-white" />
                    ) : (
                        <Plus className="w-6 h-6 text-white" />
                    )}
                </button>

                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition">
                        <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
                            Quick Actions
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Actions Grid */}
                    <div className="fixed bottom-24 right-6 z-40 w-80">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-700">Quick Actions</p>
                                <p className="text-xs text-gray-500">What would you like to do?</p>
                            </div>

                            <div className="p-3 grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                                {actions.map((action, index) => (
                                    <button
                                        key={action.id}
                                        onClick={action.action}
                                        className={`flex flex-col items-center p-4 rounded-xl ${action.color} text-white transition-all duration-200 transform hover:scale-105`}
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                        }}
                                    >
                                        <div className="p-2 bg-white/20 rounded-lg mb-2">
                                            {action.icon}
                                        </div>
                                        <span className="text-sm font-medium text-center">{action.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        navigate('/settings');
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
                                >
                                    <Settings className="w-4 h-4 mr-1" />
                                    Customize actions
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
