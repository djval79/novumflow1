import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { log } from '@/lib/logger';
import {
    Receipt,
    Plus,
    Search,
    Filter,
    Car,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Send,
    Calendar,
    Banknote,
    MapPin,
    X,
    ChevronRight,
    Camera,
    FileText as FileIcon
} from 'lucide-react';
import { format } from 'date-fns';
import Toast from '@/components/Toast';

interface ExpenseClaim {
    id: string;
    claim_reference: string;
    employee_id: string;
    total_amount: number;
    total_mileage: number;
    status: string;
    submitted_at: string;
    created_at: string;
    notes: string;
    employees?: { first_name: string; last_name: string };
}

interface ExpenseItem {
    id: string;
    claim_id: string;
    expense_date: string;
    description: string;
    amount: number;
    is_mileage: boolean;
    mileage_from: string;
    mileage_to: string;
    miles: number;
    receipt_url?: string;
}

interface ExpenseCategory {
    id: string;
    name: string;
    is_mileage: boolean;
    mileage_rate: number;
    requires_receipt: boolean;
}

export default function ExpenseManagementPage() {
    const { currentTenant } = useTenant();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [claims, setClaims] = useState<ExpenseClaim[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showNewClaimModal, setShowNewClaimModal] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeView, setActiveView] = useState<'claims' | 'mileage'>('claims');
    const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');

    // Stats
    const [stats, setStats] = useState({
        totalPending: 0,
        totalThisMonth: 0,
        awaitingApproval: 0,
        mileageThisMonth: 0
    });

    const isAdmin = ['admin', 'hr_manager', 'hr manager'].includes(profile?.role?.toLowerCase() || '');

    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant]);

    async function loadData() {
        setLoading(true);
        await Promise.all([loadClaims(), loadCategories()]);
        setLoading(false);
    }

    async function loadClaims() {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('expense_claims')
            .select('*, employees(first_name, last_name)')
            .eq('tenant_id', currentTenant.id)
            .order('created_at', { ascending: false });

        if (data) {
            setClaims(data);

            const now = new Date();
            const thisMonth = data.filter(c => {
                const created = new Date(c.created_at);
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
            });

            setStats({
                totalPending: data.filter(c => c.status === 'submitted').length,
                totalThisMonth: thisMonth.reduce((sum, c) => sum + Number(c.total_amount), 0),
                awaitingApproval: data.filter(c => c.status === 'under_review').length,
                mileageThisMonth: thisMonth.reduce((sum, c) => sum + Number(c.total_mileage || 0), 0)
            });
        }
    }

    async function loadCategories() {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('expense_categories')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('is_active', true)
            .order('name');

        setCategories(data || []);
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'under_review': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'paid': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    }

    async function updateClaimStatus(claimId: string, status: string, reason?: string) {
        try {
            const { error } = await supabase
                .from('expense_claims')
                .update({
                    status,
                    rejection_reason: reason,
                    processed_at: new Date().toISOString(),
                    processed_by: user?.id
                })
                .eq('id', claimId);

            if (error) throw error;
            setToast({ message: `Claim ${status} successfully`, type: 'success' });
            loadClaims();
        } catch (err) {
            log.error('Error updating claim status', err);
            setToast({ message: 'Failed to update claim status', type: 'error' });
        }
    }

    const filteredClaims = claims.filter(claim => {
        // First filter by view mode
        if (viewMode === 'personal') {
            if (claim.employee_id !== profile?.employee_id) return false;
        } else {
            // Team view - show all for admins/managers
            if (!isAdmin) return false;
        }

        // Then filter by status
        return filterStatus === 'all' || claim.status === filterStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
                        <Receipt className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Expenses & Mileage</h1>
                        <p className="text-sm text-gray-500">Track expenses and mileage claims</p>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                    {isAdmin && (
                        <div className="flex bg-gray-100 rounded-lg p-1 mr-3">
                            <button
                                onClick={() => setViewMode('personal')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${viewMode === 'personal'
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                My Claims
                            </button>
                            <button
                                onClick={() => setViewMode('team')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${viewMode === 'team'
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Team View
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowNewClaimModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Expense Claim
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending Approval</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.totalPending}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">This Month</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalThisMonth)}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Banknote className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Under Review</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.awaitingApproval}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Miles This Month</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.mileageThisMonth.toFixed(1)}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Car className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveView('claims')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center ${activeView === 'claims'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Receipt className="w-4 h-4 mr-2" />
                    Expense Claims
                </button>
                <button
                    onClick={() => setActiveView('mileage')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center ${activeView === 'mileage'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Car className="w-4 h-4 mr-2" />
                    Quick Mileage
                </button>
            </div>

            {activeView === 'claims' && (
                <>
                    {/* Filter */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center space-x-4">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    {/* Claims List */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {filteredClaims.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {filteredClaims.map((claim) => (
                                    <div
                                        key={claim.id}
                                        onClick={() => setSelectedClaim(claim)}
                                        className="p-4 hover:bg-gray-50 cursor-pointer transition group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-3 bg-emerald-100 rounded-xl">
                                                    <Receipt className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="font-mono text-sm text-gray-500">{claim.claim_reference}</span>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(claim.status)}`}>
                                                            {claim.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        {claim.employees?.first_name} {claim.employees?.last_name}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                                        <span className="flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {format(new Date(claim.created_at), 'dd MMM yyyy')}
                                                        </span>
                                                        {claim.total_mileage > 0 && (
                                                            <span className="flex items-center">
                                                                <Car className="w-3 h-3 mr-1" />
                                                                {claim.total_mileage} miles
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(claim.total_amount)}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    {viewMode === 'team' && claim.status === 'submitted' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Approve this claim?')) updateClaimStatus(claim.id, 'approved');
                                                                }}
                                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const reason = prompt('Enter rejection reason:');
                                                                    if (reason) updateClaimStatus(claim.id, 'rejected', reason);
                                                                }}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Expense Claims</h3>
                                <p className="text-gray-500 mb-4">Create your first expense claim to get started</p>
                                <button
                                    onClick={() => setShowNewClaimModal(true)}
                                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Expense Claim
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeView === 'mileage' && (
                <QuickMileageLog
                    categories={categories}
                    onSuccess={() => {
                        setToast({ message: 'Mileage logged successfully', type: 'success' });
                    }}
                />
            )}

            {/* New Claim Modal */}
            {showNewClaimModal && (
                <NewExpenseClaimModal
                    categories={categories}
                    onClose={() => setShowNewClaimModal(false)}
                    onSuccess={() => {
                        setToast({ message: 'Expense claim created', type: 'success' });
                        loadClaims();
                    }}
                    onError={(msg) => setToast({ message: msg, type: 'error' })}
                />
            )}

            {/* Claim Details Modal */}
            {selectedClaim && (
                <ClaimDetailsModal
                    claim={selectedClaim}
                    onClose={() => setSelectedClaim(null)}
                    onStatusUpdate={() => loadClaims()}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// Quick Mileage Log Component
function QuickMileageLog({
    categories,
    onSuccess
}: {
    categories: ExpenseCategory[];
    onSuccess: () => void;
}) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        journey_date: format(new Date(), 'yyyy-MM-dd'),
        from_location: '',
        to_location: '',
        miles: '',
        purpose: ''
    });

    const mileageCategory = categories.find(c => c.is_mileage);
    const mileageRate = mileageCategory?.mileage_rate || 0.45;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentTenant || !user) return;

        setLoading(true);

        // Get employee ID
        const { data: profile } = await supabase
            .from('users_profiles')
            .select('employee_id')
            .eq('id', user.id)
            .single();

        if (!profile?.employee_id) {
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('mileage_log')
            .insert({
                tenant_id: currentTenant.id,
                employee_id: profile.employee_id,
                journey_date: formData.journey_date,
                from_location: formData.from_location,
                to_location: formData.to_location,
                miles: parseFloat(formData.miles),
                purpose: formData.purpose
            });

        setLoading(false);

        if (!error) {
            onSuccess();
            setFormData({
                journey_date: format(new Date(), 'yyyy-MM-dd'),
                from_location: '',
                to_location: '',
                miles: '',
                purpose: ''
            });
        }
    }

    const estimatedAmount = formData.miles ? parseFloat(formData.miles) * mileageRate : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-indigo-600" />
                Log Mileage Journey
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.journey_date}
                            onChange={(e) => setFormData({ ...formData, journey_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Miles</label>
                        <input
                            type="number"
                            step="0.1"
                            required
                            value={formData.miles}
                            onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                            placeholder="0.0"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <input
                            type="text"
                            required
                            value={formData.from_location}
                            onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                            placeholder="Starting location"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input
                            type="text"
                            required
                            value={formData.to_location}
                            onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                            placeholder="Destination"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose (optional)</label>
                    <input
                        type="text"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        placeholder="e.g., Client visit - Mrs Smith"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                {formData.miles && (
                    <div className="bg-indigo-50 rounded-xl p-4">
                        <p className="text-sm text-indigo-600">
                            Estimated claim: <span className="font-bold text-lg">£{estimatedAmount.toFixed(2)}</span>
                            <span className="text-indigo-400 ml-2">(@ £{mileageRate}/mile)</span>
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {loading ? 'Logging...' : 'Log Mileage'}
                </button>
            </form>
        </div>
    );
}

// New Expense Claim Modal
function NewExpenseClaimModal({
    categories,
    onClose,
    onSuccess,
    onError
}: {
    categories: ExpenseCategory[];
    onClose: () => void;
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Array<{
        expense_date: string;
        description: string;
        amount: string;
        category_id: string;
        is_mileage: boolean;
        miles: string;
        receipt_file?: File | null;
        receipt_url?: string;
    }>>([{
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        amount: '',
        category_id: '',
        is_mileage: false,
        miles: '',
        receipt_file: null as File | null,
        receipt_url: ''
    }]);

    function addItem() {
        setItems([...items, {
            expense_date: format(new Date(), 'yyyy-MM-dd'),
            description: '',
            amount: '',
            category_id: '',
            is_mileage: false,
            miles: '',
            receipt_file: null as File | null,
            receipt_url: ''
        }]);
    }

    function updateItem(index: number, field: string, value: string | boolean) {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;

        // Auto-calculate mileage amount
        if (field === 'category_id') {
            const cat = categories.find(c => c.id === value);
            newItems[index].is_mileage = cat?.is_mileage || false;
        }
        if (field === 'miles' && newItems[index].is_mileage) {
            const cat = categories.find(c => c.id === newItems[index].category_id);
            const rate = cat?.mileage_rate || 0.45;
            newItems[index].amount = (parseFloat(String(value)) * rate).toFixed(2);
        }

        setItems(newItems);
    }

    function removeItem(index: number) {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    }

    async function uploadReceipt(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
            .from('expenses')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('expenses')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentTenant || !user) return;

        setLoading(true);

        // Get employee ID
        const { data: profile } = await supabase
            .from('users_profiles')
            .select('employee_id')
            .eq('id', user.id)
            .single();

        if (!profile?.employee_id) {
            onError('Could not find employee profile');
            setLoading(false);
            return;
        }

        // Create claim
        const { data: claim, error: claimError } = await supabase
            .from('expense_claims')
            .insert({
                tenant_id: currentTenant.id,
                employee_id: profile.employee_id,
                status: 'draft'
            })
            .select()
            .single();

        if (claimError || !claim) {
            onError(claimError?.message || 'Failed to create claim');
            setLoading(false);
            return;
        }

        // Add items
        const itemsToInsert = await Promise.all(items.map(async item => {
            let receiptUrl = '';
            if (item.receipt_file) {
                try {
                    receiptUrl = await uploadReceipt(item.receipt_file);
                } catch (err) {
                    console.error('Failed to upload receipt', err);
                }
            }

            return {
                claim_id: claim.id,
                expense_date: item.expense_date,
                description: item.description,
                amount: parseFloat(item.amount),
                category_id: item.category_id || null,
                is_mileage: item.is_mileage,
                miles: item.miles ? parseFloat(item.miles) : null,
                mileage_rate: item.is_mileage ? (categories.find(c => c.id === item.category_id)?.mileage_rate || 0.45) : null,
                receipt_url: receiptUrl
            };
        }));

        const { error: itemsError } = await supabase
            .from('expense_items')
            .insert(itemsToInsert);

        setLoading(false);

        if (itemsError) {
            onError(itemsError.message);
        } else {
            onSuccess();
            onClose();
        }
    }

    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">New Expense Claim</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Items */}
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Item {index + 1}</span>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={item.expense_date}
                                            onChange={(e) => updateItem(index, 'expense_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            value={item.category_id}
                                            onChange={(e) => updateItem(index, 'category_id', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name} {cat.is_mileage && '(Mileage)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {item.is_mileage ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Miles</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                required
                                                value={item.miles}
                                                onChange={(e) => updateItem(index, 'miles', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (£)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={item.amount}
                                                onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        required
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        placeholder="What was this expense for?"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {!item.is_mileage && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (optional)</label>
                                        <div className="flex items-center space-x-2">
                                            <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                                <Camera className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="text-sm text-gray-600 truncate">
                                                    {item.receipt_file ? item.receipt_file.name : 'Upload Receipt'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            updateItem(index, 'receipt_file', e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {item.receipt_file && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateItem(index, 'receipt_file', null)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {item.is_mileage && item.amount && (
                                    <p className="text-sm text-indigo-600">
                                        Calculated: £{item.amount}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Add Another Item
                    </button>

                    {/* Total */}
                    <div className="bg-emerald-50 rounded-xl p-4 flex justify-between items-center">
                        <span className="font-medium text-emerald-800">Total Claim Amount</span>
                        <span className="text-2xl font-bold text-emerald-700">£{totalAmount.toFixed(2)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Claim Details Modal
function ClaimDetailsModal({
    claim,
    onClose,
    onStatusUpdate
}: {
    claim: ExpenseClaim;
    onClose: () => void;
    onStatusUpdate: () => void;
}) {
    const { user } = useAuth();
    const [items, setItems] = useState<ExpenseItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadItems();
    }, [claim.id]);

    async function loadItems() {
        const { data } = await supabase
            .from('expense_items')
            .select('*')
            .eq('claim_id', claim.id)
            .order('expense_date');

        setItems(data || []);
        setLoading(false);
    }

    async function updateStatus(newStatus: string) {
        const updateData: any = { status: newStatus };

        if (newStatus === 'submitted') {
            updateData.submitted_at = new Date().toISOString();
        }
        if (['approved', 'rejected'].includes(newStatus)) {
            updateData.reviewed_by = user?.id;
            updateData.reviewed_at = new Date().toISOString();
        }
        if (newStatus === 'paid') {
            updateData.paid_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('expense_claims')
            .update(updateData)
            .eq('id', claim.id);

        if (!error) {
            onStatusUpdate();
            onClose();
        }
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div>
                        <p className="text-sm font-mono text-gray-500">{claim.claim_reference}</p>
                        <h2 className="text-xl font-bold text-gray-900">
                            {claim.employees?.first_name} {claim.employees?.last_name}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(claim.status)}`}>
                                {claim.status.replace('_', ' ')}
                            </span>
                            {claim.total_mileage > 0 && (
                                <span className="text-sm text-gray-500 flex items-center">
                                    <Car className="w-4 h-4 mr-1" />
                                    {claim.total_mileage} miles
                                </span>
                            )}
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(claim.total_amount)}
                        </span>
                    </div>

                    {/* Items */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Expense Items</h3>
                        {loading ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-12 bg-gray-100 rounded"></div>
                                <div className="h-12 bg-gray-100 rounded"></div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.description}</p>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(item.expense_date), 'dd MMM yyyy')}
                                                {item.is_mileage && ` • ${item.mileage_from} → ${item.mileage_to} (${item.miles} mi)`}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right mr-4">
                                                <span className="font-bold text-gray-900 block">{formatCurrency(item.amount)}</span>
                                            </div>
                                            {item.receipt_url && (
                                                <a
                                                    href={item.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                                                    title="View Receipt"
                                                >
                                                    <FileIcon className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Actions */}
                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                            {claim.status === 'draft' && (
                                <button
                                    onClick={() => updateStatus('submitted')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit for Approval
                                </button>
                            )}
                            {claim.status === 'submitted' && (
                                <button
                                    onClick={() => updateStatus('under_review')}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                                >
                                    Start Review
                                </button>
                            )}
                            {['submitted', 'under_review'].includes(claim.status) && (
                                <>
                                    <button
                                        onClick={() => updateStatus('approved')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateStatus('rejected')}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </button>
                                </>
                            )}
                            {claim.status === 'approved' && (
                                <button
                                    onClick={() => updateStatus('paid')}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
                                >
                                    <Banknote className="w-4 h-4 mr-2" />
                                    Mark as Paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'submitted': return 'bg-blue-100 text-blue-800';
        case 'under_review': return 'bg-yellow-100 text-yellow-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'paid': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
