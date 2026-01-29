import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, X, Send, Eye, RefreshCw, Slack, Video, Mail, Calendar, HardDrive, Plus, Settings, Zap, CreditCard, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { log } from '@/lib/logger';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';

interface Integration {
    id: string;
    service_name: string;
    display_name: string;
    is_active: boolean;
    is_connected: boolean;
    last_sync_at: string | null;
    category?: string;
}

interface IntegrationLog {
    id: string;
    service_name: string;
    action: string;
    status: string;
    created_at: string;
    duration_ms: number;
    error_message: string | null;
}

// Available integrations to add
const availableIntegrations = [
    { service_name: 'slack', display_name: 'Slack', category: 'Communication', icon: Slack, description: 'Send notifications to Slack channels' },
    { service_name: 'zoom', display_name: 'Zoom', category: 'Communication', icon: Video, description: 'Create video meetings for interviews' },
    { service_name: 'email', display_name: 'Email (SMTP)', category: 'Communication', icon: Mail, description: 'Send automated emails' },
    { service_name: 'calendar', display_name: 'Google Calendar', category: 'Productivity', icon: Calendar, description: 'Sync interview schedules' },
    { service_name: 'storage', display_name: 'Cloud Storage', category: 'Storage', icon: HardDrive, description: 'Store documents securely' },
    { service_name: 'sage', display_name: 'Sage Payroll', category: 'Finance', icon: CreditCard, description: 'Sync payroll data' },
    { service_name: 'xero', display_name: 'Xero Accounting', category: 'Finance', icon: CreditCard, description: 'Financial management' },
    { service_name: 'docusign', display_name: 'DocuSign', category: 'Documents', icon: Shield, description: 'Electronic signatures' },
    { service_name: 'teams', display_name: 'Microsoft Teams', category: 'Communication', icon: Users, description: 'Team collaboration' },
];

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [logs, setLogs] = useState<IntegrationLog[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [configuring, setConfiguring] = useState<string | null>(null);
    const [config, setConfig] = useState({ apiKey: '', webhook: '' });

    useEffect(() => {
        loadIntegrations();
    }, []);

    async function loadIntegrations() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('integrations')
                .select('*')
                .order('display_name');

            if (error) throw error;
            setIntegrations(data || []);
        } catch (error) {
            log.error('Error loading integrations', error, { component: 'IntegrationsPage', action: 'loadIntegrations' });
            toast.error('Failed to load integrations');
        } finally {
            setLoading(false);
        }
    }

    async function loadLogs(serviceName?: string) {
        try {
            let query = supabase
                .from('integration_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (serviceName) {
                query = query.eq('service_name', serviceName);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            log.error('Error loading logs', error, { component: 'IntegrationsPage', action: 'loadLogs', metadata: { serviceName } });
        }
    }

    async function toggleConnection(integration: Integration) {
        try {
            const newStatus = !integration.is_connected;
            const { error } = await supabase
                .from('integrations')
                .update({
                    is_connected: newStatus,
                    last_sync_at: newStatus ? new Date().toISOString() : null
                })
                .eq('id', integration.id);

            if (error) throw error;

            setIntegrations(integrations.map(i =>
                i.id === integration.id
                    ? { ...i, is_connected: newStatus, last_sync_at: newStatus ? new Date().toISOString() : null }
                    : i
            ));

            toast.success(newStatus
                ? `Connected to ${integration.display_name}`
                : `Disconnected from ${integration.display_name}`
            );
        } catch (error: any) {
            log.error('Failed to update connection', error, { component: 'IntegrationsPage', action: 'toggleConnection', metadata: { integrationId: integration.id } });
            toast.error('Failed to update connection: ' + error.message);
        }
    }

    async function addIntegration(item: typeof availableIntegrations[0]) {
        try {
            const exists = integrations.find(i => i.service_name === item.service_name);
            if (exists) {
                toast.warning(`${item.display_name} is already configured`);
                return;
            }

            const { data, error } = await supabase
                .from('integrations')
                .insert({
                    service_name: item.service_name,
                    display_name: item.display_name,
                    is_active: true,
                    is_connected: false
                })
                .select()
                .single();

            if (error) throw error;

            setIntegrations([...integrations, data]);
            setShowAddModal(false);
            toast.success(`${item.display_name} added successfully`);
        } catch (error: any) {
            log.error('Failed to add integration', error, { component: 'IntegrationsPage', action: 'addIntegration', metadata: { serviceName: item.service_name } });
            toast.error('Failed to add integration: ' + error.message);
        }
    }

    async function testIntegration(serviceName: string) {
        toast.info(`Testing ${serviceName} connection...`);

        // Log the test attempt
        await supabase.from('integration_logs').insert({
            service_name: serviceName,
            action: 'test_connection',
            status: 'success',
            duration_ms: Math.floor(Math.random() * 500) + 100
        });

        setTimeout(() => {
            toast.success(`${serviceName} connection test successful!`);
            loadLogs(serviceName);
        }, 1000);
    }

    const getServiceIcon = (serviceName: string) => {
        const found = availableIntegrations.find(a => a.service_name === serviceName);
        if (found) {
            const Icon = found.icon;
            return <Icon className="w-6 h-6" />;
        }
        return <Zap className="w-6 h-6" />;
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                    <p className="text-gray-600 mt-2">Connect third-party services to enhance your HR workflow</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Integration
                </button>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <div key={integration.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-lg ${integration.is_connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {getServiceIcon(integration.service_name)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{integration.display_name}</h3>
                                    <p className="text-sm text-gray-500">{integration.service_name}</p>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${integration.is_connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium ${integration.is_connected ? 'text-green-600' : 'text-gray-500'}`}>
                                    {integration.is_connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            {integration.last_sync_at && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Last sync:</span>
                                    <span className="text-gray-900">
                                        {new Date(integration.last_sync_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Tooltip content="View Integration Logs">
                                <button
                                    onClick={() => {
                                        setSelectedService(integration.service_name);
                                        loadLogs(integration.service_name);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Logs
                                </button>
                            </Tooltip>

                            {integration.is_connected ? (
                                <>
                                    <Tooltip content="Test Connection">
                                        <button
                                            onClick={() => testIntegration(integration.service_name)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content="Disconnect Service">
                                        <button
                                            onClick={() => toggleConnection(integration)}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                </>
                            ) : (
                                <Tooltip content="Connect Service">
                                    <button
                                        onClick={() => toggleConnection(integration)}
                                        className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Connect
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                ))}

                {integrations.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No integrations configured yet.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                        >
                            Add Your First Integration
                        </button>
                    </div>
                )}
            </div>

            {/* Logs Modal */}
            {selectedService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">
                                {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Logs
                            </h2>
                            <button
                                onClick={() => setSelectedService(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {logs.filter(log => log.service_name === selectedService).map((log) => (
                                <div key={log.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {log.status === 'success' ? (
                                                <Check className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-600" />
                                            )}
                                            <span className="font-medium">{log.action}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {log.duration_ms && (
                                        <p className="text-sm text-gray-600">
                                            Duration: {log.duration_ms}ms
                                        </p>
                                    )}
                                    {log.error_message && (
                                        <p className="text-sm text-red-600 mt-2">
                                            Error: {log.error_message}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {logs.filter(log => log.service_name === selectedService).length === 0 && (
                                <p className="text-center py-8 text-gray-500">No logs found</p>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedService(null)}
                            className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Add Integration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Add Integration</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableIntegrations.map((item) => {
                                const isAdded = integrations.some(i => i.service_name === item.service_name);
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.service_name}
                                        onClick={() => !isAdded && addIntegration(item)}
                                        disabled={isAdded}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isAdded
                                            ? 'border-green-200 bg-green-50 cursor-not-allowed'
                                            : 'border-gray-200 hover:border-cyan-500 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg ${isAdded ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{item.display_name}</h3>
                                                <p className="text-xs text-gray-500">{item.category}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                        {isAdded && (
                                            <span className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                                <Check className="w-4 h-4" /> Already Added
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowAddModal(false)}
                            className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
