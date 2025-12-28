import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

interface AddKPIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}

export default function AddKPIModal({ isOpen, onClose, onSuccess, onError }: AddKPIModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [kpiDefinitions, setKpiDefinitions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        kpi_definition_id: '',
        employee_id: '',
        period_start: '',
        period_end: '',
        target_value: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    async function loadData() {
        try {
            const { data: empData } = await supabase
                .from('employees')
                .select('id, first_name, last_name')
                .eq('status', 'active')
                .order('first_name');
            setEmployees(empData || []);

            const { data: kpiData } = await supabase
                .from('kpi_definitions')
                .select('id, name, measurement_unit')
                .eq('is_active', true)
                .order('name');
            setKpiDefinitions(kpiData || []);
        } catch (error) {
            log.error('Error loading KPI context data', error, { component: 'AddKPIModal', action: 'loadData' });
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('kpi_values')
                .insert({
                    ...formData,
                    target_value: parseFloat(formData.target_value),
                    actual_value: 0,
                    status: 'pending',
                    created_by: user?.id
                });

            if (error) throw error;

            onSuccess();
            onClose();
            setFormData({
                kpi_definition_id: '',
                employee_id: '',
                period_start: '',
                period_end: '',
                target_value: '',
            });
        } catch (error: any) {
            log.error('Error adding KPI target', error, { component: 'AddKPIModal', action: 'handleSubmit', metadata: formData });
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add KPI Target">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KPI Definition *</label>
                    <select
                        required
                        value={formData.kpi_definition_id}
                        onChange={(e) => setFormData({ ...formData, kpi_definition_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                        <option value="">Select KPI</option>
                        {kpiDefinitions.map((kpi) => (
                            <option key={kpi.id} value={kpi.id}>
                                {kpi.name} ({kpi.measurement_unit})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee (Optional)</label>
                    <select
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                        <option value="">Department-wide / No specific employee</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.first_name} {emp.last_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
                        <input
                            type="date"
                            required
                            value={formData.period_start}
                            onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
                        <input
                            type="date"
                            required
                            value={formData.period_end}
                            onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
                    <input
                        type="number"
                        required
                        step="0.01"
                        value={formData.target_value}
                        onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Add KPI Target'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
