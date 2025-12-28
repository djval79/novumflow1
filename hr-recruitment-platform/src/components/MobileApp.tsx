import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Clock, Users, Briefcase, Calendar, MessageSquare, FileText, TrendingUp, Zap, Loader2, Check, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsEngine } from '../lib/analyticsEngine';
import { businessIntelligence } from '../lib/businessIntelligence';

export default function MobileApp() {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'approvals' | 'insights'>('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<any>(null);
  const [businessAlerts, setBusinessAlerts] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (currentTenant) {
      loadMobileData();
    }
  }, [currentTenant]);

  const loadMobileData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Real Stats
      const stats = {
        active_jobs: 0,
        applications_today: 0,
        pending_interviews: 0,
        automation_savings_today: 0
      };

      const [jobsRes, appsRes, interviewsRes, leaveRes] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant?.id).eq('status', 'published'),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant?.id).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('tenant_id', currentTenant?.id).gte('scheduled_at', new Date().toISOString()),
        supabase.from('leave_requests').select('*, employees(first_name, last_name)').eq('tenant_id', currentTenant?.id).eq('status', 'pending')
      ]);

      stats.active_jobs = jobsRes.count || 0;
      stats.applications_today = appsRes.count || 0;
      stats.pending_interviews = interviewsRes.count || 0;
      stats.automation_savings_today = 12; // Mock for now

      setQuickStats(stats);
      setApprovals(leaveRes.data || []);

      const alerts = businessIntelligence.getBusinessAlerts();
      setBusinessAlerts(alerts);

      // 2. Fetch/Prepare Notifications
      const mockNotifications = [
        {
          id: 'n1',
          type: 'approval',
          title: 'New Leave Request',
          message: `${leaveRes.data?.[0]?.employees?.first_name || 'An employee'} requested leave`,
          time: 'Just now',
          priority: 'medium'
        },
        {
          id: 'n2',
          type: 'insight',
          title: 'Critical Engagement Alert',
          message: 'Sarah Chen shows turnover risk indicators',
          time: '1h ago',
          priority: 'high'
        }
      ].filter(n => (leaveRes.data?.length || 0) > 0 || n.id === 'n2');

      setNotifications(mockNotifications);

    } catch (error) {
      log.error('Failed to load mobile data', error, { component: 'MobileApp', action: 'loadMobileData' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', requestId);

      if (error) throw error;

      setApprovals(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      log.error('Error processing leave request', error, { component: 'MobileApp', action: 'handleApproval' });
    } finally {
      setActionLoading(null);
    }
  };

  const QuickActionCard = ({ icon: Icon, title, value, trend, color }: any) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-all active:scale-95">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {trend === 'up' ? '↗' : '↘'} 12%
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{title}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const NotificationItem = ({ notification }: { notification: any }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-indigo-500 mb-3 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bold text-gray-900 text-sm">{notification.title}</h3>
        <span className="text-[10px] text-gray-400 font-medium">{notification.time}</span>
      </div>
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">{notification.message}</p>
      <div className="flex space-x-2">
        {notification.type === 'approval' && (
          <button
            onClick={() => setActiveTab('approvals')}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Review Requests
          </button>
        )}
        {notification.type === 'insight' && (
          <button
            onClick={() => setActiveTab('insights')}
            className="px-3 py-1.5 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase rounded-lg hover:bg-purple-100 transition-colors"
          >
            View Retention Plan
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div>
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Smartphone className="w-16 h-16 text-indigo-600 animate-bounce" />
            <Loader2 className="absolute top-0 right-0 w-6 h-6 text-indigo-400 animate-spin" />
          </div>
          <p className="text-indigo-900 font-bold uppercase tracking-widest text-xs">NovumFlow Mobile</p>
          <p className="text-gray-400 text-xs mt-1">Syncing secure HR intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-24 font-sans antialiased">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 pb-12 rounded-b-[2rem] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tighter">NovumFlow</h1>
            <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest">Executive Mobility</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 w-2 h-2 rounded-full border-2 border-indigo-700"></span>
              )}
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-lg">
              <img src={`https://ui-avatars.com/api/?name=${user?.email}&background=6366f1&color=fff`} alt="Avatar" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick Stats */}
      <div className="px-5 -mt-8">
        <div className="grid grid-cols-2 gap-4">
          <QuickActionCard
            icon={Briefcase}
            title="Jobs"
            value={quickStats?.active_jobs || 0}
            color="text-indigo-600"
          />
          <QuickActionCard
            icon={Users}
            title="Apps"
            value={quickStats?.applications_today || 0}
            trend="up"
            color="text-emerald-600"
          />
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="p-5 mt-2">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Secondary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-orange-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Interviews</span>
                </div>
                <p className="text-xl font-bold">{quickStats?.pending_interviews || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-purple-500">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Saved HT</span>
                </div>
                <p className="text-xl font-bold">{quickStats?.automation_savings_today || 0}h</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">Priority Alerts</h2>
              <span className="text-[10px] font-bold text-indigo-600">View All</span>
            </div>

            <div className="space-y-0">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">All clear for today!</p>
                </div>
              )}
            </div>

            {businessAlerts && (
              <div className="space-y-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">Intelligence Insights</h2>
                {businessAlerts.opportunities.slice(0, 1).map((alert: string, i: number) => (
                  <div key={i} className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg relative overflow-hidden group">
                    <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-xs mb-1 uppercase tracking-widest text-indigo-300">Growth Opportunity</h3>
                    <p className="text-xs leading-relaxed pr-8">{alert}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">Operational Queue</h2>
            {[
              { task: 'Review Diversity Report', priority: 'High', type: 'compliance' },
              { task: 'Calibrate Compensation', priority: 'Medium', type: 'finance' },
              { task: 'Pipeline Review: CTO', priority: 'High', type: 'recruitment' }
            ].map((task, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${task.priority === 'High' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900">{task.task}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{task.type}</p>
                </div>
                <button className="p-2 bg-gray-50 rounded-lg text-indigo-600 active:bg-indigo-100">
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">Pending Requests ({approvals.length})</h2>
            {approvals.length > 0 ? (
              approvals.map((approval) => (
                <div key={approval.id} className="bg-white rounded-xl p-5 shadow-lg border border-gray-50 relative overflow-hidden">
                  {actionLoading === approval.id && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${approval.employees?.first_name}+${approval.employees?.last_name}&background=eff6ff&color=3b82f6`}
                      className="w-10 h-10 rounded-full"
                      alt="EMP"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{approval.employees?.first_name} {approval.employees?.last_name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Leave Request</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Period:</span>
                      <span className="font-semibold">{new Date(approval.start_date).toLocaleDateString()} - {new Date(approval.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Reason:</span>
                      <span className="font-semibold truncate max-w-[150px]">{approval.reason || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApproval(approval.id, 'rejected')}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproval(approval.id, 'approved')}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:bg-indigo-700"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                <h3 className="text-gray-900 font-bold">No Pending Approvals</h3>
                <p className="text-xs text-gray-400 mt-1">You're all caught up with employee requests.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">Predictive Intelligence</h2>
            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Quarterly Trajectory</span>
                </div>
                <p className="text-lg font-bold mb-2">Hiring Velocity is up 18%</p>
                <p className="text-xs text-indigo-100/70 leading-relaxed mb-6">
                  Based on current application flows and automation levels, your cost-per-hire is projected to drop by $450 in Q3.
                </p>
                <p className="text-xs text-indigo-100/70 leading-relaxed mb-6">
                  Based on current application flows and automation levels, your cost-per-hire is projected to drop by $450 in Q3.
                </p>
                <button className="w-full py-3 bg-white text-indigo-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
                  View Detailed Forecast
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6">
              {[
                { title: 'Retention Risk', level: 'Low', change: '-4%' },
                { title: 'Engagement Score', level: '8.4', change: '+0.2' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">{stat.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900">{stat.level}</span>
                    <span className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-indigo-500'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-around items-center px-4 py-3 z-50">
        {[
          { id: 'dashboard', icon: TrendingUp, label: 'Feed' },
          { id: 'tasks', icon: FileText, label: 'Work' },
          { id: 'approvals', icon: Users, label: 'Team' },
          { id: 'insights', icon: Zap, label: 'Insights' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'fill-indigo-50' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}