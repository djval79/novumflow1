import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
  Users,
  Briefcase,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import AdminPrivilegeSetup from '../components/AdminPrivilegeSetup';
import DashboardAnalytics from '../components/DashboardAnalytics';

interface DashboardStats {
  totalEmployees: number;
  activeJobs: number;
  pendingApplications: number;
  upcomingExpiries: number;
  todayAttendance: number;
  pendingLeaveRequests: number;
}

export default function DashboardPage() {
  const { currentTenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeJobs: 0,
    pendingApplications: 0,
    upcomingExpiries: 0,
    todayAttendance: 0,
    pendingLeaveRequests: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant) {
      loadDashboardData();
    }
  }, [currentTenant]);

  async function loadDashboardData() {
    if (!currentTenant) return;

    try {
      // Get total employees for current tenant
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'active');

      // Get active job postings for current tenant
      const { count: jobCount } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'published');

      // Get pending applications for current tenant
      const { count: appCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .in('status', ['applied', 'screening', 'interview_scheduled']);

      // Get upcoming document expiries for current tenant (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { count: expiryCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .eq('is_current_version', true);

      // Get today's attendance for current tenant
      // NOTE: attendance_records table doesn't have tenant_id column yet
      // TODO: Add tenant_id column to attendance_records table
      const attendanceCount = 0; // Disabled until table has tenant_id

      // Get pending leave requests for current tenant
      // NOTE: leave_requests table doesn't have tenant_id column yet
      // TODO: Add tenant_id column to leave_requests table
      const leaveCount = 0; // Disabled until table has tenant_id

      // Get recent audit logs for current tenant
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      setStats({
        totalEmployees: employeeCount || 0,
        activeJobs: jobCount || 0,
        pendingApplications: appCount || 0,
        upcomingExpiries: expiryCount || 0,
        todayAttendance: attendanceCount || 0,
        pendingLeaveRequests: leaveCount || 0,
      });

      setRecentActivities(logs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      name: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      name: 'Active Job Postings',
      value: stats.activeJobs,
      icon: Briefcase,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      name: 'Pending Applications',
      value: stats.pendingApplications,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+23%'
    },
    {
      name: 'Document Expiries',
      value: stats.upcomingExpiries,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      change: 'Next 30 days'
    },
  ];

  const quickStats = [
    { name: 'Today\'s Attendance', value: stats.todayAttendance, icon: CheckCircle },
    { name: 'Pending Leave Requests', value: stats.pendingLeaveRequests, icon: Calendar },
  ];

  if (loading || !currentTenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500">{stat.change}</p>
              </div>
              <div className={`${stat.color} rounded-xl p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickStats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start border-l-2 border-indigo-500 pl-4 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 capitalize">{activity.entity_type}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No recent activities</p>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mt-8">
        <DashboardAnalytics />
      </div>

      {/* Admin Privilege Setup */}
      <AdminPrivilegeSetup />
    </div>
  );
}
