import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
        const variants = {
            primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
            secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
            danger: 'bg-rose-600 text-white hover:bg-rose-700',
            ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={loading || props.disabled}
                {...props}
            >
                {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
