import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Briefcase,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Heart,
  Stethoscope,
  ShieldAlert,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { format } from 'date-fns';
import AdminPrivilegeSetup from '../components/AdminPrivilegeSetup';
import DashboardAnalytics from '../components/DashboardAnalytics';
import UKComplianceDashboardWidget from '../components/UKComplianceDashboardWidget';
import WelcomeDashboard from '../components/WelcomeDashboard';
import { log } from '@/lib/logger';

interface DashboardStats {
  totalEmployees: number; // For CareFlow, this represents "Total Carers"
  activeJobs: number;
  pendingApplications: number;
  upcomingExpiries: number;
  todayAttendance: number;
  pendingLeaveRequests: number;
  // CareFlow Specific
  activeClients: number;
  todayVisits: number;
  medicationAlerts: number;
  openIncidents: number;
}

// Domain-aware detection
const isCareFlow = window.location.hostname.includes('careflow');

export default function DashboardPage() {
  const { currentTenant } = useTenant();
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeJobs: 0,
    pendingApplications: 0,
    upcomingExpiries: 0,
    todayAttendance: 0,
    pendingLeaveRequests: 0,
    activeClients: 0,
    todayVisits: 0,
    medicationAlerts: 0,
    openIncidents: 0,
  });
  const [recentActivities, setRecentActivities] = useState<{ id: string; action: string; entity_type: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant) {
      loadDashboardData();
    }
  }, [currentTenant]);

  async function loadDashboardData() {
    if (!currentTenant) return;

    try {
      setLoading(true);

      // 1. Shared Metric: Employees (Carers for CareFlow)
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'active');

      // 2. Shared Metric: Feedback/HR items
      const { count: leaveCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending');

      let domainStats: Partial<DashboardStats> = {};

      if (isCareFlow) {
        // CAREFLOW SPECIFIC FETCHING
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', currentTenant.id)
          .eq('status', 'active');

        const today = new Date().toISOString().split('T')[0];
        const { count: visitCount } = await supabase
          .from('care_visits')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', currentTenant.id)
          .eq('scheduled_date', today);

        const { count: incidentCount } = await supabase
          .from('incident_reports')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', currentTenant.id)
          .eq('status', 'open');

        domainStats = {
          activeClients: clientCount || 0,
          todayVisits: visitCount || 0,
          openIncidents: incidentCount || 0,
          medicationAlerts: 0 // Mock for now
        };
      } else {
        // NOVUMFLOW SPECIFIC FETCHING
        const { count: jobCount } = await supabase
          .from('job_postings')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', currentTenant.id)
          .eq('status', 'published');

        const { count: appCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', currentTenant.id)
          .in('status', ['applied', 'screening', 'interview_scheduled']);

        domainStats = {
          activeJobs: jobCount || 0,
          pendingApplications: appCount || 0
        };
      }

      // Shared Document Expiries
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { count: expiryCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .eq('is_current_version', true);

      setStats(prev => ({
        ...prev,
        ...domainStats,
        totalEmployees: employeeCount || 0,
        pendingLeaveRequests: leaveCount || 0,
        upcomingExpiries: expiryCount || 0,
      }));

      // Recent Activities
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('timestamp', { ascending: false })
        .limit(8);

      setRecentActivities(logs || []);
    } catch (error) {
      log.error('Error loading dashboard data', error, { component: 'DashboardPage', action: 'loadDashboardData' });
    } finally {
      setLoading(false);
    }
  }

  // Define cards based on domain
  const statCards = isCareFlow ? [
    {
      name: 'Total Carers',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-purple-500',
      change: '+2 this month'
    },
    {
      name: 'Active Clients',
      value: stats.activeClients,
      icon: Heart,
      color: 'bg-pink-500',
      change: '4 pending'
    },
    {
      name: "Today's Visits",
      value: stats.todayVisits,
      icon: Clock,
      color: 'bg-indigo-500',
      change: '88% complete'
    },
    {
      name: 'Medication Alerts',
      value: stats.medicationAlerts,
      icon: Stethoscope,
      color: 'bg-red-500',
      change: 'Critical: 0'
    },
  ] : [
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

  const quickStats = isCareFlow ? [
    { name: 'Unassigned Shifts', value: 3, icon: Calendar, color: 'text-amber-600' },
    { name: 'Pending Care Plan Reviews', value: stats.pendingLeaveRequests, icon: FileText, color: 'text-purple-600' },
  ] : [
    { name: 'Today\'s Attendance', value: stats.todayAttendance, icon: CheckCircle, color: 'text-green-600' },
    { name: 'Pending Leave Requests', value: stats.pendingLeaveRequests, icon: Calendar, color: 'text-indigo-600' },
  ];

  if (loading || !currentTenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isCareFlow ? 'border-purple-600' : 'border-indigo-600'}`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <WelcomeDashboard />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="mt-2 flex items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCareFlow ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`${stat.color} rounded-2xl p-4 shadow-lg shadow-gray-100`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Primary Widgets) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Feature-Specific Dashboard Content */}
          {isCareFlow ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Real-time Visit Tracker
                </h2>
                <button className="text-sm text-purple-600 font-semibold hover:underline">View Live Map</button>
              </div>
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LayoutDashboard className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Configure Care Parameters</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                  To start tracking live visits and eMAR compliance, ensure your clients have active care plans assigned.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <button className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition">
                    Manage Clients
                  </button>
                  <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">
                    Rota Settings
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <UKComplianceDashboardWidget />
          )}

          <DashboardAnalytics />
        </div>

        {/* Right Column (Secondary Widgets) */}
        <div className="space-y-8">
          {/* Quick Secondary Stats */}
          <div className="grid grid-cols-1 gap-4">
            {quickStats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Timeline Integration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Updates</h2>
              <TrendingUp className={`w-5 h-5 ${isCareFlow ? 'text-purple-600' : 'text-indigo-600'}`} />
            </div>

            <div className="space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => (
                  <div key={activity.id} className="relative pl-8 pb-6 last:pb-0">
                    {idx !== recentActivities.length - 1 && (
                      <div className="absolute left-3 top-7 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${isCareFlow ? 'bg-purple-500' : 'bg-indigo-500'}`}>
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{activity.action}</p>
                      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{activity.entity_type}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(activity.timestamp), 'MMM dd · HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No recent activities</p>
                </div>
              )}
            </div>

            <button className={`w-full mt-6 py-2.5 rounded-xl text-sm font-bold border border-gray-100 hover:bg-gray-50 transition-colors ${isCareFlow ? 'text-purple-600' : 'text-indigo-600'}`}>
              View Audit Trail
            </button>
          </div>

          <AdminPrivilegeSetup />
        </div>
      </div>
    </div>
  );
}
