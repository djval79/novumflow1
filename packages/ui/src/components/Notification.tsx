import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  isVisible: boolean;
  onClose: () => void;
}

const typeVariants = {
  success: 'bg-green-500 border-green-200',
  error: 'bg-red-500 border-red-200',
  warning: 'bg-yellow-500 border-yellow-200',
  info: 'bg-blue-500 border-blue-200'
};

export const Notification = ({ type, title, message, isVisible, onClose }: NotificationProps) => {
  return (
    <motion.div
      className={`
        fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border
        ${typeVariants[type]} text-white max-w-sm
      `}
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        x: isVisible ? 0 : 300, 
        scale: isVisible ? 1 : 0.8 
      }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{title}</h4>
          {message && <p className="text-sm opacity-90 mt-1">{message}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

export interface FormFieldProps {
  label: string;
  error?: string;
  success?: string;
  children: ReactNode;
  className?: string;
}

export const FormField = ({ label, error, success, children, className = '' }: FormFieldProps) => {
  return (
    <motion.div
      className={`mb-4 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-1 text-sm text-red-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            className="mt-1 text-sm text-green-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};