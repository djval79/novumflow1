import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, X, Send, Eye, RefreshCw, Slack, Video, Mail, Calendar, HardDrive, AlertCircle } from 'lucide-react';

interface Integration {
    id: string;
    service_name: string;
    display_name: string;
    is_active: boolean;
    is_connected: boolean;
    last_sync_at: string | null;
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

// Default integrations shown when no database table exists
const DEFAULT_INTEGRATIONS: Integration[] = [
    { id: '1', service_name: 'slack', display_name: 'Slack', is_active: true, is_connected: false, last_sync_at: null },
    { id: '2', service_name: 'zoom', display_name: 'Zoom', is_active: true, is_connected: false, last_sync_at: null },
    { id: '3', service_name: 'email', display_name: 'Email (SMTP)', is_active: true, is_connected: false, last_sync_at: null },
    { id: '4', service_name: 'calendar', display_name: 'Calendar', is_active: true, is_connected: false, last_sync_at: null },
    { id: '5', service_name: 'storage', display_name: 'Cloud Storage', is_active: true, is_connected: false, last_sync_at: null },
];

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [logs, setLogs] = useState<IntegrationLog[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [testMessage, setTestMessage] = useState('');
    const [testing, setTesting] = useState(false);
    const [setupRequired, setSetupRequired] = useState(false);

    useEffect(() => {
        loadIntegrations();
    }, []);

    async function loadIntegrations() {
        try {
            // First try to load from integrations table directly
            const { data, error } = await supabase
                .from('integrations')
                .select('*')
                .order('display_name');
            
            if (error) {
                // Table doesn't exist or other error - use defaults
                console.log('Integrations table not available, using defaults');
                setIntegrations(DEFAULT_INTEGRATIONS);
                setSetupRequired(true);
            } else {
                setIntegrations(data?.length ? data : DEFAULT_INTEGRATIONS);
                setSetupRequired(!data?.length);
            }
        } catch (error) {
            console.log('Using default integrations');
            setIntegrations(DEFAULT_INTEGRATIONS);
            setSetupRequired(true);
        } finally {
            setLoading(false);
        }
    }

    async function loadLogs(serviceName?: string) {
        try {
            // Try to load from integration_logs table
            let query = supabase
                .from('integration_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (serviceName) {
                query = query.eq('service_name', serviceName);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.log('Integration logs table not available');
                setLogs([]);
            } else {
                setLogs(data || []);
            }
        } catch (error) {
            console.log('Error loading logs:', error);
            setLogs([]);
        }
    }

    async function checkConnection(serviceName: string) {
        // Show informational message since edge functions aren't deployed
        alert(`ℹ️ Integration connection check requires Edge Functions to be deployed.\n\nTo enable ${serviceName} integration:\n1. Deploy the integration-manager Edge Function\n2. Configure API keys in Supabase secrets\n3. Run connection check again`);
    }

    async function testIntegration(serviceName: string) {
        // Show informational message since edge functions aren't deployed
        alert(`ℹ️ Integration testing requires Edge Functions to be deployed.\n\nTo test ${serviceName}:\n1. Deploy the integration-manager Edge Function\n2. Configure ${serviceName} API credentials\n3. Run the test again`);
    }

    const getServiceIcon = (serviceName: string) => {
        switch (serviceName) {
            case 'slack': return <Slack className="w-6 h-6" />;
            case 'zoom': return <Video className="w-6 h-6" />;
            case 'email': return <Mail className="w-6 h-6" />;
            case 'calendar': return <Calendar className="w-6 h-6" />;
            case 'storage': return <HardDrive className="w-6 h-6" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-600 mt-2">Connect third-party services to enhance your HR workflow</p>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <div key={integration.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-lg ${integration.is_connected ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                    {getServiceIcon(integration.service_name)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{integration.display_name}</h3>
                                    <p className="text-sm text-gray-500">{integration.service_name}</p>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${integration.is_connected ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium ${integration.is_connected ? 'text-green-600' : 'text-gray-500'
                                    }`}>
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
                            <button
                                onClick={() => {
                                    setSelectedService(integration.service_name);
                                    loadLogs(integration.service_name);
                                }}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Logs
                            </button>
                            {integration.is_connected ? (
                                <button
                                    onClick={() => testIntegration(integration.service_name)}
                                    disabled={testing}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                                    title="Test Integration"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => checkConnection(integration.service_name)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2"
                                    title="Check Connection"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {setupRequired && (
                    <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-blue-900">Integration Setup Required</h3>
                        <p className="text-blue-700 mt-2">
                            To enable integrations, deploy the Edge Functions and configure API credentials in Supabase.
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                            The integrations shown below are available for configuration.
                        </p>
                    </div>
                )}
                
                {integrations.length === 0 && !setupRequired && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p>No integrations configured yet.</p>
                        <p className="text-sm mt-2">Deploy the integration database schema to get started.</p>
                    </div>
                )}
            </div>

            {/* Test Integration Modal */}
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
                                            Duration: {log.duration_ms.toFixed(2)}ms
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
        </div>
    );
}
