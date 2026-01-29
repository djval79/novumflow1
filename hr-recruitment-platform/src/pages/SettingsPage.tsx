import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import EmailTemplateEditor from '../components/EmailTemplateEditor';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { tenantService } from '@/lib/services/TenantService';
import { Palette, Download, Layout, ArrowRight, Building2, Shield, Save, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const { currentTenant, refreshTenants } = useTenant();
  const [branding, setBranding] = useState<{ primaryColor: string; accentColor: string }>({
    primaryColor: '#0891b2',
    accentColor: '#4f46e5'
  });

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

      if (currentTenant?.settings?.branding) {
        setBranding({
          primaryColor: currentTenant.settings.branding.primaryColor || '#0891b2',
          accentColor: currentTenant.settings.branding.accentColor || '#4f46e5'
        });
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

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) return;
    setSaving(true);
    setMessage('');

    try {
      const newSettings = {
        ...(currentTenant.settings || {}),
        branding: {
          ...branding,
          last_updated: new Date().toISOString()
        }
      };

      const success = await tenantService.updateTenant(currentTenant.id, {
        settings: newSettings
      });

      if (success) {
        await refreshTenants();
        setMessage('Branding updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to update branding');
      }
    } catch (error) {
      setMessage('Error saving branding: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
            className="inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl disabled:opacity-50 active:scale-95"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Company Details'}
          </button>
        </div>
      </form>

      {/* White-Label Branding Section - Enterprise Only */}
      {currentTenant?.subscription_tier === 'enterprise' ? (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">White-Label Branding</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widestAlpha">Phase 7: Enterprise Personalization</p>
            </div>
            <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">Enterprise Active</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10">
              <form onSubmit={handleSaveBranding} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Primary Theme Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="h-14 w-14 rounded-xl border-none p-0 cursor-pointer overflow-hidden shadow-lg"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Accent / CTA Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={branding.accentColor}
                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        className="h-14 w-14 rounded-xl border-none p-0 cursor-pointer overflow-hidden shadow-lg"
                      />
                      <input
                        type="text"
                        value={branding.accentColor}
                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-10 py-5 bg-cyan-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-cyan-600/20 hover:bg-cyan-700 active:scale-95 transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                    Update Brand Colors
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Layout size={120} /></div>
              <h3 className="text-lg font-black tracking-tight mb-4 uppercase">Live Preview</h3>
              <div className="space-y-6 relative z-10">
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                  <div className="h-2 w-1/2 rounded-full opacity-20" style={{ backgroundColor: branding.primaryColor }}></div>
                  <div className="h-2 w-full rounded-full opacity-10 bg-white"></div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: branding.primaryColor }}></div>
                    <div className="h-8 flex-1 rounded-lg border border-white/20"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: branding.accentColor }}>
                    <Check size={20} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Accent Active</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  * colors are applied via dynamic CSS variables across the entire suite instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-12 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10"><Shield size={160} /></div>
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-black tracking-tight mb-4 uppercase">Unlock White-Label Branding</h2>
            <p className="text-indigo-100 font-medium mb-8 leading-relaxed">
              Personalize NovumFlow with your organization's colors and logos. Enterprise tier customers enjoy complete control over the UI theme across all suite modules.
            </p>
            <Link
              to="/billing"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-xl"
            >
              Upgrade to Enterprise <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Email Templates Section */}
      <div className="mt-8">
        <EmailTemplateEditor />
      </div>
    </div>
  );
}
