import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, User, Briefcase, ClipboardList, Calendar } from 'lucide-react';
import { callEmployeeCrud } from '@/lib/employeeCrud';

interface ConvertToEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: any;
    onSuccess: () => void;
    onError: (message: string) => void;
}

export default function ConvertToEmployeeModal({
    isOpen,
    onClose,
    application,
    onSuccess,
    onError
}: ConvertToEmployeeModalProps) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [department, setDepartment] = useState<string>('');
    const [position, setPosition] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');

    useEffect(() => {
        if (isOpen && currentTenant) {
            loadTemplates();
            // Pre-fill from job posting
            if (application?.job_postings) {
                setDepartment(application.job_postings.department || '');
                setPosition(application.job_postings.job_title || '');
            }
            // Set default due date to 30 days from now
            const defaultDue = new Date();
            defaultDue.setDate(defaultDue.getDate() + 30);
            setDueDate(defaultDue.toISOString().split('T')[0]);
        }
    }, [isOpen, currentTenant, application]);

    async function loadTemplates() {
        const { data } = await supabase
            .from('onboarding_checklist_templates')
            .select('*')
            .eq('tenant_id', currentTenant?.id);
        setTemplates(data || []);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!application || !currentTenant || !user) return;

        setLoading(true);
        try {
            // 1. Create the employee
            const employeeData = {
                first_name: application.applicant_first_name,
                last_name: application.applicant_last_name,
                email: application.applicant_email,
                phone: application.applicant_phone,
                position: position,
                department: department,
                status: 'active',
                date_hired: startDate || new Date().toISOString().split('T')[0],
                tenant_id: currentTenant.id
            };

            await callEmployeeCrud('create', employeeData);

            // 2. If checklist selected, fetch the new employee and assign checklist
            if (selectedTemplateId) {
                // Get the newly created employee by email
                const { data: newEmployee } = await supabase
                    .from('employees')
                    .select('id')
                    .eq('email', application.applicant_email)
                    .eq('tenant_id', currentTenant.id)
                    .single();

                if (newEmployee) {
                    const template = templates.find(t => t.id === selectedTemplateId);

                    // Create checklist assignment
                    const { data: newChecklist, error: checklistError } = await supabase
                        .from('employee_onboarding_checklists')
                        .insert({
                            employee_id: newEmployee.id,
                            template_id: selectedTemplateId,
                            template_name: template?.name || 'Onboarding Checklist',
                            tenant_id: currentTenant.id,
                            status: 'not_started',
                            assigned_by: user.id,
                            due_date: dueDate || null
                        })
                        .select()
                        .single();

                    if (!checklistError && newChecklist && template?.tasks) {
                        // Create individual items
                        const items = template.tasks.map((task: string, index: number) => ({
                            checklist_id: newChecklist.id,
                            task_name: task,
                            task_order: index,
                            is_completed: false
                        }));

                        await supabase
                            .from('onboarding_checklist_items')
                            .insert(items);
                    }
                }
            }

            // 3. Update application status to 'Hired'
            await supabase
                .from('applications')
                .update({ status: 'Hired' })
                .eq('id', application.id);

            onSuccess();
            onClose();
        } catch (error: any) {
            onError(error.message || 'Failed to convert to employee');
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen || !application) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Convert to Employee</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Candidate Info */}
                    <div className="bg-indigo-50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">
                                    {application.applicant_first_name} {application.applicant_last_name}
                                </p>
                                <p className="text-sm text-gray-600">{application.applicant_email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Employee Details */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Briefcase className="w-4 h-4 inline mr-1" />
                                    Position
                                </label>
                                <input
                                    type="text"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Onboarding Checklist */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" />
                            Assign Onboarding Checklist
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Template (Optional)</label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">No checklist</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.name} ({template.tasks?.length || 0} tasks)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedTemplateId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Onboarding Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            )}

                            {selectedTemplateId && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Preview Tasks:</p>
                                    <ul className="space-y-1">
                                        {templates.find(t => t.id === selectedTemplateId)?.tasks?.slice(0, 5).map((task: string, i: number) => (
                                            <li key={i} className="text-sm text-gray-600 flex items-center">
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></span>
                                                {task}
                                            </li>
                                        ))}
                                        {(templates.find(t => t.id === selectedTemplateId)?.tasks?.length || 0) > 5 && (
                                            <li className="text-sm text-gray-400 italic">
                                                + {templates.find(t => t.id === selectedTemplateId)?.tasks?.length - 5} more tasks
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Converting...
                                </>
                            ) : (
                                'Convert to Employee'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
