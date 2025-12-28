import React, { useState, useEffect } from 'react';
import { complianceService } from '@/lib/services/ComplianceService';
import { Save, AlertTriangle, Loader2 } from 'lucide-react';
import { log } from '@/lib/logger';

export default function ComplianceSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        dbs_renewal_months: 36,
        rtw_check_frequency_months: 12,
        training_validity: {
            fire_safety: 12,
            manual_handling: 12,
            safeguarding: 24,
            infection_control: 12,
            medication: 12,
            first_aid: 36,
            food_hygiene: 36
        }
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await complianceService.getSettings();
            setSettings(prev => ({
                ...prev,
                ...data,
                training_validity: { ...prev.training_validity, ...(data.training_validity || {}) }
            }));
        } catch (error) {
            log.error('Error loading settings', error, { component: 'ComplianceSettingsPage', action: 'loadSettings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const success = await complianceService.updateSettings(settings);
            if (success) {
                alert('Compliance rules updated successfully!');
            } else {
                alert('Failed to update settings.');
            }
        } catch (error) {
            log.error('Error saving settings', error, { component: 'ComplianceSettingsPage', action: 'handleSave' });
            alert('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleTrainingChange = (type: string, value: number) => {
        setSettings(prev => ({
            ...prev,
            training_validity: {
                ...prev.training_validity,
                [type]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Compliance Rules Configuration</h1>
                    <p className="text-gray-600 mt-1">Customize compliance requirements to match CQC and internal policies.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-medium text-orange-900">Important Note</h3>
                    <p className="text-sm text-orange-800 mt-1">
                        Changing these settings will affect compliance calculations for all staff.
                        For example, reducing the DBS renewal period may cause some currently compliant staff to become "Expiring Soon" or "Non-Compliant".
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">General Requirements</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">DBS Check Renewal Period (Months)</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="number"
                                value={settings.dbs_renewal_months}
                                onChange={(e) => setSettings({ ...settings, dbs_renewal_months: parseInt(e.target.value) || 0 })}
                                className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                Months
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Standard is 36 months (3 years). Some organizations require 12 months.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Right to Work Check Frequency (Months)</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="number"
                                value={settings.rtw_check_frequency_months}
                                onChange={(e) => setSettings({ ...settings, rtw_check_frequency_months: parseInt(e.target.value) || 0 })}
                                className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                Months
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Frequency for re-checking staff with time-limited visas.</p>
                    </div>
                </div>

                {/* Training Validity */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Training Validity Periods</h2>
                    <p className="text-sm text-gray-500">Set how long each training certificate is valid for before requiring renewal.</p>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {Object.entries(settings.training_validity).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </label>
                                <div className="flex items-center w-32">
                                    <input
                                        type="number"
                                        value={value as number}
                                        onChange={(e) => handleTrainingChange(key, parseInt(e.target.value) || 0)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    />
                                    <span className="ml-2 text-xs text-gray-500">Mo</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
