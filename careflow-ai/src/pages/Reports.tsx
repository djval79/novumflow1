import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { FileText, Download, Sparkles, Loader2, AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react';
import { generateExecutiveReport } from '../services/geminiService';

// Mock Data
const FINANCIAL_DATA = [
  { month: 'Jun', revenue: 42000, cost: 31000 },
  { month: 'Jul', revenue: 45000, cost: 33000 },
  { month: 'Aug', revenue: 43000, cost: 34000 },
  { month: 'Sep', revenue: 48000, cost: 35000 },
  { month: 'Oct', revenue: 51000, cost: 36000 },
];

const INCIDENT_DATA = [
  { name: 'Falls', value: 4 },
  { name: 'Medication', value: 2 },
  { name: 'Skin Integrity', value: 3 },
  { name: 'Behavioral', value: 1 },
];

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reports: React.FC = () => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = {
    revenue: 51000,
    costs: 36000,
    incidents: 10,
    compliance: 92,
    missedVisits: 3
  };

  const handleGenerateInsight = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateExecutiveReport(stats);
      setAiSummary(summary);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Reporting & Analytics</h1>
           <p className="text-slate-500 text-sm">Operational insights and performance metrics.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
           <Download size={18} /> Export PDF
        </button>
      </div>

      {/* AI Insight Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-2 text-primary-300 font-bold uppercase tracking-wider text-xs">
                  <Sparkles size={14} /> Executive AI Summary
               </div>
               {!aiSummary && (
                 <button 
                   onClick={handleGenerateInsight}
                   disabled={isGenerating}
                   className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center gap-2"
                 >
                    {isGenerating ? <Loader2 className="animate-spin" size={12} /> : 'Generate Briefing'}
                 </button>
               )}
            </div>

            {isGenerating ? (
               <div className="h-24 flex items-center justify-center text-slate-400 animate-pulse">
                  Analyzing {FINANCIAL_DATA.length} months of data...
               </div>
            ) : aiSummary ? (
               <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-lg font-medium leading-relaxed">{aiSummary}</p>
               </div>
            ) : (
               <div className="h-20 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold mb-1">October Performance Review</h2>
                  <p className="text-slate-400">Click 'Generate Briefing' to have AI analyze operational trends and risks.</p>
               </div>
            )}
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Travel Efficiency</p>
            <div className="flex items-end justify-between">
               <h3 className="text-xl font-bold text-slate-800">88%</h3>
               <TrendingUp size={18} className="text-green-500 mb-1" />
            </div>
            <p className="text-xs text-slate-400 mt-2">Time spent caring vs traveling</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Staff Retention</p>
            <div className="flex items-end justify-between">
               <h3 className="text-xl font-bold text-slate-800">94%</h3>
               <Users size={18} className="text-blue-500 mb-1" />
            </div>
            <p className="text-xs text-slate-400 mt-2">+2% from last quarter</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Avg Visit Duration</p>
            <div className="flex items-end justify-between">
               <h3 className="text-xl font-bold text-slate-800">42m</h3>
               <Clock size={18} className="text-purple-500 mb-1" />
            </div>
            <p className="text-xs text-slate-400 mt-2">Target: 45m</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Missed Visits</p>
            <div className="flex items-end justify-between">
               <h3 className="text-xl font-bold text-red-600">3</h3>
               <AlertTriangle size={18} className="text-red-500 mb-1" />
            </div>
            <p className="text-xs text-slate-400 mt-2">Requires investigation</p>
         </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Financial Trend */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Revenue vs Staff Costs</h3>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={FINANCIAL_DATA}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10}/>
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                     <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                     <Area type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" name="Staff Costs" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Incident Breakdown */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Safety Incidents by Category</h3>
            <div className="h-64 flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={INCIDENT_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {INCIDENT_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Recent Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Generated Reports Archive</h3>
         </div>
         <div className="divide-y divide-slate-100">
            {[
               { name: 'Q3 Financial Summary.pdf', date: 'Oct 01, 2023', type: 'Finance' },
               { name: 'Monthly Compliance Audit.csv', date: 'Sep 28, 2023', type: 'Compliance' },
               { name: 'Staff Attendance Log.pdf', date: 'Sep 25, 2023', type: 'HR' },
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
                  <button className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-sm font-medium">
                     Download
                  </button>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Reports;