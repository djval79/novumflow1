
import React from 'react';

// Base Skeleton component with shimmer animation
export const Skeleton: React.FC<{
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded' | 'premium';
    width?: string | number;
    height?: string | number;
}> = ({ className = '', variant = 'rectangular', width, height }) => {
    const baseClasses = 'animate-pulse bg-slate-100/50';

    const variantClasses = {
        text: 'rounded-lg',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-[1.5rem]',
        premium: 'rounded-[3rem]'
    };

    const style: React.CSSProperties = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%')
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Card Skeleton for dashboard cards
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white rounded-[3rem] border border-slate-50 p-10 shadow-2xl ${className}`}>
        <div className="flex items-center justify-between mb-8">
            <Skeleton variant="premium" width={64} height={64} />
            <Skeleton variant="rounded" width={100} height={32} />
        </div>
        <Skeleton variant="text" className="mb-4" height={16} width="60%" />
        <Skeleton variant="text" height={32} width="40%" />
    </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
    <tr className="border-b border-slate-50/50">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-10 py-8">
                <Skeleton variant="text" height={20} width={i === 0 ? '80%' : '60%'} />
            </td>
        ))}
    </tr>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 5
}) => (
    <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-2xl">
        <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <Skeleton variant="text" width={200} height={24} />
            <Skeleton variant="premium" width={150} height={48} />
        </div>
        <table className="w-full">
            <thead className="bg-slate-50/50">
                <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} className="px-10 py-6 text-left">
                            <Skeleton variant="text" height={14} width={100} />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    </div>
);

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => (
    <div className="flex items-center gap-6 p-8 border-b border-slate-50 last:border-0">
        <Skeleton variant="circular" width={56} height={56} />
        <div className="flex-1">
            <Skeleton variant="text" height={18} width="60%" className="mb-3" />
            <Skeleton variant="text" height={14} width="40%" />
        </div>
        <Skeleton variant="rounded" width={80} height={32} />
    </div>
);

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-12 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
                <Skeleton variant="text" height={60} width={400} />
                <Skeleton variant="text" height={16} width={300} />
            </div>
            <Skeleton variant="premium" width={200} height={64} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
                <div className="bg-white rounded-[4.5rem] border border-slate-100 p-12 shadow-2xl">
                    <Skeleton variant="text" height={24} width={200} className="mb-8" />
                    <Skeleton variant="rounded" height={400} />
                </div>
            </div>
            <div className="bg-white rounded-[4rem] border border-slate-100 p-8 shadow-2xl flex flex-col">
                <Skeleton variant="text" height={24} width={150} className="mb-8 px-4" />
                <div className="flex-1 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <ListItemSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Page Header Skeleton
export const PageHeaderSkeleton: React.FC = () => (
    <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-12">
        <div className="space-y-4">
            <Skeleton variant="text" height={48} width={250} />
            <Skeleton variant="text" height={14} width={350} />
        </div>
        <div className="flex gap-6">
            <Skeleton variant="premium" width={140} height={56} />
            <Skeleton variant="premium" width={160} height={56} />
        </div>
    </div>
);

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
    <div className="bg-white rounded-[4rem] border border-slate-100 p-16 space-y-12 shadow-2xl">
        {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-4">
                <Skeleton variant="text" height={14} width={120} className="ml-4" />
                <Skeleton variant="rounded" height={64} />
            </div>
        ))}
        <div className="flex gap-6 pt-8">
            <Skeleton variant="premium" width={140} height={64} />
            <Skeleton variant="premium" width={100} height={64} />
        </div>
    </div>
);

// People/Staff List Skeleton
export const PeopleListSkeleton: React.FC = () => (
    <div className="space-y-12">
        <PageHeaderSkeleton />
        <div className="flex gap-6 mb-8 bg-white border border-slate-100 p-6 rounded-[3rem] w-fit shadow-2xl">
            <Skeleton variant="rounded" width={250} height={48} />
            <Skeleton variant="rounded" width={140} height={48} />
            <Skeleton variant="rounded" width={140} height={48} />
        </div>
        <TableSkeleton rows={8} columns={6} />
    </div>
);

// Shift/Schedule Skeleton
export const ScheduleSkeleton: React.FC = () => (
    <div className="space-y-12">
        <PageHeaderSkeleton />
        <div className="bg-white rounded-[4.5rem] border border-slate-100 overflow-hidden shadow-2xl flex flex-col">
            {/* Calendar Header */}
            <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                <div className="flex items-center gap-6">
                    <Skeleton variant="circular" width={48} height={48} />
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="circular" width={48} height={48} />
                </div>
                <div className="flex gap-4 p-2 bg-white border border-slate-100 rounded-[2rem] shadow-xl">
                    <Skeleton variant="rounded" width={100} height={48} />
                    <Skeleton variant="rounded" width={100} height={48} />
                </div>
            </div>
            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 border-b border-slate-50">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="p-8 border-r border-slate-50 last:border-r-0 text-center">
                        <Skeleton variant="text" height={16} width={40} className="mx-auto" />
                    </div>
                ))}
            </div>
            {/* Time Slots */}
            <div className="divide-y divide-slate-50">
                {Array.from({ length: 5 }).map((_, row) => (
                    <div key={row} className="grid grid-cols-7">
                        {Array.from({ length: 7 }).map((_, col) => (
                            <div key={col} className="p-4 h-40 border-r border-slate-50 last:border-r-0 relative group">
                                {Math.random() > 0.4 && (
                                    <Skeleton variant="rounded" height={100} className="shadow-xl" />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Chat/Messages Skeleton
export const MessagesSkeleton: React.FC = () => (
    <div className="flex h-full gap-10 animate-in fade-in duration-1000">
        {/* Conversation List */}
        <div className="w-[450px] bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-2xl flex flex-col">
            <div className="px-10 py-12 border-b border-slate-50 flex flex-col gap-6">
                <Skeleton variant="text" width={150} height={28} />
                <Skeleton variant="rounded" height={60} />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-8 flex gap-6 items-center">
                        <Skeleton variant="circular" width={64} height={64} />
                        <div className="flex-1 space-y-3">
                            <Skeleton variant="text" height={18} width="70%" />
                            <Skeleton variant="text" height={14} width="50%" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
        {/* Message Area */}
        <div className="flex-1 bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-12 py-10 border-b border-slate-50 flex items-center gap-6 bg-slate-50/20">
                <Skeleton variant="circular" width={56} height={56} />
                <div className="space-y-2">
                    <Skeleton variant="text" height={20} width={150} />
                    <Skeleton variant="text" height={12} width={100} />
                </div>
            </div>
            <div className="flex-1 p-16 space-y-12 overflow-y-auto scrollbar-hide">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <Skeleton
                            variant="rounded"
                            width={i % 2 === 0 ? '60%' : '50%'}
                            height={120}
                            className="shadow-xl"
                        />
                    </div>
                ))}
            </div>
            <div className="p-12 border-t border-slate-50 bg-slate-50/20">
                <Skeleton variant="premium" height={80} />
            </div>
        </div>
    </div>
);

export default Skeleton;
