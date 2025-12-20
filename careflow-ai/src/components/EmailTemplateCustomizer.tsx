
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import {
    Mail, Save, Eye, EyeOff, Sparkles, Loader2, Check, X,
    RefreshCw, Code, FileText, Send, AlertCircle, ChevronDown, Zap, Target, History, ShieldCheck, Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    category: 'scheduling' | 'compliance' | 'notifications' | 'onboarding' | 'billing';
    variables: string[];
    isActive: boolean;
    lastModified: string;
}

const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'lastModified'>[] = [
    {
        name: 'Shift Assignment',
        subject: 'New Shift Assigned - {{shift_date}}',
        body: `Dear {{staff_name}},

You have been assigned a new shift:

📅 Date: {{shift_date}}
⏰ Time: {{shift_start}} - {{shift_end}}
📍 Location: {{client_address}}
👤 Client: {{client_name}}

Special Notes:
{{shift_notes}}

Please confirm your attendance by logging into the CareFlow app.

Best regards,
{{company_name}}`,
        category: 'scheduling',
        variables: ['staff_name', 'shift_date', 'shift_start', 'shift_end', 'client_address', 'client_name', 'shift_notes', 'company_name'],
        isActive: true
    },
    {
        name: 'DBS Expiry Warning',
        subject: '⚠️ DBS Check Expiring Soon - Action Required',
        body: `Dear {{staff_name}},

This is a reminder that your DBS check will expire on {{expiry_date}}.

To remain compliant and continue working, please:
1. Apply for a new DBS check immediately
2. Submit the application reference to HR
3. Provide the certificate once received

If you have already renewed your DBS, please ignore this email or contact HR to update your records.

Regards,
Compliance Team
{{company_name}}`,
        category: 'compliance',
        variables: ['staff_name', 'expiry_date', 'company_name'],
        isActive: true
    },
    {
        name: 'Training Reminder',
        subject: '📚 Training Due: {{training_name}}',
        body: `Hello {{staff_name}},

Your {{training_name}} certification is due for renewal.

⏰ Due Date: {{due_date}}
📖 Course Link: {{course_link}}

Completing this training is mandatory to maintain your compliance status.

Please complete this training as soon as possible.

Thank you,
{{company_name}} Training Team`,
        category: 'compliance',
        variables: ['staff_name', 'training_name', 'due_date', 'course_link', 'company_name'],
        isActive: true
    },
    {
        name: 'Visit Confirmation',
        subject: 'Visit Confirmed - {{visit_date}}',
        body: `Dear {{client_name}},

Your care visit has been confirmed:

📅 Date: {{visit_date}}
⏰ Time: {{visit_time}}
👤 Carer: {{carer_name}}

If you need to make any changes, please contact us at least 24 hours in advance.

Best regards,
{{company_name}}`,
        category: 'scheduling',
        variables: ['client_name', 'visit_date', 'visit_time', 'carer_name', 'company_name'],
        isActive: true
    },
    {
        name: 'Welcome New Staff',
        subject: '👋 Welcome to {{company_name}}!',
        body: `Dear {{staff_name}},

Welcome to {{company_name}}! We're thrilled to have you join our team.

Here's what you need to know:

📱 Download the CareFlow App
🔐 Your login: {{email}}
📋 Complete your onboarding checklist
📚 Required training modules are assigned

Your first day is {{start_date}}. Please arrive 15 minutes early.

If you have any questions, don't hesitate to reach out.

Best regards,
{{manager_name}}
{{company_name}}`,
        category: 'onboarding',
        variables: ['staff_name', 'company_name', 'email', 'start_date', 'manager_name'],
        isActive: true
    },
    {
        name: 'Invoice Notification',
        subject: 'Invoice #{{invoice_number}} - {{company_name}}',
        body: `Dear {{client_name}},

Please find attached your invoice for care services.

Invoice Number: {{invoice_number}}
Invoice Date: {{invoice_date}}
Amount Due: {{amount}}
Due Date: {{due_date}}

Payment Details:
Bank: {{bank_name}}
Account: {{account_number}}
Sort Code: {{sort_code}}
Reference: {{invoice_number}}

Thank you for choosing {{company_name}}.

Regards,
Accounts Team`,
        category: 'billing',
        variables: ['client_name', 'invoice_number', 'invoice_date', 'amount', 'due_date', 'bank_name', 'account_number', 'sort_code', 'company_name'],
        isActive: true
    },
    {
        name: 'Incident Report',
        subject: '🚨 Incident Report: {{incident_type}} - {{date}}',
        body: `INCIDENT NOTIFICATION

Date: {{date}}
Time: {{time}}
Type: {{incident_type}}
Severity: {{severity}}
Location: {{location}}

Description:
{{description}}

Staff Involved: {{staff_name}}
Client Involved: {{client_name}}

Immediate Actions Taken:
{{actions_taken}}

This incident has been logged in the system and will be reviewed by management.

---
Automated notification from CareFlow AI`,
        category: 'notifications',
        variables: ['date', 'time', 'incident_type', 'severity', 'location', 'description', 'staff_name', 'client_name', 'actions_taken'],
        isActive: true
    }
];

const CategoryBadge: React.FC<{ category: EmailTemplate['category'] }> = ({ category }) => {
    const styles = {
        scheduling: 'bg-blue-900 border-blue-500 text-blue-400',
        compliance: 'bg-amber-900 border-amber-500 text-amber-400',
        notifications: 'bg-purple-900 border-purple-500 text-purple-400',
        onboarding: 'bg-emerald-900 border-emerald-500 text-emerald-400',
        billing: 'bg-slate-800 border-slate-600 text-slate-400'
    };

    return (
        <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-xl ${styles[category]}`}>
            {category}
        </span>
    );
};

const VariableTag: React.FC<{ variable: string; onClick?: () => void }> = ({ variable, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 bg-slate-900 text-primary-500 border border-white/5 rounded-xl text-[10px] font-black tracking-widestAlpha hover:bg-primary-600 hover:text-white transition-all shadow-inner uppercase"
    >
        {`{{${variable}}}`}
    </button>
);

export default function EmailTemplateCustomizer() {
    const { currentTenant } = useTenant();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const [editSubject, setEditSubject] = useState('');
    const [editBody, setEditBody] = useState('');
    const [editActive, setEditActive] = useState(true);

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
                setTemplates(data as EmailTemplate[]);
            } else {
                const defaults = DEFAULT_TEMPLATES.map((t, i) => ({
                    ...t,
                    id: `default-${i}`,
                    lastModified: new Date().toISOString()
                }));
                setTemplates(defaults);
            }
        } catch (error) {
            const defaults = DEFAULT_TEMPLATES.map((t, i) => ({
                ...t,
                id: `default-${i}`,
                lastModified: new Date().toISOString()
            }));
            setTemplates(defaults);
        } finally {
            setLoading(false);
        }
    }

    function selectTemplate(template: EmailTemplate) {
        setSelectedTemplate(template);
        setEditSubject(template.subject);
        setEditBody(template.body);
        setEditActive(template.isActive);
        setIsEditing(false);
        setShowPreview(false);
        toast.info(`Retrieved Template Manifest: ${template.name}`);
    }

    function insertVariable(variable: string) {
        const insertion = `{{${variable}}}`;
        setEditBody(prev => prev + insertion);
        toast.success(`Injected Variable: ${variable}`);
    }

    async function saveTemplate() {
        if (!selectedTemplate) return;
        setSaving(true);
        const saveToast = toast.loading('Synchronizing template parameters with local node...');

        try {
            const updated = {
                ...selectedTemplate,
                subject: editSubject,
                body: editBody,
                isActive: editActive,
                lastModified: new Date().toISOString()
            };

            if (currentTenant?.id) {
                const { error } = await supabase
                    .from('email_templates')
                    .upsert({
                        ...updated,
                        tenant_id: currentTenant.id
                    }, { onConflict: 'id' });

                if (error) throw error;
            }

            setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTemplate(updated);
            setIsEditing(false);
            toast.success('Template Spectrum Archived', { id: saveToast });
        } catch (error) {
            toast.warning('Template Saved Locally (Sync Failure)', { id: saveToast });
        } finally {
            setSaving(false);
        }
    }

    function getPreviewContent() {
        const sampleData: Record<string, string> = {
            staff_name: 'SARAH JOHNSON',
            client_name: 'MR. WILLIAMS',
            shift_date: 'MONDAY, 21ST DECEMBER 2024',
            shift_start: '09:00',
            shift_end: '17:00',
            client_address: '123 OAK STREET, LIVERPOOL, L1 1AA',
            shift_notes: 'CLIENT PREFERS TEA WITH 2 SUGARS. ASSIST WITH MEDICATION AT 12PM.',
            company_name: currentTenant?.name?.toUpperCase() || 'CAREFLOW SERVICES',
            expiry_date: '15TH JANUARY 2025',
            training_name: 'MANUAL HANDLING',
            due_date: '31ST DECEMBER 2024',
            course_link: 'HTTPS://ACADEMY.CAREFLOW.AI/VECTOR/123',
            visit_date: 'TUESDAY, 22ND DECEMBER 2024',
            visit_time: '10:00 AM',
            carer_name: 'SARAH JOHNSON',
            email: 'SARAH.JOHNSON@SECURE.CAREFLOW.AI',
            start_date: '2ND JANUARY 2025',
            manager_name: 'DR. A. ADMIN',
            invoice_number: 'INV-2024-0042',
            invoice_date: '20TH DECEMBER 2024',
            amount: '£1,250.00',
            bank_name: 'BARCLAYS SECURE',
            account_number: '12345678',
            sort_code: '20-00-00',
            date: '20TH DECEMBER 2024',
            time: '14:32',
            incident_type: 'MINOR FALL',
            severity: 'LOW (ALPHA)',
            location: 'CLIENT\'S KITCHEN GRID',
            description: 'CLIENT LOST BALANCE WHILE REACHING FOR A CUP. NO INJURIES SUSTAINED.',
            actions_taken: 'ASSISTED CLIENT TO CHAIR. CHECKED FOR INJURIES. INCIDENT LOGGED.'
        };

        let preview = editBody;
        Object.entries(sampleData).forEach(([key, value]) => {
            preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return preview;
    }

    const filteredTemplates = filterCategory === 'all'
        ? templates
        : templates.filter(t => t.category === filterCategory);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-10">
                <Loader2 className="w-24 h-24 animate-spin text-primary-600" />
                <p className="font-black uppercase tracking-[0.6em] text-[12px] text-slate-300 animate-pulse">Synchronizing Comms Lattice...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-full animate-in fade-in duration-700">
            {/* Template List */}
            <div className="lg:col-span-1 flex flex-col bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Mail size={64} className="text-slate-900" /></div>
                <div className="p-10 border-b border-slate-50 bg-slate-50/20 relative z-10">
                    <div className="space-y-4">
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-[0.4em] flex items-center gap-4">
                            <Mail size={24} className="text-primary-600" /> Template Grid
                        </h3>
                        <div className="relative">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full p-5 pr-12 text-[10px] font-black uppercase tracking-widestAlpha border-2 border-slate-50 rounded-[1.5rem] bg-white appearance-none cursor-pointer focus:border-primary-500 outline-none shadow-inner"
                            >
                                <option value="all">Spectrum: All Channels</option>
                                <option value="scheduling">Channel: Scheduling</option>
                                <option value="compliance">Channel: Compliance</option>
                                <option value="notifications">Channel: Notifications</option>
                                <option value="onboarding">Channel: Onboarding</option>
                                <option value="billing">Channel: Billing</option>
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10 divide-y divide-slate-50">
                    {filteredTemplates.map(template => (
                        <button
                            key={template.id}
                            onClick={() => selectTemplate(template)}
                            className={`w-full p-8 text-left hover:bg-slate-50 transition-all group relative border-l-[12px] border-l-transparent ${selectedTemplate?.id === template.id ? 'bg-slate-50/50 border-l-primary-600' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-6">
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-4">
                                        <p className="font-black text-slate-900 text-base uppercase tracking-tight truncate group-hover:text-primary-600 transition-colors">
                                            {template.name}
                                        </p>
                                        {!template.isActive && (
                                            <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate">{template.subject}</p>
                                </div>
                                <CategoryBadge category={template.category} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-2 flex flex-col bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
                {selectedTemplate ? (
                    <>
                        {/* Editor Header */}
                        <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row items-center justify-between gap-10 relative z-20">
                            <div className="flex items-center gap-8">
                                <div className="p-4 bg-slate-900 rounded-3xl shadow-xl"><History size={24} className="text-primary-500" /></div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter leading-none">{selectedTemplate.name}</h3>
                                    <div className="flex items-center gap-4">
                                        <CategoryBadge category={selectedTemplate.category} />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            Last Hash Sync: {new Date(selectedTemplate.lastModified).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => {
                                        setEditActive(!editActive);
                                        toast.info(`Template status toggled to: ${!editActive ? 'Active' : 'Disabled'}`);
                                        if (!isEditing) setIsEditing(true);
                                    }}
                                    className={`flex items-center gap-4 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all border-4 ${editActive
                                        ? 'bg-green-50 border-green-100 text-green-700 shadow-xl'
                                        : 'bg-rose-50 border-rose-100 text-rose-700 shadow-inner opacity-50'
                                        }`}
                                >
                                    {editActive ? <ShieldCheck size={18} /> : <X size={18} />}
                                    {editActive ? 'Verified Live' : 'Offline'}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowPreview(!showPreview);
                                        toast.info(showPreview ? 'Switching to Protocol Editor' : 'Switching to Manifest Mockup');
                                    }}
                                    className={`p-4 rounded-[1.5rem] transition-all border-4 ${showPreview ? 'bg-primary-900 border-primary-500 text-primary-400 shadow-2xl' : 'bg-slate-50 border-slate-100 text-slate-300 hover:text-slate-900 hover:bg-white shadow-xl'}`}
                                >
                                    {showPreview ? <Code size={24} /> : <Eye size={24} />}
                                </button>

                                {isEditing ? (
                                    <button
                                        onClick={saveTemplate}
                                        disabled={saving}
                                        className="flex items-center gap-4 px-10 py-3 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-black transition-all disabled:opacity-50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 group"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="text-primary-500 group-hover:scale-125 transition-transform" />}
                                        Commit
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            toast.info('Template parameters unlocked for modification');
                                        }}
                                        className="flex items-center gap-4 px-10 py-3 bg-white border-4 border-slate-50 text-slate-900 rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:border-primary-500 transition-all shadow-xl active:scale-95"
                                    >
                                        <FileText size={18} className="text-primary-600" />
                                        Initialize
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide relative z-10 bg-white">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Transmission Header (Subject)</label>
                                <div className="relative">
                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                    <input
                                        type="text"
                                        value={editSubject}
                                        onChange={(e) => {
                                            setEditSubject(e.target.value);
                                            if (!isEditing) setIsEditing(true);
                                        }}
                                        className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] text-[11px] font-black text-slate-900 uppercase tracking-widestAlpha focus:border-primary-500 focus:bg-white outline-none transition-all shadow-inner"
                                        placeholder="Enter subject protocol..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6 flex items-center gap-3">
                                        <Zap size={16} className="text-primary-600" /> Reactive Tokens
                                    </label>
                                    <div className="h-px bg-slate-50 w-full" />
                                </div>
                                <div className="flex flex-wrap gap-3 p-8 bg-slate-50/50 rounded-[3rem] border-2 border-slate-50 shadow-inner">
                                    {selectedTemplate.variables.map(variable => (
                                        <VariableTag
                                            key={variable}
                                            variable={variable}
                                            onClick={() => {
                                                insertVariable(variable);
                                                if (!isEditing) setIsEditing(true);
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] text-center">Inject reactive metadata nodes into transmission body</p>
                            </div>

                            <div className="flex-1 min-h-[500px] flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6 mb-4">
                                    {showPreview ? 'Transmission Manifest Mockup' : 'Transmission Body (Raw Logic)'}
                                </label>
                                {showPreview ? (
                                    <div className="flex-1 p-[2px] bg-slate-50 rounded-[3.5rem] shadow-inner">
                                        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-white h-full relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-12 opacity-5"><Target size={128} className="text-slate-900" /></div>
                                            <div className="border-b-4 border-slate-50 pb-10 mb-10 relative z-10">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widestAlpha mb-2">Subject Payload:</p>
                                                <p className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                                    {editSubject.replace(/{{([^}]+)}}/g, (_, key) => {
                                                        const sampleData: Record<string, string> = {
                                                            shift_date: 'MONDAY, 21ST DECEMBER 2024',
                                                            training_name: 'MANUAL HANDLING',
                                                            visit_date: 'TUESDAY, 22ND DECEMBER 2024',
                                                            company_name: currentTenant?.name?.toUpperCase() || 'CAREFLOW SERVICES',
                                                            invoice_number: 'INV-2024-0042',
                                                            incident_type: 'MINOR FALL',
                                                            date: '20TH DECEMBER 2024'
                                                        };
                                                        return sampleData[key] || `{{${key}}}`;
                                                    })}
                                                </p>
                                            </div>
                                            <div className="relative z-10">
                                                <pre className="whitespace-pre-wrap font-bold text-base text-slate-700 leading-loose uppercase tracking-tight">
                                                    {getPreviewContent()}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => {
                                            setEditBody(e.target.value);
                                            if (!isEditing) setIsEditing(true);
                                        }}
                                        className="flex-1 w-full p-12 bg-slate-900 text-primary-500 border-4 border-slate-950 rounded-[3.5rem] text-[13px] font-black tracking-widestAlpha focus:border-primary-600 outline-none transition-all shadow-[0_30px_60px_rgba(0,0,0,0.3)] min-h-[400px] resize-none scrollbar-hide uppercase"
                                        placeholder="Initialize transmission logic body..."
                                    />
                                )}
                            </div>

                            <div className="p-10 bg-slate-900 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl border border-white/5 relative overflow-hidden group/test">
                                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="p-6 bg-primary-600 text-white rounded-[2rem] shadow-2xl border-4 border-white/5 animate-pulse"><Send size={32} /></div>
                                    <div className="space-y-2">
                                        <p className="text-xl font-black text-white uppercase tracking-tighter">Handshake Simulation</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Send verification telemetry to administrative endpoint.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toast.success('Verification telemetry dispatched successfully')}
                                    className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-primary-50 transition-all shadow-2xl active:scale-95 relative z-10 group/btn2"
                                >
                                    <Send size={24} className="inline mr-4 text-primary-600 group-hover/btn2:-translate-y-1 group-hover/btn2:translate-x-1 transition-transform" /> Dispatch Simulation
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-12 text-center p-20 grayscale opacity-10">
                        <Mail size={160} className="text-slate-900" />
                        <div className="space-y-4">
                            <p className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Null Channel</p>
                            <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.8em]">Awaiting Spectrum Selection</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
