import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-2 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  };

  const variantStyles = {
    primary: 'bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white focus:ring-[#1E3A8A] shadow-sm',
    secondary: 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1]',
    outline: 'border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC]',
    danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white focus:ring-[#DC2626]',
    success: 'bg-[#16A34A] hover:bg-[#15803D] text-white focus:ring-[#16A34A]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
