import React, { useState, useEffect } from 'react';
import { complianceService, DBSCheck, TrainingRecord } from '@/lib/services/ComplianceService';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { AlertTriangle, Clock, AlertCircle, ChevronRight } from 'lucide-react';

export default function ComplianceAlerts() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [expiringDBS, setExpiringDBS] = useState<DBSCheck[]>([]);
    const [expiringTraining, setExpiringTraining] = useState<TrainingRecord[]>([]);

    useEffect(() => {
        loadAlerts();
    }, [currentTenant]);

    const loadAlerts = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            const [dbs, training] = await Promise.all([
                complianceService.getExpiringDBS(90), // 3 months notice for DBS
                complianceService.getExpiringCertificates(30) // 1 month notice for training
            ]);

            setExpiringDBS(dbs);
            setExpiringTraining(training);
        } catch (error) {
            log.error('Error loading compliance alerts', error, { component: 'ComplianceAlerts', action: 'loadAlerts' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;
    }

    if (expiringDBS.length === 0 && expiringTraining.length === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                    <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h3 className="font-medium text-green-900">No Immediate Actions</h3>
                    <p className="text-sm text-green-700">All compliance checks and training are up to date.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Compliance Alerts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DBS Alerts */}
                {expiringDBS.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex justify-between items-center">
                            <h4 className="font-medium text-orange-900 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                DBS Renewals Due ({expiringDBS.length})
                            </h4>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                            {expiringDBS.map(check => (
                                <div key={check.id} className="p-3 hover:bg-gray-50 flex justify-between items-center gap-3 group">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{check.applicant_name}</p>
                                        <p className="text-xs text-gray-500">Expires: {check.expiry_date}</p>
                                    </div>
                                    <button className="text-gray-400 hover:text-cyan-600 transition-colors flex-shrink-0">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Training Alerts */}
                {expiringTraining.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-100 flex justify-between items-center">
                            <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Training Expiring ({expiringTraining.length})
                            </h4>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                            {expiringTraining.map(record => (
                                <div key={record.id} className="p-3 hover:bg-gray-50 flex justify-between items-center gap-3 group">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{record.staff_name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 break-words">
                                            <span className="font-medium">{record.training_name}</span>
                                            <span className="mx-1 text-gray-300">•</span>
                                            <span className="whitespace-nowrap">Expires: {record.expiry_date}</span>
                                        </p>
                                    </div>
                                    <button className="text-gray-400 hover:text-cyan-600 transition-colors flex-shrink-0">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
