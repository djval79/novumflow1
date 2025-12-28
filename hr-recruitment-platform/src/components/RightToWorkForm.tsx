import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { rtwService, DocumentType, RTWValidationResult, RTW_CRITICAL_DATES } from '@/lib/services/RightToWorkService';
import { useTenant } from '@/contexts/TenantContext';
import { Upload, CheckCircle, AlertTriangle, Loader2, XCircle, ExternalLink, Info, Shield, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

interface RightToWorkFormData {
    staff_name: string;
    document_type: DocumentType;
    document_number: string;
    nationality: string;
    visa_type?: string;
    visa_expiry?: string;
    share_code?: string;
    dob?: string;
    check_date: string;
    notes?: string;
    document_file?: FileList;
}

interface RightToWorkFormProps {
    employeeId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function RightToWorkForm({ employeeId, onSuccess, onCancel }: RightToWorkFormProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [validationResult, setValidationResult] = useState<RTWValidationResult | null>(null);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RightToWorkFormData>({
        defaultValues: {
            check_date: new Date().toISOString().split('T')[0]
        }
    });

    const documentType = watch('document_type');
    const shareCode = watch('share_code');
    const nationality = watch('nationality');
    const dob = watch('dob');

    // Real-time validation when document type changes
    useEffect(() => {
        if (documentType) {
            const validation = rtwService.validateDocumentType(documentType as DocumentType);
            setValidationResult(validation);
        } else {
            setValidationResult(null);
        }
    }, [documentType]);

    // Check if online verification is required
    const requiresOnlineVerification = nationality && documentType
        ? rtwService.requiresOnlineVerification(nationality, documentType as DocumentType)
        : false;

    const handleVerifyShareCode = async () => {
        if (!shareCode || !dob) {
            alert('Please enter both the share code and date of birth to verify.');
            return;
        }
        setVerifying(true);
        setVerificationResult(null);
        try {
            const result = await rtwService.verifyShareCode(shareCode, dob);
            setVerificationResult(result);
            if (result.valid && result.details) {
                setValue('staff_name', result.details.name);
                if (result.details.expiryDate) {
                    setValue('visa_expiry', result.details.expiryDate);
                }
            }
        } catch (error) {
            log.error('Verification failed', error, { component: 'RightToWorkForm', action: 'handleVerifyShareCode' });
            setVerificationResult({ valid: false, error: 'Verification service unavailable' });
        } finally {
            setVerifying(false);
        }
    };

    const onSubmit = async (data: RightToWorkFormData) => {
        if (!currentTenant) return;

        // Pre-submission validation
        if (validationResult && !validationResult.canProceed) {
            alert('Cannot submit: This document type is not valid for Right to Work checks. Please read the error messages above.');
            return;
        }

        setLoading(true);
        try {
            let documentUrl = '';

            if (data.document_file && data.document_file.length > 0) {
                const file = data.document_file[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `rtw-documents/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('compliance-docs')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;
                documentUrl = filePath;
            }

            const { check, validation } = await rtwService.addCheck({
                tenant_id: currentTenant.id,
                employee_id: employeeId,
                staff_name: data.staff_name,
                document_type: data.document_type,
                document_number: data.document_number,
                nationality: data.nationality,
                visa_type: data.visa_type,
                visa_expiry: data.visa_expiry || undefined,
                share_code: data.share_code,
                share_code_verified: verificationResult?.valid || false,
                share_code_verified_at: verificationResult?.verifiedAt,
                check_date: data.check_date,
                status: verificationResult?.valid ? 'verified' : 'pending_verification',
                document_url: documentUrl,
                notes: data.notes
            });

            if (!check) {
                alert(`Failed to save RTW check:\n${validation.errors.join('\n')}`);
                return;
            }

            // Show warnings if any
            if (validation.warnings.length > 0) {
                alert(`RTW Check saved successfully.\n\n⚠️ Important Reminders:\n${validation.warnings.join('\n')}`);
            }

            onSuccess();
        } catch (error) {
            log.error('Error submitting RTW check', error, { component: 'RightToWorkForm', action: 'onSubmit' });
            alert('Failed to submit check. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Check if current date is past BRP invalid date
    const isBRPInvalid = new Date() >= RTW_CRITICAL_DATES.BRP_INVALID_DATE;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-cyan-600 to-blue-600">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Right to Work Check</h2>
                    </div>
                    <button onClick={onCancel} className="text-white/80 hover:text-white text-2xl">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* CRITICAL: Home Office 2024/2025 Update Banner */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-900 text-lg">🚨 Critical: 2024-2025 Right to Work Changes</h4>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        <span className="text-amber-800"><strong>BRPs are NO LONGER VALID</strong> since 31 October 2024</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-amber-800"><strong>eVisas are MANDATORY</strong> – use online share code verification</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                        <span className="text-amber-800">Fines up to <strong>£60,000 per illegal worker</strong></span>
                                    </div>
                                </div>
                                <a
                                    href="https://www.gov.uk/view-right-to-work"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Home Office Online Checking Service
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {validationResult && validationResult.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-800">Cannot Proceed</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-red-700">
                                        {validationResult.errors.map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                    </ul>
                                    {validationResult.recommendedAction && (
                                        <p className="mt-3 text-sm text-red-800 font-medium bg-red-100 p-2 rounded">
                                            📋 {validationResult.recommendedAction}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Validation Warnings */}
                    {validationResult && validationResult.warnings.length > 0 && validationResult.canProceed && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-800">Important Reminders</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                                        {validationResult.warnings.map((warning, idx) => (
                                            <li key={idx}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Document Type */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                            <select
                                {...register('document_type', { required: 'Document type is required' })}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 py-2.5"
                            >
                                <option value="">Select Document Type</option>
                                <optgroup label="🇬🇧 British/Irish Citizens (Unrestricted Right to Work)">
                                    <option value="passport_uk">UK Passport (valid or expired)</option>
                                    <option value="passport_irish">Irish Passport</option>
                                    <option value="birth_certificate_ni_number">UK Birth Certificate + NI Number Document</option>
                                </optgroup>
                                <optgroup label="✅ eVisa Holders (RECOMMENDED - Online Verification)">
                                    <option value="share_code">🌐 Online Share Code (MANDATORY for most non-UK workers)</option>
                                </optgroup>
                                <optgroup label="📄 Temporary/Transitional Documents">
                                    <option value="passport_non_uk">Non-UK Passport with 90-day Vignette (requires follow-up)</option>
                                    <option value="frontier_worker_permit">Frontier Worker Permit</option>
                                    <option value="certificate_of_application">Certificate of Application (time-limited)</option>
                                </optgroup>
                                <optgroup label="❌ NO LONGER VALID (from 31 Oct 2024)">
                                    <option value="biometric_residence_permit" disabled={isBRPInvalid}>
                                        {isBRPInvalid ? '🚫 Biometric Residence Permit (BRP) - BLOCKED' : 'Biometric Residence Permit (BRP)'}
                                    </option>
                                </optgroup>
                                <optgroup label="Other">
                                    <option value="other">Other Acceptable Document</option>
                                </optgroup>
                            </select>
                            {errors.document_type && <p className="text-red-500 text-xs mt-1">{errors.document_type.message}</p>}
                        </div>

                        {/* Share Code Verification Section */}
                        {documentType === 'share_code' && (
                            <div className="md:col-span-2 bg-blue-50 p-5 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Online Share Code Verification
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-1">Share Code *</label>
                                        <input
                                            type="text"
                                            {...register('share_code', { required: documentType === 'share_code' })}
                                            className="block w-full rounded-lg border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="W12-345-678"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-1">Date of Birth *</label>
                                        <input
                                            type="date"
                                            {...register('dob')}
                                            className="block w-full rounded-lg border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={handleVerifyShareCode}
                                            disabled={verifying || !shareCode}
                                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                                        >
                                            {verifying ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Verify Code
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Verification Result */}
                                {verificationResult && (
                                    <div className={`mt-4 p-4 rounded-lg ${verificationResult.valid ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                                        {verificationResult.valid ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-green-800 font-semibold">
                                                    <CheckCircle className="w-5 h-5" />
                                                    Share Code Verified Successfully
                                                </div>
                                                {verificationResult.details && (
                                                    <div className="text-sm text-green-700 grid grid-cols-2 gap-2 mt-2">
                                                        <div><strong>Name:</strong> {verificationResult.details.name}</div>
                                                        <div><strong>Immigration Status:</strong> {verificationResult.details.immigrationStatus}</div>
                                                        <div><strong>Right to Work:</strong> {verificationResult.details.rightToWork}</div>
                                                        <div><strong>Expires:</strong> {verificationResult.details.expiryDate || 'N/A'}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-800">
                                                <XCircle className="w-5 h-5" />
                                                <span>{verificationResult.error || 'Verification failed. Please check the code and try again.'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Staff Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name *</label>
                            <input
                                type="text"
                                {...register('staff_name', { required: 'Staff name is required' })}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                            {errors.staff_name && <p className="text-red-500 text-xs mt-1">{errors.staff_name.message}</p>}
                        </div>

                        {/* Nationality */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                            <input
                                type="text"
                                {...register('nationality', { required: 'Nationality is required' })}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                            {requiresOnlineVerification && (
                                <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    Online verification is recommended for this nationality
                                </p>
                            )}
                        </div>

                        {/* Document Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                            <input
                                type="text"
                                {...register('document_number')}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Check Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Check Date *
                            </label>
                            <input
                                type="date"
                                {...register('check_date', { required: 'Check date is required' })}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Visa Details - shown for non-UK documents */}
                        {documentType && !['passport_uk', 'passport_irish', 'birth_certificate_ni_number'].includes(documentType) && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Visa/Permit Type</label>
                                    <input
                                        type="text"
                                        {...register('visa_type')}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                        placeholder="e.g., Skilled Worker, Student"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permission Expiry Date</label>
                                    <input
                                        type="date"
                                        {...register('visa_expiry')}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                    />
                                </div>
                            </>
                        )}

                        {/* Document Upload */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document Evidence</label>
                            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-cyan-400 transition-colors">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                                            <span>Upload a file</span>
                                            <input type="file" className="sr-only" {...register('document_file')} accept=".pdf,.png,.jpg,.jpeg" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                {...register('notes')}
                                rows={3}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                placeholder="Any additional notes about this RTW check..."
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (validationResult && !validationResult.canProceed)}
                            className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Shield className="w-4 h-4" />
                            Save RTW Check
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

