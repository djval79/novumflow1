import React from 'react';

export default function BrandedFooter() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <img
                            src="/assets/branding/novumsolvo-logo.jpg"
                            alt="NovumSolvo"
                            className="h-6 w-auto object-contain"
                        />
                        <span className="font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
                            NovumFlow
                        </span>
                    </div>
                    <div className="text-center sm:text-right">
                        <p className="text-xs">
                            Powered by{' '}
                            <span className="font-semibold text-cyan-600">NovumSolvo Ltd</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            © {new Date().getFullYear()} All rights reserved
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
