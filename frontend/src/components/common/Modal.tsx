import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] overflow-y-auto"
    >
      {/* Darkened Blur Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-200 z-0"
        aria-hidden="true"
      />

      {/* Top-aligned Scrollable Wrapper with Generous Headroom */}
      <div
        onClick={onClose}
        className="relative z-10 min-h-full flex items-start justify-center px-4 pt-16 sm:pt-24 pb-16 text-center"
      >
        {/* Modal Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={twMerge(
            clsx(
              'relative w-full max-h-[min(78vh,680px)] flex flex-col bg-[#0e0e13] border border-white/15 rounded-3xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.95)] p-6 sm:p-8 text-left animate-slide-up',
              maxWidthStyles[maxWidth]
            )
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-white/10 shrink-0">
              <div className="min-w-0 flex-1">
                {title && (
                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 -mr-1"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Content Body (Scrollable) */}
          <div className="overflow-y-auto flex-1 pr-1.5 -mr-1.5 space-y-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
