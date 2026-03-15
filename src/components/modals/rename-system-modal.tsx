'use client';

/**
 * RenameSystemModal - modal for editing system properties (name and emergence).
 */

import { Settings } from 'lucide-react';
import { useSystemStore } from '@/store';

export function RenameSystemModal() {
  const { renameModal, setRenameModal, saveRename } = useSystemStore();

  if (!renameModal.isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRename();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-600 w-96">
        <h3 className="text-sm font-semibold text-slate-200 mb-5 uppercase tracking-wider flex items-center gap-2">
          <Settings size={16} className="text-indigo-400" /> System Properties
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              System Name
            </label>
            <input
              type="text"
              value={renameModal.name}
              onChange={(e) =>
                setRenameModal({ ...renameModal, name: e.target.value })
              }
              onKeyDown={handleKeyDown}
              placeholder="Enter system name"
              autoFocus
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex justify-between">
              <span>
                Emergence <span className="text-slate-500 italic">(Optional)</span>
              </span>
            </label>
            <input
              type="text"
              value={renameModal.emergence}
              onChange={(e) =>
                setRenameModal({ ...renameModal, emergence: e.target.value })
              }
              onKeyDown={handleKeyDown}
              placeholder="e.g. Continuous Flow of Value"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-1.5">
              The property or behavior that arises from the interaction of the
              parts, but is not present in the parts themselves.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <button
            onClick={() =>
              setRenameModal({ isOpen: false, name: '', emergence: '' })
            }
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveRename}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-lg shadow-indigo-900/50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
