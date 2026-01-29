
import React, { useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Users, MapPin, ArrowRight, CalendarHeart, ShieldCheck, Zap, TrendingUp, Activity, Target, History, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { Link } from 'react-router-dom';
import { statsService, visitService } from '../services/supabaseService';
import StaffComplianceWidget from '../components/StaffComplianceWidget';
import FamilyPortal from './FamilyPortal';
import { DashboardSkeleton } from '../components/Skeleton';
import { useDashboardRealtime } from '../hooks/useRealtime';
import { RealtimeNotification, LiveBadge } from '../components/RealtimeIndicator';
import { toast } from 'sonner';


const visitData = [
  { name: 'Mon', visits: 45, completed: 42 },
  { name: 'Tue', visits: 52, completed: 50 },
  { name: 'Wed', visits: 48, completed: 48 },
  { name: 'Thu', visits: 61, completed: 55 },
  { name: 'Fri', visits: 55, completed: 54 },
  { name: 'Sat', visits: 38, completed: 38 },
  { name: 'Sun', visits: 40, completed: 39 },
];

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.ElementType; color: string; trend?: string; index: number }> = ({
  title, value, change, icon: Icon, color, trend, index
}) => (
  <motion.div
    className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl hover:shadow-primary-500/10 transition-all group relative overflow-hidden"
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
    whileHover={{ 
      y: -5, 
      scale: 1.02,
      boxShadow: "0 40px 100px rgba(14, 165, 233, 0.15)"
    }}
  >
    <motion.div 
      className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16"
      animate={{ 
        backgroundColor: ["#f8fafc", "#dbeafe", "#f8fafc"],
        scale: [1, 1.1, 1]
      }}
      whileHover={{ backgroundColor: "#dbeafe" }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut"
      }}
    />
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start mb-10">
        <motion.div 
          className={`p-4 rounded-2xl shadow-xl ${color} border-4 border-white`}
          whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
          transition={{ scale: { duration: 0.3 }, rotate: { duration: 0.5, repeat: 2 } }}
        >
          <Icon size={24} className="text-white" />
        </motion.div>
        <div className="text-right">
          <motion.p 
            className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {title}
          </motion.p>
          <motion.h3 
            className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            {value}
          </motion.h3>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <motion.span 
          className="text-[8px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 uppercase tracking-widestAlpha shadow-sm"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {change}
        </motion.span>
        {trend && (
          <motion.span 
            className="text-[8px] font-black text-slate-300 uppercase tracking-widestAlpha"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            {trend}
          </motion.span>
        )}
      </div>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = React.useState({ activeClients: 0, todayVisits: 0, openIncidents: 0, activeStaff: 0 });
  const [feed, setFeed] = React.useState<any[]>([]);
  const [upcomingVisits, setUpcomingVisits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const userRole = profile?.role?.toLowerCase();
  const isCarer = userRole === 'carer';
  const isAdmin = userRole === 'admin';
  const isFamilyOrClient = userRole === 'family' || userRole === 'client';

  if (isFamilyOrClient) {
    return <FamilyPortal />;
  }

  const { currentTenant } = useTenant();

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const realtimeIndicator = useDashboardRealtime(currentTenant?.id, {
    onVisitUpdate: refreshData,
    onIncidentUpdate: refreshData,
    onClientUpdate: refreshData,
    onStaffUpdate: refreshData
  });

  React.useEffect(() => {
    let isMounted = true;

    if (!currentTenant) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
        }
      }, 5000);

      try {
        const dashboardStats = await statsService.getDashboardStats();
        if (isMounted) {
          setStats(dashboardStats);
          if (isAdmin) {
            const feedData = await statsService.getLiveFeed();
            setFeed(feedData);
          }
          if (isCarer) {
            const visits = await visitService.getUpcoming(3);
            setUpcomingVisits(visits);
          }
        }
      } catch (error) {
        toast.error('Neural Sync Interrupted');
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, isCarer, refreshKey, currentTenant]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!currentTenant) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-1000">
        <div className="bg-slate-900 p-12 rounded-[4rem] mb-10 shadow-[0_40px_100px_rgba(0,0,0,0.2)]">
          <Users size={64} className="text-primary-500" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter uppercase">Tenant <span className="text-primary-600">Protocol</span> Required</h2>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-lg mb-12 leading-relaxed">
          Operational matrix currently detached. Initialize an organizational node to establish CareFlow clinical synchronization.
        </p>
        <Link to="/onboarding" className="group bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-black transition-all shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95 flex items-center gap-6">
          Initialize Hub <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12 animate-in fade-in duration-700 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
      <RealtimeNotification visible={realtimeIndicator.visible} message={realtimeIndicator.message} />

      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">Mission <span className="text-primary-600">Control</span></h1>
            <LiveBadge />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-2">
            Systemic Integrity Operational • Welcome Back Unit: <span className="text-slate-900">{profile?.full_name || user?.email}</span>
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-6">
            <button className="bg-white border-2 border-slate-100 text-slate-900 px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:border-primary-500 transition-all active:scale-95">
              Pull Analysis
            </button>
            <button className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-black transition-all active:scale-95 flex items-center gap-4">
              <Zap size={18} className="text-primary-500" /> New Deployment
            </button>
          </div>
        )}
      </div>

      {/* --- CARER INTEL PANEL --- */}
      {isCarer && (
        <>
          {upcomingVisits.length > 0 ? (
            <div className="bg-slate-900 rounded-[4rem] p-16 text-white shadow-[0_40px_100px_rgba(0,0,0,0.3)] mb-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/10 rounded-full -mr-64 -mt-64 blur-[120px] group-hover:bg-primary-600/20 transition-all duration-1000"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-12">
                <div className="flex-1 space-y-8">
                  <span className="inline-block px-6 py-2.5 bg-white/5 backdrop-blur-3xl rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] mb-4 border border-white/10 shadow-2xl">Active Tactical Priority</span>
                  <h2 className="text-6xl font-black tracking-tighter uppercase leading-tight">{upcomingVisits[0].clients?.name}</h2>
                  <div className="flex items-center gap-6 text-slate-400 font-extrabold text-sm uppercase tracking-widestAlpha">
                    <div className="p-3 bg-white/5 rounded-2xl"><MapPin size={24} className="text-primary-500" /></div>
                    {upcomingVisits[0].clients?.address || 'Deployment Loc Secure'}
                  </div>
                </div>
                <div className="text-right flex flex-col justify-center items-end gap-6 min-w-[300px]">
                  <div className="flex flex-col items-end">
                    <div className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 tabular-nums leading-none">{upcomingVisits[0].start_time?.substring(0, 5)}</div>
                    <div className="text-[12px] font-black text-primary-500 uppercase tracking-[0.5em] mt-4">Scheduled Arrival</div>
                  </div>
                  <Link to={`/visit/${upcomingVisits[0].id}`} className="mt-6 bg-primary-600 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-primary-600 transition-all flex items-center gap-6 shadow-2xl active:scale-95 shadow-primary-500/20">
                    Initiate Deployment <Zap size={20} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-2xl mb-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-slate-50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
              <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="p-8 bg-slate-50 rounded-[2.5rem]"><CalendarHeart size={48} className="text-slate-200" /></div>
                <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.5em]">Null Scheduled Operations for Current Epoch</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- EXECUTIVE HUD GRID --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <StatCard
            title="Registry Base"
            value={stats.activeClients.toString()}
            change="Real-time Sync"
            trend="Active Cohort"
            icon={Users}
            color="bg-slate-900"
          />
          <StatCard
            title="Deployment Volume"
            value={stats.todayVisits.toString()}
            change="+4.2% Kinetic"
            trend="Daily Cycle"
            icon={Activity}
            color="bg-primary-600"
          />
          <StatCard
            title="System Friction"
            value={stats.openIncidents.toString()}
            change="Priority Alpha"
            trend="Active Hazards"
            icon={AlertTriangle}
            color="bg-rose-500"
          />
          <StatCard
            title="Operational Units"
            value={stats.activeStaff.toString()}
            change="Combat Ready"
            trend="On-Station"
            icon={TrendingUp}
            color="bg-indigo-600"
          />
        </div>
      )}

      {/* Carer Deployment Feed */}
      {isCarer && (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl" />
          <h3 className="text-[10px] font-black text-slate-900 mb-12 uppercase tracking-[0.6em] flex items-center gap-4 relative z-10">
            <Target className="text-primary-600" size={24} /> Temporal Mission Itinerary
          </h3>
          <div className="space-y-6 relative z-10">
            {upcomingVisits.map((visit, i) => (
              <div key={i} className="flex items-center justify-between p-10 bg-slate-50/10 rounded-[2.5rem] border border-slate-50 hover:bg-white hover:shadow-2xl hover:border-primary-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-12">
                  <div className="flex flex-col">
                    <div className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums flex items-center gap-4">
                      {visit.start_time?.substring(0, 5)} <ArrowRight size={18} className="text-slate-300" /> {visit.end_time?.substring(0, 5)}
                    </div>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Visit Spectrum</span>
                  </div>
                  <div className="w-px h-12 bg-slate-100" />
                  <div>
                    <div className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-primary-600 transition-colors">{visit.clients?.name}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">{visit.visit_type} PROTOCOL</div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  {i === 0 ? (
                    <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-5 py-2.5 rounded-xl uppercase tracking-[0.25em] border border-primary-100 shadow-sm animate-pulse">
                      Live Priority
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-5 py-2.5 rounded-xl uppercase tracking-[0.25em] border border-slate-50">Queued</span>
                  )}
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-all shadow-inner">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            ))}
            {upcomingVisits.length === 0 && (
              <div className="text-center py-20 bg-slate-50/20 rounded-[3rem] border-4 border-dashed border-slate-50">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">All Mission Objectives Neutralized</p>
              </div>
            )}
          </div>
          <Link to="/rostering" className="block w-full text-center py-8 mt-12 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-[2rem] transition-all border-4 border-dashed border-slate-50 hover:border-primary-100">
            Access Expanded Combat Roster
          </Link>
        </div>
      )}

      {/* --- BUSINESS INTELLIGENCE TIER --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="flex justify-between items-end mb-12 relative z-10">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em]">Kinetic Activity Stream</h3>
                <p className="text-[11px] font-black text-primary-600 uppercase tracking-[0.4em]">Monthly Mission Completion Aggregator</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-100"></div> <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Projected</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary-500"></div> <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Actual</span></div>
              </div>
            </div>
            <div className="flex-1 h-96 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '24px',
                      border: 'none',
                      boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                      padding: '24px',
                      color: '#fff',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      fontWeight: 900,
                      letterSpacing: '0.2em'
                    }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#e2e8f0" strokeWidth={4} fill="transparent" strokeDasharray="10 10" />
                  <Area type="monotone" dataKey="completed" stroke="#0ea5e9" strokeWidth={6} fillOpacity={1} fill="url(#colorVisits)" dot={{ r: 8, fill: '#fff', strokeWidth: 4, stroke: '#0ea5e9' }} activeDot={{ r: 12, strokeWidth: 0, fill: '#0ea5e9 shadow-xl' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[4rem] text-white p-12 shadow-2xl border border-white/5 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
            <div className="relative z-10 flex flex-col h-full">
              <StaffComplianceWidget />
            </div>
          </div>
        </div>
      )}

      {/* OPERATIONAL AUDIT TERMINAL - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Activity size={128} className="text-slate-900" /></div>
          <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center relative z-10">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em] flex items-center gap-4">
                <History size={24} className="text-primary-600" /> Operational Matrix Ledger
              </h3>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Real-time Chronological Audit Protocol</p>
            </div>
            <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95">Purge Archives</button>
          </div>
          <div className="divide-y divide-slate-50 relative z-10 bg-white">
            {feed.length > 0 ? feed.map((item, idx) => (
              <div key={idx} className="px-12 py-8 flex items-center gap-10 hover:bg-slate-50/50 transition-all group border-l-[12px] border-l-transparent hover:border-l-primary-600">
                <div className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] border shadow-sm min-w-[140px] text-center transition-all group-hover:scale-105 ${item.color.replace('bg-', 'border-').replace('-500', '-200')} ${item.color.replace('bg-', 'text-')} bg-white`}>
                  {item.type}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-base text-slate-900 font-extrabold uppercase tracking-tight group-hover:translate-x-2 transition-transform">{item.msg}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Clock size={12} /> PROTOCOL TIMESTAMP: {item.time.split('T')[0]} • SECURE LOG
                  </p>
                </div>
                <button className="p-4 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                  <ArrowRight size={20} />
                </button>
              </div>
            )) : (
              <div className="p-32 text-center flex flex-col items-center gap-8">
                <div className="p-8 bg-slate-50 rounded-[3rem] opacity-20"><History size={64} className="text-slate-900" /></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Null Feed Buffer: Grid Silent</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
