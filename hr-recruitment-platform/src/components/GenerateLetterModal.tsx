import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { X, User, FileText, Send, Loader2 } from 'lucide-react';

interface GenerateLetterModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId?: string;
    onSuccess: (letter: any) => void;
    onError: (message: string) => void;
}

export default function GenerateLetterModal({
    isOpen,
    onClose,
    templateId,
    onSuccess,
    onError
}: GenerateLetterModalProps) {
    const [employees, setEmployees] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || '');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [previewContent, setPreviewContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (templateId) {
            setSelectedTemplateId(templateId);
        }
    }, [templateId]);

    useEffect(() => {
        // When template or employee changes, we might want to update preview or variables
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
            // Find all {{variable}} patterns
            const regex = /{{\s*(\w+)\s*}}/g;
            const matches = [...template.content.matchAll(regex)];
            const vars: Record<string, string> = {};
            matches.forEach(match => {
                const varName = match[1];
                // Skip system variables that are auto-filled
                const systemVars = ['employee_name', 'employee_first_name', 'employee_last_name', 'employee_email', 'employee_number', 'position', 'department', 'current_date'];
                if (!systemVars.includes(varName) && !variables[varName]) {
                    vars[varName] = '';
                }
            });
            setVariables(prev => ({ ...vars, ...prev }));
        }
    }, [selectedTemplateId, templates]);

    async function loadData() {
        setFetching(true);
        try {
            const { data: employeesData } = await supabase
                .from('employees')
                .select('id, first_name, last_name, position, department')
                .eq('status', 'active')
                .order('last_name');

            setEmployees(employeesData || []);

            if (!templateId) {
                const { data: templatesData } = await supabase
                    .from('letter_templates')
                    .select('*')
                    .eq('is_active', true)
                    .order('template_name');
                setTemplates(templatesData || []);
            } else {
                const { data: templateData } = await supabase
                    .from('letter_templates')
                    .select('*')
                    .eq('id', templateId)
                    .single();
                if (templateData) setTemplates([templateData]);
            }
        } catch (error) {
            log.error('Error loading generation data', error);
        } finally {
            setFetching(false);
        }
    }

    async function handleGenerate() {
        if (!selectedTemplateId || !selectedEmployeeId) {
            onError('Please select both a template and an employee');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('letter-template-crud', {
                body: {
                    action: 'generate',
                    data: {
                        template_id: selectedTemplateId,
                        employee_id: selectedEmployeeId,
                        variables
                    }
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error.message);

            onSuccess(data.data);
            onClose();
        } catch (error: any) {
            log.error('Letter generation failed', error);
            onError(error.message || 'Failed to generate letter');
        } finally {
            setLoading(true);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Send className="w-5 h-5 mr-2 text-indigo-600" />
                                Generate New Letter
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Template Selection */}
                            {!templateId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">-- Select a template --</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.template_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Employee Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">-- Select an employee --</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.position})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dynamic Variables */}
                            {Object.keys(variables).length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Custom Fields
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.keys(variables).map(varName => (
                                            <div key={varName}>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{varName.replace(/_/g, ' ')}</label>
                                                <input
                                                    type="text"
                                                    value={variables[varName]}
                                                    onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder={`Enter value for ${varName}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading || !selectedTemplateId || !selectedEmployeeId}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : 'Generate Letter'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
