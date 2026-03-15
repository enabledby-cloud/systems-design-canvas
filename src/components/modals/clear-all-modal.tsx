'use client';

/**
 * ClearAllModal - confirmation modal for clearing all canvas content.
 */

import { AlertTriangle } from 'lucide-react';
import { useSystemStore } from '@/store';

export function ClearAllModal() {
  const { isClearModalOpen, setIsClearModalOpen, handleClearAll } =
    useSystemStore();

  if (!isClearModalOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-600 w-96 max-w-full">
        <div className="flex items-center space-x-3 mb-4 text-red-400">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-semibold uppercase tracking-wider text-slate-100">
            Clear Canvas
          </h3>
        </div>

        <p className="text-sm text-slate-300 mb-6">
          Are you sure you want to delete all entities and connections in the
          current view? This cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsClearModalOpen(false)}
            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors shadow-lg shadow-red-900/50"
          >
            Yes, Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
