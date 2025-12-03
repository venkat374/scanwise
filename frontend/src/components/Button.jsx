import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = "",
    disabled = false,
    loading = false,
    type = "button"
}) => {
    const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 focus:ring-emerald-500",
        secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-500",
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:ring-red-500",
        ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
