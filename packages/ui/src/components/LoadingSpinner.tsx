import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

const sizeVariants = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

const colorVariants = {
  primary: 'border-blue-600',
  secondary: 'border-gray-600',
  white: 'border-white'
};

export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}: LoadingSpinnerProps) => {
  return (
    <motion.div
      className={`
        ${sizeVariants[size]} 
        ${colorVariants[color]} 
        border-2 border-t-transparent rounded-full
        ${className}
      `}
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    />
  );
};

export interface PageLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PageLoader = ({ isLoading, children, fallback }: PageLoaderProps) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loader"
          className="flex items-center justify-center min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {fallback || (
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" />
              <motion.p
                className="text-gray-600 text-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Loading...
              </motion.p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  rounded = false 
}: SkeletonProps) => {
  return (
    <motion.div
      className={`
        bg-gray-300 
        ${rounded ? 'rounded-full' : 'rounded'} 
        ${className}
      `}
      style={{ width, height }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
};