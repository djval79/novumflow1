import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Download, Mail, MoreHorizontal, X } from 'lucide-react';
import { log } from '@/lib/logger';

interface BulkActionsProps<T> {
    items: T[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    getId: (item: T) => string;
    actions?: BulkAction[];
    children: (params: {
        isSelected: (id: string) => boolean;
        toggleSelection: (id: string) => void;
    }) => React.ReactNode;
}

interface BulkAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    variant?: 'default' | 'danger';
    onClick: (selectedIds: string[]) => void;
}

export default function BulkActions<T>({
    items,
    selectedIds,
    onSelectionChange,
    getId,
    actions = [],
    children,
}: BulkActionsProps<T>) {
    const [showActions, setShowActions] = useState(false);

    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

    function toggleAll() {
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(items.map(getId)));
        }
    }

    function toggleSelection(id: string) {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        onSelectionChange(newSelection);
    }

    function isSelected(id: string): boolean {
        return selectedIds.has(id);
    }

    function handleAction(action: BulkAction) {
        action.onClick(Array.from(selectedIds));
        setShowActions(false);
    }

    function clearSelection() {
        onSelectionChange(new Set());
    }

    const defaultActions: BulkAction[] = [
        {
            id: 'export',
            label: 'Export Selected',
            icon: <Download className="w-4 h-4" />,
            onClick: (ids) => log.debug('Bulk Export triggered', { component: 'BulkActions', action: 'export', metadata: { ids } }),
        },
        {
            id: 'email',
            label: 'Send Email',
            icon: <Mail className="w-4 h-4" />,
            onClick: (ids) => log.debug('Bulk Email triggered', { component: 'BulkActions', action: 'email', metadata: { ids } }),
        },
        {
            id: 'delete',
            label: 'Delete Selected',
            icon: <Trash2 className="w-4 h-4" />,
            variant: 'danger',
            onClick: (ids) => log.debug('Bulk Delete triggered', { component: 'BulkActions', action: 'delete', metadata: { ids } }),
        },
    ];

    const allActions = [...defaultActions, ...actions];

    return (
        <div>
            {/* Selection Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={clearSelection}
                            className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-indigo-700">
                            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {allActions.slice(0, 3).map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleAction(action)}
                                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition ${action.variant === 'danger'
                                    ? 'text-red-700 hover:bg-red-100'
                                    : 'text-indigo-700 hover:bg-indigo-100'
                                    }`}
                            >
                                {action.icon}
                                <span className="ml-2">{action.label}</span>
                            </button>
                        ))}

                        {allActions.length > 3 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {showActions && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowActions(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                                            {allActions.slice(3).map(action => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => handleAction(action)}
                                                    className={`w-full flex items-center px-4 py-2 text-sm ${action.variant === 'danger'
                                                        ? 'text-red-700 hover:bg-red-50'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {action.icon}
                                                    <span className="ml-2">{action.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Select All Header */}
            <div className="flex items-center mb-2">
                <button
                    onClick={toggleAll}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                    {allSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 mr-2" />
                    ) : someSelected ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 bg-indigo-100 rounded mr-2 flex items-center justify-center">
                            <div className="w-2 h-0.5 bg-indigo-600" />
                        </div>
                    ) : (
                        <Square className="w-5 h-5 text-gray-400 mr-2" />
                    )}
                    {allSelected ? 'Deselect All' : 'Select All'}
                </button>

                {items.length > 0 && (
                    <span className="ml-3 text-xs text-gray-500">
                        ({items.length} total)
                    </span>
                )}
            </div>

            {/* Children with selection context */}
            {children({ isSelected, toggleSelection })}
        </div>
    );
}

// Selection Checkbox Component
export function SelectionCheckbox({
    checked,
    onChange
}: {
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
            className="flex-shrink-0"
        >
            {checked ? (
                <CheckSquare className="w-5 h-5 text-indigo-600" />
            ) : (
                <Square className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
            )}
        </button>
    );
}
