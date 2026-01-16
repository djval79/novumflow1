import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Upload, Building2, Mail, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmailTemplateEditor from '../components/EmailTemplateEditor';
import { log } from '@/lib/logger';

interface CompanySettings {
  id: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_website?: string;
  company_address?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  annual_leave_days?: number;
  sick_leave_days?: number;
  timezone?: string;
  currency?: string;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();

      if (data) {
        setCompanySettings(data);
      }
    } catch (error) {
      log.error('Error loading settings', error, { component: 'SettingsPage' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('company_settings')
        .update({
          ...companySettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', companySettings.id);

      if (error) throw error;

      // Log action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'UPDATE_COMPANY_SETTINGS',
        entity_type: 'company_settings',
        entity_id: companySettings.id,
        timestamp: new Date().toISOString()
      });

      log.track('settings_updated', {
        component: 'SettingsPage',
        userId: user?.id
      });

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage('Error saving settings: ' + errorMessage);
      log.error('Error saving settings', error, { component: 'SettingsPage' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!companySettings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No company settings found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your organization's configuration and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Company Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Company Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companySettings.company_name || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={companySettings.company_email || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, company_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone
                </label>
                <input
                  type="tel"
                  value={companySettings.company_phone || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, company_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Website
                </label>
                <input
                  type="url"
                  value={companySettings.company_website || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, company_website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address
                </label>
                <textarea
                  value={companySettings.company_address || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, company_address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Working Hours & Policies</h2>
            {/* ... (existing fields) ... */}
          </div>

          {/* Compliance & Auditing */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Compliance & Auditing
            </h2>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">Regulatory Audit Trail</h3>
                  <p className="text-sm text-slate-500">View immutable logs of all sensitive actions for CQC Inspections.</p>
                </div>
                <Link
                  to="/audit-logs"
                  className="px-6 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  View Audit Logs
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Email Templates Section */}
      <div className="mt-8">
        <EmailTemplateEditor />
      </div>
    </div>
  );
}
