import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import FormRenderer from './FormBuilder/FormRenderer';
import { FormField } from './FormBuilder/FormBuilder';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function AddApplicationModal({ isOpen, onClose, onSuccess, onError }: AddApplicationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [basicInfo, setBasicInfo] = useState({
    applicant_first_name: '',
    applicant_last_name: '',
    applicant_email: '',
    applicant_phone: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadFormSchema();
      loadAvailableJobs();
    }
  }, [isOpen]);

  async function loadAvailableJobs() {
    const { data } = await supabase
      .from('job_postings')
      .select('id, job_title, status')
      .in('status', ['draft', 'active'])
      .order('created_at', { ascending: false });

    if (data) {
      setAvailableJobs(data);
    }
  }

  async function loadFormSchema() {
    // Load the active form template.
    const { data } = await supabase
      .from('form_templates')
      .select('schema')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data && data.schema) {
      setFormSchema(data.schema);
    }
  }

  async function uploadFile(file: File, bucket: string, category: string = 'other'): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `uploads/${category}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  }

  const handleFinalSubmit = async (dynamicData: Record<string, any>) => {
    if (!selectedPosition) {
      onError('Please select a position');
      return;
    }
    if (!basicInfo.applicant_first_name || !basicInfo.applicant_last_name || !basicInfo.applicant_email) {
      onError('Please fill in all required basic information');
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare Payload
      const payload: any = {
        job_posting_id: selectedJobId || null,
        position: selectedPosition,
        applicant_first_name: basicInfo.applicant_first_name,
        applicant_last_name: basicInfo.applicant_last_name,
        applicant_email: basicInfo.applicant_email,
        applicant_phone: basicInfo.applicant_phone,
        status: 'applied',
        custom_data: {}
      };

      // 2. Separate Files and Data
      const filesToUpload: { key: string; file: File; fieldSchema?: FormField }[] = [];
      const standardColumns = ['cv_url', 'cover_letter', 'portfolio_url', 'linkedin_url'];

      for (const [key, value] of Object.entries(dynamicData)) {
        if (value instanceof File) {
          // Single file
          const fieldSchema = formSchema.find(f => f.id === key);
          filesToUpload.push({ key, file: value, fieldSchema });
        } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
          // Multiple files
          const fieldSchema = formSchema.find(f => f.id === key);
          value.forEach((file: File) => {
            filesToUpload.push({ key, file, fieldSchema });
          });
        } else if (standardColumns.includes(key)) {
          payload[key] = value;
        } else {
          payload.custom_data[key] = value;
        }
      }

      // 3. Create Application Record using direct Supabase insert
      const { data: applicationData, error: insertError } = await supabase
        .from('applications')
        .insert(payload)
        .select()
        .single();

      if (insertError || !applicationData) {
        throw new Error(insertError?.message || 'Failed to create application');
      }

      const applicationId = applicationData.id;

      // 4. Upload Files and Save Metadata
      for (const { key, file, fieldSchema } of filesToUpload) {
        const category = fieldSchema?.documentCategory || 'other';
        const url = await uploadFile(file, 'applicant-cvs', category);
        if (url) {
          // If it's the CV, update the application record
          if (key === 'resume_url' || key === 'cv_url') {
            await supabase
              .from('applications')
              .update({ cv_url: url })
              .eq('id', applicationId);
          }

          // Save to application_documents
          const complianceTags = [];
          if (fieldSchema?.complianceType && fieldSchema.complianceType !== 'none') {
            if (fieldSchema.complianceType === 'both') {
              complianceTags.push('home_office', 'recruitment');
            } else {
              complianceTags.push(fieldSchema.complianceType);
            }
          }

          await supabase.from('application_documents').insert({
            application_id: applicationId,
            document_url: url,
            document_name: file.name,
            category: fieldSchema?.documentCategory || 'other',
            compliance_tags: complianceTags,
            uploaded_by: user?.id
          });
        }
      }

      onSuccess();
      onClose();
      setBasicInfo({
        applicant_first_name: '',
        applicant_last_name: '',
        applicant_email: '',
        applicant_phone: ''
      });
      setSelectedPosition('');

    } catch (error: any) {
      onError(error.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Application" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Job Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Posting</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">No specific job (general application)</option>
            {availableJobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.job_title} ({job.status})
              </option>
            ))}
          </select>
        </div>

        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position Applied For *</label>
          <select
            required
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Select Position</option>
            <option value="Live in Carer">Live in Carer</option>
            <option value="Carer">Carer</option>
            <option value="Senior Carer">Senior Carer</option>
            <option value="Support Worker">Support Worker</option>
            <option value="Care Coordinator">Care Coordinator</option>
            <option value="Manager">Manager</option>
            <option value="Deputy Manager">Deputy Manager</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Cleaner">Cleaner</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Basic Info (Hardcoded for consistency) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={basicInfo.applicant_first_name}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={basicInfo.applicant_last_name}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={basicInfo.applicant_email}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={basicInfo.applicant_phone}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Dynamic Form */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <FormRenderer
            schema={formSchema}
            onSubmit={handleFinalSubmit}
            submitLabel={loading ? 'Submitting...' : 'Submit Application'}
            loading={loading}
          />
        </div>
      </div>
    </Modal>
  );
}
