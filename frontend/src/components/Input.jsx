import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', ...props }) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">{label}</label>}
            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...props}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...props}
                />
            )}
        </div>
    );
};

export default Input;
