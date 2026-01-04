import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    CreditCard,
    Check,
    Zap,
    Shield,
    Users,
    Briefcase,
    Crown,
    ArrowRight,
    Receipt,
    Calendar,
    AlertCircle,
    Sparkles,
    Building2
} from 'lucide-react';
import { format } from 'date-fns';
import Toast from '@/components/Toast';

interface Plan {
    id: string;
    name: string;
    display_name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    currency: string;
    max_employees: number | null;
    max_users: number | null;
    max_job_postings: number | null;
    ai_screenings_per_month: number | null;
    storage_gb: number;
    features: Record<string, boolean>;
}

interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    billing_interval: string;
    current_period_start: string;
    current_period_end: string;
    trial_end: string | null;
    ai_screenings_used: number;
    cancel_at_period_end: boolean;
    plan?: Plan;
}

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    invoice_url: string;
    paid_at: string;
}

export default function BillingPage() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant]);

    async function loadData() {
        setLoading(true);
        await Promise.all([loadPlans(), loadSubscription(), loadPayments()]);
        setLoading(false);
    }

    async function loadPlans() {
        const { data } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
        setPlans(data || []);
    }

    async function loadSubscription() {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('tenant_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('tenant_id', currentTenant.id)
            .single();

        if (data) {
            setSubscription({
                ...data,
                plan: data.subscription_plans
            });
        }
    }

    async function loadPayments() {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('payment_history')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('created_at', { ascending: false })
            .limit(10);

        setPayments(data || []);
    }

    async function handleUpgrade(planId: string) {
        setUpgrading(true);

        // In production, this would redirect to Stripe Checkout
        // For now, we'll simulate a subscription creation
        try {
            const plan = plans.find(p => p.id === planId);
            if (!plan || !currentTenant) throw new Error('Plan not found');

            // Check if subscription exists
            if (subscription) {
                // Update existing subscription
                const { error } = await supabase
                    .from('tenant_subscriptions')
                    .update({
                        plan_id: planId,
                        billing_interval: billingInterval,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', subscription.id);

                if (error) throw error;
            } else {
                // Create new subscription
                const now = new Date();
                const periodEnd = new Date();
                periodEnd.setMonth(periodEnd.getMonth() + (billingInterval === 'yearly' ? 12 : 1));

                const { error } = await supabase
                    .from('tenant_subscriptions')
                    .insert({
                        tenant_id: currentTenant.id,
                        plan_id: planId,
                        status: 'active',
                        billing_interval: billingInterval,
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd.toISOString(),
                        ai_screenings_used: 0
                    });

                if (error) throw error;
            }

            setToast({ message: `Successfully upgraded to ${plan.display_name}!`, type: 'success' });
            loadSubscription();
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to upgrade', type: 'error' });
        } finally {
            setUpgrading(false);
        }
    }

    function getPlanIcon(name: string) {
        switch (name) {
            case 'starter': return Zap;
            case 'professional': return Shield;
            case 'enterprise': return Crown;
            default: return Zap;
        }
    }

    function getPlanColor(name: string) {
        switch (name) {
            case 'starter': return 'from-blue-500 to-blue-600';
            case 'professional': return 'from-purple-500 to-purple-600';
            case 'enterprise': return 'from-amber-500 to-amber-600';
            default: return 'from-gray-500 to-gray-600';
        }
    }

    function formatPrice(price: number, currency: string) {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency
        }).format(price);
    }

    const featureLabels: Record<string, string> = {
        dashboard: 'Dashboard',
        hr_module: 'HR Module',
        recruitment: 'Recruitment',
        documents: 'Document Management',
        messaging: 'Team Messaging',
        ai_screening: 'AI Resume Screening',
        sponsor_guardian: 'Sponsor Guardian (Visa)',
        automation: 'Workflow Automation',
        api_access: 'API Access',
        priority_support: 'Priority Support',
        dedicated_account_manager: 'Dedicated Account Manager',
        custom_branding: 'Custom Branding',
        sso: 'Single Sign-On (SSO)'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                        <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
                        <p className="text-sm text-gray-500">Manage your plan and billing details</p>
                    </div>
                </div>
            </div>

            {/* Current Subscription Status */}
            {subscription && (
                <div className={`bg-gradient-to-r ${getPlanColor(subscription.plan?.name || 'starter')} rounded-2xl p-6 text-white`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                {React.createElement(getPlanIcon(subscription.plan?.name || 'starter'), { className: 'w-8 h-8' })}
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">Current Plan</p>
                                <h2 className="text-2xl font-bold">{subscription.plan?.display_name}</h2>
                                <p className="text-white/70 text-sm mt-1">
                                    {subscription.billing_interval === 'yearly' ? 'Annual billing' : 'Monthly billing'} •
                                    Renews {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 md:mt-0 flex flex-col items-end">
                            <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${subscription.status === 'active' ? 'bg-green-400/20 text-green-100' :
                                        subscription.status === 'trialing' ? 'bg-blue-400/20 text-blue-100' :
                                            'bg-red-400/20 text-red-100'
                                    }`}>
                                    {subscription.status}
                                </span>
                            </div>
                            {subscription.cancel_at_period_end && (
                                <p className="text-white/80 text-sm mt-2">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    Cancels at period end
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Usage Stats */}
                    {subscription.plan?.ai_screenings_per_month && (
                        <div className="mt-6 p-4 bg-white/10 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-sm">AI Screenings Used</span>
                                <span className="font-bold">
                                    {subscription.ai_screenings_used} / {subscription.plan.ai_screenings_per_month}
                                </span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{ width: `${Math.min((subscription.ai_screenings_used / subscription.plan.ai_screenings_per_month) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Billing Interval Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100 rounded-xl p-1 inline-flex">
                    <button
                        onClick={() => setBillingInterval('monthly')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition ${billingInterval === 'monthly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingInterval('yearly')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center ${billingInterval === 'yearly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Yearly
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Save 17%
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const PlanIcon = getPlanIcon(plan.name);
                    const isCurrentPlan = subscription?.plan_id === plan.id;
                    const price = billingInterval === 'yearly' ? plan.price_yearly : plan.price_monthly;

                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg ${isCurrentPlan ? 'border-indigo-500 shadow-lg' : 'border-gray-200'
                                } ${plan.name === 'professional' ? 'md:scale-105 md:z-10' : ''}`}
                        >
                            {plan.name === 'professional' && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="inline-flex items-center px-4 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-full">
                                        <Sparkles className="w-4 h-4 mr-1" />
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Plan Header */}
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className={`p-2 rounded-xl bg-gradient-to-br ${getPlanColor(plan.name)}`}>
                                        <PlanIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{plan.display_name}</h3>
                                        <p className="text-sm text-gray-500">{plan.description}</p>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="mb-6">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold text-gray-900">{formatPrice(price, plan.currency)}</span>
                                        <span className="text-gray-500 ml-2">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
                                    </div>
                                    {billingInterval === 'yearly' && (
                                        <p className="text-sm text-green-600 mt-1">
                                            {formatPrice(plan.price_monthly * 12 - plan.price_yearly, plan.currency)} saved annually
                                        </p>
                                    )}
                                </div>

                                {/* Limits */}
                                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 flex items-center">
                                            <Users className="w-4 h-4 mr-2" />
                                            Employees
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {plan.max_employees || 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 flex items-center">
                                            <Building2 className="w-4 h-4 mr-2" />
                                            Users
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {plan.max_users || 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 flex items-center">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            Job Postings
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {plan.max_job_postings || 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 flex items-center">
                                            <Zap className="w-4 h-4 mr-2" />
                                            AI Screenings/mo
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {plan.ai_screenings_per_month || 'Unlimited'}
                                        </span>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-2 mb-6">
                                    {Object.entries(plan.features).slice(0, 6).map(([key, enabled]) => (
                                        <div key={key} className="flex items-center text-sm">
                                            {enabled ? (
                                                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 mr-2" />
                                            )}
                                            <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                                                {featureLabels[key] || key}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={upgrading || isCurrentPlan}
                                    className={`w-full py-3 px-4 rounded-xl font-medium transition flex items-center justify-center ${isCurrentPlan
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : plan.name === 'professional'
                                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {isCurrentPlan ? (
                                        'Current Plan'
                                    ) : upgrading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            {subscription ? 'Upgrade' : 'Get Started'}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <Receipt className="w-5 h-5 mr-2 text-gray-400" />
                            Payment History
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.paid_at && format(new Date(payment.paid_at), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {payment.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatPrice(payment.amount, payment.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                                                    payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {payment.invoice_url && (
                                                <a
                                                    href={payment.invoice_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    View Invoice
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Enterprise Contact */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Need a custom solution?</h2>
                        <p className="text-gray-300 max-w-xl">
                            For large organizations with specific requirements, we offer tailored plans with custom integrations, dedicated support, and volume discounts.
                        </p>
                    </div>
                    <button className="mt-4 md:mt-0 px-6 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition flex items-center">
                        Contact Sales
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
