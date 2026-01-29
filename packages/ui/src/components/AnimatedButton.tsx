import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

export interface AnimatedButtonProps extends MotionProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
  ghost: 'text-blue-600 hover:bg-blue-100'
};

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', onClick, ...motionProps }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={`
          relative overflow-hidden rounded-lg font-medium transition-all duration-200
          ${buttonVariants[variant]}
          ${sizeVariants[size]}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        whileHover={!disabled && !loading ? { scale: 1.05, transition: { duration: 0.2 } } : {}}
        whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
        onClick={onClick}
        disabled={disabled || loading}
        {...motionProps}
      >
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-inherit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.span
          className={loading ? 'opacity-0' : 'opacity-100'}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
        
        <motion.div
          className="absolute inset-0 bg-white opacity-0 pointer-events-none"
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';