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
      <div className="bg-github-surface p-6 rounded-xl shadow-2xl border border-github-border w-96">
        <h3 className="text-sm font-semibold text-github-text mb-5 uppercase tracking-wider flex items-center gap-2">
          <Settings size={16} className="text-accent-blue" /> System Properties
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs text-github-text-secondary mb-1.5">
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
              className="w-full bg-github-bg border border-github-border rounded px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-github-text-secondary mb-1.5 flex justify-between">
              <span>
                Emergence <span className="text-github-text-muted italic">(Optional)</span>
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
              className="w-full bg-github-bg border border-github-border rounded px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
            />
            <p className="text-[10px] text-github-text-muted mt-1.5">
              The property or behavior that arises from the interaction of the
              parts, but is not present in the parts themselves.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-github-border">
          <button
            onClick={() =>
              setRenameModal({ isOpen: false, name: '', emergence: '' })
            }
            className="px-4 py-2 text-sm font-medium text-github-text-secondary hover:text-github-text hover:bg-github-elevated rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveRename}
            className="px-5 py-2 text-sm font-medium bg-accent-blue hover:bg-accent-blue/80 text-white rounded-md transition-colors shadow-glow-blue"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
