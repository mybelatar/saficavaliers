'use client';

import { type ReactNode, useEffect } from 'react';

interface ManagementModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function ManagementModal({
  title,
  isOpen,
  onClose,
  children,
  maxWidthClassName
}: ManagementModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(15,10,8,0.82)] px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <button
        aria-label="Fermer la fenetre"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className={joinClasses(
          'theme-card relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-3xl p-4 sm:max-h-[90vh] sm:p-5',
          maxWidthClassName ?? 'max-w-3xl'
        )}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="theme-panel-title">{title}</h3>
          <button
            className="theme-action-secondary rounded-xl px-3 py-1.5 text-sm"
            onClick={onClose}
            type="button"
          >
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
