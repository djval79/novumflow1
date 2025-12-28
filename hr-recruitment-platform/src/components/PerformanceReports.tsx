import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function PerformanceReports() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data: reportData, error } = await supabase.functions.invoke('performance-crud', {
                body: { action: 'get_reports' },
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (error) throw error;

            setData(reportData);
            setLastUpdated(new Date());
        } catch (error) {
            log.error('Error loading reports', error, { component: 'PerformanceReports', action: 'loadReports' });
            setData(null);
        } finally {
            setLoading(false);
        }
    }


    async function generateData() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.functions.invoke('performance-crud', {
                body: { action: 'generate_sample_data' },
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || 'Unknown error');

            // Reload reports after generating data
            await loadReports();
        } catch (error: any) {
            log.error('Error generating sample data', error, { component: 'PerformanceReports', action: 'generateData' });
            alert(`Failed to generate sample data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-4">
                <button
                    onClick={generateData}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                    Generate Sample Data
                </button>
            </div>

            {!data ? (
                <div className="text-center py-12 text-gray-500">No data available. Click "Generate Sample Data" to get started.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Rating Distribution */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Review Rating Distribution</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.ratingDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#4F46E5" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Goal Status */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Goal Completion Status</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.goalStatus}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {data.goalStatus.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-indigo-50 p-6 rounded-lg">
                            <p className="text-sm text-indigo-600 font-medium">Total Reviews</p>
                            <p className="text-3xl font-bold text-indigo-900">{data.totalReviews}</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Total Goals</p>
                            <p className="text-3xl font-bold text-green-900">{data.totalGoals}</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Avg KPI Score</p>
                            <p className="text-3xl font-bold text-blue-900">{data.avgKPI}%</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
