import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  History,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { OnboardingTour } from '../components/OnboardingTour';
import { Zap } from 'lucide-react';
import AdminPrivilegeSetup from '../components/AdminPrivilegeSetup';
import DashboardAnalytics from '../components/DashboardAnalytics';
import UKComplianceDashboardWidget from '../components/UKComplianceDashboardWidget';
import WelcomeDashboard from '../components/WelcomeDashboard';
import { log } from '@/lib/logger';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';

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
  const { profile } = useAuth();
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
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('nv_onboarding_seen');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    if (currentTenant) {
      loadDashboardData();
    }
  }, [currentTenant]);

  async function loadDashboardData() {
    if (!currentTenant) return;

    try {
      setLoading(true);

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Perform all count queries in parallel for better performance
      const [
        { count: employeeCount },
        { count: leaveCount },
        { count: jobCount },
        { count: appCount },
        { count: expiryCount },
        { data: logs }
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'active'),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'pending'),
        supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'published'),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).in('status', ['applied', 'screening', 'interview_scheduled']),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).not('expiry_date', 'is', null).lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]).eq('is_current_version', true),
        supabase.from('audit_logs').select('*').eq('tenant_id', currentTenant.id).order('timestamp', { ascending: false }).limit(8)
      ]);

      setStats({
        totalEmployees: employeeCount || 0,
        activeJobs: jobCount || 0,
        pendingApplications: appCount || 0,
        pendingLeaveRequests: leaveCount || 0,
        upcomingExpiries: expiryCount || 0,
        todayAttendance: 0,
      });

      setRecentActivities(logs || []);
    } catch (error) {
      log.error('Error loading dashboard data', error, { component: 'DashboardPage', action: 'loadDashboardData' });
    } finally {
      setLoading(false);
    }
  }

  function safeFormatDate(dateStr: string, formatStr: string = 'MMM dd · HH:mm') {
    try {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (!isValid(date)) return 'N/A';
      return format(date, formatStr);
    } catch (e) {
      return 'N/A';
    }
  }



  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 pb-20">
        {/* Welcome Widget Skeleton */}
        <Skeleton className="h-64 w-full rounded-3xl" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Analytics Chart Skeleton */}
            <Skeleton className="h-96 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
          <div className="space-y-8">
            {/* Activity Feed Skeleton */}
            <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-4">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <SkeletonList count={5} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-20 relative">
      {showTour && <OnboardingTour onComplete={() => {
        localStorage.setItem('nv_onboarding_seen', 'true');
        setShowTour(false);
      }} />}

      {/* Header with Tour Trigger */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-22xl font-black text-gray-900 tracking-tight uppercase">Mission Control</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widestAlpha">NovumFlow Integrated Suite</p>
        </div>
        <button
          onClick={() => setShowTour(true)}
          className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 transition-all flex items-center gap-3 active:scale-95"
        >
          <Zap size={14} className="text-cyan-500" /> System Tour
        </button>
      </div>

      {/* Dynamic Welcome Widget */}
      <WelcomeDashboard />

      {/* Admin Quick Fix Widget */}
      {profile?.is_super_admin && <AdminPrivilegeSetup />}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Analytics & Widget */}
        <div className="lg:col-span-2 space-y-8">
          <DashboardAnalytics />
          <UKComplianceDashboardWidget />
        </div>

        {/* Right Column: Recent Activity & Coming Soon */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="font-black text-gray-900 tracking-tight">Recent Activity</h3>
              </div>
              <button className="text-xs font-bold text-cyan-600 uppercase tracking-widest hover:text-cyan-700 transition-colors">View All</button>
            </div>

            <div className="p-3">
              {recentActivities.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer">
                      <div className="mt-1 p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                        <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] h-4 flex items-center px-1.5 bg-gray-100 text-gray-500 rounded font-bold uppercase tracking-wider">{activity.entity_type}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{safeFormatDate(activity.timestamp)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Support Widget */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="relative z-10">
              <h4 className="font-black text-xl mb-2 tracking-tight">Need help?</h4>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Our support team is here for you 24/7. Access our complete documentation or contact us directly.</p>
              <div className="space-y-3">
                <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95">Knowledge Base</button>
                <button className="w-full py-3 bg-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/30 transition-all border border-white/10">Contact Support</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
