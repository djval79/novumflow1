/**
 * KPIsTable Component
 * 
 * Displays KPI definitions and values using GenericCRUDTable
 * Supports filtering and viewing KPI performance metrics
 */

import React, { useMemo } from 'react';
import { TrendingUp, Edit, Trash2, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { GenericCRUDTable, Column, Action } from '@/components/shared/crud/GenericCRUDTable';
import { useKPIs, KPIDefinition } from '@/hooks';
import { log } from '@/lib/logger';

interface KPIsTableProps {
  searchTerm?: string;
  isAdmin?: boolean;
  onAddNew: () => void;
  onEdit: (kpi: KPIDefinition) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function KPIsTable({
  searchTerm = '',
  isAdmin = false,
  onAddNew,
  onEdit,
  onSuccess,
  onError,
}: KPIsTableProps) {
  // Fetch KPI definitions using React Query
  const { data: kpis = [], isLoading, error } = useKPIs();

  // Filter KPIs based on search term
  const filteredKPIs = useMemo(() => {
    if (!searchTerm) return kpis;
    const lowerSearch = searchTerm.toLowerCase();
    return kpis.filter(kpi =>
      kpi.name?.toLowerCase().includes(lowerSearch) ||
      kpi.category?.toLowerCase().includes(lowerSearch) ||
      kpi.description?.toLowerCase().includes(lowerSearch)
    );
  }, [kpis, searchTerm]);

  // Handle KPI deactivation (KPIs should typically be deactivated, not deleted)
  const handleDeactivate = async (kpi: KPIDefinition) => {
    if (!window.confirm('Are you sure you want to deactivate this KPI definition?')) {
      return;
    }

    // Note: In a real implementation, this would call an update mutation
    // to set is_active = false. For now, we just show the action.
    log.track('kpi_deactivate_requested', { kpiId: kpi.id });
    onError?.('KPI deactivation not implemented - KPIs should be updated, not deleted');
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      sales: 'bg-green-100 text-green-800',
      marketing: 'bg-blue-100 text-blue-800',
      operations: 'bg-purple-100 text-purple-800',
      finance: 'bg-yellow-100 text-yellow-800',
      hr: 'bg-pink-100 text-pink-800',
      customer_success: 'bg-indigo-100 text-indigo-800',
      engineering: 'bg-orange-100 text-orange-800',
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Define table columns
  const columns: Column<KPIDefinition>[] = useMemo(() => [
    {
      key: 'name',
      label: 'KPI Name',
      sortable: true,
      render: (kpi) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{kpi.name}</div>
            {kpi.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs" title={kpi.description}>
                {kpi.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (kpi) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getCategoryColor(kpi.category)}`}>
          {kpi.category?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'measurement_unit',
      label: 'Unit',
      render: (kpi) => (
        <span className="text-sm text-gray-600">{kpi.measurement_unit || '-'}</span>
      ),
    },
    {
      key: 'target_value',
      label: 'Default Target',
      render: (kpi) => (
        <span className="text-sm font-medium text-gray-900">
          {kpi.target_value ?? kpi.default_target ?? 'Not set'}
          {kpi.measurement_unit && ` ${kpi.measurement_unit}`}
        </span>
      ),
    },
    {
      key: 'calculation_method',
      label: 'Calculation',
      render: (kpi) => (
        <span className="text-sm text-gray-600 capitalize">
          {kpi.calculation_method?.replace(/_/g, ' ') || 'Manual'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (kpi) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          kpi.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {kpi.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ], []);

  // Define row actions
  const actions: Action<KPIDefinition>[] = useMemo(() => {
    const actionsList: Action<KPIDefinition>[] = [
      {
        label: 'Edit',
        icon: Edit,
        onClick: onEdit,
        variant: 'primary',
      },
    ];

    if (isAdmin) {
      actionsList.push({
        label: 'Deactivate',
        icon: Trash2,
        onClick: handleDeactivate,
        variant: 'danger',
        show: (kpi) => kpi.is_active !== false,
      });
    }

    return actionsList;
  }, [onEdit, isAdmin]);

  return (
    <GenericCRUDTable
      data={filteredKPIs}
      columns={columns}
      loading={isLoading}
      error={error?.message}
      actions={actions}
      onAdd={isAdmin ? onAddNew : undefined}
      searchable={false}
      emptyMessage="No KPI definitions found"
    />
  );
}

export default KPIsTable;
