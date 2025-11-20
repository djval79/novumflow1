import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AddReviewTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function AddReviewTypeModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AddReviewTypeModalProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'annual',
    auto_schedule: false,
    schedule_offset_days: 365,
    trigger_event: 'anniversary',
    duration_days: 14,
    requires_self_assessment: true,
    requires_manager_review: true,
    requires_peer_review: false,
    peer_review_count: 0,
    allow_skip_level_review: false,
    rating_scale_type: '1-5',
    passing_threshold: 3.0,
    notification_template: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/performance-crud`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'create',
            entity: 'review_types',
            data: formData,
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        frequency: 'annual',
        auto_schedule: false,
        schedule_offset_days: 365,
        trigger_event: 'anniversary',
        duration_days: 14,
        requires_self_assessment: true,
        requires_manager_review: true,
        requires_peer_review: false,
        peer_review_count: 0,
        allow_skip_level_review: false,
        rating_scale_type: '1-5',
        passing_threshold: 3.0,
        notification_template: '',
      });
    } catch (error: any) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Review Type">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Review Type Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., Annual Performance Review"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="one-time">One-Time</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annual">Semi-Annual</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rating Scale *
            </label>
            <select
              value={formData.rating_scale_type}
              onChange={(e) => setFormData({ ...formData, rating_scale_type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="1-5">1-5 Scale</option>
              <option value="1-10">1-10 Scale</option>
              <option value="A-F">A-F Grade</option>
              <option value="custom">Custom</option>
              <option value="none">No Rating</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Auto-Scheduling</h4>
          
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={formData.auto_schedule}
              onChange={(e) => setFormData({ ...formData, auto_schedule: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable automatic scheduling
            </label>
          </div>

          {formData.auto_schedule && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trigger Event
                  </label>
                  <select
                    value={formData.trigger_event}
                    onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="hire_date">After Hire Date</option>
                    <option value="anniversary">Work Anniversary</option>
                    <option value="last_review">After Last Review</option>
                    <option value="end_of_probation">End of Probation</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Schedule After (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.schedule_offset_days}
                    onChange={(e) => setFormData({ ...formData, schedule_offset_days: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  Review Period Duration (Days)
                </label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  How many days the review stays open for completion
                </p>
              </div>
            </>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Review Participants</h4>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_self_assessment}
                onChange={(e) => setFormData({ ...formData, requires_self_assessment: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require self-assessment
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_manager_review}
                onChange={(e) => setFormData({ ...formData, requires_manager_review: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require manager review
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_peer_review}
                onChange={(e) => setFormData({ ...formData, requires_peer_review: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require peer review
              </label>
            </div>

            {formData.requires_peer_review && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700">
                  Number of Peer Reviewers
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.peer_review_count}
                  onChange={(e) => setFormData({ ...formData, peer_review_count: parseInt(e.target.value) })}
                  className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allow_skip_level_review}
                onChange={(e) => setFormData({ ...formData, allow_skip_level_review: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Allow skip-level review (manager's manager)
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Review Type'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
