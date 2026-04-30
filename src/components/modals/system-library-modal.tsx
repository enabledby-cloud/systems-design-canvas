'use client';

/**
 * SystemLibraryModal - Modal for browsing, loading, and managing saved systems.
 * Provides a visual interface for the system library with search, sort, and actions.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Trash2,
  FileDown,
  Copy,
  Clock,
  Box,
  GitBranch,
  FolderOpen,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useSystemStore } from '@/store';
import { StorageService, type SavedSystemMeta } from '@/utils/storage-service';
import { useEscapeKey } from '@/utils/use-escape-key';
import { Button } from '@/components/ui';

type SortKey = 'name' | 'updatedAt' | 'nodeCount';
type SortOrder = 'asc' | 'desc';

export function SystemLibraryModal() {
  const {
    isLibraryModalOpen,
    setIsLibraryModalOpen,
    loadSystemFromLibrary,
    deleteSystemFromLibrary,
    duplicateSystemInLibrary,
    savedSystems,
    createNewSystem,
    loadDefaultSystem,
  } = useSystemStore();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setIsLibraryModalOpen(false);
  }, [setIsLibraryModalOpen]);

  // Close on Escape key
  useEscapeKey(handleClose, isLibraryModalOpen);

  const filteredSystems = useMemo(() => {
    let result = [...savedSystems];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.emergence?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'nodeCount':
          comparison = a.nodeCount - b.nodeCount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [savedSystems, search, sortKey, sortOrder]);

  if (!isLibraryModalOpen) return null;

  const handleLoad = (id: string) => {
    loadSystemFromLibrary(id);
    setIsLibraryModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteSystemFromLibrary(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateSystemInLibrary(id);
  };

  const handleExport = (id: string) => {
    const system = StorageService.loadSystem(id);
    if (system) {
      StorageService.exportToFile(system.data);
    }
  };

  const handleNewSystem = () => {
    createNewSystem();
    setIsLibraryModalOpen(false);
  };

  const handleLoadDefault = () => {
    loadDefaultSystem();
    setIsLibraryModalOpen(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-github-surface rounded-xl shadow-2xl border border-github-border w-[700px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-github-border">
          <div className="flex items-center gap-3">
            <FolderOpen className="text-accent-blue" size={24} />
            <h2 className="text-lg font-semibold gradient-text-primary">Systems</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="!p-2"
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-github-border flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-github-text-secondary"
            />
            <input
              type="text"
              placeholder="Search systems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-github-bg border border-github-border rounded-lg pl-9 pr-4 py-2 text-sm text-github-text placeholder:text-github-text-muted focus:outline-none focus:border-accent-blue"
            />
          </div>

          <Button variant="primary" size="sm" onClick={handleNewSystem}>
            <Plus size={16} />
            <span>New</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadDefault}
            title="Load the example Engineering Support System"
          >
            <Sparkles size={16} className="text-accent-orange" />
            <span>Demo</span>
          </Button>
        </div>

        {/* Sort Controls */}
        <div className="px-6 py-2 border-b border-github-border flex items-center gap-4 text-xs text-github-text-secondary">
          <span>Sort by:</span>
          {(['name', 'updatedAt', 'nodeCount'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`px-2 py-1 rounded transition-colors ${
                sortKey === key
                  ? 'bg-github-elevated text-github-text'
                  : 'hover:bg-github-elevated/50'
              }`}
            >
              {key === 'name' && 'Name'}
              {key === 'updatedAt' && 'Last Modified'}
              {key === 'nodeCount' && 'Size'}
              {sortKey === key && (
                <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>

        {/* System List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {filteredSystems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-github-text-secondary py-12">
              {savedSystems.length === 0 ? (
                <>
                  <FolderOpen size={48} className="mb-4 opacity-50" />
                  <p className="text-lg mb-2">No saved systems yet</p>
                  <p className="text-sm text-github-text-muted mb-4">
                    Save your current system or create a new one to get started.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="primary" onClick={handleNewSystem}>
                      <Plus size={16} />
                      New System
                    </Button>
                    <Button variant="secondary" onClick={handleLoadDefault}>
                      <Sparkles size={16} className="text-accent-orange" />
                      Load Demo
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Search size={48} className="mb-4 opacity-50" />
                  <p className="text-lg">No systems match your search</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredSystems.map((system) => (
                <div
                  key={system.id}
                  className="group bg-github-bg border border-github-border rounded-lg p-4 hover:border-accent-blue/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-github-text truncate">
                        {system.name}
                      </h3>
                      {system.emergence && (
                        <p className="text-sm text-accent-green truncate mt-0.5">
                          → {system.emergence}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-github-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(system.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Box size={12} />
                          {system.nodeCount} nodes
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch size={12} />
                          {system.edgeCount} edges
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleLoad(system.id)}
                        className="px-3 py-1.5 bg-accent-blue hover:bg-accent-blue/80 text-white text-xs rounded transition-colors"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDuplicate(system.id)}
                        className="p-1.5 hover:bg-github-elevated rounded transition-colors text-github-text-secondary hover:text-github-text"
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleExport(system.id)}
                        className="p-1.5 hover:bg-github-elevated rounded transition-colors text-github-text-secondary hover:text-github-text"
                        title="Export to file"
                      >
                        <FileDown size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(system.id)}
                        className={`p-1.5 rounded transition-colors ${
                          confirmDelete === system.id
                            ? 'bg-accent-pink text-white'
                            : 'hover:bg-github-elevated text-github-text-secondary hover:text-accent-pink'
                        }`}
                        title={confirmDelete === system.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {confirmDelete === system.id && (
                    <div className="mt-3 pt-3 border-t border-github-border flex items-center justify-between">
                      <span className="text-xs text-accent-pink">
                        Are you sure you want to delete this system?
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-xs text-github-text-secondary hover:text-github-text"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(system.id)}
                          className="px-2 py-1 text-xs bg-accent-pink text-white rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-github-border flex items-center justify-between text-xs text-github-text-secondary">
          <span>{savedSystems.length} system{savedSystems.length !== 1 ? 's' : ''} saved</span>
          <span className="text-github-text-muted">
            Data stored in browser localStorage
          </span>
        </div>
      </div>
    </div>
  );
}
