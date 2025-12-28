import React, { useState, useEffect } from 'react';
import { complianceService, TrainingRecord } from '@/lib/services/ComplianceService';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { CheckCircle, AlertTriangle, XCircle, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import TrainingRecordForm from './TrainingRecordForm';

interface StaffTrainingSummary {
    user_id: string;
    staff_name: string;
    training: Record<string, TrainingRecord | null>;
}

export default function TrainingMatrix() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [matrixData, setMatrixData] = useState<StaffTrainingSummary[]>([]);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);

    const mandatoryTrainingTypes = [
        'health_safety',
        'fire_safety',
        'safeguarding',
        'infection_control',
        'manual_handling',
        'medication',
        'mental_capacity_dols',
        'first_aid',
        'food_hygiene',
        'equality_diversity',
        'record_keeping'
    ];

    useEffect(() => {
        loadMatrixData();
    }, [currentTenant]);

    const loadMatrixData = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            // In a real app, we'd have a dedicated API for this matrix to avoid N+1 queries
            // For now, we'll fetch the compliance report which contains the data we need
            const { training_matrix } = await complianceService.generateCQCReport(currentTenant.id);

            // Group by user
            const grouped: Record<string, StaffTrainingSummary> = {};

            training_matrix.forEach((record: TrainingRecord) => {
                // Use user_id if available, otherwise fallback to staff_name as a unique key for manual entries
                // This prevents duplicates where some records have user_id and others don't for the same person
                // ideally we should always have user_id, but for manual entries we might not
                const userId = record.user_id || `manual_${record.staff_name.toLowerCase().replace(/\s+/g, '_')}`;

                if (!grouped[userId]) {
                    grouped[userId] = {
                        user_id: userId,
                        staff_name: record.staff_name,
                        training: {}
                    };
                }

                // Store the most recent record for this type
                const existing = grouped[userId].training[record.training_name]; // Using training_name as key for now, ideally training_type
                if (!existing || new Date(record.completion_date) > new Date(existing.completion_date)) {
                    // Map training_type if available, otherwise use name
                    const key = record.training_type || record.training_name;
                    grouped[userId].training[key] = record;
                }
            });

            setMatrixData(Object.values(grouped));
        } catch (error) {
            log.error('Error loading training matrix', error, { component: 'TrainingMatrix', action: 'loadMatrixData' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this training record?')) {
            await complianceService.deleteTrainingRecord(id);
            loadMatrixData();
        }
    };

    const getStatusIcon = (record: TrainingRecord | null) => {
        if (!record) return <XCircle className="w-5 h-5 text-red-300" />;

        const expiry = record.expiry_date ? new Date(record.expiry_date) : null;
        const now = new Date();

        if (expiry && expiry < now) {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }

        if (expiry && expiry < new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)) { // 3 months
            return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        }

        return <CheckCircle className="w-5 h-5 text-green-500" />;
    };

    const getTrainingLabel = (type: string) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading training matrix...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Training Matrix</h2>
                    <p className="text-sm text-gray-600 mt-1">Overview of mandatory training status across all staff</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRecord(null);
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Training
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                                Staff Member
                            </th>
                            {mandatoryTrainingTypes.map(type => (
                                <th key={type} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                                    {getTrainingLabel(type)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {matrixData.map(staff => (
                            [
                                <tr key={`row-${staff.user_id}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                                        <button
                                            onClick={() => setExpandedUser(expandedUser === staff.user_id ? null : staff.user_id)}
                                            className="flex items-center gap-2 font-medium text-gray-900 hover:text-cyan-600"
                                        >
                                            {expandedUser === staff.user_id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            {staff.staff_name}
                                        </button>
                                    </td>
                                    {mandatoryTrainingTypes.map(type => (
                                        <td key={type} className="px-4 py-4 text-center whitespace-nowrap">
                                            <div className="flex justify-center" title={staff.training[type]?.expiry_date ? `Expires: ${staff.training[type]?.expiry_date}` : 'Missing'}>
                                                {getStatusIcon(staff.training[type])}
                                            </div>
                                        </td>
                                    ))}
                                </tr>,
                                expandedUser === staff.user_id && (
                                    <tr key={`details-${staff.user_id}`} className="bg-gray-50">
                                        <td colSpan={mandatoryTrainingTypes.length + 1} className="px-6 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {Object.values(staff.training).map((record) => (
                                                    record && (
                                                        <div key={record.id} className="bg-white p-3 rounded border border-gray-200 text-sm relative group">
                                                            <div className="font-medium text-gray-900">{record.training_name}</div>
                                                            <div className="text-gray-500 mt-1">Completed: {record.completion_date}</div>
                                                            <div className={`mt-1 ${!record.expiry_date ? 'text-gray-500' :
                                                                new Date(record.expiry_date) < new Date() ? 'text-red-600 font-medium' :
                                                                    'text-gray-500'
                                                                }`}>
                                                                Expires: {record.expiry_date || 'N/A'}
                                                            </div>

                                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingRecord(record);
                                                                        setShowAddModal(true);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(record.id)}
                                                                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ]
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Valid</span>
                </div>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>Expiring Soon (3 months)</span>
                </div>
                <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Expired</span>
                </div>
                <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-300" />
                    <span>Missing</span>
                </div>
            </div>

            {
                showAddModal && (
                    <TrainingRecordForm
                        initialData={editingRecord || undefined}
                        onSuccess={() => {
                            setShowAddModal(false);
                            setEditingRecord(null);
                            loadMatrixData();
                        }}
                        onCancel={() => {
                            setShowAddModal(false);
                            setEditingRecord(null);
                        }}
                    />
                )
            }
        </div >
    );
}
