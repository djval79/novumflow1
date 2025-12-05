import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AddInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  interview?: any; // Optional interview for editing
}

export default function AddInterviewModal({ isOpen, onClose, onSuccess, onError, interview }: AddInterviewModalProps) {
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

  useEffect(() => {
    if (interview) {
      const date = new Date(interview.scheduled_date);
      setFormData({
        application_id: interview.application_id,
        interview_type: interview.interview_type,
        scheduled_date: date.toISOString().split('T')[0],
        scheduled_time: date.toTimeString().slice(0, 5),
        duration: interview.duration || 60,
        location: interview.location || '',
        interviewer_notes: interview.notes || '',
        status: interview.status
      });
    } else {
      setFormData({
        application_id: '',
        interview_type: 'phone_screening',
        scheduled_date: '',
        scheduled_time: '',
        duration: 60,
        location: '',
        interviewer_notes: '',
        status: 'scheduled'
      });
    }
  }, [interview, isOpen]);

  async function loadApplications() {
    const { data } = await supabase
      .from('applications')
      .select('id, applicant_first_name, applicant_last_name, email, job_posting_id, status')
      .in('status', ['shortlisted', 'screening', 'interview_scheduled'])
      .order('applied_at', { ascending: false });
    setApplications(data || []);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;

      const payload = {
        application_id: formData.application_id,
        interview_type: formData.interview_type,
        scheduled_date: scheduledDateTime,
        duration: Number(formData.duration) || 60,
        location: formData.location,
        notes: formData.interviewer_notes,
        status: formData.status,
        interviewer_id: user?.id,
        updated_at: new Date().toISOString()
      };

      let error;

      if (interview) {
        // Update existing interview
        const { error: updateError } = await supabase
          .from('interviews')
          .update(payload)
          .eq('id', interview.id);
        error = updateError;
      } else {
        // Create new interview
        const { error: insertError } = await supabase
          .from('interviews')
          .insert({
            ...payload,
            created_at: new Date().toISOString()
          });
        error = insertError;
      }

      if (error) {
        throw new Error(error.message || `Failed to ${interview ? 'update' : 'schedule'} interview`);
      }

      // Update application status if needed
      if (!interview && formData.status === 'scheduled') {
        await supabase
          .from('applications')
          .update({ status: 'interview_scheduled' })
          .eq('id', formData.application_id);

        // Send interview invitation email
        const selectedApp = applications.find(a => a.id === formData.application_id);
        if (selectedApp?.email) {
          await supabase.functions.invoke('send-interview-invite', {
            body: {
              candidateName: `${selectedApp.applicant_first_name} ${selectedApp.applicant_last_name}`,
              candidateEmail: selectedApp.email,
              interviewType: formData.interview_type,
              scheduledDate: formData.scheduled_date,
              scheduledTime: formData.scheduled_time,
              duration: formData.duration,
              location: formData.location,
              notes: formData.interviewer_notes
            }
          });
        }
      }

      onSuccess();
      onClose();
      if (!interview) {
        setFormData({
          application_id: '',
          interview_type: 'phone_screening',
          scheduled_date: '',
          scheduled_time: '',
          duration: 60,
          location: '',
          interviewer_notes: '',
          status: 'scheduled'
        });
      }
    } catch (error: any) {
      onError(error.message || `Failed to ${interview ? 'update' : 'schedule'} interview`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={interview ? "Edit Interview" : "Schedule Interview"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Application *</label>
          <select
            required
            value={formData.application_id}
            onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            disabled={!!interview} // Disable changing application when editing
          >
            <option value="">Select Application</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.applicant_first_name} {app.applicant_last_name} - {app.status}
              </option>
            ))}
            {interview && !applications.find(a => a.id === interview.application_id) && (
              <option value={interview.application_id}>Current Application</option>
            )}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
            <input
              type="number"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
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
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no_show">No Show</option>
            </select>
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
            {loading ? (interview ? 'Updating...' : 'Scheduling...') : (interview ? 'Update Interview' : 'Schedule Interview')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

