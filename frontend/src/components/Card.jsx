import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, title, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
