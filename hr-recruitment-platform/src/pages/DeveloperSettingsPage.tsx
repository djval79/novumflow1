import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { Key, Plus, Trash2, Copy, AlertCircle, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function DeveloperSettingsPage() {
    const { currentTenant } = useTenant();
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [keyName, setKeyName] = useState('');

    useEffect(() => {
        if (currentTenant) loadKeys();
    }, [currentTenant]);

    async function loadKeys() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setKeys(data || []);
        } catch (error) {
            console.error('Error loading API keys:', error);
            toast.error('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    }

    async function createKey() {
        if (!keyName.trim()) return toast.error('Please enter a key name');

        // Generate a random key (simulated here, ideally done on server)
        const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        const key = `nf_live_${randomPart}`;
        const keyHash = key; // In production, hash this! Storing plain for demo simplicity if no backend func.

        try {
            const { data, error } = await supabase.from('api_keys').insert({
                tenant_id: currentTenant?.id,
                name: keyName,
                key_hash: keyHash, // In real app, hash this before sending or use RPC
                key_prefix: key.substring(0, 10),
                created_by: (await supabase.auth.getUser()).data.user?.id
            }).select().single();

            if (error) throw error;

            setNewKey(key);
            setKeyName('');
            loadKeys();
            toast.success('API Key created');
        } catch (err: any) {
            toast.error('Error creating key: ' + err.message);
        }
    }

    async function deleteKey(id: string) {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        try {
            const { error } = await supabase.from('api_keys').delete().eq('id', id);
            if (error) throw error;
            setKeys(keys.filter(k => k.id !== id));
            toast.success('API Key revoked');
        } catch (err: any) {
            toast.error('Error revoking key');
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Developer Settings</h1>
                <p className="text-gray-500 mt-2">Manage API keys for accessing the NovumFlow API.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-600" /> API Keys
                    </h2>
                </div>

                {newKey && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium text-green-900 mb-1">New API Key Generated</p>
                                <p className="text-sm text-green-700 mb-3">
                                    Make sure to copy your API key now. You won't be able to see it again!
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="bg-white px-3 py-2 rounded border border-green-200 font-mono text-sm flex-1 break-all">
                                        {newKey}
                                    </code>
                                    <button onClick={() => copyToClipboard(newKey)} className="p-2 hover:bg-green-100 rounded text-green-700">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-8">
                    <input
                        type="text"
                        placeholder="Key Name (e.g. Zapier Integration)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={keyName}
                        onChange={e => setKeyName(e.target.value)}
                    />
                    <button
                        onClick={createKey}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Generate Key
                    </button>
                </div>

                <div className="space-y-4">
                    {keys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <p className="font-semibold text-gray-900">{key.name}</p>
                                <p className="text-sm text-gray-500 font-mono mt-1">
                                    Prefix: {key.key_prefix}...
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Created: {new Date(key.created_at).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => deleteKey(key.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {keys.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-400 text-sm">No API keys found. Generate one to get started.</div>
                    )}
                </div>
            </div>

            {/* Webhooks Section */}
            <WebhookSettings />

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-blue-900 text-sm">API Documentation</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Read the <button onClick={() => window.location.href = '/docs'} className="underline font-bold">NovumFlow API Docs</button> to learn how to authenticate requests and access data programmatically.
                    </p>
                </div>
            </div>
        </div>
    );
}

function WebhookSettings() {
    const { currentTenant } = useTenant();
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [url, setUrl] = useState('');
    const [events, setEvents] = useState<string[]>(['employee.created']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentTenant) loadWebhooks();
    }, [currentTenant]);

    async function loadWebhooks() {
        if (!currentTenant) return;
        const { data } = await supabase.from('webhooks').select('*').eq('tenant_id', currentTenant.id);
        setWebhooks(data || []);
    }

    async function addWebhook() {
        if (!url) return toast.error('Enter a URL');

        try {
            setLoading(true);
            const { error } = await supabase.from('webhooks').insert({
                tenant_id: currentTenant?.id,
                url,
                events,
                secret: 'whsec_' + Math.random().toString(36).substring(7)
            });
            if (error) throw error;
            toast.success('Webhook added');
            setUrl('');
            loadWebhooks();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteWebhook(id: string) {
        if (!confirm('Delete webhook?')) return;
        await supabase.from('webhooks').delete().eq('id', id);
        loadWebhooks();
        toast.success('Webhook deleted');
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Webhooks
                </h2>
            </div>

            <div className="flex gap-4 mb-6">
                <input
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="https://api.your-app.com/webhook"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                />
                <button
                    onClick={addWebhook}
                    disabled={loading}
                    className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Webhook
                </button>
            </div>

            <div className="space-y-4">
                {webhooks.map(wh => (
                    <div key={wh.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">{wh.url}</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">Active</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                {wh.events.map((ev: string) => (
                                    <span key={ev} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">{ev}</span>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => deleteWebhook(wh.id)} className="p-2 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {webhooks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">No webhooks configured.</div>
                )}
            </div>
        </div>
    );
}
