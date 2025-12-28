import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'; // Recharts is already a dependency in careflow-ai, so assuming it's okay to use here.

interface HRAnalyticsDashboardProps {
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function HRAnalyticsDashboard({ onLoadingChange, onError }: HRAnalyticsDashboardProps) {
  const { user } = useAuth();
  const [employeeTurnoverData, setEmployeeTurnoverData] = useState<any[]>([]);
  const [leaveTrendsData, setLeaveTrendsData] = useState<any[]>([]);
  const [recruitmentStageData, setRecruitmentStageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  async function fetchAnalyticsData() {
    setLoading(true);
    onLoadingChange(true);
    try {
      // Fetch Employee Turnover Data (simplified)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('created_at, status');
      if (employeesError) throw employeesError;

      const turnoverByMonth: Record<string, { hires: number; terminations: number }> = {};
      employeesData.forEach((emp: any) => {
        const month = new Date(emp.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!turnoverByMonth[month]) {
          turnoverByMonth[month] = { hires: 0, terminations: 0 };
        }
        turnoverByMonth[month].hires++;
        if (emp.status === 'terminated') {
          turnoverByMonth[month].terminations++;
        }
      });
      setEmployeeTurnoverData(Object.keys(turnoverByMonth).map(month => ({
        month,
        Hires: turnoverByMonth[month].hires,
        Terminations: turnoverByMonth[month].terminations,
      })));

      // Fetch Leave Trends Data
      const { data: leavesData, error: leavesError } = await supabase
        .from('leave_requests')
        .select('start_date, total_days, status');
      if (leavesError) throw leavesError;

      const leaveTrendsByMonth: Record<string, { approved: number; pending: number; rejected: number }> = {};
      leavesData.forEach((leave: any) => {
        const month = new Date(leave.start_date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!leaveTrendsByMonth[month]) {
          leaveTrendsByMonth[month] = { approved: 0, pending: 0, rejected: 0 };
        }
        if (leave.status === 'approved') leaveTrendsByMonth[month].approved += leave.total_days;
        else if (leave.status === 'pending') leaveTrendsByMonth[month].pending += leave.total_days;
        else if (leave.status === 'rejected') leaveTrendsByMonth[month].rejected += leave.total_days;
      });
      setLeaveTrendsData(Object.keys(leaveTrendsByMonth).map(month => ({
        month,
        Approved: leaveTrendsByMonth[month].approved,
        Pending: leaveTrendsByMonth[month].pending,
        Rejected: leaveTrendsByMonth[month].rejected,
      })));

      // Fetch Recruitment Stage Data
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('current_stage_id, workflow_stages(name)');
      if (applicationsError) throw applicationsError;

      const stageCounts: Record<string, number> = {};
      applicationsData.forEach((app: any) => {
        const stageName = app.workflow_stages?.name || 'Unknown Stage';
        stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
      });
      setRecruitmentStageData(Object.keys(stageCounts).map(stage => ({
        name: stage,
        value: stageCounts[stage],
      })));

    } catch (error: any) {
      log.error('Error fetching analytics data', error, { component: 'HRAnalyticsDashboard', action: 'fetchAnalyticsData' });
      onError(error.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  }

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold text-gray-900">HR Analytics Dashboard</h2>
      <p className="text-gray-600">Overview of key HR metrics and trends.</p>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Employee Turnover */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Employee Turnover</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={employeeTurnoverData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Hires" stroke={COLORS[0]} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Terminations" stroke={COLORS[1]} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Leave Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Leave Trends (Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaveTrendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Approved" fill={COLORS[0]} />
                <Bar dataKey="Pending" fill={COLORS[2]} />
                <Bar dataKey="Rejected" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recruitment Stage Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Recruitment Stage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <Pie
                  data={recruitmentStageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {recruitmentStageData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
