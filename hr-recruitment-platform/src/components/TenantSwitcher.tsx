import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Building2, Check, ChevronDown, Plus, Loader2 } from 'lucide-react';


export default function TenantSwitcher() {
    const { currentTenant, tenants, loading, switchTenant } = useTenant();
    const [isOpen, setIsOpen] = useState(false);
    const [switching, setSwitching] = useState(false);

    const handleTenantSwitch = async (tenantId: string) => {
        if (tenantId === currentTenant?.id) {
            setIsOpen(false);
            return;
        }

        setSwitching(true);
        await switchTenant(tenantId);
        // Page will reload, so no need to set switching to false
    };

    if (loading || !currentTenant) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                < Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-w-[200px] justify-between"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Building2 className="w-4 h-4 flex-shrink-0 text-gray-500" />
                    <span className="truncate">{currentTenant.name}</span>
                </div>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Organizations
                            </p>
                        </div>

                        {/* Tenant List */}
                        <div className="max-h-64 overflow-y-auto">
                            {tenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    onClick={() => handleTenantSwitch(tenant.id)}
                                    disabled={switching}
                                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${switching ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-semibold text-sm">
                                                {tenant.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-hidden text-left">
                                            <p className="font-medium text-gray-900 truncate">{tenant.name}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {tenant.subscription_tier} · {tenant.subdomain}
                                            </p>
                                        </div>
                                    </div>
                                    {tenant.id === currentTenant?.id && (
                                        <Check className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to create tenant page
                                    window.location.href = '/tenant/create';
                                }}
                                disabled={switching}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Organization
                            </button>
                        </div>

                        {switching && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                                    <p className="text-sm text-gray-600">Switching organization...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
