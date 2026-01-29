import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface UsageMetrics {
  id: string;
  tenant_id: string;
  metric_type: string;
  usage_count: number;
  period_start: string;
  period_end: string;
  overage_count: number;
  overage_charge: number;
}

export interface SubscriptionPlan {
  id: string;
  app_name: string;
  plan_id: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  price_per_employee?: number;
  price_per_bed?: number;
  currency: string;
  max_employees?: number;
  max_users?: number;
  max_patients?: number;
  max_locations?: number;
  max_job_postings?: number;
  ai_screenings_per_month?: number;
  ai_care_plans_per_month?: number;
  ai_analyses_per_month?: number;
  storage_gb: number;
  is_active: boolean;
  sort_order: number;
  popular: boolean;
  savings_percent?: number;
  features: Record<string, boolean>;
}

export interface SuiteBundle {
  id: string;
  bundle_id: string;
  name: string;
  description: string;
  individual_price: number;
  bundle_price: number;
  savings_percent: number;
  currency: string;
  apps: string[];
  features: string[];
  featured: boolean;
  is_active: boolean;
}

export interface VolumeTier {
  id: string;
  tier_name: string;
  min_employees: number;
  max_employees?: number;
  discount_percent: number;
  description: string;
  is_active: boolean;
}

export interface PricingCalculator {
  base_price: number;
  volume_discount: number;
  final_price: number;
  applied_tier: string;
}

class PricingService {
  private static instance: PricingService;

  static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  // Get all subscription plans for an app
  async getSubscriptionPlans(appName: string): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('app_name', appName)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  // Get all suite bundles
  async getSuiteBundles(): Promise<SuiteBundle[]> {
    const { data, error } = await supabase
      .from('suite_bundles')
      .select('*')
      .eq('is_active', true)
      .order('bundle_price');

    if (error) throw error;
    return data || [];
  }

  // Get volume tiers
  async getVolumeTiers(): Promise<VolumeTier[]> {
    const { data, error } = await supabase
      .from('volume_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_employees');

    if (error) throw error;
    return data || [];
  }

  // Calculate pricing with volume discounts
  async calculatePrice(
    appName: string,
    planId: string,
    employeeCount?: number,
    bedCount?: number,
    billingInterval: 'monthly' | 'yearly' = 'monthly'
  ): Promise<PricingCalculator> {
    const { data, error } = await supabase.rpc('calculate_subscription_price', {
      p_app_name: appName,
      p_plan_id: planId,
      p_employee_count: employeeCount || null,
      p_billing_interval: billingInterval
    });

    if (error) throw error;
    
    return {
      base_price: data[0]?.base_price || 0,
      volume_discount: data[0]?.volume_discount || 0,
      final_price: data[0]?.final_price || 0,
      applied_tier: data[0]?.applied_tier || 'standard'
    };
  }

  // Track usage for billing
  async trackUsage(
    tenantId: string,
    metricType: string,
    usageCount: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const { error } = await supabase
      .from('usage_metrics')
      .upsert({
        tenant_id: tenantId,
        metric_type: metricType,
        usage_count: usageCount,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0]
      }, {
        onConflict: 'tenant_id,metric_type,period_start'
      });

    if (error) throw error;
  }

  // Get usage metrics for a tenant
  async getUsageMetrics(
    tenantId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<UsageMetrics[]> {
    let query = supabase
      .from('usage_metrics')
      .select('*')
      .eq('tenant_id', tenantId);

    if (periodStart) {
      query = query.gte('period_start', periodStart.toISOString().split('T')[0]);
    }
    if (periodEnd) {
      query = query.lte('period_end', periodEnd.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('period_start', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Calculate overage charges
  calculateOverage(
    currentUsage: number,
    limit: number | undefined | null,
    overageRate: number = 0.10
  ): { overageUnits: number; overageCharge: number } {
    if (!limit || currentUsage <= limit) {
      return { overageUnits: 0, overageCharge: 0 };
    }

    const overageUnits = currentUsage - limit;
    const overageCharge = overageUnits * overageRate;

    return { overageUnits, overageCharge };
  }

  // Get ROI calculation
  calculateROI(
    currentCost: number,
    ourCost: number,
    timeSavedHours: number = 0,
    hourlyRate: number = 25
  ): {
    costSavings: number;
    roiPercentage: number;
    paybackPeriodMonths: number;
    timeSavingsValue: number;
    totalAnnualValue: number;
  } {
    const costSavings = currentCost - ourCost;
    const roiPercentage = currentCost > 0 ? (costSavings / currentCost) * 100 : 0;
    const paybackPeriodMonths = costSavings > 0 ? (ourCost / costSavings) * 12 : 0;
    const timeSavingsValue = timeSavedHours * hourlyRate * 12; // Annual value
    const totalAnnualValue = costSavings + timeSavingsValue;

    return {
      costSavings,
      roiPercentage,
      paybackPeriodMonths,
      timeSavingsValue,
      totalAnnualValue
    };
  }

  // Format pricing display
  formatPrice(
    price: number,
    currency: string = 'GBP',
    perUnit?: string
  ): string {
    const formatted = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(price);

    return perUnit ? `${formatted}/${perUnit}` : formatted;
  }

  // Get recommended plan based on needs
  async getRecommendedPlan(
    appName: string,
    requirements: {
      employees?: number;
      patients?: number;
      beds?: number;
      locations?: number;
      needAI?: boolean;
      needAPI?: boolean;
    }
  ): Promise<SubscriptionPlan | null> {
    const plans = await this.getSubscriptionPlans(appName);
    
    // Simple recommendation logic - can be enhanced with ML
    for (const plan of plans) {
      if (requirements.employees && plan.max_employees && requirements.employees > plan.max_employees) {
        continue;
      }
      if (requirements.patients && plan.max_patients && requirements.patients > plan.max_patients) {
        continue;
      }
      if (requirements.beds && plan.price_per_bed && !plan.price_per_bed) {
        continue;
      }
      if (requirements.needAI && !plan.features.ai_features && !plan.features.ai_screening) {
        continue;
      }
      if (requirements.needAPI && !plan.features.api_access) {
        continue;
      }
      
      return plan;
    }
    
    return null;
  }
}

export const pricingService = PricingService.getInstance();

// React hook for pricing
export function usePricing() {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan[]>>({});
  const [bundles, setBundles] = useState<SuiteBundle[]>([]);
  const [volumeTiers, setVolumeTiers] = useState<VolumeTier[]>([]);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    setLoading(true);
    try {
      const [allPlans, allBundles, allTiers] = await Promise.all([
        // Load plans for all apps
        Promise.all([
          pricingService.getSubscriptionPlans('novumflow'),
          pricingService.getSubscriptionPlans('careflow'),
          pricingService.getSubscriptionPlans('complyflow')
        ]),
        pricingService.getSuiteBundles(),
        pricingService.getVolumeTiers()
      ]);

      setPlans({
        novumflow: allPlans[0],
        careflow: allPlans[1],
        complyflow: allPlans[2]
      });
      setBundles(allBundles);
      setVolumeTiers(allTiers);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async (
    appName: string,
    planId: string,
    employeeCount?: number,
    bedCount?: number,
    billingInterval: 'monthly' | 'yearly' = 'monthly'
  ) => {
    return pricingService.calculatePrice(appName, planId, employeeCount, bedCount, billingInterval);
  };

  return {
    loading,
    plans,
    bundles,
    volumeTiers,
    calculatePrice,
    formatPrice: pricingService.formatPrice.bind(pricingService),
    calculateROI: pricingService.calculateROI.bind(pricingService),
    getRecommendedPlan: pricingService.getRecommendedPlan.bind(pricingService),
    trackUsage: pricingService.trackUsage.bind(pricingService),
    getUsageMetrics: pricingService.getUsageMetrics.bind(pricingService)
  };
}