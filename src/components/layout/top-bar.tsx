'use client';

/**
 * TopBar component - main header with logo, layer controls, and action buttons.
 * Updated to work with React Flow (no canvas ref needed).
 */

import { GitCommit, Plus, Trash2, ArrowLeft, Layers, Save, FolderOpen, Download, Upload, Sparkles, Library } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Button } from '@/components/ui';

export function TopBar() {
  const {
    viewDepth,
    currentPath,
    hasUnsavedChanges,
    isFlattened,
    getMaxDepth,
    incrementViewDepth,
    decrementViewDepth,
    navigateUp,
    openNodeEditor,
    setIsClearModalOpen,
    saveToLibrary,
    setIsLibraryModalOpen,
    setIsExportModalOpen,
    setIsImportModalOpen,
    setIsEntityPickerOpen,
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

        {/* File Actions */}
        <div className="flex items-center space-x-1">
          <Button
            onClick={() => saveToLibrary()}
            variant={hasUnsavedChanges ? 'primary' : 'secondary'}
            size="sm"
            icon={<Save size={16} />}
            className={hasUnsavedChanges ? 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30 shadow-none' : ''}
            title={hasUnsavedChanges ? 'Save changes' : 'Already saved'}
          >
            <span className="hidden md:inline">Save</span>
          </Button>
          <Button
            onClick={() => setIsLibraryModalOpen(true)}
            variant="secondary"
            size="sm"
            icon={<FolderOpen size={16} />}
            title="Open saved systems"
          >
            <span className="hidden md:inline">Systems</span>
          </Button>
          <Button
            onClick={() => setIsExportModalOpen(true)}
            variant="secondary"
            size="sm"
            icon={<Download size={16} />}
            title="Export system JSON"
          >
            <span className="hidden md:inline">Export</span>
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="secondary"
            size="sm"
            icon={<Upload size={16} />}
            title="Import system JSON"
          >
            <span className="hidden md:inline">Import</span>
          </Button>
        </div>

        <div className="h-6 w-px bg-github-border mx-2 hidden lg:block" />

        {/* Layer Controls */}
        <div className="hidden lg:flex items-center space-x-1 bg-github-bg border border-github-border rounded-md p-1 mr-2 shadow-inner">
          <div className="px-2 text-xs font-semibold text-github-text-secondary uppercase tracking-wider flex items-center gap-1">
            <Layers size={14} /> Depth
          </div>
          <Button
            onClick={decrementViewDepth}
            disabled={viewDepth === 0}
            variant="ghost"
            size="sm"
            className="w-6 h-6 !p-0"
            aria-label="Decrease view depth"
          >
            -
          </Button>
          <div 
            className="min-w-[3rem] text-center text-sm font-mono font-bold text-accent-blue"
            title={maxDepth === 0 ? "No nested subsystems" : `Viewing depth ${viewDepth + 1} of ${maxDepth + 1} available levels`}
          >
            {viewDepth + 1}<span className="text-github-text-muted font-normal">/{maxDepth + 1}</span>
          </div>
          <Button
            onClick={incrementViewDepth}
            disabled={viewDepth >= maxDepth}
            variant="ghost"
            size="sm"
            className="w-6 h-6 !p-0"
            aria-label="Increase view depth"
          >
            +
          </Button>
        </div>

        {/* Action Buttons (only when not flattened) */}
        {!flattened && (
          <>
            <Button
              onClick={() => setIsEntityPickerOpen(true)}
              variant="primary"
              size="sm"
              icon={<Library size={16} />}
              title="Browse entity library"
            >
              <span className="hidden sm:inline">Entities</span>
            </Button>
            <Button
              onClick={handleAddEntity}
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              title="Add blank entity"
            >
              <span className="hidden sm:inline">Empty Component</span>
            </Button>
            <Button
              onClick={() => setIsClearModalOpen(true)}
              variant="danger"
              size="sm"
              icon={<Trash2 size={16} />}
            >
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          </>
        )}

        {/* Go Up Button */}
        {currentPath.length > 0 && (
          <Button
            onClick={() => navigateUp(currentPath.length - 1)}
            variant="secondary"
            size="sm"
            icon={<ArrowLeft size={16} />}
          >
            Go Up
          </Button>
        )}
      </div>
    </div>
  );
}
