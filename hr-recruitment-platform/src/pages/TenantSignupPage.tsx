import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';
import { Building2, User, CreditCard, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { log } from '@/lib/logger';

interface TenantSignupData {
    // Step 1: Organization Details
    organizationName: string;
    subdomain: string;
    industry: string;
    size: string;

    // Step 2: Admin User
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    adminPasswordConfirm: string;

    // Step 3: Subscription
    subscriptionTier: 'trial' | 'basic' | 'professional' | 'enterprise';
}

const STEPS = [
    { id: 1, name: 'Organization', icon: Building2 },
    { id: 2, name: 'Admin User', icon: User },
    { id: 3, name: 'Subscription', icon: CreditCard },
];

const SUBSCRIPTION_TIERS = [
    {
        id: 'trial',
        name: '14-Day Free Trial',
        price: '£0',
        period: '14 days',
        features: [
            'Up to 10 users',
            'Basic features',
            'Email support',
            'No credit card required',
        ],
    },
    {
        id: 'basic',
        name: 'Basic',
        price: '£199',
        period: 'per month',
        features: [
            'Up to 25 users',
            'All core features',
            'Email support',
            'Basic analytics',
        ],
    },
    {
        id: 'professional',
        name: 'Professional',
        price: '£499',
        period: 'per month',
        features: [
            'Up to 100 users',
            'Advanced features',
            'Priority support',
            'Advanced analytics',
            'API access',
        ],
        popular: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        features: [
            'Unlimited users',
            'All features',
            '24/7 phone support',
            'Dedicated account manager',
            'Custom integrations',
            'SLA guarantee',
        ],
    },
];

export default function TenantSignupPage() {
    const navigate = useNavigate();
    const { createTenant } = useTenant();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<TenantSignupData>({
        organizationName: '',
        subdomain: '',
        industry: 'healthcare',
        size: '1-10',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: '',
        subscriptionTier: 'trial',
    });

    const updateFormData = (field: keyof TenantSignupData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateStep = () => {
        if (currentStep === 1) {
            if (!formData.organizationName.trim()) {
                setError('Organization name is required');
                return false;
            }
            if (!formData.subdomain.trim()) {
                setError('Subdomain is required');
                return false;
            }
            if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
                setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
                return false;
            }
        }

        if (currentStep === 2) {
            if (!formData.adminName.trim()) {
                setError('Admin name is required');
                return false;
            }
            if (!formData.adminEmail.trim()) {
                setError('Admin email is required');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
                setError('Invalid email address');
                return false;
            }
            if (formData.adminPassword.length < 8) {
                setError('Password must be at least 8 characters');
                return false;
            }
            if (formData.adminPassword !== formData.adminPasswordConfirm) {
                setError('Passwords do not match');
                return false;
            }
        }

        return true;
    };

    const handleNext = async () => {
        if (!validateStep()) return;

        if (currentStep === 1) {
            setLoading(true);
            try {
                const { data: isAvailable, error } = await supabase.rpc('check_subdomain_availability', {
                    p_subdomain: formData.subdomain
                });

                if (error) throw error;

                if (!isAvailable) {
                    setError('This subdomain is already taken');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                log.error('Error checking subdomain', err, { component: 'TenantSignupPage', action: 'handleNext', metadata: { step: 1, subdomain: formData.subdomain } });
                setError('Failed to verify subdomain availability');
                setLoading(false);
                return;
            }
            setLoading(false);
        }

        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        setError('');

        try {
            // 1. Create Admin User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.adminEmail,
                password: formData.adminPassword,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`,
                    data: {
                        full_name: formData.adminName,
                        role: 'admin' // Initial role
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user account');

            // 2. Create Tenant
            const { data: tenantId, error: tenantError } = await supabase.rpc('create_tenant', {
                p_name: formData.organizationName,
                p_subdomain: formData.subdomain,
                p_owner_user_id: authData.user.id,
                p_subscription_tier: formData.subscriptionTier
            });

            if (tenantError) throw tenantError;

            // 3. Send Welcome Email
            try {
                await supabase.functions.invoke('send-welcome-email', {
                    body: {
                        email: formData.adminEmail,
                        name: formData.adminName,
                        organizationName: formData.organizationName
                    }
                });
            } catch (emailError) {
                log.error('Failed to send welcome email', emailError, { component: 'TenantSignupPage', action: 'handleSubmit', metadata: { email: formData.adminEmail } });
                // Don't block signup flow on email failure
            }

            // Redirect to login or dashboard
            // If email confirmation is enabled, we should show a message
            if (authData.session) {
                navigate('/dashboard');
            } else {
                // User created but not logged in (email confirmation required)
                alert('Account created! Please check your email to confirm your account.');
                navigate('/login');
            }
        } catch (err: any) {
            log.error('Signup error', err, { component: 'TenantSignupPage', action: 'handleSubmit' });
            if (err.message && err.message.includes('confirmation email')) {
                setError('Email service is temporarily busy. Your account and organization may have been created—please try logging in, or wait a few minutes and try again.');
            } else if (err.message && err.message.includes('rate limit')) {
                setError('Too many attempts. Please wait a few minutes before trying again.');
            } else {
                setError(err.message || 'Failed to create organization');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Organization</h1>
                    <p className="text-gray-600">Get started with NovumFlow in just a few steps</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        {STEPS.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentStep > step.id
                                            ? 'bg-cyan-600 text-white'
                                            : currentStep === step.id
                                                ? 'bg-cyan-600 text-white ring-4 ring-cyan-100'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <Check className="w-6 h-6" />
                                        ) : (
                                            <step.icon className="w-6 h-6" />
                                        )}
                                    </div>
                                    <span className={`mt-2 text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {step.name}
                                    </span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`h-0.5 w-24 mx-4 transition-all ${currentStep > step.id ? 'bg-cyan-600' : 'bg-gray-200'}
                                            `}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Organization Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.organizationName}
                                    onChange={(e) => updateFormData('organizationName', e.target.value)}
                                    placeholder="Ringstead Care Home"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subdomain
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={formData.subdomain}
                                        onChange={(e) => updateFormData('subdomain', e.target.value.toLowerCase())}
                                        placeholder="ringsteadcare"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                    <span className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                                        .novumflow.com
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">This will be your unique URL</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Industry
                                    </label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => updateFormData('industry', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        <option value="healthcare">Healthcare</option>
                                        <option value="homecare">Home Care</option>
                                        <option value="nursing">Nursing Home</option>
                                        <option value="recruitment">Recruitment</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Organization Size
                                    </label>
                                    <select
                                        value={formData.size}
                                        onChange={(e) => updateFormData('size', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201+">201+ employees</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Admin User */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.adminName}
                                    onChange={(e) => updateFormData('adminName', e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={(e) => updateFormData('adminEmail', e.target.value)}
                                    placeholder="john@ringsteadcare.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.adminPassword}
                                    onChange={(e) => updateFormData('adminPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                                <p className="mt-2 text-sm text-gray-500">Minimum 8 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.adminPasswordConfirm}
                                    onChange={(e) => updateFormData('adminPasswordConfirm', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Subscription */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <p className="text-center text-gray-600 mb-8">
                                Choose the plan that best fits your organization
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {SUBSCRIPTION_TIERS.map((tier) => (
                                    <button
                                        key={tier.id}
                                        onClick={() => updateFormData('subscriptionTier', tier.id as any)}
                                        className={`relative p-6 border-2 rounded-xl text-left transition-all ${formData.subscriptionTier === tier.id
                                            ? 'border-cyan-600 bg-cyan-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            } ${tier.popular ? 'ring-2 ring-cyan-200' : ''}`}
                                    >
                                        {tier.popular && (
                                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-600 text-white text-xs font-semibold rounded-full">
                                                Popular
                                            </span>
                                        )}

                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                                            <div className="mt-2">
                                                <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                                                {tier.period && (
                                                    <span className="text-gray-500 ml-2">{tier.period}</span>
                                                )}
                                            </div>
                                        </div>

                                        <ul className="space-y-2">
                                            {tier.features.map((feature, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {formData.subscriptionTier === tier.id && (
                                            <div className="absolute top-6 right-6">
                                                <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1 || loading}
                            className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Organization
                                        <Check className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}
