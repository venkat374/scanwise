import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = "",
    disabled = false,
    loading = false,
    type = "button"
}) => {
    const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500 border border-transparent",
        secondary: "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:ring-zinc-500",
        outline: "bg-transparent border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus:ring-emerald-500",
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:ring-red-500 border border-transparent",
        ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-transparent"
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </motion.button>
    );
};

export default Button;
