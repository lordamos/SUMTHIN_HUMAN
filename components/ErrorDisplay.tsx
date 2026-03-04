import React from 'react';
import { motion } from 'framer-motion';
import { ErrorIcon } from './Icons';

interface ErrorDisplayProps {
  message: string;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between gap-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-300"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <ErrorIcon />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button 
        onClick={onDismiss} 
        className="p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Dismiss error message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

export default ErrorDisplay;
