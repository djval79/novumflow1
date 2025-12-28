/**
 * UK Compliance Dashboard Widget
 * 
 * A comprehensive widget for the main dashboard showing:
 * - CQC Readiness Score
 * - Home Office Compliance Status
 * - Staff Compliance Overview
 * - Critical Alerts
 * - Upcoming Expiries
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import {
    Shield,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    AlertTriangle,
    CheckCircle,
    Clock,
    Users,
    FileCheck,
    GraduationCap,
    Briefcase,
    ExternalLink,
    RefreshCw,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Info
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface ComplianceMetrics {
    totalStaff: number;
    compliantStaff: number;
    complianceRate: number;
    dbsValid: number;
    dbsExpiring: number;
    dbsExpired: number;
    rtwValid: number;
    rtwExpiring: number;
    rtwExpired: number;
    trainingComplete: number;
    trainingOverdue: number;
    cqcReady: boolean;
    lastUpdated: string;
}

interface ExpiringItem {
    id: string;
    type: 'dbs' | 'rtw' | 'training';
    staffName: string;
    itemName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    severity: 'critical' | 'warning' | 'info';
}

export default function UKComplianceDashboardWidget() {
    const navigate = useNavigate();
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
    const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
    const [showEVisaGuide, setShowEVisaGuide] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            loadComplianceData();
        }
    }, [currentTenant]);

    const loadComplianceData = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            // Get staff compliance status
            const { data: complianceData, error: complianceError } = await supabase
                .from('staff_compliance_status')
                .select('*')
                .eq('tenant_id', currentTenant.id);

            if (complianceError) throw complianceError;

            // Get expiring DBS checks (next 90 days)
            const ninetyDaysFromNow = new Date();
            ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

            const { data: expiringDBS } = await supabase
                .from('dbs_checks')
                .select('id, applicant_name, expiry_date')
                .eq('tenant_id', currentTenant.id)
                .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0])
                .gte('expiry_date', new Date().toISOString().split('T')[0])
                .order('expiry_date');

            // Get expiring RTW (next 90 days)
            const { data: expiringRTW } = await supabase
                .from('right_to_work_checks')
                .select('id, staff_name, next_check_date')
                .eq('tenant_id', currentTenant.id)
                .not('next_check_date', 'is', null)
                .lte('next_check_date', ninetyDaysFromNow.toISOString().split('T')[0])
                .gte('next_check_date', new Date().toISOString().split('T')[0])
                .order('next_check_date');

            // Get expiring training (next 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const { data: expiringTraining } = await supabase
                .from('training_records')
                .select('id, staff_name, training_name, expiry_date')
                .eq('tenant_id', currentTenant.id)
                .eq('is_mandatory', true)
                .not('expiry_date', 'is', null)
                .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
                .gte('expiry_date', new Date().toISOString().split('T')[0])
                .order('expiry_date');

            // Calculate metrics
            const staffData = complianceData || [];
            const total = staffData.length;
            const compliant = staffData.filter((s: any) => s.cqc_ready).length;
            const dbsOk = staffData.filter((s: any) => s.dbs_status === 'compliant').length;
            const dbsExp = staffData.filter((s: any) => s.dbs_status === 'expiring_soon').length;
            const dbsExpired = staffData.filter((s: any) => s.dbs_status === 'expired' || s.dbs_status === 'missing').length;
            const rtwOk = staffData.filter((s: any) => s.rtw_status === 'compliant').length;
            const rtwExp = staffData.filter((s: any) => s.rtw_status === 'expiring_soon').length;
            const rtwExpired = staffData.filter((s: any) => s.rtw_status === 'expired' || s.rtw_status === 'missing').length;
            const trainingOk = staffData.filter((s: any) => s.training_status === 'compliant').length;
            const trainingOverdue = staffData.filter((s: any) => s.training_status === 'overdue' || s.training_status === 'missing').length;

            setMetrics({
                totalStaff: total,
                compliantStaff: compliant,
                complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 100,
                dbsValid: dbsOk,
                dbsExpiring: dbsExp,
                dbsExpired: dbsExpired,
                rtwValid: rtwOk,
                rtwExpiring: rtwExp,
                rtwExpired: rtwExpired,
                trainingComplete: trainingOk,
                trainingOverdue: trainingOverdue,
                cqcReady: dbsExpired === 0 && rtwExpired === 0,
                lastUpdated: new Date().toISOString()
            });

            // Build expiring items list
            const items: ExpiringItem[] = [];

            expiringDBS?.forEach((item: any) => {
                const days = differenceInDays(new Date(item.expiry_date), new Date());
                items.push({
                    id: item.id,
                    type: 'dbs',
                    staffName: item.applicant_name,
                    itemName: 'DBS Certificate',
                    expiryDate: item.expiry_date,
                    daysUntilExpiry: days,
                    severity: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info'
                });
            });

            expiringRTW?.forEach((item: any) => {
                const days = differenceInDays(new Date(item.next_check_date), new Date());
                items.push({
                    id: item.id,
                    type: 'rtw',
                    staffName: item.staff_name,
                    itemName: 'Right to Work',
                    expiryDate: item.next_check_date,
                    daysUntilExpiry: days,
                    severity: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info'
                });
            });

            expiringTraining?.forEach((item: any) => {
                const days = differenceInDays(new Date(item.expiry_date), new Date());
                items.push({
                    id: item.id,
                    type: 'training',
                    staffName: item.staff_name || 'Unknown',
                    itemName: item.training_name,
                    expiryDate: item.expiry_date,
                    daysUntilExpiry: days,
                    severity: days <= 14 ? 'critical' : days <= 21 ? 'warning' : 'info'
                });
            });

            // Sort by urgency
            items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
            setExpiringItems(items.slice(0, 5)); // Top 5 most urgent

        } catch (error) {
            log.error('Error loading compliance data', error, { component: 'UKComplianceDashboardWidget', action: 'loadComplianceData' });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadComplianceData();
        setRefreshing(false);
    };

    const getComplianceIcon = () => {
        if (!metrics) return <Shield className="w-8 h-8 text-gray-400" />;

        if (metrics.complianceRate >= 95 && metrics.cqcReady) {
            return <ShieldCheck className="w-8 h-8 text-emerald-500" />;
        } else if (metrics.complianceRate >= 70) {
            return <ShieldAlert className="w-8 h-8 text-amber-500" />;
        } else {
            return <ShieldX className="w-8 h-8 text-red-500" />;
        }
    };

    const getComplianceColor = () => {
        if (!metrics) return 'gray';
        if (metrics.complianceRate >= 95 && metrics.cqcReady) return 'emerald';
        if (metrics.complianceRate >= 70) return 'amber';
        return 'red';
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'warning': return 'text-amber-600 bg-amber-50';
            default: return 'text-blue-600 bg-blue-50';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'dbs': return <FileCheck className="w-4 h-4" />;
            case 'rtw': return <Briefcase className="w-4 h-4" />;
            case 'training': return <GraduationCap className="w-4 h-4" />;
            default: return <AlertTriangle className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                </div>
                <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>
        );
    }

    const color = getComplianceColor();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r from-${color}-500 to-${color}-600 px-6 py-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            {getComplianceIcon()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">UK Compliance Status</h3>
                            <p className="text-white/80 text-sm">CQC & Home Office</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => navigate('/compliance')}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-1"
                        >
                            View Full Report <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Main Score */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold text-${color}-600`}>
                                {metrics?.complianceRate || 0}%
                            </span>
                            <span className="text-gray-500 text-sm">compliance rate</span>
                        </div>
                        <p className="text-gray-600 mt-1">
                            {metrics?.compliantStaff || 0} of {metrics?.totalStaff || 0} staff fully compliant
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${metrics?.cqcReady ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        <div className="flex items-center gap-2">
                            {metrics?.cqcReady ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">CQC Ready</span>
                                </>
                            ) : (
                                <>
                                    <ShieldX className="w-5 h-5" />
                                    <span className="font-semibold">Action Required</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* DBS Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileCheck className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-700">DBS Checks</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">{metrics?.dbsValid || 0}</span>
                            <span className="text-sm text-gray-500">valid</span>
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                            {(metrics?.dbsExpiring || 0) > 0 && (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    {metrics?.dbsExpiring} expiring
                                </span>
                            )}
                            {(metrics?.dbsExpired || 0) > 0 && (
                                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                    {metrics?.dbsExpired} expired
                                </span>
                            )}
                        </div>
                    </div>

                    {/* RTW Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-5 h-5 text-cyan-600" />
                            <span className="text-sm font-medium text-gray-700">Right to Work</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">{metrics?.rtwValid || 0}</span>
                            <span className="text-sm text-gray-500">verified</span>
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                            {(metrics?.rtwExpiring || 0) > 0 && (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    {metrics?.rtwExpiring} expiring
                                </span>
                            )}
                            {(metrics?.rtwExpired || 0) > 0 && (
                                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                    {metrics?.rtwExpired} expired
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Training Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Training</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">{metrics?.trainingComplete || 0}</span>
                            <span className="text-sm text-gray-500">complete</span>
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                            {(metrics?.trainingOverdue || 0) > 0 && (
                                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                    {metrics?.trainingOverdue} overdue
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* eVisa Alert Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-800 text-sm">2024-2025 Home Office Update</h4>
                            <p className="text-amber-700 text-sm mt-1">
                                BRPs are no longer valid for RTW checks. All non-UK workers must use eVisa share codes.
                            </p>
                            <button
                                onClick={() => setShowEVisaGuide(true)}
                                className="mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                            >
                                View eVisa Training Guide →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Upcoming Expiries */}
                {expiringItems.length > 0 && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            Upcoming Expiries
                        </h4>
                        <div className="space-y-2">
                            {expiringItems.map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className={`flex items-center justify-between p-3 rounded-lg ${getSeverityColor(item.severity)} border border-current/10`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-white/50 rounded-lg">
                                            {getTypeIcon(item.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{item.staffName}</p>
                                            <p className="text-xs opacity-75">{item.itemName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {item.daysUntilExpiry === 0 ? 'Today' :
                                                item.daysUntilExpiry === 1 ? 'Tomorrow' :
                                                    `${item.daysUntilExpiry} days`}
                                        </p>
                                        <p className="text-xs opacity-75">
                                            {format(new Date(item.expiryDate), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {expiringItems.length === 0 && (
                    <div className="text-center py-6 bg-emerald-50 rounded-lg">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        <p className="text-emerald-800 font-medium">All Clear!</p>
                        <p className="text-emerald-600 text-sm">No upcoming expiries in the next 30 days</p>
                    </div>
                )}

                {/* Last Updated */}
                <p className="text-xs text-gray-400 mt-4 text-center">
                    Last updated: {metrics?.lastUpdated ? format(new Date(metrics.lastUpdated), 'dd MMM yyyy HH:mm') : 'Never'}
                </p>
            </div>

            {/* eVisa Training Guide Modal */}
            {showEVisaGuide && (
                <EVisaTrainingGuide onClose={() => setShowEVisaGuide(false)} />
            )}
        </div>
    );
}

// ============================================
// eVisa Training Guide Component (Phase 3)
// ============================================
interface EVisaTrainingGuideProps {
    onClose: () => void;
}

function EVisaTrainingGuide({ onClose }: EVisaTrainingGuideProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: 'What Changed?',
            icon: <Info className="w-8 h-8 text-cyan-600" />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-700">
                        From <strong>31 October 2024</strong>, the UK moved to a fully digital immigration system.
                        This means significant changes for Right to Work checks:
                    </p>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                        <h4 className="font-semibold text-red-800">❌ No Longer Valid</h4>
                        <ul className="text-red-700 text-sm mt-2 list-disc list-inside space-y-1">
                            <li>Biometric Residence Permits (BRPs)</li>
                            <li>Biometric Residence Cards (BRCs)</li>
                            <li>Passport vignette stickers (for existing workers)</li>
                        </ul>
                    </div>
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4">
                        <h4 className="font-semibold text-emerald-800">✅ Now Required</h4>
                        <ul className="text-emerald-700 text-sm mt-2 list-disc list-inside space-y-1">
                            <li>eVisa via UKVI online account</li>
                            <li>Share code for employer verification</li>
                            <li>Online checking service (gov.uk)</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            title: 'How to Verify an eVisa',
            icon: <FileCheck className="w-8 h-8 text-cyan-600" />,
            content: (
                <div className="space-y-4">
                    <ol className="space-y-4">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold">1</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">Ask for Share Code</h4>
                                <p className="text-gray-600 text-sm">Worker generates a share code from their UKVI account at <a href="https://www.gov.uk/view-prove-immigration-status" target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline">gov.uk/view-prove-immigration-status</a></p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold">2</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">Access Employer Checking Service</h4>
                                <p className="text-gray-600 text-sm">Go to <a href="https://www.gov.uk/view-right-to-work" target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline">gov.uk/view-right-to-work</a></p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold">3</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">Enter Share Code + Date of Birth</h4>
                                <p className="text-gray-600 text-sm">Share codes are 9 characters and valid for 90 days</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold">4</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">Download & Save Verification</h4>
                                <p className="text-gray-600 text-sm">Save a PDF of the verification page with date stamp</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold">5</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">Record in NovumFlow</h4>
                                <p className="text-gray-600 text-sm">Upload document and record share code in RTW form</p>
                            </div>
                        </li>
                    </ol>
                </div>
            )
        },
        {
            title: 'Penalties for Non-Compliance',
            icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
            content: (
                <div className="space-y-4">
                    <div className="bg-red-50 rounded-lg p-6">
                        <h4 className="text-3xl font-bold text-red-700">£60,000</h4>
                        <p className="text-red-600">Fine per illegal worker (increased from £45,000)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <h5 className="text-xl font-bold text-gray-900">5 Years</h5>
                            <p className="text-gray-600 text-sm">Maximum prison sentence</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <h5 className="text-xl font-bold text-gray-900">+38%</h5>
                            <p className="text-gray-600 text-sm">Increase in enforcement</p>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-800">Statutory Excuse</h4>
                        <p className="text-amber-700 text-sm mt-1">
                            Performing RTW checks correctly provides a "statutory excuse" protecting you from penalties
                            if an employee turns out to be an illegal worker.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: 'Quick Reference Checklist',
            icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
            content: (
                <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-cyan-600" />
                            <span className="text-gray-700">Complete RTW check BEFORE first day of work</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-cyan-600" />
                            <span className="text-gray-700">Use online service for eVisa holders (not BRP)</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-cyan-600" />
                            <span className="text-gray-700">Save dated copy of verification for 2+ years</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-cyan-600" />
                            <span className="text-gray-700">Set follow-up check date for time-limited permissions</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-cyan-600" />
                            <span className="text-gray-700">Record share code in NovumFlow RTW form</span>
                        </label>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <a
                            href="https://www.gov.uk/government/publications/right-to-work-checks-employers-guide"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-center text-sm font-medium transition-colors"
                        >
                            📄 Official Guidance
                        </a>
                        <a
                            href="https://www.gov.uk/view-right-to-work"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-center text-sm font-medium transition-colors"
                        >
                            🔍 Check RTW Now
                        </a>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">eVisa Training Guide</h2>
                            <p className="text-cyan-100 text-sm">2024-2025 Right to Work Updates</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white text-2xl font-light"
                        >
                            ×
                        </button>
                    </div>
                    {/* Progress */}
                    <div className="flex gap-2 mt-4">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-1.5 rounded-full transition-all ${i <= currentStep ? 'bg-white' : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-cyan-50 rounded-xl">
                            {steps[currentStep].icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {steps[currentStep].title}
                        </h3>
                    </div>
                    {steps[currentStep].content}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Complete ✓
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
