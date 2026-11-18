import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantStyles = {
    neutral: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
    primary: 'bg-[#EFF6FF] text-[#1E3A8A] border border-[#BFDBFE]',
    success: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
    warning: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
    purple: 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
