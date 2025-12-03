import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Define the Job interface based on your database schema
interface Job {
  id: string;
  job_title: string;
  department: string;
  location?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  salary_range_min?: number;
  salary_range_max?: number;
  job_description: string;
  requirements: string;
  application_deadline?: string;
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  posted_by?: string;
  created_at: string;
  updated_at: string;
  workflow_id?: string;
}

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  jobToEdit: Job | null; // Pass the job object when editing
}

export default function EditJobModal({ isOpen, onClose, onSuccess, onError, jobToEdit }: EditJobModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_title: '',
    department: '',
    location: '',
    employment_type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'intern',
    salary_range_min: '',
    salary_range_max: '',
    job_description: '',
    requirements: '',
    application_deadline: '',
    status: 'draft' as 'draft' | 'published' | 'closed' | 'cancelled'
  });

  // Effect to populate form data when jobToEdit changes or modal opens
  useEffect(() => {
    if (isOpen && jobToEdit) {
      setFormData({
        job_title: jobToEdit.job_title,
        department: jobToEdit.department,
        location: jobToEdit.location || '',
        employment_type: jobToEdit.employment_type || 'full_time',
        salary_range_min: jobToEdit.salary_range_min ? String(jobToEdit.salary_range_min) : '',
        salary_range_max: jobToEdit.salary_range_max ? String(jobToEdit.salary_range_max) : '',
        job_description: jobToEdit.job_description,
        requirements: jobToEdit.requirements,
        application_deadline: jobToEdit.application_deadline ? jobToEdit.application_deadline.split('T')[0] : '', // Format date for input type="date"
        status: jobToEdit.status || 'draft'
      });
    } else if (isOpen && !jobToEdit) {
      // Clear form if opening for new job (shouldn't happen for EditJobModal, but good practice)
      setFormData({
        job_title: '', department: '', location: '', employment_type: 'full_time',
        salary_range_min: '', salary_range_max: '', job_description: '', requirements: '',
        application_deadline: '', status: 'draft'
      });
    }
  }, [isOpen, jobToEdit]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const payload = {
        ...formData,
        salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
        application_deadline: formData.application_deadline || null,
      };

      let result;
      if (jobToEdit) {
        // Update existing job
        const { data, error } = await supabase
          .from('job_postings')
          .update(payload)
          .eq('id', jobToEdit.id)
          .select()
          .single();

        if (error) throw new Error(error.message || 'Failed to update job posting');
        result = { data };
      } else {
        // Create new job (should not happen in EditJobModal, but kept for robustness)
        const { data, error } = await supabase
          .from('job_postings')
          .insert({
            ...payload,
            posted_by: user.id
          })
          .select()
          .single();

        if (error) throw new Error(error.message || 'Failed to create job posting');
        result = { data };
      }

      if (result.data) {
        onSuccess();
        onClose();
      } else {
        throw new Error(jobToEdit ? 'Failed to update job posting' : 'Failed to create job posting');
      }
    } catch (error: any) {
      onError(error.message || (jobToEdit ? 'Failed to update job posting' : 'Failed to create job posting'));
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = jobToEdit ? "Edit Job Posting" : "Create Job Posting";
  const submitButtonText = jobToEdit ? "Update Job Posting" : "Create Job Posting";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-4xl">
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
              onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })}
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option> {/* Added for editing purposes */}
              <option value="cancelled">Cancelled</option> {/* Added for editing purposes */}
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
            {loading ? (jobToEdit ? 'Updating...' : 'Creating...') : submitButtonText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
