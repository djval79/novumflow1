import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  job?: any; // Optional job for editing
}

export default function AddJobModal({ isOpen, onClose, onSuccess, onError, job }: AddJobModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_title: '',
    department: '',
    location: '',
    employment_type: 'full_time',
    salary_range_min: '',
    salary_range_max: '',
    job_description: '',
    requirements: '',
    application_deadline: '',
    status: 'draft'
  });

  useEffect(() => {
    if (job) {
      setFormData({
        job_title: job.job_title || '',
        department: job.department || '',
        location: job.location || '',
        employment_type: job.employment_type || 'full_time',
        salary_range_min: job.salary_range_min ? job.salary_range_min.toString() : '',
        salary_range_max: job.salary_range_max ? job.salary_range_max.toString() : '',
        job_description: job.job_description || '',
        requirements: job.requirements || '',
        application_deadline: job.application_deadline ? job.application_deadline.split('T')[0] : '',
        status: job.status || 'draft'
      });
    } else {
      // Reset for new job
      setFormData({
        job_title: '',
        department: '',
        location: '',
        employment_type: 'full_time',
        salary_range_min: '',
        salary_range_max: '',
        job_description: '',
        requirements: '',
        application_deadline: '',
        status: 'draft'
      });
    }
  }, [job, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const payload = {
        ...formData,
        salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
        application_deadline: formData.application_deadline || null,
        posted_by: user?.id
      };

      let error;

      if (job) {
        // Update existing job
        const { error: updateError } = await supabase
          .from('job_postings')
          .update(payload)
          .eq('id', job.id);
        error = updateError;
      } else {
        // Create new job
        const { error: insertError } = await supabase
          .from('job_postings')
          .insert(payload);
        error = insertError;
      }

      if (error) {
        throw new Error(error.message || `Failed to ${job ? 'update' : 'create'} job posting`);
      }

      onSuccess();
      onClose();
      if (!job) {
        setFormData({
          job_title: '',
          department: '',
          location: '',
          employment_type: 'full_time',
          salary_range_min: '',
          salary_range_max: '',
          job_description: '',
          requirements: '',
          application_deadline: '',
          status: 'draft'
        });
      }
    } catch (error: any) {
      onError(error.message || `Failed to ${job ? 'update' : 'create'} job posting`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={job ? "Edit Job Posting" : "Create Job Posting"} maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Remote, New York, Hybrid"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
            <select
              value={formData.employment_type}
              onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range Min</label>
            <input
              type="number"
              step="1000"
              value={formData.salary_range_min}
              onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range Max</label>
            <input
              type="number"
              step="1000"
              value={formData.salary_range_max}
              onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
            <input
              type="date"
              value={formData.application_deadline}
              onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
          <textarea
            required
            rows={4}
            value={formData.job_description}
            onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requirements *</label>
          <textarea
            required
            rows={4}
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            placeholder="Enter each requirement on a new line"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? (job ? 'Updating...' : 'Creating...') : (job ? 'Update Job Posting' : 'Create Job Posting')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

