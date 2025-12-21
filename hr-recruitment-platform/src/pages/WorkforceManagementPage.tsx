/**
 * Workforce Management Page
 * 
 * Central hub for:
 * - Safe Staffing Calculator (CQC Regulation 18)
 * - Induction Workflow Management
 * - Staff Competency Overview
 */

import React, { useState } from 'react';
import {
    Calculator,
    BookOpen,
    Award,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Building2
} from 'lucide-react';
import SafeStaffingCalculator from '@/components/SafeStaffingCalculator';
import InductionWorkflow from '@/components/InductionWorkflow';

type ActiveTool = 'staffing' | 'induction' | null;

export default function WorkforceManagementPage() {
    const [activeTool, setActiveTool] = useState<ActiveTool>(null);

    const tools = [
        {
            id: 'staffing' as ActiveTool,
            title: 'Safe Staffing Calculator',
            description: 'Calculate CQC-compliant staffing ratios based on service user dependency levels',
            icon: Calculator,
            color: 'blue',
            badge: 'CQC Reg 18',
            features: [
                'Dependency-based ratio calculation',
                'Real-time gap analysis',
                'Shift-specific calculations',
                'Compliance recommendations'
            ]
        },
        {
            id: 'induction' as ActiveTool,
            title: 'Induction Programme',
            description: 'Structured new starter induction with Care Certificate tracking',
            icon: BookOpen,
            color: 'emerald',
            badge: 'Skills for Care',
            features: [
                'Pre-employment checklist',
                'Day 1 to Month 3 workflow',
                'Care Certificate integration',
                'Progress tracking & sign-off'
            ]
        }
    ];

    const stats = [
        { label: 'Active Inductees', value: '3', icon: Users, color: 'blue' },
        { label: 'At-Risk Staffing', value: '0', icon: AlertTriangle, color: 'amber' },
        { label: 'Competency Rate', value: '94%', icon: Award, color: 'green' },
        { label: 'Avg Induction Time', value: '78 days', icon: Clock, color: 'purple' }
    ];

    const renderTool = () => {
        switch (activeTool) {
            case 'staffing':
                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="max-w-5xl w-full max-h-[90vh] overflow-auto">
                            <SafeStaffingCalculator onClose={() => setActiveTool(null)} />
                        </div>
                    </div>
                );
            case 'induction':
                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="max-w-6xl w-full">
                            <InductionWorkflow
                                employeeId="demo-employee"
                                employeeName="New Starter (Demo)"
                                startDate={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()}
                                onClose={() => setActiveTool(null)}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Workforce Management</h1>
                            <p className="text-gray-600">Safe staffing, induction tracking & competency management</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {stats.map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                                        <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                        <p className="text-xs text-gray-500">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Tool Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {tools.map(tool => {
                        const Icon = tool.icon;
                        return (
                            <div
                                key={tool.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                                onClick={() => setActiveTool(tool.id)}
                            >
                                <div className={`h-2 bg-${tool.color}-500`} />
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 bg-${tool.color}-100 rounded-xl`}>
                                            <Icon className={`w-6 h-6 text-${tool.color}-600`} />
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${tool.color}-100 text-${tool.color}-700`}>
                                            {tool.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{tool.description}</p>

                                    <div className="space-y-2">
                                        {tool.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    <button className={`mt-6 w-full py-2.5 bg-${tool.color}-600 text-white rounded-lg font-medium hover:bg-${tool.color}-700 transition-colors`}>
                                        Open Tool
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                            <Building2 className="w-6 h-6 text-blue-600" />
                            <h3 className="font-semibold text-blue-900">CQC Regulation 18</h3>
                        </div>
                        <p className="text-sm text-blue-800 mb-4">
                            Sufficient numbers of suitably qualified, competent, skilled and experienced
                            staff must be deployed to meet requirements.
                        </p>
                        <a href="https://www.cqc.org.uk/guidance-providers/regulations-enforcement/regulation-18-staffing"
                            target="_blank"
                            className="text-sm text-blue-600 hover:underline">
                            Read CQC Guidance →
                        </a>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                        <div className="flex items-center gap-3 mb-4">
                            <Award className="w-6 h-6 text-emerald-600" />
                            <h3 className="font-semibold text-emerald-900">Care Certificate</h3>
                        </div>
                        <p className="text-sm text-emerald-800 mb-4">
                            15 standards that new health and social care workers should be
                            assessed against within 12 weeks of starting work.
                        </p>
                        <a href="https://www.skillsforcare.org.uk/Learning-development/inducting-staff/care-certificate/Care-Certificate.aspx"
                            target="_blank"
                            className="text-sm text-emerald-600 hover:underline">
                            Skills for Care Resources →
                        </a>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-6 h-6 text-amber-600" />
                            <h3 className="font-semibold text-amber-900">Quality Indicators</h3>
                        </div>
                        <p className="text-sm text-amber-800 mb-4">
                            Track staffing levels, competency completion rates, and
                            induction progress as key quality metrics.
                        </p>
                        <button className="text-sm text-amber-600 hover:underline">
                            View Quality Dashboard →
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Tool Modal */}
            {activeTool && renderTool()}
        </div>
    );
}
