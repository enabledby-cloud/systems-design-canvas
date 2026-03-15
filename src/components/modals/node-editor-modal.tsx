'use client';

/**
 * NodeEditorModal - modal for creating and editing nodes.
 */

import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useSystemStore } from '@/store';
import { generateId } from '@/utils';
import type { Port } from '@/types';

export function NodeEditorModal() {
  const { editingNode, setEditingNode, saveNode } = useSystemStore();

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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 w-[500px] max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">
          {editingNode.isNew ? 'Create Entity' : 'Edit Entity'}
        </h2>

        <div className="space-y-5 overflow-y-auto pr-2 flex-1 custom-scrollbar">
          {/* External Entity Toggle */}
          <div className="flex items-center p-3 bg-slate-900/50 border border-slate-700 rounded-md">
            <input
              type="checkbox"
              id="external-toggle"
              checked={editingNode.isExternal}
              onChange={(e) => updateNode({ isExternal: e.target.checked })}
              className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
            />
            <label
              htmlFor="external-toggle"
              className="ml-2 text-sm font-medium text-slate-300 cursor-pointer flex-1"
            >
              External Entity{' '}
              <span className="text-slate-500 text-xs font-normal ml-1">
                (Sits outside the System Boundary)
              </span>
            </label>
          </div>

          {/* Entity Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Entity Name
            </label>
            <input
              type="text"
              value={editingNode.name}
              onChange={(e) => updateNode({ name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Process & Operand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Function: Process
              </label>
              <input
                type="text"
                value={editingNode.process || ''}
                onChange={(e) => updateNode({ process: e.target.value })}
                placeholder="e.g. Harvest"
                className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Function: Operand
              </label>
              <input
                type="text"
                value={editingNode.operand || ''}
                onChange={(e) => updateNode({ operand: e.target.value })}
                placeholder="e.g. Materials"
                className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          {/* Ports */}
          <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-700/50">
            {/* Inputs */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Inputs
                </label>
                <button
                  onClick={() => addPort('inputs')}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors"
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
                        className="text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => movePort('inputs', idx, 'down')}
                        disabled={idx === editingNode.inputs.length - 1}
                        className="text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={port.name}
                      onChange={(e) => updatePort('inputs', idx, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                    />
                    <button
                      onClick={() => removePort('inputs', port.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {editingNode.inputs.length === 0 && (
                  <div className="text-xs text-slate-500 italic text-center py-2">
                    No inputs
                  </div>
                )}
              </div>
            </div>

            {/* Outputs */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Outputs
                </label>
                <button
                  onClick={() => addPort('outputs')}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors"
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
                        className="text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => movePort('outputs', idx, 'down')}
                        disabled={idx === editingNode.outputs.length - 1}
                        className="text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 transition-colors"
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
                      className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                    />
                    <button
                      onClick={() => removePort('outputs', port.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {editingNode.outputs.length === 0 && (
                  <div className="text-xs text-slate-500 italic text-center py-2">
                    No outputs
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <button
            onClick={() => setEditingNode(null)}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveNode}
            className="px-5 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors shadow-lg shadow-cyan-900/50"
          >
            Save Entity
          </button>
        </div>
      </div>
    </div>
  );
}
