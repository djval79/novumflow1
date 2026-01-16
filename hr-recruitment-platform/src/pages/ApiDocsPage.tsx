import React from 'react';
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ApiDocsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">NovumFlow Developer Portal</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-500 rounded-full text-xs font-bold uppercase">v1.0.0</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-8">
                <div className="px-6 mb-8 border-b border-slate-100 pb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">API Documentation</h2>
                    <p className="text-slate-600 max-w-2xl text-lg">
                        Welcome to the NovumFlow Enterprise API. Our API allows you to programmatically manage your workforce, automate compliance checks, and synchronize data across your care ecosystem.
                    </p>
                </div>
                <SwaggerUI url="/openapi.json" />
            </div>
        </div>
    );
};

export default ApiDocsPage;
