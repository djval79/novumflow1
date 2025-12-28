import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, CheckCircle, Clock, Send, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

interface Reference {
  id: string;
  application_id: string;
  ref_name: string;
  ref_email: string;
  ref_phone?: string;
  ref_company?: string;
  ref_position?: string;
  ref_relationship: string;
  verification_status: string;
  ref_score?: number;
  ref_rating?: string;
  ref_response?: string;
  verification_request_sent_at?: string;
  verification_received_at?: string;
}

interface ReferenceManagementProps {
  applicationId: string;
  applicantName: string;
}

export default function ReferenceManagement({ applicationId, applicantName }: ReferenceManagementProps) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    ref_name: '',
    ref_email: '',
    ref_phone: '',
    ref_company: '',
    ref_position: '',
    ref_relationship: ''
  });

  useEffect(() => {
    loadReferences();
  }, [applicationId]);

  async function loadReferences() {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      const { data } = await supabase.functions.invoke('reference-management', {
        body: {
          action: 'GET_BY_APPLICATION',
          data: { application_id: applicationId }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (data?.data) {
        setReferences(data.data);
      }
    } catch (error) {
      log.error('Error loading references', error, { component: 'ReferenceManagement', action: 'loadReferences' });
    }
  }

  async function handleAddReference(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('reference-management', {
        body: {
          action: 'CREATE',
          data: {
            application_id: applicationId,
            ...formData
          }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      setFormData({
        ref_name: '',
        ref_email: '',
        ref_phone: '',
        ref_company: '',
        ref_position: '',
        ref_relationship: ''
      });
      setShowAddForm(false);
      await loadReferences();
    } catch (error) {
      log.error('Error adding reference', error, { component: 'ReferenceManagement', action: 'handleAddReference' });
      alert('Failed to add reference');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestVerification(referenceId: string) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('reference-management', {
        body: {
          action: 'REQUEST_VERIFICATION',
          data: { reference_id: referenceId }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      alert('Verification request sent successfully');
      await loadReferences();
    } catch (error) {
      log.error('Error requesting verification', error, { component: 'ReferenceManagement', action: 'handleRequestVerification' });
      alert('Failed to send verification request');
    }
  }

  async function handleVerifyReference(referenceId: string) {
    const notes = prompt('Enter verification notes:');
    if (!notes) return;

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('reference-management', {
        body: {
          action: 'VERIFY',
          data: { reference_id: referenceId, notes }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      alert('Reference verified successfully');
      await loadReferences();
    } catch (error) {
      log.error('Error verifying reference', error, { component: 'ReferenceManagement', action: 'handleVerifyReference' });
      alert('Failed to verify reference');
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      requested: 'bg-blue-100 text-blue-800',
      received: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reference Management</h3>
          <p className="text-sm text-gray-600">Applicant: {applicantName}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Reference
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Add New Reference</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddReference} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ref_name}
                  onChange={(e) => setFormData({ ...formData, ref_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.ref_email}
                  onChange={(e) => setFormData({ ...formData, ref_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.ref_phone}
                  onChange={(e) => setFormData({ ...formData, ref_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.ref_company}
                  onChange={(e) => setFormData({ ...formData, ref_company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.ref_position}
                  onChange={(e) => setFormData({ ...formData, ref_position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  required
                  value={formData.ref_relationship}
                  onChange={(e) => setFormData({ ...formData, ref_relationship: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="manager">Manager</option>
                  <option value="colleague">Colleague</option>
                  <option value="client">Client</option>
                  <option value="professor">Professor</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Reference'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {references.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No references added yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-indigo-600 hover:text-indigo-700"
            >
              Add your first reference
            </button>
          </div>
        ) : (
          references.map((ref) => (
            <div key={ref.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{ref.ref_name}</h4>
                    {getStatusBadge(ref.verification_status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {ref.ref_email}
                    </div>
                    {ref.ref_phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {ref.ref_phone}
                      </div>
                    )}
                    {ref.ref_company && (
                      <div className="text-gray-600">
                        <span className="font-medium">Company:</span> {ref.ref_company}
                      </div>
                    )}
                    {ref.ref_position && (
                      <div className="text-gray-600">
                        <span className="font-medium">Position:</span> {ref.ref_position}
                      </div>
                    )}
                    <div className="text-gray-600">
                      <span className="font-medium">Relationship:</span> {ref.ref_relationship}
                    </div>
                    {ref.ref_score && (
                      <div className="text-gray-600">
                        <span className="font-medium">Score:</span> {ref.ref_score}/10
                      </div>
                    )}
                  </div>
                  {ref.ref_response && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{ref.ref_response}</p>
                    </div>
                  )}
                </div>
                <div className="ml-4 space-y-2">
                  {ref.verification_status === 'pending' && (
                    <button
                      onClick={() => handleRequestVerification(ref.id)}
                      className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Request
                    </button>
                  )}
                  {ref.verification_status === 'received' && (
                    <button
                      onClick={() => handleVerifyReference(ref.id)}
                      className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verify
                    </button>
                  )}
                  {ref.verification_status === 'verified' && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verified
                    </div>
                  )}
                  {ref.verification_status === 'requested' && (
                    <div className="flex items-center text-blue-600 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      Awaiting Response
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
