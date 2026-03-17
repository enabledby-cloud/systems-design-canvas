'use client';

/**
 * NodeEditorModal - modal for creating and editing nodes.
 */

import { useCallback } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useSystemStore } from '@/store';
import { generateId } from '@/utils';
import { useEscapeKey } from '@/utils/use-escape-key';
import type { Port } from '@/types';

export function NodeEditorModal() {
  const { editingNode, setEditingNode, saveNode } = useSystemStore();

  const handleClose = useCallback(() => {
    setEditingNode(null);
  }, [setEditingNode]);

  // Close on Escape key
  useEscapeKey(handleClose, !!editingNode);

  if (!editingNode) return null;

  const updateNode = (updates: Partial<typeof editingNode>) => {
    setEditingNode({ ...editingNode, ...updates });
  };

  const addPort = (type: 'inputs' | 'outputs') => {
    const prefix = type === 'inputs' ? 'in' : 'out';
    const newPort: Port = { id: generateId(prefix), name: 'New Port' };
    updateNode({ [type]: [...editingNode[type], newPort] });
  };

  const removePort = (type: 'inputs' | 'outputs', portId: string) => {
    updateNode({
      [type]: editingNode[type].filter((p: Port) => p.id !== portId),
    });
  };

  const updatePort = (
    type: 'inputs' | 'outputs',
    index: number,
    name: string
  ) => {
    const ports = [...editingNode[type]];
    ports[index] = { ...ports[index], name };
    updateNode({ [type]: ports });
  };

  const movePort = (
    type: 'inputs' | 'outputs',
    index: number,
    direction: 'up' | 'down'
  ) => {
    const ports = [...editingNode[type]];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Check bounds
    if (newIndex < 0 || newIndex >= ports.length) return;
    
    // Swap ports
    [ports[index], ports[newIndex]] = [ports[newIndex], ports[index]];
    updateNode({ [type]: ports });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-github-surface p-6 rounded-xl shadow-2xl border border-github-border w-[500px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-github-text mb-6 border-b border-github-border pb-2">
          {editingNode.isNew ? 'Create Entity' : 'Edit Entity'}
        </h2>

        <div className="space-y-5 overflow-y-auto pr-2 flex-1 custom-scrollbar">
          {/* External Entity Toggle */}
          <div className="flex items-center p-3 bg-github-bg/50 border border-github-border rounded-md">
            <input
              type="checkbox"
              id="external-toggle"
              checked={editingNode.isExternal}
              onChange={(e) => updateNode({ isExternal: e.target.checked })}
              className="w-4 h-4 text-accent-blue bg-github-bg border-github-border rounded focus:ring-accent-blue focus:ring-2"
            />
            <label
              htmlFor="external-toggle"
              className="ml-2 text-sm font-medium text-github-text cursor-pointer flex-1"
            >
              External Entity{' '}
              <span className="text-github-text-secondary text-xs font-normal ml-1">
                (Sits outside the System Boundary)
              </span>
            </label>
          </div>

          {/* Entity Name */}
          <div>
            <label className="block text-xs font-semibold text-github-text-secondary mb-1 uppercase tracking-wider">
              Entity Name
            </label>
            <input
              type="text"
              value={editingNode.name}
              onChange={(e) => updateNode({ name: e.target.value })}
              className="w-full bg-github-bg border border-github-border rounded-md px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-blue transition-all"
            />
          </div>

          {/* Process & Operand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-github-text-secondary mb-1 uppercase tracking-wider">
                Function: Process
              </label>
              <input
                type="text"
                value={editingNode.process || ''}
                onChange={(e) => updateNode({ process: e.target.value })}
                placeholder="e.g. Harvest"
                className="w-full bg-github-bg border border-github-border rounded-md px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-github-text-secondary mb-1 uppercase tracking-wider">
                Function: Operand
              </label>
              <input
                type="text"
                value={editingNode.operand || ''}
                onChange={(e) => updateNode({ operand: e.target.value })}
                placeholder="e.g. Materials"
                className="w-full bg-github-bg border border-github-border rounded-md px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-blue transition-all"
              />
            </div>
          </div>

          {/* Ports */}
          <div className="grid grid-cols-2 gap-6 pt-2 border-t border-github-border/50">
            {/* Inputs */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-github-text-secondary uppercase tracking-wider">
                  Inputs
                </label>
                <button
                  onClick={() => addPort('inputs')}
                  className="text-xs bg-github-elevated hover:bg-github-border text-github-text px-2 py-1 rounded transition-colors"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {editingNode.inputs.map((port: Port, idx: number) => (
                  <div key={port.id} className="flex space-x-1 items-center">
                    <div className="flex flex-col">
                      <button
                        onClick={() => movePort('inputs', idx, 'up')}
                        disabled={idx === 0}
                        className="text-github-text-muted hover:text-github-text disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => movePort('inputs', idx, 'down')}
                        disabled={idx === editingNode.inputs.length - 1}
                        className="text-github-text-muted hover:text-github-text disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={port.name}
                      onChange={(e) => updatePort('inputs', idx, e.target.value)}
                      className="flex-1 bg-github-bg border border-github-border rounded px-2 py-1.5 text-xs text-github-text focus:border-accent-green outline-none"
                    />
                    <button
                      onClick={() => removePort('inputs', port.id)}
                      className="text-github-text-muted hover:text-accent-pink p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {editingNode.inputs.length === 0 && (
                  <div className="text-xs text-github-text-muted italic text-center py-2">
                    No inputs
                  </div>
                )}
              </div>
            </div>

            {/* Outputs */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-github-text-secondary uppercase tracking-wider">
                  Outputs
                </label>
                <button
                  onClick={() => addPort('outputs')}
                  className="text-xs bg-github-elevated hover:bg-github-border text-github-text px-2 py-1 rounded transition-colors"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {editingNode.outputs.map((port: Port, idx: number) => (
                  <div key={port.id} className="flex space-x-1 items-center">
                    <div className="flex flex-col">
                      <button
                        onClick={() => movePort('outputs', idx, 'up')}
                        disabled={idx === 0}
                        className="text-github-text-muted hover:text-github-text disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => movePort('outputs', idx, 'down')}
                        disabled={idx === editingNode.outputs.length - 1}
                        className="text-github-text-muted hover:text-github-text disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={port.name}
                      onChange={(e) =>
                        updatePort('outputs', idx, e.target.value)
                      }
                      className="flex-1 bg-github-bg border border-github-border rounded px-2 py-1.5 text-xs text-github-text focus:border-accent-pink outline-none"
                    />
                    <button
                      onClick={() => removePort('outputs', port.id)}
                      className="text-github-text-muted hover:text-accent-pink p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {editingNode.outputs.length === 0 && (
                  <div className="text-xs text-github-text-muted italic text-center py-2">
                    No outputs
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-github-border">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-github-text-secondary hover:text-github-text hover:bg-github-elevated rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveNode}
            className="px-5 py-2 text-sm font-medium bg-accent-blue hover:bg-accent-blue/80 text-white rounded-md transition-colors shadow-glow-blue"
          >
            Save Entity
          </button>
        </div>
      </div>
    </div>
  );
}
