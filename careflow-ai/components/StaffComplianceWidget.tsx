/**
 * Staff Compliance Widget for CareFlow Dashboard
 * Shows compliance status of staff synced from NovumFlow
 */

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { ShieldCheck, ShieldAlert, ShieldOff, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import complianceCheckService, { ComplianceStatus } from '@/services/ComplianceCheckService';
import { supabase } from '@/lib/supabase';

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string;
}

export default function StaffComplianceWidget() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [complianceMap, setComplianceMap] = useState<Map<string, ComplianceStatus>>(new Map());
    const [novumFlowEnabled, setNovumFlowEnabled] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            fetchComplianceData();
            // Check if NovumFlow is enabled
            setNovumFlowEnabled(currentTenant.settings?.novumflow_enabled !== false);
        }
    }, [currentTenant]);

    const fetchComplianceData = async () => {
        if (!currentTenant) return;
        setLoading(true);

        try {
            // Fetch active staff
            const { data: staffData, error: staffError } = await supabase
                .from('employees')
                .select('id, first_name, last_name')
                .eq('tenant_id', currentTenant.id)
                .eq('status', 'active');

            if (staffError) throw staffError;
            setStaff(staffData || []);

            // Fetch compliance data
            const compliance = await complianceCheckService.checkAllStaffCompliance(currentTenant.id);
            setComplianceMap(compliance);
        } catch (error) {
            console.error('Error fetching compliance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getComplianceStats = () => {
        let compliant = 0;
        let partial = 0;
        let nonCompliant = 0;

        complianceMap.forEach((status) => {
            if (status.isCompliant && status.compliancePercentage >= 90) {
                compliant++;
            } else if (status.compliancePercentage >= 50) {
                partial++;
            } else {
                nonCompliant++;
            }
        });

        return { compliant, partial, nonCompliant };
    };

    const getNonCompliantStaff = () => {
        const nonCompliant: Array<{ staff: StaffMember; compliance: ComplianceStatus }> = [];

        staff.forEach((s) => {
            const compliance = complianceMap.get(s.id);
            if (compliance && !compliance.isCompliant) {
                nonCompliant.push({ staff: s, compliance });
            }
        });

        return nonCompliant.slice(0, 5); // Show top 5
    };

    const stats = getComplianceStats();
    const nonCompliantStaff = getNonCompliantStaff();
    const totalStaff = staff.length;
    const overallComplianceRate = totalStaff > 0
        ? Math.round((stats.compliant / totalStaff) * 100)
        : 0;

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-600" />
                    <h3 className="font-semibold text-gray-900">Staff Compliance</h3>
                    {novumFlowEnabled && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            NovumFlow Synced
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchComplianceData}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 border-b border-gray-100">
                <div className="p-4 text-center border-r border-gray-100">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-2xl font-bold text-green-600">{stats.compliant}</span>
                    </div>
                    <p className="text-xs text-gray-500">Fully Compliant</p>
                </div>
                <div className="p-4 text-center border-r border-gray-100">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span className="text-2xl font-bold text-amber-600">{stats.partial}</span>
                    </div>
                    <p className="text-xs text-gray-500">Partial</p>
                </div>
                <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <ShieldOff className="w-4 h-4 text-red-500" />
                        <span className="text-2xl font-bold text-red-600">{stats.nonCompliant}</span>
                    </div>
                    <p className="text-xs text-gray-500">Non-Compliant</p>
                </div>
            </div>

            {/* Compliance Rate Bar */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Compliance Rate</span>
                    <span className={`text-sm font-semibold ${overallComplianceRate >= 90 ? 'text-green-600' :
                            overallComplianceRate >= 70 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                        {overallComplianceRate}%
                    </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${overallComplianceRate >= 90 ? 'bg-green-500' :
                                overallComplianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${overallComplianceRate}%` }}
                    />
                </div>
            </div>

            {/* Non-compliant Staff List */}
            {nonCompliantStaff.length > 0 && (
                <div className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Attention Required
                    </h4>
                    <div className="space-y-2">
                        {nonCompliantStaff.map(({ staff: s, compliance }) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {s.first_name} {s.last_name}
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        {compliance.missingDocuments.length > 0
                                            ? `Missing: ${compliance.missingDocuments.slice(0, 2).join(', ')}`
                                            : compliance.rtw_status !== 'valid'
                                                ? 'RTW not verified'
                                                : 'Compliance issues'
                                        }
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-semibold ${compliance.compliancePercentage >= 70 ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                        {compliance.compliancePercentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* NovumFlow Link */}
            {novumFlowEnabled && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <a
                        href={`${window.location.origin.replace('5174', '5173')}/compliance`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Manage compliance in NovumFlow
                    </a>
                </div>
            )}
        </div>
    );
}
