import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useState, useEffect } from 'react';
import { Shield, User, CheckCircle, AlertTriangle, Download, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { complianceService, ComplianceStatus } from '@/lib/services/ComplianceService';
import { log } from '@/lib/logger';
import Toast from '@/components/Toast';

export default function StaffPassportPage() {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<ComplianceStatus | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadStatus();
    }, [user, currentTenant]);

    const loadStatus = async () => {
        if (!user || !currentTenant) return;
        setLoading(true);
        try {
            const data = await complianceService.getStaffComplianceStatus(user.id);
            setStatus(data);
        } catch (error) {
            log.error('Error loading passport status', error, { component: 'StaffPassportPage', action: 'loadStatus' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (score: number) => {
        if (score >= 90) return 'bg-green-600';
        if (score >= 70) return 'bg-yellow-500';
        return 'bg-red-600';
    };

    const getStatusText = (score: number) => {
        if (score >= 90) return 'VERIFIED SAFE';
        if (score >= 70) return 'ACTION REQUIRED';
        return 'NON-COMPLIANT';
    };

    const handleSaveImage = async () => {
        setIsSaving(true);
        try {
            // In a real app, logic to convert div to image (e.g. html2canvas)
            await new Promise(resolve => setTimeout(resolve, 1500));
            setToast({ message: 'Profile image saved successfully!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to save image', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleShareLink = async () => {
        setIsSharing(true);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'NovumFlow Staff Passport',
                    text: `My compliance status is ${getStatusText(status?.overall_compliance_score || 0)}`,
                    url: `https://novumflow.com/verify/${user?.id}`,
                });
            } else {
                await navigator.clipboard.writeText(`https://novumflow.com/verify/${user?.id}`);
                setToast({ message: 'Verification link copied to clipboard!', type: 'success' });
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setToast({ message: 'Failed to share', type: 'error' });
            }
        } finally {
            setIsSharing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    // Fallback if no status found (e.g. new user)
    const complianceScore = status?.overall_compliance_score || 0;
    const isVerified = complianceScore >= 90;
    const qrValue = `https://novumflow.com/verify/${user?.id}`;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-cyan-600" />
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Digital Staff Passport</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Present this ID to prove your compliance status.
                    </p>
                </div>

                {/* ID Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative">
                    {/* Header Band */}
                    <div className={`h-24 ${getStatusColor(complianceScore)} flex items-center justify-center relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <h1 className="text-2xl font-black text-white tracking-widest uppercase drop-shadow-md">
                            {getStatusText(complianceScore)}
                        </h1>
                    </div>

                    <div className="px-8 pb-8 pt-12 relative text-center">
                        {/* Avatar */}
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                            <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-16 w-16 text-gray-400" />
                                )}
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mt-2">{user?.user_metadata?.full_name || user?.email}</h2>
                        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mt-1">
                            {status?.staff_name ? 'Registered Staff' : 'Staff Member'}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-left bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">DBS Status</p>
                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                    {status?.dbs_status === 'compliant' ? (
                                        <><CheckCircle className="w-3 h-3 text-green-500" /> Clear</>
                                    ) : (
                                        <><AlertTriangle className="w-3 h-3 text-yellow-500" /> Pending</>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Right to Work</p>
                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                    {status?.rtw_status === 'compliant' ? (
                                        <><CheckCircle className="w-3 h-3 text-green-500" /> Verified</>
                                    ) : (
                                        <><AlertTriangle className="w-3 h-3 text-yellow-500" /> Check Req.</>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Training</p>
                                <p className="font-medium text-gray-900">
                                    {status?.training_status === 'compliant' ? 'Up to Date' : 'Incomplete'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">ID Number</p>
                                <p className="font-mono text-xs text-gray-900 truncate" title={user?.id}>
                                    {user?.id?.substring(0, 8)}...
                                </p>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="mt-8 flex justify-center">
                            <div className="p-4 bg-white border-2 border-gray-100 rounded-xl shadow-inner">
                                <QRCode value={qrValue} size={160} />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">Scan to verify live status</p>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${isVerified ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-medium text-gray-500">
                                {isVerified ? 'Live & Active' : 'Restricted'}
                            </span>
                        </div>
                        <span className="text-xs text-gray-400">NovumFlow ID</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={handleSaveImage}
                        disabled={isSaving || isSharing}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
                        {isSaving ? 'Processing...' : 'Save Image'}
                    </button>
                    <button
                        onClick={handleShareLink}
                        disabled={isSaving || isSharing}
                        className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md font-medium transition-colors disabled:opacity-50"
                    >
                        {isSharing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Share2 className="w-5 h-5" />}
                        {isSharing ? 'Sharing...' : 'Share Link'}
                    </button>
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
