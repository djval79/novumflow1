import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

export interface AnimatedCardProps extends MotionProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className = '', hover = true, delay = 0, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: delay * 0.1,
          ease: [0.4, 0, 0.2, 1]
        }}
        whileHover={hover ? { 
          y: -5, 
          scale: 1.02,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        } : {}}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';