'use client';

/**
 * EdgeEditorModal - modal for editing edge properties.
 */

import { Trash2 } from 'lucide-react';
import { useSystemStore } from '@/store';

export function EdgeEditorModal() {
  const { editingEdge, setEditingEdge, saveEdge, deleteEditingEdge } =
    useSystemStore();

  if (!editingEdge) return null;

  const updateEdge = (updates: Partial<typeof editingEdge>) => {
    setEditingEdge({ ...editingEdge, ...updates });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-slate-800 p-5 rounded-xl shadow-2xl border border-slate-600 w-80">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wider">
          Edit Connection
        </h3>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Interaction (What flows)
          </label>
          <input
            type="text"
            value={editingEdge.interaction || editingEdge.label || ''}
            onChange={(e) =>
              updateEdge({ interaction: e.target.value, label: e.target.value })
            }
            placeholder="e.g. Material"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Structure (Physical medium)
          </label>
          <input
            type="text"
            value={editingEdge.structure || ''}
            onChange={(e) => updateEdge({ structure: e.target.value })}
            placeholder="e.g. Pipeline, Truck"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={deleteEditingEdge}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 p-1 rounded hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => setEditingEdge(null)}
              className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdge}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
