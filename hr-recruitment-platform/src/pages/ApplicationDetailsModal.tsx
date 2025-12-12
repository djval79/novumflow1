/**
 * ApplicationDetailsModal Component
 * 
 * Displays detailed information about an application
 * Supports AI screening, document generation, and conversion to employee
 */

import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Application } from '@/hooks';

interface ApplicationDetailsModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onAiScreen: (app: Application) => void;
  onConvertToEmployee: (app: Application) => void;
  onGenerateDocument: (app: Application, templateId: string) => void;
}

export default function ApplicationDetailsModal({
  application,
  isOpen,
  onClose,
  onUpdate,
  onAiScreen,
  onConvertToEmployee,
  onGenerateDocument,
}: ApplicationDetailsModalProps) {
  const [notes, setNotes] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const { user } = useAuth();

  if (!isOpen || !application) return null;

  async function handleAddNote() {
    if (!notes.trim()) return;
    setAddingNote(true);

    const timestamp = new Date().toLocaleString();
    const newNote = `[${timestamp} - ${user?.email}] ${notes}\n\n`;
    const updatedNotes = (application.notes || '') + newNote;

    const { error } = await supabase
      .from('applications')
      .update({ notes: updatedNotes })
      .eq('id', application.id);

    if (!error) {
      setNotes('');
      onUpdate();
    }
    setAddingNote(false);
  }

  // Get job posting data (handles both naming conventions)
  const jobPosting = (application as any).job_postings;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {application.applicant_first_name} {application.applicant_last_name}
              </h3>
              <p className="text-gray-500">{application.applicant_email}</p>
              <p className="text-gray-500">{application.applicant_phone || 'No phone provided'}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {application.status}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Applied: {application.applied_at && format(new Date(application.applied_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Job Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Applied For</h4>
            <p className="text-gray-900 font-medium">{jobPosting?.job_title}</p>
            <p className="text-sm text-gray-500">
              {jobPosting?.department} • {jobPosting?.employment_type?.replace('_', ' ')}
            </p>
          </div>

          {/* AI Screening Results */}
          {(application.ai_score || application.ai_summary) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">AI Screening Results</h4>
              {application.ai_score && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-blue-900">{application.ai_score}/100</span>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${application.ai_score}%` }}
                    />
                  </div>
                </div>
              )}
              {application.ai_summary && (
                <p className="text-sm text-blue-700">{application.ai_summary}</p>
              )}
            </div>
          )}

          {/* Links & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {application.cv_url && (
              <a
                href={application.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                View CV
              </a>
            )}
            <button
              onClick={() => onAiScreen(application)}
              className="flex items-center justify-center p-3 border border-transparent rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
            >
              AI Screen
            </button>
            {application.status === 'Hired' && (
              <>
                <button
                  onClick={() => onConvertToEmployee(application)}
                  className="flex items-center justify-center p-3 border border-transparent rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
                >
                  Convert to Employee
                </button>
                <button
                  onClick={() => onGenerateDocument(application, '1')}
                  className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                >
                  Generate Offer Letter
                </button>
              </>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Notes & Activity
            </h4>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
              {application.notes || 'No notes yet.'}
            </div>

            <div className="flex gap-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                rows={2}
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !notes.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
