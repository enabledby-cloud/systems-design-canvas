'use client';

/**
 * NodeEditorModal - modal for creating and editing nodes.
 */

import { useCallback } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useSystemStore } from '@/store';
import { generateId } from '@/utils';
import { Modal, ModalFooter, Button, Input, Checkbox } from '@/components/ui';
import type { Port } from '@/types';

export function NodeEditorModal() {
  const { editingNode, setEditingNode, saveNode } = useSystemStore();

  const handleClose = useCallback(() => {
    setEditingNode(null);
  }, [setEditingNode]);

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
    <Modal
      isOpen={!!editingNode}
      onClose={handleClose}
      title={editingNode.isNew ? 'Create Entity' : 'Edit Entity'}
      size="md"
    >
      <div className="space-y-5">
        {/* External Entity Toggle */}
        <Checkbox
          id="external-toggle"
          label="External Entity"
          description="Sits outside the System Boundary"
          checked={editingNode.isExternal}
          onChange={(e) => updateNode({ isExternal: e.target.checked })}
        />

        {/* Entity Name */}
        <Input
          label="Entity Name"
          value={editingNode.name}
          onChange={(e) => updateNode({ name: e.target.value })}
        />

        {/* Process & Operand */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Function: Process"
            value={editingNode.process || ''}
            onChange={(e) => updateNode({ process: e.target.value })}
            placeholder="e.g. Harvest"
          />
          <Input
            label="Function: Operand"
            value={editingNode.operand || ''}
            onChange={(e) => updateNode({ operand: e.target.value })}
            placeholder="e.g. Materials"
          />
        </div>

        {/* Ports */}
        <div className="grid grid-cols-2 gap-6 pt-2 border-t border-github-border/50">
          {/* Inputs */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-github-text-secondary uppercase tracking-wider">
                Inputs
              </label>
              <Button variant="ghost" size="sm" onClick={() => addPort('inputs')}>
                + Add
              </Button>
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
              <Button variant="ghost" size="sm" onClick={() => addPort('outputs')}>
                + Add
              </Button>
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
                    onChange={(e) => updatePort('outputs', idx, e.target.value)}
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

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={saveNode}>
          Save Entity
        </Button>
      </ModalFooter>
    </Modal>
  );
}
