import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AddInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function AddInterviewModal({ isOpen, onClose, onSuccess, onError }: AddInterviewModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    application_id: '',
    interview_type: 'phone_screening',
    scheduled_date: '',
    scheduled_time: '',
    duration: 60,
    location: '',
    interviewer_notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    if (isOpen) {
      loadApplications();
    }
  }, [isOpen]);

  async function loadApplications() {
    const { data } = await supabase
      .from('applications')
      .select('id, applicant_first_name, applicant_last_name, job_posting_id, status')
      .in('status', ['shortlisted', 'screening', 'interview_scheduled'])
      .order('applied_at', { ascending: false });
    setApplications(data || []);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      
      // Ensure duration is a number
      const interviewData = {
        ...formData,
        duration: Number(formData.duration) || 60, // Default to 60 minutes if not provided
        scheduled_at: scheduledDateTime,
        created_by: user?.id,
        updated_by: user?.id
      };
      
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/interview-crud`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'create',
            data: {
              application_id: formData.application_id,
              interview_type: formData.interview_type,
              scheduled_date: scheduledDateTime,
              duration: formData.duration,
              location: formData.location,
              feedback: formData.interviewer_notes,
              status: formData.status
            }
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.data) {
        onSuccess();
        onClose();
        setFormData({
          application_id: '',
          interview_type: 'technical',
          scheduled_date: '',
          scheduled_time: '',
          location: '',
          interviewer_notes: '',
          status: 'scheduled'
        });
      } else {
        throw new Error(result.error?.message || 'Failed to schedule interview');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Interview">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Application *</label>
          <select
            required
            value={formData.application_id}
            onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Select Application</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.applicant_first_name} {app.applicant_last_name} - {app.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type *</label>
          <select
            required
            value={formData.interview_type}
            onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="phone_screening">Phone Screening</option>
            <option value="technical">Technical Interview</option>
            <option value="behavioral">Behavioral Interview</option>
            <option value="hr_round">HR Round</option>
            <option value="final">Final Round</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
            <input
              type="time"
              required
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Zoom Meeting, Office Room 301"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer Notes</label>
          <textarea
            rows={3}
            value={formData.interviewer_notes}
            onChange={(e) => setFormData({ ...formData, interviewer_notes: e.target.value })}
            placeholder="Any special instructions or notes for the interview..."
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
            {loading ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
