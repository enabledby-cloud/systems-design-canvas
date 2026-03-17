'use client';

/**
 * ClearAllModal - confirmation modal for clearing all canvas content.
 */

import { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSystemStore } from '@/store';
import { useEscapeKey } from '@/utils/use-escape-key';

export function ClearAllModal() {
  const { isClearModalOpen, setIsClearModalOpen, handleClearAll } =
    useSystemStore();

  const handleClose = useCallback(() => {
    setIsClearModalOpen(false);
  }, [setIsClearModalOpen]);

  // Close on Escape key
  useEscapeKey(handleClose, isClearModalOpen);

  if (!isClearModalOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
      onClick={handleClose}
    >
      <div
        className="bg-github-surface p-6 rounded-xl shadow-2xl border border-github-border w-96 max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4 text-accent-pink">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-semibold uppercase tracking-wider text-github-text">
            Clear Canvas
          </h3>
        </div>

        <p className="text-sm text-github-text-secondary mb-6">
          Are you sure you want to delete all entities and connections in the
          current view? This cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-github-text-secondary hover:bg-github-elevated hover:text-github-text rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm bg-accent-pink hover:bg-accent-pink/80 text-white rounded transition-colors shadow-glow-pink"
          >
            Yes, Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
