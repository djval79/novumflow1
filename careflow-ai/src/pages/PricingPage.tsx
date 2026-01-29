import React, { useState } from 'react';
import { Check, Users, Heart, Activity, Calendar, MessageSquare, Shield, ArrowRight, Sparkles, Calculator, Star, Building, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  price_per_bed?: number;
  currency: string;
  max_patients: number | null;
  max_staff: number | null;
  max_locations: number | null;
  ai_care_plans_per_month: number | null;
  storage_gb: number;
  features: Record<string, boolean>;
  popular?: boolean;
  savings?: string;
}

const CAREFLOW_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'starter',
    display_name: 'Starter',
    description: 'Perfect for small care homes starting their digital journey.',
    price_monthly: 0,
    price_yearly: 0,
    price_per_bed: 0,
    currency: 'GBP',
    max_patients: 25,
    max_staff: 15,
    max_locations: 1,
    ai_care_plans_per_month: 10,
    storage_gb: 10,
    features: {
      dashboard: true,
      care_planning: true,
      staff_management: true,
      medication_management: true,
      visit_scheduling: true,
      client_management: true,
      ai_features: false,
      route_optimization: false,
      telehealth: false,
      family_portal: false,
      advanced_analytics: false,
      api_access: false,
      priority_support: false,
      custom_branding: false,
      offline_mode: true
    }
  },
  {
    id: 'professional',
    name: 'professional',
    display_name: 'Professional',
    description: 'Advanced care management with AI-powered features.',
    price_monthly: 75,
    price_yearly: 750,
    price_per_bed: 3,
    currency: 'GBP',
    max_patients: 100,
    max_staff: 50,
    max_locations: 3,
    ai_care_plans_per_month: 100,
    storage_gb: 50,
    popular: true,
    savings: 'Save 17% annually',
    features: {
      dashboard: true,
      care_planning: true,
      staff_management: true,
      medication_management: true,
      visit_scheduling: true,
      client_management: true,
      ai_features: true,
      route_optimization: true,
      telehealth: false,
      family_portal: false,
      advanced_analytics: true,
      api_access: false,
      priority_support: true,
      custom_branding: false,
      offline_mode: true
    }
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    display_name: 'Enterprise',
    description: 'Complete digital care platform for large organizations.',
    price_monthly: 299,
    price_yearly: 2870,
    price_per_bed: 2.5,
    currency: 'GBP',
    max_patients: null,
    max_staff: null,
    max_locations: null,
    ai_care_plans_per_month: 1000,
    storage_gb: 500,
    savings: 'Save 20% annually',
    features: {
      dashboard: true,
      care_planning: true,
      staff_management: true,
      medication_management: true,
      visit_scheduling: true,
      client_management: true,
      ai_features: true,
      route_optimization: true,
      telehealth: true,
      family_portal: true,
      advanced_analytics: true,
      api_access: true,
      priority_support: true,
      custom_branding: true,
      offline_mode: true
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
    features: ['Up to 25 patients', 'Up to 10 employees', 'Basic care management', 'Email support']
  },
  {
    id: 'professional-suite', 
    name: 'Professional Suite',
    description: 'Comprehensive solution for growing organizations',
    apps: ['NovumFlow HR Pro', 'CareFlow Pro', 'ComplyFlow Pro'],
    individual_price: 374,
    bundle_price: 249,
    savings: 33,
    featured: true,
    features: ['Up to 100 patients', 'Up to 50 employees', 'Advanced AI features', 'Priority support']
  },
  {
    id: 'enterprise-suite',
    name: 'Enterprise Suite',
    description: 'Complete healthcare operating system',
    apps: ['NovumFlow Enterprise', 'CareFlow Enterprise', 'ComplyFlow Enterprise'],
    individual_price: 896,
    bundle_price: 699,
    savings: 22,
    features: ['Unlimited patients & employees', 'White-label options', 'Custom integrations', 'Dedicated success manager']
  }
];

export default function CareFlowPricing() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [showROI, setShowROI] = useState(false);
  const [bedCount, setBedCount] = useState(50);
  const [patientCount, setPatientCount] = useState(40);
  const navigate = useNavigate();

  function formatPrice(price: number, currency: string = 'GBP') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  function calculateROI(beds: number, patients: number, currentCost: number) {
    const ourCost = beds * 3; // Professional tier per bed monthly
    const annualCost = ourCost * 12;
    const currentAnnualCost = currentCost * 12;
    const savings = currentAnnualCost - annualCost;
    const roiPercentage = ((savings / currentAnnualCost) * 100).toFixed(0);
    return { ourCost, annualCost, savings, roiPercentage };
  }

  const roi = calculateROI(bedCount, patientCount, bedCount * 8); // Assuming £8/bed current cost

  const featureLabels: Record<string, string> = {
    dashboard: 'Care Dashboard',
    care_planning: 'AI Care Planning',
    staff_management: 'Staff Management',
    medication_management: 'eMAR - Medication Management',
    visit_scheduling: 'Visit Scheduling',
    client_management: 'Client Management',
    ai_features: 'AI-Powered Features',
    route_optimization: 'Route Optimization',
    telehealth: 'Telehealth Integration',
    family_portal: 'Family Portal Access',
    advanced_analytics: 'Advanced Analytics',
    api_access: 'API Access',
    priority_support: 'Priority Support',
    custom_branding: 'Custom Branding',
    offline_mode: 'Offline Mode'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Transform Care Delivery
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          AI-powered care management that reduces admin time by 70% and improves patient outcomes.
        </p>
        
        {/* Trust Indicators */}
        <div className="flex justify-center items-center space-x-8 mb-12">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-gray-700 font-medium">4.9/5 Rating</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-gray-700 font-medium">CQC & HIPAA Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-teal-500" />
            <span className="text-gray-700 font-medium">200+ Care Homes</span>
          </div>
        </div>
      </div>

      {/* Suite Bundles - Featured First */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            💎 Suite Bundles - Best Value
          </h2>
          <p className="text-lg text-gray-600">
            Get the complete healthcare operating system and save up to 33%
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SUITE_BUNDLES.map((bundle) => (
            <div
              key={bundle.id}
              className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${
                bundle.featured ? 'border-teal-500 shadow-lg scale-105' : 'border-gray-200'
              }`}
            >
              {bundle.featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-full">
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
                        <Check className="w-4 h-4 text-teal-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-3 px-4 rounded-xl font-medium transition flex items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700">
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
            CareFlow Individual Plans
          </h2>
          <p className="text-lg text-gray-600">
            Choose the perfect plan for your care organization
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl p-1 inline-flex shadow-sm">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition ${
                billingInterval === 'monthly'
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition flex items-center ${
                billingInterval === 'yearly'
                  ? 'bg-teal-500 text-white'
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CAREFLOW_PLANS.map((plan) => {
            const price = billingInterval === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const isCurrentPlan = plan.id === 'professional'; // Simulated

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg ${
                  isCurrentPlan ? 'border-teal-500 shadow-lg' : 'border-gray-200'
                } ${plan.popular ? 'md:scale-105 md:z-10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-full">
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
                              {plan.price_per_bed ? ` / bed / ${billingInterval === 'yearly' ? 'year' : 'month'}` : ` / ${billingInterval === 'yearly' ? 'year' : 'month'}`}
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
                        Patients
                      </span>
                      <span className="font-medium text-gray-900">
                        {plan.max_patients || 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Care Staff
                      </span>
                      <span className="font-medium text-gray-900">
                        {plan.max_staff || 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        AI Care Plans/mo
                      </span>
                      <span className="font-medium text-gray-900">
                        {plan.ai_care_plans_per_month || 'Unlimited'}
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
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700'
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
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
              <Calculator className="w-8 h-8 mr-3" />
              CareFlow ROI Calculator
            </h2>
            <p className="text-teal-100">
              See how much time and money you can save with AI-powered care management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Beds</label>
              <input
                type="range"
                min="10"
                max="200"
                value={bedCount}
                onChange={(e) => setBedCount(Number(e.target.value))}
                className="w-full mb-4"
              />
              <div className="text-2xl font-bold mb-4">{bedCount} Beds</div>
              
              <label className="block text-sm font-medium mb-2">Average Patients</label>
              <input
                type="range"
                min="5"
                max="bedCount"
                value={patientCount}
                onChange={(e) => setPatientCount(Number(e.target.value))}
                className="w-full mb-4"
              />
              <div className="text-2xl font-bold">{patientCount} Patients</div>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Your Annual Savings</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current System Cost:</span>
                  <span className="font-mono">{formatPrice(roi.ourCost * 12 * 2.67)}/yr</span>
                </div>
                <div className="flex justify-between">
                  <span>CareFlow Cost:</span>
                  <span className="font-mono">{formatPrice(roi.annualCost)}/yr</span>
                </div>
                <div className="border-t border-white/20 pt-2">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Annual Savings:</span>
                    <span className="text-green-300">{formatPrice(roi.savings)}/yr</span>
                  </div>
                  <div className="text-green-300 text-sm mt-1">
                    {roi.roiPercentage}% reduction in costs + 70% time saved
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why CareFlow Leaders Choose Us
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">70% Time Saved</h3>
            <p className="text-gray-600">AI-powered care planning reduces admin time dramatically</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Better Outcomes</h3>
            <p className="text-gray-600">Improved care quality with intelligent monitoring</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Full Compliance</h3>
            <p className="text-gray-600">CQC and regulatory compliance built-in</p>
          </div>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gray-900 rounded-3xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Care Delivery?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join 200+ care organizations already using CareFlow to deliver better care, reduce costs, and ensure compliance.
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
              className="px-8 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition flex items-center justify-center"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}