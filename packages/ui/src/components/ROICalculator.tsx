import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, Target, Calculator } from 'lucide-react';

interface ROICalculatorProps {
  currentCost: number;
  ourCost: number;
  timeSavedHours: number;
  hourlyRate?: number;
  currency?: string;
  className?: string;
}

interface ROIResult {
  costSavings: number;
  roiPercentage: number;
  paybackPeriodMonths: number;
  timeSavingsValue: number;
  totalAnnualValue: number;
}

export default function ROICalculator({
  currentCost,
  ourCost,
  timeSavedHours,
  hourlyRate = 25,
  currency = 'GBP',
  className = ''
}: ROICalculatorProps) {
  
  const calculateROI = (): ROIResult => {
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
  };

  const roi = calculateROI();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${Math.abs(percent).toFixed(0)}%`;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">ROI Analysis</h3>
            <p className="text-sm text-gray-600">Annual financial impact</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(roi.costSavings)}
            </div>
            <div className="text-sm text-gray-600">Annual Cost Savings</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercent(roi.roiPercentage)}
            </div>
            <div className="text-sm text-gray-600">Return on Investment</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {roi.paybackPeriodMonths.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Months to Payback</div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Cost Comparison</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Current System</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(currentCost * 12)}/year
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full" 
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">NovumFlow Suite</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(ourCost * 12)}/year
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min((ourCost / currentCost) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Time Savings */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-900">Time Savings</h4>
                <p className="text-sm text-gray-600">
                  {timeSavedHours} hours/month = {((timeSavedHours * 12) / 40).toFixed(0)} weeks/year
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(roi.timeSavingsValue)}
              </div>
              <div className="text-sm text-gray-600">Annual value</div>
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Total Annual Value</h4>
              <p className="text-sm text-gray-600">
                Cost savings + time savings value
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(roi.totalAnnualValue)}
              </div>
              <div className="text-sm text-gray-600">
                {formatPercent((roi.totalAnnualValue / (currentCost * 12)) * 100)} total value
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}