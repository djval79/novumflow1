
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Users, MapPin, ChevronRight, ArrowRight, MessageSquare, CalendarHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { UserRole } from '../types';
import { Link } from 'react-router-dom';
import { statsService, visitService } from '../services/supabaseService';
import StaffComplianceWidget from '../components/StaffComplianceWidget';

const visitData = [
  { name: 'Mon', visits: 45, completed: 42 },
  { name: 'Tue', visits: 52, completed: 50 },
  { name: 'Wed', visits: 48, completed: 48 },
  { name: 'Thu', visits: 61, completed: 55 },
  { name: 'Fri', visits: 55, completed: 54 },
  { name: 'Sat', visits: 38, completed: 38 },
  { name: 'Sun', visits: 40, completed: 39 },
];

const complianceData = [
  { name: 'Training', value: 92 },
  { name: 'DBS', value: 98 },
  { name: 'Reviews', value: 85 },
];

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.ElementType; color: string }> = ({
  title, value, change, icon: Icon, color
}) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <span className="text-xs font-medium text-green-600 mt-4 inline-block bg-green-50 px-2 py-1 rounded">
      {change}
    </span>
  </div>
);

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = React.useState({ activeClients: 0, todayVisits: 0, openIncidents: 0 });
  const [upcomingVisits, setUpcomingVisits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Use profile.role instead of user.role (Case Insensitive)
  const userRole = profile?.role?.toLowerCase();

  const isCarer = userRole === 'carer';
  const isAdmin = userRole === 'admin';
  const isFamilyOrClient = userRole === 'family' || userRole === 'client';

  const { currentTenant } = useTenant();

  React.useEffect(() => {
    let isMounted = true;
    console.log('Dashboard: useEffect running. isCarer:', isCarer, 'Tenant:', currentTenant?.name);

    if (!currentTenant) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      console.log('Dashboard: fetchData started');

      // Force loading to false after 5 seconds to prevent infinite loop
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('Dashboard: Fetch timeout reached, forcing loading false');
          setLoading(false);
        }
      }, 5000);

      try {
        const dashboardStats = await statsService.getDashboardStats();

        if (isMounted) {
          console.log('Dashboard: stats fetched', dashboardStats);
          setStats(dashboardStats);

          if (isCarer) {
            console.log('Dashboard: fetching carer visits');
            const visits = await visitService.getUpcoming(3);
            console.log('Dashboard: visits fetched', visits);
            setUpcomingVisits(visits);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          console.log('Dashboard: setting loading to false');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isCarer]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  if (!currentTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Users size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Select an Organization</h2>
        <p className="text-slate-500 max-w-md">
          Please select an organization from the top menu to view the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 text-sm">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">
              Export Report
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-primary-700">
              + New Shift
            </button>
          </div>
        )}
      </div>

      {/* --- CARER VIEW --- */}
      {isCarer && (
        <>
          {upcomingVisits.length > 0 ? (
            <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-2 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider mb-2">Up Next</span>
                    <h2 className="text-2xl font-bold">{upcomingVisits[0].clients?.name}</h2>
                    <div className="flex items-center gap-2 text-primary-100 mt-1">
                      <MapPin size={16} /> {upcomingVisits[0].clients?.address || 'No address'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{upcomingVisits[0].start_time?.substring(0, 5)}</div>
                    <div className="text-sm text-primary-200">Scheduled Start</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm">{upcomingVisits[0].visit_type}</span>
                  </div>
                  <Link to={`/visit/${upcomingVisits[0].id}`} className="bg-white text-primary-900 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors flex items-center gap-2">
                    Start Visit <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
              <p className="text-slate-500">No upcoming visits scheduled.</p>
            </div>
          )}
        </>
      )}

      {/* --- FAMILY / CLIENT VIEW --- */}
      {isFamilyOrClient && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Who's Visiting Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Clock size={100} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Next Scheduled Visit</h3>
            <p className="text-slate-500 text-sm mb-4">Your care team today.</p>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700 border-4 border-white shadow-sm">
                ?
              </div>
              <div>
                <p className="font-bold text-lg">Check Schedule</p>
                <p className="text-sm text-slate-500">Please view your full schedule</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/messages" className="flex-1 py-2 text-center bg-primary-50 text-primary-700 font-bold rounded-lg hover:bg-primary-100 transition-colors text-sm">
                Messages
              </Link>
              <Link to="/care-plans" className="flex-1 py-2 text-center border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm">
                View Plan
              </Link>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarHeart className="text-primary-600" size={20} /> Recent Updates
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">No recent updates.</p>
              <Link to="/messages" className="block text-sm text-primary-600 font-medium hover:underline mt-2">
                View all messages
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- ADMIN STATS GRID (Hidden for Family/Client) --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Clients"
            value={stats.activeClients.toString()}
            change="Live"
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Visits Today"
            value={stats.todayVisits.toString()}
            change="Scheduled"
            icon={CheckCircle2}
            color="bg-green-500"
          />
          <StatCard
            title="Open Incidents"
            value={stats.openIncidents.toString()}
            change="Action Required"
            icon={AlertTriangle}
            color="bg-amber-500"
          />
          <StatCard
            title="Staff on Duty"
            value="-"
            change="Active now"
            icon={Clock}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Carer Schedule Preview */}
      {isCarer && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Your Schedule Today</h3>
          <div className="space-y-4">
            {upcomingVisits.map((visit, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-bold text-slate-500 w-24">
                    {visit.start_time?.substring(0, 5)} - {visit.end_time?.substring(0, 5)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{visit.clients?.name}</div>
                    <div className="text-xs text-slate-500">{visit.visit_type}</div>
                  </div>
                </div>
                <div className="text-right">
                  {i === 0 && <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">NEXT</span>}
                </div>
              </div>
            ))}
            {upcomingVisits.length === 0 && <p className="text-sm text-slate-500">No visits scheduled.</p>}
          </div>
          <Link to="/rostering" className="block w-full text-center py-3 mt-4 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            View Full Roster
          </Link>
        </div>
      )}

      {/* --- ADMIN CHARTS (Hidden for Carer & Family) --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Visit Trends (Weekly)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="visits" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Compliance Widget - NovumFlow Synced */}
          <StaffComplianceWidget />
        </div>
      )}

      {/* Live Feed - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Live Feed & Alerts</h3>
            <button className="text-primary-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { type: 'System', msg: 'Dashboard updated with real-time data', time: 'Just now', color: 'text-green-600 bg-green-50' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.color}`}>{item.type}</span>
                <p className="flex-1 text-sm text-slate-700">{item.msg}</p>
                <span className="text-xs text-slate-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
