import React from 'react';

const Card = ({ children, title, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg tracking-tight">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
