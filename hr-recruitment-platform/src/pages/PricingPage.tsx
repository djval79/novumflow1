import React, { useState } from 'react';
import { Check, Zap, Users, Building2, ArrowRight, Sparkles, TrendingUp, Calculator, Shield, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  price_per_employee?: number;
  currency: string;
  max_employees: number | null;
  max_users: number | null;
  max_job_postings: number | null;
  ai_screenings_per_month: number | null;
  storage_gb: number;
  features: Record<string, boolean>;
  popular?: boolean;
  savings?: string;
}

const NOVUMFLOW_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'starter',
    display_name: 'Starter',
    description: 'Perfect for small businesses getting started with modern HR.',
    price_monthly: 0,
    price_yearly: 0,
    price_per_employee: 0,
    currency: 'GBP',
    max_employees: 10,
    max_users: 3,
    max_job_postings: 3,
    ai_screenings_per_month: 10,
    storage_gb: 5,
    popular: false,
    features: {
      dashboard: true,
      hr_module: true,
      recruitment: true,
      documents: true,
      messaging: true,
      ai_screening: false,
      sponsor_guardian: false,
      automation: false,
      api_access: false,
      priority_support: false,
      dedicated_account_manager: false,
      custom_branding: false,
      sso: false
    }
  },
  {
    id: 'professional',
    name: 'professional',
    display_name: 'Professional',
    description: 'Advanced HR features for growing companies.',
    price_monthly: 8,
    price_yearly: 80,
    price_per_employee: 8,
    currency: 'GBP',
    max_employees: 50,
    max_users: 10,
    max_job_postings: 20,
    ai_screenings_per_month: 100,
    storage_gb: 25,
    popular: true,
    savings: 'Save 17% annually',
    features: {
      dashboard: true,
      hr_module: true,
      recruitment: true,
      documents: true,
      messaging: true,
      ai_screening: true,
      sponsor_guardian: false,
      automation: true,
      api_access: false,
      priority_support: true,
      dedicated_account_manager: false,
      custom_branding: false,
      sso: false
    }
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    display_name: 'Enterprise',
    description: 'Complete HR solution for large organizations.',
    price_monthly: 15,
    price_yearly: 144,
    price_per_employee: 12,
    currency: 'GBP',
    max_employees: null,
    max_users: null,
    max_job_postings: null,
    ai_screenings_per_month: 1000,
    storage_gb: 500,
    savings: 'Save 20% annually',
    features: {
      dashboard: true,
      hr_module: true,
      recruitment: true,
      documents: true,
      messaging: true,
      ai_screening: true,
      sponsor_guardian: true,
      automation: true,
      api_access: true,
      priority_support: true,
      dedicated_account_manager: true,
      custom_branding: true,
      sso: true
    }
  }
];

const SUITE_BUNDLES = [
  {
    id: 'business-suite',
    name: 'Business Suite',
    description: 'Complete business management platform for SMEs',
    apps: ['NovumFlow HR', 'CareFlow Basic'],
    individual_price: 128,
    bundle_price: 89,
    savings: 30,
    features: ['Up to 25 employees', 'Basic care management', 'Full HR suite', 'Email support']
  },
  {
    id: 'professional-suite', 
    name: 'Professional Suite',
    description: 'Comprehensive solution for growing organizations',
    apps: ['NovumFlow HR Pro', 'CareFlow Pro', 'ComplyFlow Pro'],
    individual_price: 297,
    bundle_price: 199,
    savings: 33,
    featured: true,
    features: ['Up to 100 employees', 'Advanced care management', 'Full compliance suite', 'Priority support']
  },
  {
    id: 'enterprise-suite',
    name: 'Enterprise Suite',
    description: 'Complete healthcare operating system',
    apps: ['NovumFlow Enterprise', 'CareFlow Enterprise', 'ComplyFlow Enterprise'],
    individual_price: 747,
    bundle_price: 599,
    savings: 20,
    features: ['Unlimited employees', 'White-label options', 'Custom integrations', 'Dedicated success manager']
  }
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [showROI, setShowROI] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(25);
  const navigate = useNavigate();

  function formatPrice(price: number, currency: string = 'GBP') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  function calculateROI(employees: number, currentCost: number) {
    const ourCost = employees * 12; // Professional tier per employee annually
    const savings = currentCost - ourCost;
    const roiPercentage = ((savings / currentCost) * 100).toFixed(0);
    return { ourCost, savings, roiPercentage };
  }

  const roi = calculateROI(employeeCount, employeeCount * 25); // Assuming £25/employee current cost

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Transform Your Healthcare Business
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          All-in-one HR, Care Management, and Compliance platform. Save 30-40% with our suite bundles.
        </p>
        
        {/* Trust Indicators */}
        <div className="flex justify-center items-center space-x-8 mb-12">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-gray-700 font-medium">4.9/5 Rating</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-gray-700 font-medium">GDPR & HIPAA Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700 font-medium">500+ Organizations</span>
          </div>
        </div>
      </div>

      {/* Suite Bundles - Featured First */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            💎 Bundle & Save Big
          </h2>
          <p className="text-lg text-gray-600">
            Get all three apps at a massive discount
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SUITE_BUNDLES.map((bundle) => (
            <div
              key={bundle.id}
              className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${
                bundle.featured ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200'
              }`}
            >
              {bundle.featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-full">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{bundle.name}</h3>
                  <p className="text-gray-600 mb-4">{bundle.description}</p>
                  
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(bundle.bundle_price)}
                      <span className="text-lg font-normal text-gray-500">/mo</span>
                    </div>
                    <div className="text-sm text-gray-500 line-through">
                      Was {formatPrice(bundle.individual_price)}/mo
                    </div>
                    <div className="text-green-600 font-semibold text-sm mt-1">
                      Save {bundle.savings}% ({formatPrice(bundle.individual_price - bundle.bundle_price)}/mo)
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">Includes:</div>
                  <div className="space-y-1">
                    {bundle.apps.map((app, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        {app}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">Key Features:</div>
                  <div className="space-y-1">
                    {bundle.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-blue-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-3 px-4 rounded-xl font-medium transition flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual App Pricing */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Individual App Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Or choose individual apps based on your needs
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl p-1 inline-flex shadow-sm">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition ${
                billingInterval === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition flex items-center ${
                billingInterval === 'yearly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {NOVUMFLOW_PLANS.map((plan) => {
            const price = billingInterval === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const isCurrentPlan = plan.id === 'professional'; // Simulated

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg ${
                  isCurrentPlan ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                } ${plan.popular ? 'md:scale-105 md:z-10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-full">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.display_name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    {/* Pricing */}
                    <div className="mb-4">
                      {plan.price_monthly === 0 ? (
                        <div className="text-4xl font-bold text-green-600">Free</div>
                      ) : (
                        <>
                          <div className="text-4xl font-bold text-gray-900">
                            {formatPrice(price)}
                            <span className="text-lg font-normal text-gray-500">
                              {plan.price_per_employee ? ` / employee / ${billingInterval === 'yearly' ? 'year' : 'month'}` : ` / ${billingInterval === 'yearly' ? 'year' : 'month'}`}
                            </span>
                          </div>
                          {billingInterval === 'yearly' && plan.savings && (
                            <div className="text-green-600 font-semibold text-sm mt-1">
                              {plan.savings}
                            </div>
                          )}
                        </>
                      )}
                    </div>
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
                    className={`w-full py-3 px-4 rounded-xl font-medium transition flex items-center justify-center ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                        : price === 0
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrentPlan ? (
                      'Current Plan'
                    ) : price === 0 ? (
                      'Start Free Trial'
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
              <Calculator className="w-8 h-8 mr-3" />
              ROI Calculator
            </h2>
            <p className="text-blue-100">
              See how much you can save with NovumFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Employees</label>
              <input
                type="range"
                min="5"
                max="500"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full mb-4"
              />
              <div className="text-2xl font-bold">{employeeCount} Employees</div>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Your Annual Savings</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current System Cost:</span>
                  <span className="font-mono">{formatPrice(employeeCount * 25 * 12)}/yr</span>
                </div>
                <div className="flex justify-between">
                  <span>NovumFlow Cost:</span>
                  <span className="font-mono">{formatPrice(roi.ourCost * 12)}/yr</span>
                </div>
                <div className="border-t border-white/20 pt-2">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Annual Savings:</span>
                    <span className="text-green-300">{formatPrice(roi.savings * 12)}/yr</span>
                  </div>
                  <div className="text-green-300 text-sm mt-1">
                    {roi.roiPercentage}% reduction in costs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gray-900 rounded-3xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            For large organizations with specific requirements, we offer tailored plans with custom integrations, 
            dedicated support, and volume discounts starting at 100+ employees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/contact-sales')}
              className="px-8 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition flex items-center justify-center"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <button 
              onClick={() => navigate('/demo')}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center justify-center"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}