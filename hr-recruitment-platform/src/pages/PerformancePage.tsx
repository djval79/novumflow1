import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  Target,
  Award,
  Settings,
  BarChart,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Edit,
  Trash2,
  Eye,
  PlayCircle,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import PerformanceReports from '@/components/PerformanceReports';
import AddReviewTypeModal from '@/components/AddReviewTypeModal';
import CreateReviewModal from '@/components/CreateReviewModal';
import AddGoalModal from '@/components/AddGoalModal';
import AddKPIModal from '@/components/AddKPIModal';
import AddCriteriaModal from '@/components/AddCriteriaModal';
import RateModal from '@/components/RateModal';
import ViewReviewModal from '@/components/ViewReviewModal';

type TabType = 'reviews' | 'goals' | 'kpis' | 'settings' | 'reports';

interface ReviewType {
  id: string;
  name: string;
  description: string;
  frequency: string;
  auto_schedule: boolean;
  requires_self_assessment: boolean;
  requires_manager_review: boolean;
  requires_peer_review: boolean;
}

interface Review {
  id: string;
  review_type_id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  review_due_date: string;
  status: string;
  overall_rating: number;
  review_type: { name: string; frequency: string };
  employee: { first_name: string; last_name: string; email: string; department: string };
}

interface Goal {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  goal_type: string;
  target_date: string;
  status: string;
  progress_percentage: number;
  priority: string;
  employee: { first_name: string; last_name: string };
}

interface KPIValue {
  id: string;
  kpi_definition_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  target_value: number;
  actual_value: number;
  variance: number;
  status: string;
  kpi: { name: string; category: string; measurement_unit: string };
  employee: { first_name: string; last_name: string };
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'goals' | 'kpis' | 'settings' | 'reports'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpiValues, setKpiValues] = useState<KPIValue[]>([]);
  const [reviewTypes, setReviewTypes] = useState<ReviewType[]>([]);
  const [kpiDefinitions, setKpiDefinitions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { user, profile } = useAuth();

  // Modal states
  const [showAddReviewTypeModal, setShowAddReviewTypeModal] = useState(false);
  const [showCreateReviewModal, setShowCreateReviewModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddKPIModal, setShowAddKPIModal] = useState(false);
  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showViewReviewModal, setShowViewReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const userRole = profile?.role;
  const isAdmin = ['admin', 'hr_manager', 'hr manager'].includes(userRole?.toLowerCase() || '');

  useEffect(() => {
    loadData();
    loadSupportingData();
  }, [activeTab]);

  async function loadSupportingData() {
    try {
      // Load review types
      const { data: reviewTypesData } = await supabase
        .from('performance_review_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      setReviewTypes(reviewTypesData || []);

      // Load KPI definitions
      const { data: kpiDefsData } = await supabase
        .from('kpi_definitions')
        .select('*')
        .eq('is_active', true)
        .order('category');
      setKpiDefinitions(kpiDefsData || []);

      // Load employees
      const { data: empData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, department, position')
        .eq('status', 'active')
        .order('first_name');
      setEmployees(empData || []);
    } catch (error) {
      console.error('Error loading supporting data:', error);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      switch (activeTab) {
        case 'reviews':
          const reviewResponse = await fetch(
            `${supabaseUrl}/functions/v1/performance-crud`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                action: 'list',
                entity: 'reviews',
                filters: statusFilter !== 'all' ? { status: statusFilter } : {}
              }),
            }
          );
          const reviewData = await reviewResponse.json();
          setReviews(Array.isArray(reviewData) ? reviewData : []);
          break;

        case 'goals':
          const goalResponse = await fetch(
            `${supabaseUrl}/functions/v1/performance-crud`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                action: 'list',
                entity: 'goals',
                filters: statusFilter !== 'all' ? { status: statusFilter } : {}
              }),
            }
          );
          const goalData = await goalResponse.json();
          setGoals(Array.isArray(goalData) ? goalData : []);
          break;

        case 'kpis':
          const kpiDefResponse = await fetch(
            `${supabaseUrl}/functions/v1/performance-crud`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                action: 'list',
                entity: 'kpi_definitions',
              }),
            }
          );
          const kpiDefData = await kpiDefResponse.json();
          setKpiDefinitions(Array.isArray(kpiDefData) ? kpiDefData : []);
          break;


        case 'settings':
          const typeResponse = await fetch(
            `${supabaseUrl}/functions/v1/performance-crud`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                action: 'list',
                entity: 'performance_review_types',
              }),
            }
          );
          const typeData = await typeResponse.json();
          setReviewTypes(Array.isArray(typeData) ? typeData : []);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoScheduleReviews() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/performance-crud`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'auto_schedule',
            entity: 'reviews',
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setToast({
        message: `Successfully scheduled ${result.count} review(s)`,
        type: 'success'
      });
      loadData();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      on_track: 'bg-green-100 text-green-800',
      at_risk: 'bg-orange-100 text-orange-800',
      achieved: 'bg-purple-100 text-purple-800',
      not_achieved: 'bg-red-100 text-red-800',
      on_target: 'bg-green-100 text-green-800',
      below_target: 'bg-yellow-100 text-yellow-800',
      needs_attention: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const filteredReviews = reviews.filter(review =>
    searchTerm === '' ||
    review.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.review_type?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGoals = goals.filter(goal =>
    searchTerm === '' ||
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredKPIs = kpiValues.filter(kpi =>
    searchTerm === '' ||
    kpi.kpi?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kpi.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'reviews', label: 'Performance Reviews', icon: Award },
    { id: 'goals', label: 'Goals & Objectives', icon: Target },
    { id: 'kpis', label: 'KPIs', icon: TrendingUp },
    { id: 'settings', label: 'Review Settings', icon: Settings },
    { id: 'reports', label: 'Reports', icon: BarChart },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track reviews, goals, and KPIs across your organization
              </p>
            </div>
            {isAdmin && activeTab === 'reviews' && (
              <button
                onClick={handleAutoScheduleReviews}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Auto-Schedule Reviews
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className={`${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Search and Filters */}
        {activeTab !== 'reports' && (
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {activeTab !== 'settings' && (
              <div className="ml-4 flex items-center space-x-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  {activeTab === 'reviews' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </>
                  )}
                  {activeTab === 'goals' && (
                    <>
                      <option value="active">Active</option>
                      <option value="on_track">On Track</option>
                      <option value="at_risk">At Risk</option>
                      <option value="achieved">Achieved</option>
                      <option value="not_achieved">Not Achieved</option>
                    </>
                  )}
                </select>

                {isAdmin && (
                  <button
                    onClick={() => {
                      if (activeTab === 'reviews') setShowCreateReviewModal(true);
                      if (activeTab === 'goals') setShowAddGoalModal(true);
                      if (activeTab === 'kpis') setShowAddKPIModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {review.employee?.first_name} {review.employee?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{review.employee?.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{review.review_type?.name}</div>
                        <div className="text-sm text-gray-500">{review.review_type?.frequency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(review.review_period_start), 'MMM d, yyyy')} -<br />
                        {format(new Date(review.review_period_end), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(review.review_due_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(review.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.overall_rating ? (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {review.overall_rating.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not rated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedItem(review);
                            setShowViewReviewModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {review.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedItem(review);
                              setShowRateModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <Star className="h-5 w-5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {/* handle delete */ }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No reviews found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                Loading...
              </div>
            ) : filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => (
                <div key={goal.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Target className="h-6 w-6 text-indigo-600" />
                          <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                          {getPriorityBadge(goal.priority)}
                          {getStatusBadge(goal.status)}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{goal.description}</p>
                        <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {goal.employee?.first_name} {goal.employee?.last_name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                          </span>
                          <span className="capitalize">{goal.goal_type} goal</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => {/* handle edit */ }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {/* handle delete */ }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{goal.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${goal.progress_percentage >= 75
                            ? 'bg-green-600'
                            : goal.progress_percentage >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                          style={{ width: `${goal.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                No goals found
              </div>
            )}
          </div>
        )}

        {/* KPIs Tab */}
        {activeTab === 'kpis' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KPI Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee/Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredKPIs.length > 0 ? (
                  filteredKPIs.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{kpi.kpi?.name}</div>
                        <div className="text-sm text-gray-500">{kpi.kpi?.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kpi.employee ? (
                          `${kpi.employee.first_name} ${kpi.employee.last_name}`
                        ) : (
                          'Department-wide'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(kpi.period_start), 'MMM yyyy')} -<br />
                        {format(new Date(kpi.period_end), 'MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kpi.target_value} {kpi.kpi?.measurement_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {kpi.actual_value} {kpi.kpi?.measurement_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${kpi.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.variance >= 0 ? '+' : ''}{kpi.variance}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(kpi.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {/* handle edit */ }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {/* handle delete */ }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No KPI values found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {reviewTypes.map((reviewType) => (
              <div key={reviewType.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Award className="h-6 w-6 text-indigo-600" />
                        <h3 className="text-lg font-medium text-gray-900">{reviewType.name}</h3>
                        {reviewType.auto_schedule && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Auto-scheduled
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{reviewType.description}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="capitalize">{reviewType.frequency}</span>
                        {reviewType.requires_self_assessment && <span>• Self-assessment</span>}
                        {reviewType.requires_manager_review && <span>• Manager review</span>}
                        {reviewType.requires_peer_review && <span>• Peer review</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(reviewType);
                            setShowAddCriteriaModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {/* handle edit */ }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {/* handle delete */ }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <PerformanceReports />
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modals */}
      <AddReviewTypeModal
        isOpen={showAddReviewTypeModal}
        onClose={() => setShowAddReviewTypeModal(false)}
        onSuccess={() => {
          loadSupportingData();
          setToast({ message: 'Review type added successfully', type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      <CreateReviewModal
        isOpen={showCreateReviewModal}
        onClose={() => setShowCreateReviewModal(false)}
        onSuccess={() => {
          loadData();
          setToast({ message: 'Review created successfully', type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      <AddGoalModal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        onSuccess={() => {
          loadData();
          setToast({ message: 'Goal added successfully', type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      <AddKPIModal
        isOpen={showAddKPIModal}
        onClose={() => setShowAddKPIModal(false)}
        onSuccess={() => {
          loadData();
          setToast({ message: 'KPI target added successfully', type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {selectedItem && (
        <>
          <AddCriteriaModal
            isOpen={showAddCriteriaModal}
            onClose={() => {
              setShowAddCriteriaModal(false);
              setSelectedItem(null);
            }}
            onSuccess={() => {
              setToast({ message: 'Criteria added successfully', type: 'success' });
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
            reviewType={selectedItem}
          />

          <RateModal
            isOpen={showRateModal}
            onClose={() => {
              setShowRateModal(false);
              setSelectedItem(null);
            }}
            onSuccess={() => {
              loadData();
              setToast({ message: 'Rating submitted successfully', type: 'success' });
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
            review={selectedItem}
          />

          <ViewReviewModal
            isOpen={showViewReviewModal}
            onClose={() => {
              setShowViewReviewModal(false);
              setSelectedItem(null);
            }}
            review={selectedItem}
          />
        </>
      )}
    </div>
  );
}
