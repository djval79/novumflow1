/**
 * PerformancePage - Refactored Version
 * 
 * Uses the new component-based architecture with React Query hooks
 * Significantly reduced from ~900 lines to ~350 lines
 */

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
  PlayCircle,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';
import Toast from '@/components/Toast';
import PerformanceReports from '@/components/PerformanceReports';
import AddReviewTypeModal from '@/components/AddReviewTypeModal';
import CreateReviewModal from '@/components/CreateReviewModal';
import AddGoalModal from '@/components/AddGoalModal';
import AddKPIModal from '@/components/AddKPIModal';
import AddCriteriaModal from '@/components/AddCriteriaModal';
import RateModal from '@/components/RateModal';
import ViewReviewModal from '@/components/ViewReviewModal';
import { ReviewsTable, GoalsList, KPIsTable } from '@/components/performance';
import { PerformanceReview, PerformanceGoal, KPIDefinition } from '@/hooks';
import { log } from '@/lib/logger';

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

export default function PerformancePageRefactored() {
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Review types for settings tab (loaded separately)
  const [reviewTypes, setReviewTypes] = useState<ReviewType[]>([]);

  // Modal states
  const [showAddReviewTypeModal, setShowAddReviewTypeModal] = useState(false);
  const [showCreateReviewModal, setShowCreateReviewModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddKPIModal, setShowAddKPIModal] = useState(false);
  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showViewReviewModal, setShowViewReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { user, profile } = useAuth();
  const userRole = profile?.role;
  const isAdmin = ['admin', 'hr_manager', 'hr manager'].includes(userRole?.toLowerCase() || '');

  // Load review types for settings tab
  useEffect(() => {
    if (activeTab === 'settings') {
      loadReviewTypes();
    }
  }, [activeTab]);

  async function loadReviewTypes() {
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
            action: 'list',
            entity: 'performance_review_types',
          }),
        }
      );

      const data = await response.json();
      setReviewTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      log.error('Failed to load review types', { error });
      showError('Failed to load review types');
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

      showSuccess(`Successfully scheduled ${result.count} review(s)`);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Toast handlers
  const showSuccess = (message: string) => setToast({ message, type: 'success' });
  const showError = (message: string) => setToast({ message, type: 'error' });

  // Review handlers
  const handleViewReview = (review: PerformanceReview) => {
    setSelectedItem(review);
    setShowViewReviewModal(true);
  };

  const handleRateReview = (review: PerformanceReview) => {
    setSelectedItem(review);
    setShowRateModal(true);
  };

  // Goal handlers
  const handleEditGoal = (goal: PerformanceGoal) => {
    setSelectedItem(goal);
    setShowAddGoalModal(true);
  };

  // KPI handlers
  const handleEditKPI = (kpi: KPIDefinition) => {
    setSelectedItem(kpi);
    setShowAddKPIModal(true);
  };

  // Tab configuration
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
        {activeTab !== 'reports' && activeTab !== 'settings' && (
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
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <ReviewsTable
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            isAdmin={isAdmin}
            onAddNew={() => setShowCreateReviewModal(true)}
            onView={handleViewReview}
            onRate={handleRateReview}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <GoalsList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            isAdmin={isAdmin}
            onAddNew={() => setShowAddGoalModal(true)}
            onEdit={handleEditGoal}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {/* KPIs Tab */}
        {activeTab === 'kpis' && (
          <KPIsTable
            searchTerm={searchTerm}
            isAdmin={isAdmin}
            onAddNew={() => setShowAddKPIModal(true)}
            onEdit={handleEditKPI}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {/* Settings Tab - Review Types */}
        {activeTab === 'settings' && (
          <ReviewTypeSettings
            reviewTypes={reviewTypes}
            loading={loading}
            isAdmin={isAdmin}
            onAddCriteria={(reviewType) => {
              setSelectedItem(reviewType);
              setShowAddCriteriaModal(true);
            }}
          />
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
          loadReviewTypes();
          showSuccess('Review type added successfully');
        }}
        onError={showError}
      />

      <CreateReviewModal
        isOpen={showCreateReviewModal}
        onClose={() => setShowCreateReviewModal(false)}
        onSuccess={() => showSuccess('Review created successfully')}
        onError={showError}
      />

      <AddGoalModal
        isOpen={showAddGoalModal}
        onClose={() => {
          setShowAddGoalModal(false);
          setSelectedItem(null);
        }}
        onSuccess={() => showSuccess('Goal added successfully')}
        onError={showError}
      />

      <AddKPIModal
        isOpen={showAddKPIModal}
        onClose={() => {
          setShowAddKPIModal(false);
          setSelectedItem(null);
        }}
        onSuccess={() => showSuccess('KPI added successfully')}
        onError={showError}
      />

      {selectedItem && (
        <>
          <AddCriteriaModal
            isOpen={showAddCriteriaModal}
            onClose={() => {
              setShowAddCriteriaModal(false);
              setSelectedItem(null);
            }}
            onSuccess={() => showSuccess('Criteria added successfully')}
            onError={showError}
            reviewType={selectedItem}
          />

          <RateModal
            isOpen={showRateModal}
            onClose={() => {
              setShowRateModal(false);
              setSelectedItem(null);
            }}
            onSuccess={() => showSuccess('Rating submitted successfully')}
            onError={showError}
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

// Review Type Settings Component
interface ReviewTypeSettingsProps {
  reviewTypes: ReviewType[];
  loading: boolean;
  isAdmin: boolean;
  onAddCriteria: (reviewType: ReviewType) => void;
}

function ReviewTypeSettings({ reviewTypes, loading, isAdmin, onAddCriteria }: ReviewTypeSettingsProps) {


  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
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
                    onClick={() => onAddCriteria(reviewType)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Add Criteria"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {/* handle edit */ }}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {/* handle delete */ }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
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
  );
}
