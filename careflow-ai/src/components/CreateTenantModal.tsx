
import React, { useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import { X, Building2, Loader2, Check } from 'lucide-react';

interface CreateTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateTenantModal({ isOpen, onClose }: CreateTenantModalProps) {
    const { createTenant } = useTenant();
    const [name, setName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const tenant = await createTenant(name, subdomain);
            if (tenant) {
                onClose();
                // Optional: Switch to new tenant immediately?
                // The context usually reloads, so let's just close for now.
                window.location.reload();
            } else {
                setError('Failed to create organization. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        // Auto-generate subdomain from name
        const generated = newName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        setSubdomain(generated);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-cyan-600" />
                        Create Organization
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={handleNameChange}
                            placeholder="e.g. Sunny Side Care"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subdomain
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                https://
                            </span>
                            <input
                                type="text"
                                required
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value)}
                                placeholder="sunny-side"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            This will be your unique address on CareFlow.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Create Organization
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
