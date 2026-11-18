import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-slideUp bg-white border-[#E2E8F0]">
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
      )}
      <span className="text-[#0F172A]">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#94A3B8] hover:text-[#0F172A] p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
