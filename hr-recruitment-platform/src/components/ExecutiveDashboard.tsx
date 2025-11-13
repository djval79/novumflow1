import React, { useState, useEffect } from 'react';
import * as Recharts from 'recharts';

// Re-export the components we need with proper typing
const {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} = Recharts;

// Custom Tooltip component with proper typing
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: any;
    name: string;
    payload: any;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => {
          if (formatter) {
            const [value, name] = formatter(entry.value, entry.name);
            return (
              <p key={`tooltip-${index}`} style={{ color: entry.color }}>
                {name}: {value}
              </p>
            );
          }
          return (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};
import { TrendingUp, TrendingDown, Users, Clock, DollarSign, Brain, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import { analyticsEngine } from '../lib/analyticsEngine';
import { workflowEngine } from '../lib/workflowEngine';

export default function ExecutiveDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [workflowStats, setWorkflowStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'recruitment' | 'workforce' | 'performance'>('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(loadRealTimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await analyticsEngine.generateExecutiveDashboard();
      const workflow = workflowEngine.getWorkflowAnalytics();
      
      setDashboardData(data);
      setWorkflowStats(workflow);
      await loadRealTimeData();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const metrics = await analyticsEngine.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
    } catch (error) {
      console.error('Failed to load real-time metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Executive Intelligence...</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, change, icon: Icon, trend, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon className={`w-6 h-6 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
      </div>
      {change && (
        <div className={`flex items-center mt-3 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          <span>{Math.abs(change)}% from last month</span>
        </div>
      )}
    </div>
  );

  const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 Executive HR Intelligence</h1>
            <p className="text-gray-600 mt-1">Real-time insights and predictive analytics</p>
          </div>
          {realTimeMetrics && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Live Data</span>
              </div>
              <div className="text-orange-600 font-medium">{realTimeMetrics.top_alert}</div>
            </div>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-6 mt-4">
          {[
            { id: 'overview', label: '📊 Overview', icon: BarChart },
            { id: 'recruitment', label: '🎯 Recruitment', icon: Users },
            { id: 'workforce', label: '🔮 Workforce Planning', icon: Target },
            { id: 'performance', label: '⚡ Performance', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Real-time Metrics Bar */}
        {realTimeMetrics && (
          <div className="grid grid-cols-6 gap-4 mb-6">
            <MetricCard
              title="Active Jobs"
              value={realTimeMetrics.active_jobs}
              icon={Target}
              trend="neutral"
            />
            <MetricCard
              title="Pending Interviews"
              value={realTimeMetrics.pending_interviews}
              icon={Clock}
              trend="neutral"
            />
            <MetricCard
              title="Applications Today"
              value={realTimeMetrics.applications_today}
              icon={Users}
              trend="up"
            />
            <MetricCard
              title="Offers Pending"
              value={realTimeMetrics.offers_pending}
              icon={CheckCircle}
              trend="neutral"
            />
            <MetricCard
              title="Hours Saved Today"
              value={realTimeMetrics.automation_savings_today}
              icon={Zap}
              trend="up"
              subtitle="From automation"
            />
            <MetricCard
              title="Workflow Automations"
              value={workflowStats?.active_rules || 0}
              icon={Brain}
              trend="up"
              subtitle={`${workflowStats?.automations_today || 0} executed today`}
            />
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6">
              <MetricCard
                title="Average Time to Hire"
                value={`${dashboardData.metrics.timeToHire.average_days} days`}
                change={-8}
                icon={Clock}
                trend="up"
              />
              <MetricCard
                title="Cost per Hire"
                value={`$${dashboardData.metrics.costPerHire.average_cost.toLocaleString()}`}
                change={-12}
                icon={DollarSign}
                trend="up"
              />
              <MetricCard
                title="Employee Retention"
                value={`${dashboardData.metrics.employeeRetention.overall_rate}%`}
                change={3}
                icon={Users}
                trend="up"
              />
              <MetricCard
                title="ROI on Hiring"
                value={`${dashboardData.metrics.costPerHire.roi_analysis.roi_percentage}%`}
                change={15}
                icon={TrendingUp}
                trend="up"
              />
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center mb-4">
                <Brain className="w-6 h-6 mr-2" />
                <h3 className="text-xl font-bold">🤖 AI Recommendations</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {dashboardData.recommendations.slice(0, 4).map((rec: string, index: number) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Time to Hire by Department */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time to Hire by Department</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dashboardData.metrics.timeToHire.by_department}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="days" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recruitment Source Effectiveness */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Source ROI</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.metrics.recruitmentEfficiency.source_effectiveness}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="hire_rate"
                      nameKey="source"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.metrics.recruitmentEfficiency.source_effectiveness.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recruitment' && dashboardData && (
          <div className="space-y-6">
            {/* Recruitment Funnel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Recruitment Funnel Optimization</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-blue-600">240</span>
                  </div>
                  <p className="text-sm text-gray-600">Applications</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-indigo-600">48</span>
                  </div>
                  <p className="text-sm text-gray-600">Interviews</p>
                  <p className="text-xs text-green-600">20% rate</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-purple-600">15</span>
                  </div>
                  <p className="text-sm text-gray-600">Offers</p>
                  <p className="text-xs text-green-600">31% rate</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-green-600">12</span>
                  </div>
                  <p className="text-sm text-gray-600">Hires</p>
                  <p className="text-xs text-green-600">80% acceptance</p>
                </div>
              </div>
            </div>

            {/* Source Performance */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Performing Sources</h3>
                <div className="space-y-3">
                  {dashboardData.metrics.recruitmentEfficiency.source_effectiveness
                    .sort((a: any, b: any) => b.hire_rate - a.hire_rate)
                    .map((source: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{source.source}</p>
                        <p className="text-sm text-gray-600">Cost per hire: ${source.cost}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{(source.hire_rate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Hire rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Predictors</h3>
                <div className="space-y-4">
                  {dashboardData.insights.top_performer_traits.map((trait: any, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{trait.trait}</span>
                        <span className="text-sm text-green-600">{(trait.correlation_strength * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${trait.correlation_strength * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{trait.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workforce' && dashboardData && (
          <div className="space-y-6">
            {/* Hiring Forecast */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔮 Hiring Forecast</h3>
              <div className="grid grid-cols-3 gap-4">
                {dashboardData.forecast.hiring_needs.map((dept: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{dept.department}</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">{dept.projected_need}</p>
                    <p className="text-sm text-gray-600">New hires needed</p>
                    <p className="text-xs text-gray-500 mt-1">{dept.timeline}</p>
                    <div className="mt-2">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        dept.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                        dept.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(dept.confidence * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical Skill Gaps</h3>
                <div className="space-y-4">
                  {dashboardData.forecast.skill_gaps.map((gap: any, index: number) => (
                    <div key={index} className="border-l-4 border-orange-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{gap.skill}</h4>
                          <p className="text-sm text-gray-600">{gap.training_recommendation}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          gap.gap_severity === 'critical' ? 'bg-red-100 text-red-800' :
                          gap.gap_severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          gap.gap_severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {gap.gap_severity}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Current: {gap.current_level}/10</span>
                          <span>Required: {gap.required_level}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${(gap.current_level / gap.required_level) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Impact</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Annual Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${dashboardData.forecast.budget_projection.current_cost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Projected Cost (with growth)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${dashboardData.forecast.budget_projection.projected_cost.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">💡 Savings Opportunities</h4>
                    {dashboardData.forecast.budget_projection.savings_opportunities.map((opp: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">{opp.area}</span>
                        <span className="text-sm font-medium text-green-600">
                          ${opp.potential_savings.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && dashboardData && (
          <div className="space-y-6">
            {/* Turnover Risk */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Turnover Risk Alert</h3>
              <div className="space-y-3">
                {dashboardData.metrics.employeeRetention.predicted_turnover.map((risk: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <div>
                      <p className="font-medium text-gray-900">Employee #{risk.employee_id}</p>
                      <p className="text-sm text-gray-600">Risk factors: {risk.factors.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        risk.risk_score > 0.7 ? 'bg-red-100 text-red-800' :
                        risk.risk_score > 0.4 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(risk.risk_score * 100).toFixed(0)}% risk
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Factors */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Engagement Drivers</h3>
                <div className="space-y-4">
                  {dashboardData.insights.engagement_factors.map((factor: any, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">{factor.factor}</h4>
                        <span className="text-lg font-bold text-indigo-600">{factor.impact_score}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {factor.actionable_insights.map((insight: string, i: number) => (
                          <div key={i} className="flex items-center">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Retention by Department</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dashboardData.metrics.retentionRates.by_department}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip 
                      content={<CustomTooltip formatter={(value: any) => [`${value}%`, 'Retention Rate']} />} 
                    />
                    <Bar dataKey="rate" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}