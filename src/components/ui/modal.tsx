'use client';

/**
 * Modal - Reusable modal primitive component.
 * Provides consistent backdrop, escape key handling, and structure for all modals.
 */

import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '@/utils/use-escape-key';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when modal requests to close */
  onClose: () => void;
  /** Modal title (optional - renders header if provided) */
  title?: React.ReactNode;
  /** Icon to show before title */
  titleIcon?: React.ReactNode;
  /** Modal size preset */
  size?: ModalSize;
  /** Main content */
  children: React.ReactNode;
  /** Footer content (typically buttons) */
  footer?: React.ReactNode;
  /** Whether to show close button in header */
  showCloseButton?: boolean;
  /** Custom className for the modal container */
  className?: string;
  /** Backdrop blur intensity */
  backdropBlur?: 'none' | 'sm' | 'md';
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'w-80 max-w-[95vw]',
  md: 'w-96 max-w-[95vw]',
  lg: 'w-[500px] max-w-[95vw]',
  xl: 'w-[700px] max-w-[95vw]',
};

const blurClasses: Record<string, string> = {
  none: '',
  sm: 'backdrop-blur-[1px]',
  md: 'backdrop-blur-sm',
};

export function Modal({
  isOpen,
  onClose,
  title,
  titleIcon,
  size = 'md',
  children,
  footer,
  showCloseButton = false,
  className = '',
  backdropBlur = 'sm',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEscapeKey(onClose, isOpen);

  // Focus trap - focus modal on open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${blurClasses[backdropBlur]}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`bg-github-surface rounded-xl shadow-2xl border border-github-border flex flex-col max-h-[90vh] ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-github-border">
            {title && (
              <h2 className="text-sm font-semibold text-github-text uppercase tracking-wider flex items-center gap-2">
                {titleIcon}
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 text-github-text-secondary hover:text-github-text hover:bg-github-elevated rounded transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-github-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ModalFooter - Helper for consistent footer button layout
 */
export interface ModalFooterProps {
  children: React.ReactNode;
  /** Align buttons: 'end' (default), 'between', 'start' */
  align?: 'start' | 'end' | 'between';
}

export function ModalFooter({ children, align = 'end' }: ModalFooterProps) {
  const alignClasses = {
    start: 'justify-start',
    end: 'justify-end',
    between: 'justify-between',
  };

  return <div className={`flex items-center gap-3 ${alignClasses[align]}`}>{children}</div>;
}
