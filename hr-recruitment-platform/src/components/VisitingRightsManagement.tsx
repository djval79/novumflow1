/**
 * Visiting Rights Management
 * 
 * CQC Regulation 9A Compliance (Effective 6 April 2024)
 * 
 * This regulation requires care providers to:
 * - Ensure service users can receive visitors
 * - Not impose blanket visiting restrictions
 * - Only restrict visiting for genuine reasons
 * - Document all visiting decisions
 */

import React, { useState, useEffect } from 'react';
import {
    Users,
    Heart,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    Shield,
    FileText,
    User,
    Home,
    Info,
    Plus,
    X,
    Edit2,
    Loader2,
    MessageSquare,
    RefreshCcw,
    AlertCircle
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// TYPES
// ============================================

interface VisitingPolicy {
    id: string;
    locationId: string;
    locationName: string;
    defaultHours: { start: string; end: string };
    flexibleVisiting: boolean;
    overnightAllowed: boolean;
    maxVisitorsAtOnce: number;
    bookingRequired: boolean;
    lastReviewDate: string;
    nextReviewDate: string;
    status: 'active' | 'under_review' | 'suspended';
}

interface VisitingRestriction {
    id: string;
    serviceUserId: string;
    serviceUserName: string;
    restrictionType: 'temporary' | 'individual' | 'location_wide';
    reason: string;
    reasonCategory: 'infection_control' | 'safeguarding' | 'medical' | 'service_user_request' | 'other';
    startDate: string;
    endDate?: string;
    reviewDate: string;
    alternativeArrangements: string;
    approvedBy: string;
    approvedAt: string;
    status: 'active' | 'ended' | 'under_review';
    documentedEvidence?: string;
}

interface VisitLog {
    id: string;
    serviceUserId: string;
    visitorName: string;
    visitDate: string;
    visitTime: string;
    duration: number;
    visitType: 'in_person' | 'virtual' | 'outdoor' | 'overnight';
    notes?: string;
}

// ============================================
// CONSTANTS
// ============================================

const RESTRICTION_REASONS = [
    { value: 'infection_control', label: 'Infection Control Outbreak', description: 'Active outbreak requiring isolation', maxDuration: 14 },
    { value: 'safeguarding', label: 'Safeguarding Concern', description: 'Protection measures in place', maxDuration: null },
    { value: 'medical', label: 'Medical Treatment', description: 'Temporary medical intervention', maxDuration: 7 },
    { value: 'service_user_request', label: 'Service User Request', description: 'Individual has requested privacy', maxDuration: null },
    { value: 'other', label: 'Other (Documented)', description: 'Must be fully documented', maxDuration: null }
];

// ============================================
// COMPONENT
// ============================================

export default function VisitingRightsManagement() {
    const { currentTenant } = useTenant();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'restrictions' | 'log' | 'policy'>('overview');
    const [showAddRestriction, setShowAddRestriction] = useState(false);

    // Demo data
    const [policies] = useState<VisitingPolicy[]>([
        {
            id: '1',
            locationId: 'loc1',
            locationName: 'Maple House Care Home',
            defaultHours: { start: '08:00', end: '21:00' },
            flexibleVisiting: true,
            overnightAllowed: true,
            maxVisitorsAtOnce: 3,
            bookingRequired: false,
            lastReviewDate: '2024-11-01',
            nextReviewDate: '2025-02-01',
            status: 'active'
        }
    ]);

    const [restrictions, setRestrictions] = useState<VisitingRestriction[]>([
        {
            id: 'r1',
            serviceUserId: 'su1',
            serviceUserName: 'Mr. James Wilson',
            restrictionType: 'temporary',
            reason: 'COVID-19 outbreak on unit - 5 confirmed cases',
            reasonCategory: 'infection_control',
            startDate: '2024-12-18',
            endDate: '2024-12-25',
            reviewDate: '2024-12-22',
            alternativeArrangements: 'Video calls twice daily, window visits arranged',
            approvedBy: 'Sarah Manager',
            approvedAt: '2024-12-18T10:30:00',
            status: 'active',
            documentedEvidence: 'Infection control report attached'
        }
    ]);

    const [visitLogs] = useState<VisitLog[]>([
        { id: 'v1', serviceUserId: 'su1', visitorName: 'Mary Wilson (Wife)', visitDate: '2024-12-20', visitTime: '14:00', duration: 120, visitType: 'in_person' },
        { id: 'v2', serviceUserId: 'su2', visitorName: 'John Smith (Son)', visitDate: '2024-12-20', visitTime: '10:30', duration: 60, visitType: 'in_person' },
        { id: 'v3', serviceUserId: 'su1', visitorName: 'Mary Wilson (Wife)', visitDate: '2024-12-19', visitTime: '15:00', duration: 90, visitType: 'virtual' },
    ]);

    // New restriction form state
    const [newRestriction, setNewRestriction] = useState({
        serviceUserName: '',
        reasonCategory: 'infection_control',
        reason: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        alternativeArrangements: ''
    });

    const complianceStats = {
        totalServiceUsers: 24,
        activeRestrictions: restrictions.filter(r => r.status === 'active').length,
        visitsThisWeek: 47,
        virtualVisits: 12,
        complianceScore: 98
    };

    const handleAddRestriction = () => {
        if (!newRestriction.serviceUserName || !newRestriction.reason || !newRestriction.alternativeArrangements) {
            alert('Please fill in all required fields');
            return;
        }

        const restriction: VisitingRestriction = {
            id: `r${Date.now()}`,
            serviceUserId: `su${Date.now()}`,
            serviceUserName: newRestriction.serviceUserName,
            restrictionType: 'temporary',
            reason: newRestriction.reason,
            reasonCategory: newRestriction.reasonCategory as any,
            startDate: newRestriction.startDate,
            endDate: newRestriction.endDate || undefined,
            reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            alternativeArrangements: newRestriction.alternativeArrangements,
            approvedBy: profile?.full_name || 'Unknown',
            approvedAt: new Date().toISOString(),
            status: 'active'
        };

        setRestrictions([...restrictions, restriction]);
        setShowAddRestriction(false);
        setNewRestriction({
            serviceUserName: '',
            reasonCategory: 'infection_control',
            reason: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            alternativeArrangements: ''
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-rose-600 to-pink-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Visiting Rights Management</h2>
                            <p className="text-rose-100">CQC Regulation 9A Compliance</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-rose-100">Compliance Score</p>
                        <p className="text-3xl font-bold text-white">{complianceStats.complianceScore}%</p>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-rose-50 border-b border-rose-100">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-rose-800">
                        <p className="font-semibold">CQC Regulation 9A: Right to Receive Visitors (From 6 April 2024)</p>
                        <p className="mt-1">
                            All care providers must ensure service users can receive visitors and not impose blanket restrictions.
                            Any restrictions must be proportionate, time-limited, and have documented alternative arrangements.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex">
                    {[
                        { id: 'overview', label: 'Overview', icon: Home },
                        { id: 'restrictions', label: 'Active Restrictions', icon: AlertTriangle },
                        { id: 'log', label: 'Visit Log', icon: Calendar },
                        { id: 'policy', label: 'Visiting Policy', icon: FileText }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-rose-600 text-rose-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {tab.id === 'restrictions' && complianceStats.activeRestrictions > 0 && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                        {complianceStats.activeRestrictions}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <Users className="w-4 h-4" />
                                    <span className="text-xs font-medium">Service Users</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{complianceStats.totalServiceUsers}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 text-green-600 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-xs font-medium">Visits This Week</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{complianceStats.visitsThisWeek}</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-600 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-medium">Virtual Visits</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{complianceStats.virtualVisits}</p>
                            </div>
                            <div className={`p-4 rounded-lg ${complianceStats.activeRestrictions > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                                <div className={`flex items-center gap-2 mb-1 ${complianceStats.activeRestrictions > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-medium">Active Restrictions</span>
                                </div>
                                <p className={`text-2xl font-bold ${complianceStats.activeRestrictions > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                    {complianceStats.activeRestrictions}
                                </p>
                            </div>
                            <div className="p-4 bg-rose-50 rounded-lg">
                                <div className="flex items-center gap-2 text-rose-600 mb-1">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-xs font-medium">Compliance</span>
                                </div>
                                <p className="text-2xl font-bold text-rose-600">{complianceStats.complianceScore}%</p>
                            </div>
                        </div>

                        {/* Compliance Checklist */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-rose-600" />
                                Regulation 9A Compliance Checklist
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Visiting policy in place and reviewed within 3 months', checked: true },
                                    { label: 'No blanket visiting restrictions', checked: true },
                                    { label: 'All restrictions documented with reasons', checked: true },
                                    { label: 'Alternative arrangements for any restrictions', checked: true },
                                    { label: 'Restrictions have review dates', checked: true },
                                    { label: 'Service users consulted on visiting preferences', checked: true },
                                    { label: 'Flexible visiting hours available', checked: true },
                                    { label: 'Overnight stays facilitated where appropriate', checked: true }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <CheckCircle className={`w-5 h-5 ${item.checked ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span className={item.checked ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Recent Visits</h3>
                            <div className="space-y-2">
                                {visitLogs.slice(0, 3).map(log => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-gray-900">{log.visitorName}</p>
                                                <p className="text-sm text-gray-500">{log.visitDate} at {log.visitTime}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.visitType === 'in_person' ? 'bg-green-100 text-green-700' :
                                                log.visitType === 'virtual' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-purple-100 text-purple-700'
                                            }`}>
                                            {log.visitType.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Restrictions Tab */}
                {activeTab === 'restrictions' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Active Visiting Restrictions</h3>
                            <button
                                onClick={() => setShowAddRestriction(true)}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Restriction
                            </button>
                        </div>

                        {restrictions.filter(r => r.status === 'active').length === 0 ? (
                            <div className="text-center py-12 bg-green-50 rounded-lg">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h4 className="font-semibold text-green-800">No Active Restrictions</h4>
                                <p className="text-sm text-green-600 mt-1">All service users have full visiting rights</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {restrictions.filter(r => r.status === 'active').map(restriction => (
                                    <div key={restriction.id} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-amber-900">{restriction.serviceUserName}</h4>
                                                <p className="text-sm text-amber-700">{restriction.reason}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-medium">
                                                {restriction.restrictionType}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                            <div>
                                                <p className="text-amber-600">Start Date</p>
                                                <p className="font-medium text-amber-900">{restriction.startDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-amber-600">End Date</p>
                                                <p className="font-medium text-amber-900">{restriction.endDate || 'Under review'}</p>
                                            </div>
                                            <div>
                                                <p className="text-amber-600">Review Date</p>
                                                <p className="font-medium text-amber-900">{restriction.reviewDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-amber-600">Approved By</p>
                                                <p className="font-medium text-amber-900">{restriction.approvedBy}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                                            <p className="text-xs font-semibold text-amber-700 mb-1">Alternative Arrangements:</p>
                                            <p className="text-sm text-amber-900">{restriction.alternativeArrangements}</p>
                                        </div>

                                        <div className="flex gap-2 mt-3">
                                            <button className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 rounded text-sm hover:bg-amber-100">
                                                <RefreshCcw className="w-4 h-4 inline mr-1" />
                                                Review
                                            </button>
                                            <button className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                                End Restriction
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Visit Log Tab */}
                {activeTab === 'log' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">Visit Log</h3>
                            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Log Visit
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date/Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Visitor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Duration</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visitLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {log.visitDate}<br />
                                                <span className="text-gray-500">{log.visitTime}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{log.visitorName}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.visitType === 'in_person' ? 'bg-green-100 text-green-700' :
                                                        log.visitType === 'virtual' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {log.visitType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{log.duration} mins</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{log.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Policy Tab */}
                {activeTab === 'policy' && (
                    <div className="space-y-6">
                        {policies.map(policy => (
                            <div key={policy.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Home className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">{policy.locationName}</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${policy.status === 'active' ? 'bg-green-100 text-green-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {policy.status}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Default Hours</p>
                                            <p className="font-medium text-gray-900">{policy.defaultHours.start} - {policy.defaultHours.end}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Flexible Visiting</p>
                                            <p className={`font-medium ${policy.flexibleVisiting ? 'text-green-600' : 'text-gray-900'}`}>
                                                {policy.flexibleVisiting ? '✓ Yes - 24/7 available' : 'No'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Overnight Stays</p>
                                            <p className={`font-medium ${policy.overnightAllowed ? 'text-green-600' : 'text-gray-900'}`}>
                                                {policy.overnightAllowed ? '✓ Allowed' : 'Not available'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Max Visitors</p>
                                            <p className="font-medium text-gray-900">{policy.maxVisitorsAtOnce} at once</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-500">Last reviewed: {policy.lastReviewDate}</span>
                                        <span className="text-gray-500">Next review: {policy.nextReviewDate}</span>
                                        <button className="ml-auto px-3 py-1.5 bg-rose-100 text-rose-700 rounded text-sm font-medium hover:bg-rose-200 flex items-center gap-1">
                                            <Edit2 className="w-4 h-4" />
                                            Edit Policy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Restriction Modal */}
            {showAddRestriction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-orange-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                    <h3 className="font-bold text-white">Add Visiting Restriction</h3>
                                </div>
                                <button onClick={() => setShowAddRestriction(false)} className="text-white/80 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-800">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    Restrictions must be proportionate, time-limited, and documented.
                                    Alternative arrangements are mandatory under Regulation 9A.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service User Name *</label>
                                <input
                                    type="text"
                                    value={newRestriction.serviceUserName}
                                    onChange={(e) => setNewRestriction(prev => ({ ...prev, serviceUserName: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                    placeholder="Enter service user name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason Category *</label>
                                <select
                                    value={newRestriction.reasonCategory}
                                    onChange={(e) => setNewRestriction(prev => ({ ...prev, reasonCategory: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                >
                                    {RESTRICTION_REASONS.map(reason => (
                                        <option key={reason.value} value={reason.value}>{reason.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Reason *</label>
                                <textarea
                                    value={newRestriction.reason}
                                    onChange={(e) => setNewRestriction(prev => ({ ...prev, reason: e.target.value }))}
                                    rows={2}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                    placeholder="Provide specific details..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newRestriction.startDate}
                                        onChange={(e) => setNewRestriction(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={newRestriction.endDate}
                                        onChange={(e) => setNewRestriction(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Arrangements * (Required)</label>
                                <textarea
                                    value={newRestriction.alternativeArrangements}
                                    onChange={(e) => setNewRestriction(prev => ({ ...prev, alternativeArrangements: e.target.value }))}
                                    rows={2}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                    placeholder="e.g., Video calls, window visits, outdoor meetings..."
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddRestriction(false)}
                                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRestriction}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                            >
                                <Shield className="w-4 h-4" />
                                Add Restriction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
