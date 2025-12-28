import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { Mail, Save, Eye, Code, Copy, Check, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    type: string;
    variables: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const defaultTemplates: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
    {
        name: 'Application Received',
        type: 'application_received',
        subject: 'Thank you for your application - {{job_title}}',
        body: `Dear {{applicant_name}},

Thank you for applying for the {{job_title}} position at {{company_name}}.

We have received your application and will review it shortly. If your qualifications match our requirements, we will contact you to discuss the next steps.

In the meantime, if you have any questions, please don't hesitate to reach out.

Best regards,
{{company_name}} Recruitment Team`,
        variables: ['applicant_name', 'job_title', 'company_name'],
        is_active: true,
    },
    {
        name: 'Interview Invitation',
        type: 'interview_invitation',
        subject: 'Interview Invitation - {{job_title}} at {{company_name}}',
        body: `Dear {{applicant_name}},

We are pleased to invite you for an interview for the {{job_title}} position.

Interview Details:
- Date: {{interview_date}}
- Time: {{interview_time}}
- Location: {{interview_location}}
- Type: {{interview_type}}

Please confirm your attendance by replying to this email.

If you need to reschedule, please let us know at least 24 hours in advance.

Best regards,
{{company_name}} Recruitment Team`,
        variables: ['applicant_name', 'job_title', 'company_name', 'interview_date', 'interview_time', 'interview_location', 'interview_type'],
        is_active: true,
    },
    {
        name: 'Offer Letter',
        type: 'offer_letter',
        subject: 'Job Offer - {{job_title}} at {{company_name}}',
        body: `Dear {{applicant_name}},

We are delighted to offer you the position of {{job_title}} at {{company_name}}.

Offer Details:
- Position: {{job_title}}
- Department: {{department}}
- Start Date: {{start_date}}
- Salary: {{salary}}

Please review the attached offer letter and respond within 5 business days.

We look forward to welcoming you to our team!

Best regards,
{{company_name}} HR Team`,
        variables: ['applicant_name', 'job_title', 'company_name', 'department', 'start_date', 'salary'],
        is_active: true,
    },
    {
        name: 'Application Rejected',
        type: 'rejection',
        subject: 'Update regarding your application for {{job_title}}',
        body: `Dear {{applicant_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}.

After careful review of your application and qualifications, we have decided not to move forward with your candidacy at this time.

AI Screening Insights:
{{ai_summary}}

We appreciate the time you took to apply and wish you the best in your future endeavors.

Best regards,
{{company_name}} Recruitment Team`,
        variables: ['applicant_name', 'job_title', 'company_name', 'ai_summary'],
        is_active: true,
    },
    {
        name: 'Training Reminder',
        type: 'training_reminder',
        subject: 'Training Reminder: {{training_name}} expires on {{expiry_date}}',
        body: `Dear {{employee_name}},

This is a reminder that your {{training_name}} certification will expire on {{expiry_date}}.

Please complete the required training before the expiry date to maintain compliance.

You can access the training portal here: {{training_link}}

If you have any questions, please contact the HR department.

Best regards,
{{company_name}} Compliance Team`,
        variables: ['employee_name', 'training_name', 'expiry_date', 'training_link', 'company_name'],
        is_active: true,
    },
];

export default function EmailTemplateEditor() {
    const { currentTenant } = useTenant();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, [currentTenant]);

    async function loadTemplates() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .order('name');

            if (error) throw error;

            if (data && data.length > 0) {
                setTemplates(data);
                setSelectedTemplate(data[0]);
            } else {
                // Use default templates
                const defaultWithIds = defaultTemplates.map((t, i) => ({
                    ...t,
                    id: `default-${i}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }));
                setTemplates(defaultWithIds);
                setSelectedTemplate(defaultWithIds[0]);
            }
        } catch (error) {
            log.error('Error loading templates', error, { component: 'EmailTemplateEditor', action: 'loadTemplates' });
            // Use defaults on error
            const defaultWithIds = defaultTemplates.map((t, i) => ({
                ...t,
                id: `default-${i}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));
            setTemplates(defaultWithIds);
            setSelectedTemplate(defaultWithIds[0]);
        } finally {
            setLoading(false);
        }
    }

    async function createNewTemplate() {
        const newTemp: EmailTemplate = {
            id: `new-${Date.now()}`,
            name: 'New Template',
            type: 'custom',
            subject: 'New Subject',
            body: 'Hello {{applicant_name}},\n\nEnter your message here.',
            variables: ['applicant_name', 'company_name'],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setTemplates(prev => [newTemp, ...prev]);
        setSelectedTemplate(newTemp);
        setEditMode(true);
        setShowPreview(false);
    }

    async function cloneTemplate() {
        if (!selectedTemplate) return;
        const cloned: EmailTemplate = {
            ...selectedTemplate,
            id: `clone-${Date.now()}`,
            name: `${selectedTemplate.name} (Copy)`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setTemplates(prev => [cloned, ...prev]);
        setSelectedTemplate(cloned);
        setEditMode(true);
        setShowPreview(false);
    }

    async function deleteTemplate() {
        if (!selectedTemplate) return;
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            if (!selectedTemplate.id.startsWith('default-') && !selectedTemplate.id.startsWith('new-') && !selectedTemplate.id.startsWith('clone-')) {
                const { error } = await supabase
                    .from('email_templates')
                    .delete()
                    .eq('id', selectedTemplate.id);
                if (error) throw error;
            }

            const newTemplates = templates.filter(t => t.id !== selectedTemplate.id);
            setTemplates(newTemplates);
            setSelectedTemplate(newTemplates.length > 0 ? newTemplates[0] : null);
        } catch (error) {
            log.error('Error deleting template', error, { component: 'EmailTemplateEditor', action: 'deleteTemplate' });
        }
    }

    function updateSelectedTemplate(updates: Partial<EmailTemplate>) {
        if (!selectedTemplate) return;
        const updated = { ...selectedTemplate, ...updates };
        setSelectedTemplate(updated);
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    }

    async function saveTemplate() {
        if (!selectedTemplate || !currentTenant) return;
        setSaving(true);
        try {
            const isNew = selectedTemplate.id.startsWith('default-') ||
                selectedTemplate.id.startsWith('new-') ||
                selectedTemplate.id.startsWith('clone-');

            if (isNew) {
                const { data, error } = await supabase
                    .from('email_templates')
                    .insert({
                        tenant_id: currentTenant.id,
                        name: selectedTemplate.name,
                        subject: selectedTemplate.subject,
                        body: selectedTemplate.body,
                        type: selectedTemplate.type,
                        variables: selectedTemplate.variables,
                        is_active: selectedTemplate.is_active
                    })
                    .select()
                    .single();

                if (error) throw error;

                setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? data : t));
                setSelectedTemplate(data);
                alert('Template created successfully!');
            } else {
                const { error } = await supabase
                    .from('email_templates')
                    .update({
                        name: selectedTemplate.name,
                        subject: selectedTemplate.subject,
                        body: selectedTemplate.body,
                        type: selectedTemplate.type,
                        variables: selectedTemplate.variables,
                        is_active: selectedTemplate.is_active,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedTemplate.id);

                if (error) throw error;
                alert('Template updated successfully!');
            }
            setEditMode(false);
        } catch (error) {
            log.error('Error saving template', error, { component: 'EmailTemplateEditor', action: 'saveTemplate' });
            alert('Failed to save template. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    function renderPreview(content: string): string {
        let rendered = content;
        Object.entries(previewData).forEach(([key, value]) => {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
        });
        // Replace any remaining variables with placeholders
        rendered = rendered.replace(/{{(\w+)}}/g, (match, p1) => previewData[p1] || `[${p1}]`);
        return rendered;
    }

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            log.error('Copy to clipboard failed', err);
        }
    }

    function insertVariable(variable: string) {
        const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = selectedTemplate?.body || '';
        const insertion = `{{${variable}}}`;

        const newBody = text.substring(0, start) + insertion + text.substring(end);
        updateSelectedTemplate({ body: newBody });

        // Focus back and set cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + insertion.length, start + insertion.length);
        }, 10);
    }

    function addVariable(variable: string) {
        if (!selectedTemplate || !variable) return;
        if (selectedTemplate.variables.includes(variable)) return;
        updateSelectedTemplate({ variables: [...selectedTemplate.variables, variable] });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
                    </div>
                    <button
                        onClick={createNewTemplate}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        New Template
                    </button>
                </div>
            </div>

            <div className="flex">
                {/* Template List */}
                <div className="w-64 border-r border-gray-200 bg-gray-50 h-[600px] overflow-y-auto">
                    <div className="p-3">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => {
                                    setSelectedTemplate(template);
                                    setEditMode(false);
                                    setShowPreview(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition ${selectedTemplate?.id === template.id
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <p className="text-sm font-medium truncate">{template.name}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {template.type}
                                    </span>
                                    {template.id.startsWith('default-') && (
                                        <span className="text-[10px] text-indigo-500 font-medium">Default</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template Editor */}
                <div className="flex-1 p-6 h-[600px] overflow-y-auto">
                    {selectedTemplate ? (
                        <div className="space-y-6">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between bg-white sticky top-0 z-10 py-1">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => { setShowPreview(false); setEditMode(true); }}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition ${editMode && !showPreview
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Edit2 className="w-4 h-4 inline mr-1" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { setShowPreview(true); setEditMode(false); }}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition ${showPreview
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Eye className="w-4 h-4 inline mr-1" />
                                        Preview
                                    </button>
                                    <div className="h-6 w-px bg-gray-200 mx-1" />
                                    <button
                                        onClick={cloneTemplate}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                        title="Clone template"
                                    >
                                        <Copy className="w-4 h-4 inline" />
                                    </button>
                                    <button
                                        onClick={deleteTemplate}
                                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete template"
                                    >
                                        <Trash2 className="w-4 h-4 inline" />
                                    </button>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => copyToClipboard(selectedTemplate.body)}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        {copied ? <Check className="w-4 h-4 inline mr-1" /> : <Copy className="w-4 h-4 inline mr-1" />}
                                        {copied ? 'Copied!' : 'Copy Body'}
                                    </button>
                                    {editMode && (
                                        <button
                                            onClick={saveTemplate}
                                            disabled={saving}
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Editor/Preview */}
                            {showPreview ? (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    {/* Preview Variables */}
                                    <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                                        <p className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
                                            <Code className="w-4 h-4 mr-2" />
                                            Preview Variables
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {selectedTemplate.variables.map(variable => (
                                                <div key={variable}>
                                                    <label className="text-[10px] font-bold uppercase text-indigo-400 mb-1 block">{variable}</label>
                                                    <input
                                                        type="text"
                                                        value={previewData[variable] || ''}
                                                        onChange={(e) => setPreviewData({ ...previewData, [variable]: e.target.value })}
                                                        placeholder={`Value for ${variable}`}
                                                        className="w-full px-2 py-1.5 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email Preview */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">
                                                <span className="text-gray-500 font-normal">Subject: </span>
                                                {renderPreview(selectedTemplate.subject)}
                                            </p>
                                        </div>
                                        <div className="p-8 bg-white min-h-[300px]">
                                            <div className="prose prose-sm max-w-none whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                                                {renderPreview(selectedTemplate.body)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : editMode ? (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                                            <input
                                                type="text"
                                                value={selectedTemplate.name}
                                                onChange={(e) => updateSelectedTemplate({ name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                placeholder="e.g. Senior Dev Offer Letter"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
                                            <select
                                                value={selectedTemplate.type}
                                                onChange={(e) => updateSelectedTemplate({ type: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                            >
                                                <option value="custom">Custom</option>
                                                <option value="application_received">Application Received</option>
                                                <option value="interview_invitation">Interview Invitation</option>
                                                <option value="offer_letter">Offer Letter</option>
                                                <option value="rejection">Rejection</option>
                                                <option value="onboarding">Onboarding</option>
                                                <option value="compliance">Compliance</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                                        <input
                                            type="text"
                                            value={selectedTemplate.subject}
                                            onChange={(e) => updateSelectedTemplate({ subject: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                            placeholder="Subject line with {{variables}}"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Available Variables</label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    id="new-variable"
                                                    placeholder="Add custom variable"
                                                    className="px-2 py-1 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const input = e.currentTarget;
                                                            addVariable(input.value);
                                                            input.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            {selectedTemplate.variables.map(variable => (
                                                <button
                                                    key={variable}
                                                    onClick={() => insertVariable(variable)}
                                                    className="group flex items-center px-2 py-1 text-xs bg-white text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-50 hover:border-indigo-300 transition shadow-sm"
                                                >
                                                    <Code className="w-3 h-3 mr-1 text-indigo-400" />
                                                    {`{{${variable}}}`}
                                                </button>
                                            ))}
                                            {selectedTemplate.variables.length === 0 && (
                                                <p className="text-xs text-gray-500 italic">No variables defined yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                                        <div className="relative">
                                            <textarea
                                                id="template-body"
                                                value={selectedTemplate.body}
                                                onChange={(e) => updateSelectedTemplate({ body: e.target.value })}
                                                rows={12}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
                                            />
                                            <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 bg-white/80 px-1 rounded">
                                                Markdown supported
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <Mail className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">View or Edit Template</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto mb-6">Select a template from the list to preview its content or make modifications.</p>
                                    <div className="flex items-center justify-center space-x-3">
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
                                        >
                                            <Edit2 className="w-4 h-4 inline mr-2" />
                                            Edit Mode
                                        </button>
                                        <button
                                            onClick={() => setShowPreview(true)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
                                        >
                                            <Eye className="w-4 h-4 inline mr-2" />
                                            Preview Mode
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-24 text-gray-500">
                            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                            <h3 className="text-lg font-medium text-gray-900">No Template Selected</h3>
                            <p>Choose an existing template or create a new one to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
