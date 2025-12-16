import React from 'react';
import TrainingTracker from '@/components/TrainingTracker';
import GoalsTracker from '@/components/GoalsTracker';

export default function TrainingPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Training & Development</h1>
                <p className="mt-1 text-sm text-gray-600">Track your training courses and professional development goals</p>
            </div>

            {/* Training Tracker */}
            <TrainingTracker />

            {/* Goals Section */}
            <div className="mt-8">
                <GoalsTracker />
            </div>
        </div>
    );
}
