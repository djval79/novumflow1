import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeVariants = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

export const Modal = ({ isOpen, onClose, children, size = 'md', className = '' }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              className={`
                bg-white rounded-xl shadow-2xl w-full ${sizeVariants[size]} 
                max-h-[90vh] overflow-y-auto
                ${className}
              `}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip = ({ children, content, position = 'top', className = '' }: TooltipProps) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      {children}
      <motion.div
        className={`
          absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded-lg whitespace-nowrap
          ${positionClasses[position]}
          ${className}
        `}
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {content}
        <motion.div
          className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
          style={{
            [position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']: '-4px',
            [position === 'top' || position === 'bottom' ? 'left' : 'top']: '50%',
            [position === 'top' || position === 'bottom' ? 'transform' : '']: 'translateX(-50%)'
          }}
        />
      </motion.div>
    </div>
  );
};