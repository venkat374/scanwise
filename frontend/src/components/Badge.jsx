import React from 'react';

const Badge = ({ children, variant = 'neutral' }) => {
    const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

    const variants = {
        success: "border-transparent bg-green-500/15 text-green-500 hover:bg-green-500/25",
        warning: "border-transparent bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25",
        danger: "border-transparent bg-red-500/15 text-red-500 hover:bg-red-500/25",
        neutral: "border-transparent bg-zinc-800 text-zinc-50 hover:bg-zinc-800/80",
        info: "border-transparent bg-blue-500/15 text-blue-500 hover:bg-blue-500/25"
    };

    return (
        <span className={`${baseStyles} ${variants[variant]}`}>
            {children}
        </span>
    );
};

export default Badge;
