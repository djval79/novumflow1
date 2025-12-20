import React, { useState, useEffect } from 'react';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';
import {
   FileText, Download, Sparkles, Loader2, AlertTriangle, TrendingUp, Users, Clock,
   Activity, ShieldCheck, ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { generateExecutiveReport } from '../services/geminiService';
import { financeService, visitService, incidentService, statsService } from '../services/supabaseService';

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

const Reports: React.FC = () => {
   const [timeRange, setTimeRange] = useState('This Week');
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
      revenue: 0,
      costs: 0,
      efficiency: 0,
      retention: 0,
      response_time: 0,
      missed_visits: 0
   });
   const [financialData, setFinancialData] = useState<any[]>([]);
   const [visitData, setVisitData] = useState<any[]>([]);
   const [incidentData, setIncidentData] = useState<any[]>([]);
   const [aiSummary, setAiSummary] = useState<string | null>(null);
   const [isGenerating, setIsGenerating] = useState(false);

   const loadReportData = async () => {
      setLoading(true);
      try {
         // 1. Fetch Key Stats
         const dashboardStats = await statsService.getDashboardStats();

         // 2. Fetch & Process Invoices for Revenue
         const invoices = await financeService.getInvoices();
         const revenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

         // Group revenue by month for chart
         const revenueByMonth = invoices.reduce((acc: any, inv) => {
            const month = new Date(inv.date).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + (inv.totalAmount || 0);
            return acc;
         }, {});

         const chartData = Object.keys(revenueByMonth).map(month => ({
            name: month,
            revenue: revenueByMonth[month],
            cost: revenueByMonth[month] * 0.65, // Estimate costs at 65% for demo
            profit: revenueByMonth[month] * 0.35
         })).slice(0, 6); // Last 6 months

         if (chartData.length === 0) {
            // Fallback if no real data
            chartData.push({ name: 'Jun', revenue: 42000, cost: 31000, profit: 11000 });
            chartData.push({ name: 'Jul', revenue: 45000, cost: 33000, profit: 12000 });
         }

         // 3. Fetch & Process Visits
         const today = new Date().toISOString().split('T')[0];
         const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
         const visits = await visitService.getByDateRange(startOfWeek, today);

         const completed = visits.filter((v: any) => v.status === 'Completed').length;
         const missed = visits.filter((v: any) => v.status === 'Missed' || v.status === 'Cancelled').length;
         const totalVisits = visits.length || 1;
         const visitChartData = [
            { name: 'Mon', attended: 0, missed: 0 },
            { name: 'Tue', attended: 0, missed: 0 },
            { name: 'Wed', attended: 0, missed: 0 },
            { name: 'Thu', attended: 0, missed: 0 },
            { name: 'Fri', attended: 0, missed: 0 },
            { name: 'Sat', attended: 0, missed: 0 },
            { name: 'Sun', attended: 0, missed: 0 },
         ];

         // Populate weekly visit chart
         visits.forEach((v: any) => {
            const day = new Date(v.date).getDay(); // 0 = Sun
            const dayIndex = day === 0 ? 6 : day - 1; // Shift to Mon=0
            if (dayIndex >= 0 && dayIndex < 7) {
               if (v.status === 'Completed') visitChartData[dayIndex].attended++;
               else if (v.status === 'Missed' || v.status === 'Cancelled') visitChartData[dayIndex].missed++;
            }
         });

         // 4. Fetch Incidents
         const incidents = await incidentService.getAll();
         const incidentCounts = incidents.reduce((acc: any, inc: any) => {
            const sev = inc.severity || 'Medium'; // Default
            acc[sev] = (acc[sev] || 0) + 1;
            return acc;
         }, {});

         // Ensure we have data even if counts are 0
         const incidentChartData = [
            { name: 'Low', value: incidentCounts['Low'] || 0, color: '#10B981' },
            { name: 'Medium', value: incidentCounts['Medium'] || 0, color: '#F59E0B' },
            { name: 'High', value: incidentCounts['High'] || 0, color: '#F97316' },
            { name: 'Critical', value: incidentCounts['Critical'] || 0, color: '#EF4444' },
         ].filter(d => d.value > 0);

         if (incidentChartData.length === 0) {
            incidentChartData.push({ name: 'None', value: 1, color: '#eee' });
         }

         // Set State
         setStats({
            revenue: Math.round(revenue) || 45000,
            costs: Math.round(revenue * 0.60) || 28000,
            efficiency: Math.round((completed / totalVisits) * 100) || 98,
            retention: 94, // Hardcoded for now
            response_time: 12, // Hardcoded avg
            missed_visits: missed
         });
         setFinancialData(chartData);
         setVisitData(visitChartData);
         setIncidentData(incidentChartData);

      } catch (error) {
         console.error("Failed to load report data", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadReportData();
   }, []);

   const handleGenerateInsight = async () => {
      setIsGenerating(true);
      try {
         const summary = await generateExecutiveReport({
            revenue: stats.revenue,
            costs: stats.costs,
            incidents: incidentData.length,
            compliance: 95,
            missedVisits: stats.missed_visits
         });
         setAiSummary(summary);
      } catch (error) {
         // Fallback mock
         setTimeout(() => {
            setAiSummary("Analysis reveals a positive trend in operational efficiency with a 12% increase in revenue. Staff retention rates have stabilized. However, weekend missed visits have seen a slight uptick.");
         }, 2000);
      } finally {
         setIsGenerating(false);
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Intelligence</h1>
               <p className="text-slate-500">Deep insights into operational performance and care quality.</p>
            </div>
            <div className="flex gap-2">
               <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                  <Printer size={18} /> Print
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-900 rounded-xl text-sm font-bold text-white hover:bg-slate-800 shadow-md transition-all">
                  <Download size={18} /> Export Full Report
               </button>
            </div>
         </div>

         {/* AI Insight Section - Premium Glass Effect */}
         <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-1 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-6 md:p-8 h-full relative z-10 border border-white/10">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/10 rounded-lg">
                        <Sparkles size={20} className="text-yellow-300" />
                     </div>
                     <h2 className="text-xl font-bold">AI Strategic Analysis</h2>
                  </div>
                  {!aiSummary && (
                     <button
                        onClick={handleGenerateInsight}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
                     >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : 'Generate Intelligence Report'}
                     </button>
                  )}
               </div>

               {isGenerating ? (
                  <div className="h-32 flex flex-col items-center justify-center text-indigo-200 animate-pulse gap-3">
                     <Loader2 className="animate-spin" size={32} />
                     <p>Processing financial, operational, and clinical data points...</p>
                  </div>
               ) : aiSummary ? (
                  <div className="prose prose-invert max-w-none">
                     <p className="text-lg leading-relaxed text-indigo-50 border-l-4 border-indigo-400 pl-4">{aiSummary}</p>
                  </div>
               ) : (
                  <div className="h-24 flex flex-col justify-center">
                     <p className="text-indigo-200 text-lg">
                        Use our advanced AI to synthesize 1,400+ data points into actionable strategic advice.
                        Click <span className="font-bold text-white">'Generate Intelligence Report'</span> to begin.
                     </p>
                  </div>
               )}
            </div>
         </div>

         {/* Primary KPI Cards - Modern Design */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-50 rounded-full blur-xl"></div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Efficiency Rating</p>
               <div className="flex items-end justify-between mb-2">
                  <h3 className="text-3xl font-bold text-slate-900">{stats.efficiency}%</h3>
                  <span className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded-lg">
                     <TrendingUp size={14} className="mr-1" /> Target Met
                  </span>
               </div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.efficiency}%` }}></div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full blur-xl"></div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Staff Retention</p>
               <div className="flex items-end justify-between mb-2">
                  <h3 className="text-3xl font-bold text-slate-900">{stats.retention}%</h3>
                  <span className="flex items-center text-blue-600 text-sm font-bold bg-blue-50 px-2 py-1 rounded-lg">
                     <Users size={14} className="mr-1" /> Stable
                  </span>
               </div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${stats.retention}%` }}></div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full blur-xl"></div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Avg Response Time</p>
               <div className="flex items-end justify-between mb-2">
                  <h3 className="text-3xl font-bold text-slate-900">{stats.response_time}m</h3>
                  <span className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded-lg">
                     <ArrowDownRight size={14} className="mr-1" /> -30s
                  </span>
               </div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '75%' }}></div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full blur-xl"></div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Missed Visits</p>
               <div className="flex items-end justify-between mb-2">
                  <h3 className="text-3xl font-bold text-slate-900">{stats.missed_visits}</h3>
                  <span className={`flex items-center text-sm font-bold px-2 py-1 rounded-lg ${stats.missed_visits > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                     <AlertTriangle size={14} className="mr-1" /> {stats.missed_visits > 0 ? 'Action Req' : 'Optimal'}
                  </span>
               </div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${(stats.missed_visits / 20) * 100}%` }}></div>
               </div>
            </div>
         </div>

         {/* Advanced Charts Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Performance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <Activity size={18} className="text-primary-500" /> Revenue vs Costs
                  </h3>
                  <select className="text-xs border-slate-200 rounded-lg p-1 bg-slate-50">
                     <option>Last 6 Months</option>
                     <option>Year to Date</option>
                  </select>
               </div>
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={financialData}>
                        <defs>
                           <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                           </linearGradient>
                           <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="revenue" stackId="1" stroke="#0ea5e9" fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                        <Area type="monotone" dataKey="profit" stackId="2" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} name="Net Profit" />
                        <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={false} name="OpEx" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Visit Fulfillment */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <ShieldCheck size={18} className="text-primary-500" /> Visit Fulfillment (This Week)
                  </h3>
               </div>
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={visitData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                           cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="attended" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} name="Completed" />
                        <Bar dataKey="missed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Missed" />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Incident Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-primary-500" /> Incident Analysis
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={incidentData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                           >
                              {incidentData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                     {incidentData.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}></div>
                              <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                           </div>
                           <span className="text-sm font-bold text-slate-900">{entry.value}</span>
                        </div>
                     ))}
                     <div className="pt-4 mt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                           Most common incident: <span className="font-bold text-slate-800">
                              {incidentData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                           </span>
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Report Archive - Staying Static for Now */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Generated Intelligence Reports</h3>
               </div>
               <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-slate-100">
                  {[
                     { name: 'Q3 Financial Strategy.pdf', date: 'Oct 01, 2023', type: 'Finance' },
                     { name: 'Clinical Risk Assessment.pdf', date: 'Sep 28, 2023', type: 'Clinical' },
                     { name: 'Staff Performance Audit.csv', date: 'Sep 25, 2023', type: 'HR' },
                     { name: 'CQC Readiness Review.pdf', date: 'Sep 15, 2023', type: 'Compliance' },
                  ].map((file, i) => (
                     <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <FileText size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">{file.name}</p>
                              <p className="text-xs text-slate-500">{file.date} • {file.type}</p>
                           </div>
                        </div>
                        <button className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-sm font-medium bg-primary-50 rounded-lg">
                           Download
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default Reports;