'use client';

/**
 * TopBar component - main header with logo, layer controls, and action buttons.
 * Updated to work with React Flow (no canvas ref needed).
 */

import { GitCommit, Plus, Trash2, ArrowLeft, Code, Layers } from 'lucide-react';
import { useSystemStore } from '@/store';

export function TopBar() {
  const {
    viewDepth,
    currentPath,
    showJson,
    isFlattened,
    getMaxDepth,
    incrementViewDepth,
    decrementViewDepth,
    toggleShowJson,
    navigateUp,
    openNodeEditor,
    setIsClearModalOpen,
  } = useSystemStore();

  const flattened = isFlattened();
  const maxDepth = getMaxDepth();

  const handleAddEntity = () => {
    openNodeEditor(null);
  };

  return (
    <div className="flex items-center justify-between bg-github-surface border-b border-github-border px-4 h-14 z-20">
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 font-bold text-lg">
          <GitCommit size={24} className="text-accent-pink" />
          <span className="gradient-text-primary">System</span>
        </div>

        <div className="h-6 w-px bg-github-border mx-2 hidden sm:block" />

        {/* Layer Controls */}
        <div className="flex items-center space-x-1 bg-github-bg border border-github-border rounded-md p-1 mr-2 shadow-inner">
          <div className="px-2 text-xs font-semibold text-github-text-secondary uppercase tracking-wider flex items-center gap-1">
            <Layers size={14} /> Depth
          </div>
          <button
            onClick={decrementViewDepth}
            disabled={viewDepth === 0}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-github-elevated text-github-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Decrease view depth"
          >
            -
          </button>
          <div 
            className="min-w-[3rem] text-center text-sm font-mono font-bold text-accent-blue"
            title={maxDepth === 0 ? "No nested subsystems" : `Viewing depth ${viewDepth + 1} of ${maxDepth + 1} available levels`}
          >
            {viewDepth + 1}<span className="text-github-text-muted font-normal">/{maxDepth + 1}</span>
          </div>
          <button
            onClick={incrementViewDepth}
            disabled={viewDepth >= maxDepth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-github-elevated text-github-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Increase view depth"
          >
            +
          </button>
        </div>

        {/* Action Buttons (only when not flattened) */}
        {!flattened && (
          <>
            <button
              onClick={handleAddEntity}
              className="flex items-center space-x-1 bg-accent-blue hover:bg-accent-blue/80 text-white px-3 py-1.5 rounded-md text-sm transition-colors shadow-glow-blue/50 hover:shadow-glow-blue"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Entity</span>
            </button>
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center space-x-1 bg-accent-pink/20 hover:bg-accent-pink/30 text-accent-pink px-3 py-1.5 rounded-md text-sm transition-colors border border-accent-pink/30"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          </>
        )}

        {/* Go Up Button */}
        {currentPath.length > 0 && (
          <button
            onClick={() => navigateUp(currentPath.length - 1)}
            className="flex items-center space-x-1 bg-github-elevated hover:bg-github-border text-github-text px-3 py-1.5 rounded-md text-sm transition-colors border border-github-border"
          >
            <ArrowLeft size={16} />
            <span>Go Up</span>
          </button>
        )}
      </div>

      {/* Right side - JSON toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleShowJson}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors border ${
            showJson
              ? 'bg-github-elevated border-github-border text-github-text'
              : 'bg-github-bg border-github-border text-github-text-secondary hover:bg-github-elevated hover:text-github-text'
          }`}
        >
          <Code size={16} />
          <span>{showJson ? 'Hide JSON' : 'Show JSON'}</span>
        </button>
      </div>
    </div>
  );
}
