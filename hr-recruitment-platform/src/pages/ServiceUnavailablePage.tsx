import React from 'react';
import { AlertTriangle, RefreshCw, ServerOff } from 'lucide-react';

export default function ServiceUnavailablePage() {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 p-3">
                        <ServerOff className="h-12 w-12 text-red-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Service Unavailable
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    We're having trouble connecting to our servers right now.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <div className="rounded-md bg-yellow-50 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    System Maintenance or Outage
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        The backend service is currently returning a 503 error. This usually means the servers are undergoing maintenance or are temporarily overloaded.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 mb-6">
                        Please try again in a few moments. If the problem persists, please contact support.
                    </p>

                    <button
                        onClick={handleRetry}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 items-center"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Connection
                    </button>
                </div>
            </div>
        </div>
    );
}
