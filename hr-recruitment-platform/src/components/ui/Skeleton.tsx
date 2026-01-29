import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'circle' | 'text';
}

export function Skeleton({
    className,
    variant = 'default',
    ...props
}: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-gray-200/80 rounded-md",
                {
                    'rounded-full': variant === 'circle',
                    'h-4 w-full': variant === 'text',
                },
                className
            )}
            {...props}
        />
    );
}

// Pre-configured skeleton groups for common patterns
export function SkeletonCard() {
    return (
        <div className="p-6 rounded-2xl border border-gray-100 bg-white space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-12 w-full rounded-xl" />
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 rounded-xl border border-gray-50 bg-white">
                    <Skeleton variant="circle" className="h-10 w-10" />
                    <div className="space-y-2 flex-1">
                        <Skeleton variant="text" className="w-1/3" />
                        <Skeleton variant="text" className="w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}
