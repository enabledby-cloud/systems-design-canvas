'use client';

/**
 * EdgeEditorModal - modal for editing edge properties.
 */

import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useSystemStore } from '@/store';
import { useEscapeKey } from '@/utils/use-escape-key';

export function EdgeEditorModal() {
  const { editingEdge, setEditingEdge, saveEdge, deleteEditingEdge } =
    useSystemStore();

  const handleClose = useCallback(() => {
    setEditingEdge(null);
  }, [setEditingEdge]);

  // Close on Escape key
  useEscapeKey(handleClose, !!editingEdge);

  if (!editingEdge) return null;

  const updateEdge = (updates: Partial<typeof editingEdge>) => {
    setEditingEdge({ ...editingEdge, ...updates });
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
      onClick={handleClose}
    >
      <div
        className="bg-github-surface p-5 rounded-xl shadow-2xl border border-github-border w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-github-text mb-4 uppercase tracking-wider">
          Edit Connection
        </h3>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-github-text-secondary mb-1">
            Interaction (What flows)
          </label>
          <input
            type="text"
            value={editingEdge.interaction || editingEdge.label || ''}
            onChange={(e) =>
              updateEdge({ interaction: e.target.value, label: e.target.value })
            }
            placeholder="e.g. Material"
            className="w-full bg-github-bg border border-github-border rounded px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-github-text-secondary mb-1">
            Structure (Physical medium)
          </label>
          <input
            type="text"
            value={editingEdge.structure || ''}
            onChange={(e) => updateEdge({ structure: e.target.value })}
            placeholder="e.g. Pipeline, Truck"
            className="w-full bg-github-bg border border-github-border rounded px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={deleteEditingEdge}
            className="text-xs text-accent-pink hover:text-accent-pink/80 flex items-center gap-1 p-1 rounded hover:bg-accent-pink/10 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <div className="flex space-x-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-github-text-secondary hover:bg-github-elevated hover:text-github-text rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdge}
              className="px-3 py-1.5 text-xs bg-accent-blue hover:bg-accent-blue/80 text-white rounded transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
