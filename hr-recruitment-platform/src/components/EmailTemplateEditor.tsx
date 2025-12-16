import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
            console.error('Error loading templates:', error);
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

    async function saveTemplate() {
        if (!selectedTemplate) return;
        setSaving(true);

        try {
            if (selectedTemplate.id.startsWith('default-')) {
                // Insert new template
                const { data, error } = await supabase
                    .from('email_templates')
                    .insert({
                        tenant_id: currentTenant?.id,
                        name: selectedTemplate.name,
                        type: selectedTemplate.type,
                        subject: selectedTemplate.subject,
                        body: selectedTemplate.body,
                        variables: selectedTemplate.variables,
                        is_active: selectedTemplate.is_active,
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? data : t));
                    setSelectedTemplate(data);
                }
            } else {
                // Update existing
                const { error } = await supabase
                    .from('email_templates')
                    .update({
                        name: selectedTemplate.name,
                        subject: selectedTemplate.subject,
                        body: selectedTemplate.body,
                        variables: selectedTemplate.variables,
                        is_active: selectedTemplate.is_active,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', selectedTemplate.id);

                if (error) throw error;
            }

            setEditMode(false);
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Template saved locally (database table may not exist)');
            setEditMode(false);
        } finally {
            setSaving(false);
        }
    }

    function updateSelectedTemplate(updates: Partial<EmailTemplate>) {
        if (!selectedTemplate) return;
        const updated = { ...selectedTemplate, ...updates };
        setSelectedTemplate(updated);
        setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updated : t));
    }

    function renderPreview(template: string): string {
        let rendered = template;
        Object.entries(previewData).forEach(([key, value]) => {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
        });
        // Replace any remaining variables with placeholders
        rendered = rendered.replace(/{{(\w+)}}/g, '[$1]');
        return rendered;
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function insertVariable(variable: string) {
        if (!selectedTemplate) return;
        const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = selectedTemplate.body;
            const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
            updateSelectedTemplate({ body: newText });
            // Reset cursor position
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
            }, 0);
        }
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
                        onClick={() => {/* Add new template logic */ }}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        New Template
                    </button>
                </div>
            </div>

            <div className="flex">
                {/* Template List */}
                <div className="w-64 border-r border-gray-200 bg-gray-50">
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
                                <p className="text-xs text-gray-500 truncate">{template.type}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template Editor */}
                <div className="flex-1 p-6">
                    {selectedTemplate ? (
                        <div className="space-y-6">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between">
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
                                    <button
                                        onClick={() => copyToClipboard(selectedTemplate.body)}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        {copied ? <Check className="w-4 h-4 inline mr-1" /> : <Copy className="w-4 h-4 inline mr-1" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                {editMode && (
                                    <button
                                        onClick={saveTemplate}
                                        disabled={saving}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                )}
                            </div>

                            {/* Editor/Preview */}
                            {showPreview ? (
                                <div className="space-y-4">
                                    {/* Preview Variables */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Preview Variables</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {selectedTemplate.variables.map(variable => (
                                                <div key={variable}>
                                                    <label className="text-xs text-gray-600">{variable}</label>
                                                    <input
                                                        type="text"
                                                        value={previewData[variable] || ''}
                                                        onChange={(e) => setPreviewData({ ...previewData, [variable]: e.target.value })}
                                                        placeholder={`Enter ${variable}`}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email Preview */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">
                                                Subject: {renderPreview(selectedTemplate.subject)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white">
                                            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                                                {renderPreview(selectedTemplate.body)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : editMode ? (
                                <div className="space-y-4">
                                    {/* Template Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                                        <input
                                            type="text"
                                            value={selectedTemplate.name}
                                            onChange={(e) => updateSelectedTemplate({ name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                                        <input
                                            type="text"
                                            value={selectedTemplate.subject}
                                            onChange={(e) => updateSelectedTemplate({ subject: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* Variables */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Insert Variable</label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTemplate.variables.map(variable => (
                                                <button
                                                    key={variable}
                                                    onClick={() => insertVariable(variable)}
                                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                                                >
                                                    <Code className="w-3 h-3 inline mr-1" />
                                                    {`{{${variable}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                                        <textarea
                                            id="template-body"
                                            value={selectedTemplate.body}
                                            onChange={(e) => updateSelectedTemplate({ body: e.target.value })}
                                            rows={15}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Click "Edit" to modify this template or "Preview" to see how it looks</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>Select a template to view or edit</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
