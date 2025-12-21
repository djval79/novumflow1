/**
 * Safe Staffing Calculator Component
 * 
 * CQC Regulation 18 Compliance
 * Calculates and monitors safe staffing ratios for care settings
 * 
 * Based on:
 * - CQC Fundamental Standards (Regulation 18)
 * - Skills for Care guidance
 * - National Minimum Standards
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    AlertTriangle,
    CheckCircle,
    Calculator,
    Clock,
    UserCheck,
    Shield,
    TrendingUp,
    TrendingDown,
    Info,
    Calendar,
    Building2,
    Activity,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

// ============================================
// TYPES
// ============================================

interface ServiceUser {
    id: string;
    name: string;
    dependency_level: 'low' | 'medium' | 'high' | 'very_high';
    care_hours_required: number;
    one_to_one_care: boolean;
    night_supervision: boolean;
    clinical_needs: boolean;
}

interface StaffMember {
    id: string;
    name: string;
    role: 'nurse' | 'senior_carer' | 'carer' | 'support_worker';
    qualified: boolean;
    on_shift: boolean;
    shift_start?: string;
    shift_end?: string;
}

interface ShiftPeriod {
    name: string;
    start: string;
    end: string;
    type: 'day' | 'evening' | 'night';
}

interface StaffingCalculation {
    totalServiceUsers: number;
    totalCareHours: number;
    minimumStaffRequired: number;
    minimumNursesRequired: number;
    minimumSeniorCarersRequired: number;
    minimumCarersRequired: number;
    actualStaffOnShift: number;
    actualNursesOnShift: number;
    actualSeniorCarersOnShift: number;
    actualCarersOnShift: number;
    staffingRatio: string;
    complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
    gaps: StaffingGap[];
    recommendations: string[];
}

interface StaffingGap {
    role: string;
    required: number;
    actual: number;
    shortfall: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================
// CONSTANTS
// ============================================

// CQC-aligned staffing ratios based on dependency levels
const DEPENDENCY_RATIOS = {
    residential: {
        low: { ratio: 8, nursesRequired: false },      // 1:8
        medium: { ratio: 6, nursesRequired: false },   // 1:6
        high: { ratio: 4, nursesRequired: true },      // 1:4
        very_high: { ratio: 2, nursesRequired: true }  // 1:2
    },
    nursing: {
        low: { ratio: 6, nursesRequired: true },
        medium: { ratio: 5, nursesRequired: true },
        high: { ratio: 3, nursesRequired: true },
        very_high: { ratio: 1.5, nursesRequired: true }
    },
    domiciliary: {
        low: { ratio: 10, nursesRequired: false },
        medium: { ratio: 8, nursesRequired: false },
        high: { ratio: 5, nursesRequired: true },
        very_high: { ratio: 2, nursesRequired: true }
    }
};

const SHIFT_PERIODS: ShiftPeriod[] = [
    { name: 'Early', start: '07:00', end: '15:00', type: 'day' },
    { name: 'Late', start: '14:00', end: '22:00', type: 'evening' },
    { name: 'Night', start: '21:00', end: '07:30', type: 'night' }
];

// ============================================
// COMPONENT
// ============================================

interface SafeStaffingCalculatorProps {
    settingType?: 'residential' | 'nursing' | 'domiciliary';
    onClose?: () => void;
}

export default function SafeStaffingCalculator({
    settingType = 'residential',
    onClose
}: SafeStaffingCalculatorProps) {
    const { currentTenant } = useTenant();
    const [selectedShift, setSelectedShift] = useState<ShiftPeriod>(SHIFT_PERIODS[0]);
    const [serviceType, setServiceType] = useState<'residential' | 'nursing' | 'domiciliary'>(settingType);

    // Demo data - in production this would come from the database
    const [serviceUsers] = useState<ServiceUser[]>([
        { id: '1', name: 'Service User 1', dependency_level: 'low', care_hours_required: 2, one_to_one_care: false, night_supervision: false, clinical_needs: false },
        { id: '2', name: 'Service User 2', dependency_level: 'medium', care_hours_required: 4, one_to_one_care: false, night_supervision: false, clinical_needs: false },
        { id: '3', name: 'Service User 3', dependency_level: 'high', care_hours_required: 6, one_to_one_care: false, night_supervision: true, clinical_needs: true },
        { id: '4', name: 'Service User 4', dependency_level: 'medium', care_hours_required: 4, one_to_one_care: false, night_supervision: false, clinical_needs: false },
        { id: '5', name: 'Service User 5', dependency_level: 'very_high', care_hours_required: 8, one_to_one_care: true, night_supervision: true, clinical_needs: true },
        { id: '6', name: 'Service User 6', dependency_level: 'low', care_hours_required: 2, one_to_one_care: false, night_supervision: false, clinical_needs: false },
        { id: '7', name: 'Service User 7', dependency_level: 'medium', care_hours_required: 4, one_to_one_care: false, night_supervision: false, clinical_needs: false },
        { id: '8', name: 'Service User 8', dependency_level: 'high', care_hours_required: 6, one_to_one_care: false, night_supervision: true, clinical_needs: true },
        { id: '9', name: 'Service User 9', dependency_level: 'low', care_hours_required: 2, one_to_one_care: false, night_supervision: false, clinical_needs: false },
        { id: '10', name: 'Service User 10', dependency_level: 'medium', care_hours_required: 4, one_to_one_care: false, night_supervision: false, clinical_needs: false },
    ]);

    const [staffOnShift] = useState<StaffMember[]>([
        { id: 's1', name: 'Sarah Nurse', role: 'nurse', qualified: true, on_shift: true },
        { id: 's2', name: 'John Senior', role: 'senior_carer', qualified: true, on_shift: true },
        { id: 's3', name: 'Mary Care', role: 'carer', qualified: true, on_shift: true },
        { id: 's4', name: 'Tom Support', role: 'carer', qualified: true, on_shift: true },
    ]);

    // Calculate staffing requirements
    const calculation = useMemo((): StaffingCalculation => {
        const ratios = DEPENDENCY_RATIOS[serviceType];

        // Count service users by dependency
        const dependencyCounts = {
            low: serviceUsers.filter(u => u.dependency_level === 'low').length,
            medium: serviceUsers.filter(u => u.dependency_level === 'medium').length,
            high: serviceUsers.filter(u => u.dependency_level === 'high').length,
            very_high: serviceUsers.filter(u => u.dependency_level === 'very_high').length
        };

        // Calculate minimum staff needed for each dependency level
        const staffForLow = Math.ceil(dependencyCounts.low / ratios.low.ratio);
        const staffForMedium = Math.ceil(dependencyCounts.medium / ratios.medium.ratio);
        const staffForHigh = Math.ceil(dependencyCounts.high / ratios.high.ratio);
        const staffForVeryHigh = Math.ceil(dependencyCounts.very_high / ratios.very_high.ratio);

        // Add 1:1 care requirements
        const oneToOneStaff = serviceUsers.filter(u => u.one_to_one_care).length;

        const minimumStaffRequired = staffForLow + staffForMedium + staffForHigh + staffForVeryHigh + oneToOneStaff;

        // Calculate nurse requirements (at least 1 nurse if any high/very high dependency)
        const needsNurse = dependencyCounts.high > 0 || dependencyCounts.very_high > 0;
        const minimumNursesRequired = needsNurse ? Math.max(1, Math.ceil(minimumStaffRequired * 0.2)) : 0;

        // Senior carers - at least 1 per shift, or 1 per 4 staff
        const minimumSeniorCarersRequired = Math.max(1, Math.ceil(minimumStaffRequired / 4));

        // Remaining staff can be carers
        const minimumCarersRequired = minimumStaffRequired - minimumNursesRequired - minimumSeniorCarersRequired;

        // Count actual staff on shift
        const actualNursesOnShift = staffOnShift.filter(s => s.role === 'nurse' && s.on_shift).length;
        const actualSeniorCarersOnShift = staffOnShift.filter(s => s.role === 'senior_carer' && s.on_shift).length;
        const actualCarersOnShift = staffOnShift.filter(s => (s.role === 'carer' || s.role === 'support_worker') && s.on_shift).length;
        const actualStaffOnShift = actualNursesOnShift + actualSeniorCarersOnShift + actualCarersOnShift;

        // Calculate staffing ratio
        const staffingRatio = `1:${(serviceUsers.length / actualStaffOnShift).toFixed(1)}`;

        // Identify gaps
        const gaps: StaffingGap[] = [];

        if (actualNursesOnShift < minimumNursesRequired) {
            gaps.push({
                role: 'Registered Nurse',
                required: minimumNursesRequired,
                actual: actualNursesOnShift,
                shortfall: minimumNursesRequired - actualNursesOnShift,
                severity: 'critical'
            });
        }

        if (actualSeniorCarersOnShift < minimumSeniorCarersRequired) {
            gaps.push({
                role: 'Senior Carer',
                required: minimumSeniorCarersRequired,
                actual: actualSeniorCarersOnShift,
                shortfall: minimumSeniorCarersRequired - actualSeniorCarersOnShift,
                severity: 'high'
            });
        }

        if (actualStaffOnShift < minimumStaffRequired) {
            const shortfall = minimumStaffRequired - actualStaffOnShift;
            gaps.push({
                role: 'Care Staff',
                required: minimumStaffRequired,
                actual: actualStaffOnShift,
                shortfall,
                severity: shortfall >= 3 ? 'critical' : shortfall >= 2 ? 'high' : 'medium'
            });
        }

        // Determine compliance status
        let complianceStatus: 'compliant' | 'at_risk' | 'non_compliant' = 'compliant';
        if (gaps.some(g => g.severity === 'critical')) {
            complianceStatus = 'non_compliant';
        } else if (gaps.length > 0) {
            complianceStatus = 'at_risk';
        }

        // Generate recommendations
        const recommendations: string[] = [];
        if (actualNursesOnShift < minimumNursesRequired) {
            recommendations.push(`Urgent: Add ${minimumNursesRequired - actualNursesOnShift} registered nurse(s) to meet clinical needs requirements`);
        }
        if (actualSeniorCarersOnShift < minimumSeniorCarersRequired) {
            recommendations.push(`Add ${minimumSeniorCarersRequired - actualSeniorCarersOnShift} senior carer(s) for shift leadership`);
        }
        if (actualStaffOnShift < minimumStaffRequired) {
            recommendations.push(`Increase total care staff by ${minimumStaffRequired - actualStaffOnShift} to meet safe staffing ratios`);
        }
        if (complianceStatus === 'compliant') {
            recommendations.push('Staffing levels meet CQC Regulation 18 requirements for safe care delivery');
        }

        return {
            totalServiceUsers: serviceUsers.length,
            totalCareHours: serviceUsers.reduce((sum, u) => sum + u.care_hours_required, 0),
            minimumStaffRequired,
            minimumNursesRequired,
            minimumSeniorCarersRequired,
            minimumCarersRequired: Math.max(0, minimumCarersRequired),
            actualStaffOnShift,
            actualNursesOnShift,
            actualSeniorCarersOnShift,
            actualCarersOnShift,
            staffingRatio,
            complianceStatus,
            gaps,
            recommendations
        };
    }, [serviceUsers, staffOnShift, serviceType]);

    const getComplianceColor = (status: string) => {
        switch (status) {
            case 'compliant': return 'text-green-600 bg-green-100';
            case 'at_risk': return 'text-amber-600 bg-amber-100';
            case 'non_compliant': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getComplianceIcon = (status: string) => {
        switch (status) {
            case 'compliant': return <CheckCircle className="w-6 h-6" />;
            case 'at_risk': return <AlertTriangle className="w-6 h-6" />;
            case 'non_compliant': return <AlertCircle className="w-6 h-6" />;
            default: return <Info className="w-6 h-6" />;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Calculator className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Safe Staffing Calculator</h2>
                            <p className="text-blue-100">CQC Regulation 18 Compliance</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">
                            &times;
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Service Type</label>
                        <select
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value as any)}
                            className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="residential">Residential Care</option>
                            <option value="nursing">Nursing Home</option>
                            <option value="domiciliary">Domiciliary Care</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Shift Period</label>
                        <div className="flex rounded-lg overflow-hidden border border-gray-300">
                            {SHIFT_PERIODS.map(shift => (
                                <button
                                    key={shift.name}
                                    onClick={() => setSelectedShift(shift)}
                                    className={`px-3 py-1.5 text-sm font-medium ${selectedShift.name === shift.name
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {shift.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="ml-auto">
                        <span className="text-xs text-gray-500">Shift: {selectedShift.start} - {selectedShift.end}</span>
                    </div>
                </div>
            </div>

            {/* Compliance Status Banner */}
            <div className={`p-4 ${getComplianceColor(calculation.complianceStatus)}`}>
                <div className="flex items-center gap-3">
                    {getComplianceIcon(calculation.complianceStatus)}
                    <div>
                        <p className="font-semibold capitalize">{calculation.complianceStatus.replace('_', ' ')}</p>
                        <p className="text-sm opacity-80">
                            {calculation.complianceStatus === 'compliant'
                                ? 'Staffing levels meet safe care requirements'
                                : `${calculation.gaps.length} staffing gap(s) identified`}
                        </p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-3xl font-bold">{calculation.staffingRatio}</p>
                        <p className="text-xs opacity-80">Current Ratio</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-medium">Service Users</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{calculation.totalServiceUsers}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium">Care Hours/Day</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{calculation.totalCareHours}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <UserCheck className="w-4 h-4" />
                            <span className="text-xs font-medium">Staff Required</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{calculation.minimumStaffRequired}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${calculation.actualStaffOnShift >= calculation.minimumStaffRequired
                            ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                        <div className={`flex items-center gap-2 mb-1 ${calculation.actualStaffOnShift >= calculation.minimumStaffRequired
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-medium">Staff On Shift</span>
                        </div>
                        <p className={`text-2xl font-bold ${calculation.actualStaffOnShift >= calculation.minimumStaffRequired
                                ? 'text-green-600' : 'text-red-600'
                            }`}>{calculation.actualStaffOnShift}</p>
                    </div>
                </div>

                {/* Staff Breakdown */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Staff Breakdown</h3>
                    <div className="space-y-3">
                        {[
                            { role: 'Registered Nurses', required: calculation.minimumNursesRequired, actual: calculation.actualNursesOnShift, icon: '🩺' },
                            { role: 'Senior Carers', required: calculation.minimumSeniorCarersRequired, actual: calculation.actualSeniorCarersOnShift, icon: '⭐' },
                            { role: 'Care Assistants', required: calculation.minimumCarersRequired, actual: calculation.actualCarersOnShift, icon: '💙' }
                        ].map(row => (
                            <div key={row.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{row.icon}</span>
                                    <span className="font-medium text-gray-700">{row.role}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Required</p>
                                        <p className="font-semibold">{row.required}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                    <div className={`text-right ${row.actual >= row.required ? 'text-green-600' : 'text-red-600'}`}>
                                        <p className="text-xs">Actual</p>
                                        <p className="font-semibold">{row.actual}</p>
                                    </div>
                                    {row.actual >= row.required ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gaps & Recommendations */}
                {calculation.gaps.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Staffing Gaps</h3>
                        <div className="space-y-2">
                            {calculation.gaps.map((gap, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border ${gap.severity === 'critical' ? 'bg-red-50 border-red-200' :
                                        gap.severity === 'high' ? 'bg-amber-50 border-amber-200' :
                                            'bg-yellow-50 border-yellow-200'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{gap.role}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gap.severity === 'critical' ? 'bg-red-200 text-red-800' :
                                                gap.severity === 'high' ? 'bg-amber-200 text-amber-800' :
                                                    'bg-yellow-200 text-yellow-800'
                                            }`}>
                                            -{gap.shortfall} shortfall
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Recommendations
                    </h3>
                    <ul className="space-y-1">
                        {calculation.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                    Calculations based on CQC Regulation 18 guidance and Skills for Care recommendations.
                    Always apply professional judgement based on individual service user needs.
                </p>
            </div>
        </div>
    );
}
