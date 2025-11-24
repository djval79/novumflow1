import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { AlertCircle } from 'lucide-react';

interface FeatureRouteProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function FeatureRoute({ feature, children, fallback }: FeatureRouteProps) {
    const { hasFeature, loading } = useTenant();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!hasFeature(feature)) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Not Available</h2>
                    <p className="text-gray-600 mb-6">
                        This feature is not included in your current subscription plan.
                    </p>
                    <p className="text-sm text-gray-500">
                        Contact your administrator to upgrade your plan and access this feature.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
