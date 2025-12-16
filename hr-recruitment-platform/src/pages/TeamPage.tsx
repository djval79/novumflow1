import React from 'react';
import TeamDirectory from '@/components/TeamDirectory';
import ActivityTimeline from '@/components/ActivityTimeline';

export default function TeamPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Team</h1>
                <p className="mt-1 text-sm text-gray-600">View and manage your team members</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Team Directory - Takes 2 columns */}
                <div className="xl:col-span-2">
                    <TeamDirectory />
                </div>

                {/* Activity Timeline - Takes 1 column */}
                <div>
                    <ActivityTimeline />
                </div>
            </div>
        </div>
    );
}
