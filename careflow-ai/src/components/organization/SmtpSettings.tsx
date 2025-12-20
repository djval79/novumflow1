import React, { useState, useEffect } from 'react';
import { Mail, Save, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/context/TenantContext';
import { toast } from 'sonner';

export default function SmtpSettings() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        host: '',
        port: 587,
        user: '',
        password: '',
        from_email: ''
    });
    const [hasPassword, setHasPassword] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            loadConfig();
        }
    }, [currentTenant]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_tenant_smtp_config', {
                p_tenant_id: currentTenant?.id
            });

            if (error) throw error;

            if (data) {
                setFormData({
                    host: data.config?.host || '',
                    port: data.config?.port || 587,
                    user: data.config?.user || '',
                    password: '', // Never return password
                    from_email: data.config?.from_email || ''
                });
                setHasPassword(data.has_password);
            }
        } catch (error) {
            toast.error('Failed to load SMTP configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase.rpc('save_tenant_smtp_config', {
                p_host: formData.host,
                p_port: parseInt(formData.port.toString()),
                p_user: formData.user,
                p_password: formData.password || null, // Only send if changed
                p_from_email: formData.from_email,
                p_tenant_id: currentTenant?.id
            });

            if (error) throw error;

            toast.success('Email settings saved successfully');
            setFormData(prev => ({ ...prev, password: '' })); // Clear password field
            setHasPassword(true);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Custom Email Domain</h2>
                    <p className="text-sm text-gray-500">Send system emails from your own domain via SMTP</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                        <input
                            type="text"
                            value={formData.host}
                            onChange={e => setFormData({ ...formData, host: e.target.value })}
                            placeholder="smtp.example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                        <input
                            type="number"
                            value={formData.port}
                            onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                            placeholder="587"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                            required
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            value={formData.user}
                            onChange={e => setFormData({ ...formData, user: e.target.value })}
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                            {hasPassword && <span className="text-xs text-green-600 ml-2 font-bold uppercase tracking-wider">(Configured)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder={hasPassword ? "••••••••" : "Enter password"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 transition-all font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Email Address</label>
                    <input
                        type="email"
                        value={formData.from_email}
                        onChange={e => setFormData({ ...formData, from_email: e.target.value })}
                        placeholder="notifications@yourdomain.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                        required
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 font-bold"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
