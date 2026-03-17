'use client';

/**
 * Custom React Flow node component for system entities.
 * Renders nodes with input/output handles (ports), function box, and controls.
 */

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Edit2, Maximize2, Trash2 } from 'lucide-react';
import { useSystemStore } from '@/store';
import type { SystemFlowNode } from '@/types';

export const SystemNode = memo(function SystemNode({
  id,
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
}: NodeProps<SystemFlowNode>) {
  const { openNodeEditor, enterNode, deleteNode, isFlattened } = useSystemStore();
  
  const flattened = isFlattened();
  // Get inputs/outputs with fallbacks
  const inputs = data.inputs ?? [];
  const outputs = data.outputs ?? [];
  const { name, process, operand, isExternal } = data;

  const wrapperClass = isExternal
    ? 'w-[220px] bg-github-surface/80 border-2 border-dashed border-github-border rounded-lg shadow-xl flex flex-col select-none'
    : `w-[220px] bg-github-surface border ${selected ? 'border-accent-blue shadow-glow-blue/30' : 'border-github-border'} rounded-lg shadow-xl flex flex-col select-none`;

  const headerClass = isExternal
    ? 'h-[40px] px-3 bg-github-surface/80 border-b-2 border-dashed border-github-border rounded-t-lg flex justify-between items-center'
    : 'h-[40px] px-3 bg-github-surface border-b border-github-border rounded-t-lg flex justify-between items-center';

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Reconstruct the node data for the editor with current position
      const nodeForEdit = {
        id,
        name,
        process: process || '',
        operand: operand || '',
        isExternal: isExternal ?? false,
        emergence: data.emergence,
        x: positionAbsoluteX ?? 0,
        y: positionAbsoluteY ?? 0,
        inputs: inputs,
        outputs: outputs,
        internal: data.internal,
      };
      openNodeEditor(nodeForEdit);
    },
    [id, name, process, operand, isExternal, data.emergence, data.internal, inputs, outputs, positionAbsoluteX, positionAbsoluteY, openNodeEditor]
  );

  const handleDecompose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      enterNode(id);
    },
    [id, enterNode]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNode(id);
    },
    [id, deleteNode]
  );

  return (
    <div className={wrapperClass}>
      {/* Header with drag handle */}
      <div className={`${headerClass} cursor-move`}>
        <div className="flex items-center space-x-2 overflow-hidden">
          <Box
            size={14}
            className={isExternal ? 'text-github-text-secondary flex-shrink-0' : 'text-accent-blue flex-shrink-0'}
          />
          <span
            className={`font-medium text-sm truncate ${
              isExternal ? 'text-github-text-secondary italic' : 'text-github-text'
            }`}
          >
            {name}
          </span>
        </div>
        {!flattened && (
          <div className="flex space-x-1">
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-github-elevated rounded text-github-text-secondary hover:text-github-text nodrag"
              title="Edit Entity"
              aria-label="Edit Entity"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={handleDecompose}
              className="p-1 hover:bg-github-elevated rounded text-github-text-secondary hover:text-github-text nodrag"
              title="Decompose (View Internals)"
              aria-label="Decompose"
            >
              <Maximize2 size={12} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-accent-pink/20 rounded text-github-text-secondary hover:text-accent-pink nodrag"
              title="Delete Entity"
              aria-label="Delete Entity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Function Box */}
      <div
        className={`mx-3 mt-3 mb-1 h-[40px] bg-github-bg/50 rounded flex flex-col items-center justify-center border border-github-border/50 pointer-events-none overflow-hidden ${
          isExternal ? 'opacity-70' : ''
        }`}
      >
        <span className="text-github-text-secondary font-semibold text-[10px] uppercase tracking-wider leading-tight">
          {process || 'Process'}
        </span>
        <span className="text-github-text font-bold text-xs tracking-wide truncate leading-tight">
          {operand || 'Operand'}
        </span>
      </div>

      {/* Ports */}
      <div className="flex justify-between py-2 px-3 text-xs gap-2">
        {/* Input Ports */}
        <div className="flex flex-col space-y-2 flex-1 min-w-0">
          {inputs.length === 0 && (
            <span className="text-github-text-muted italic text-[10px]">No inputs</span>
          )}
          {inputs.map((port) => (
            <div key={port.id} className="flex items-center h-6 relative">
              <Handle
                type="target"
                position={Position.Left}
                id={port.id}
                className="!w-3 !h-3 !bg-accent-green !border-2 !border-accent-green/70 !rounded-full !-left-[18px]"
              />
              <span 
                className={`truncate max-w-[80px] ${isExternal ? 'text-accent-green/50' : 'text-accent-green'}`}
                title={port.name}
              >
                {port.name}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px bg-github-border/30 self-stretch" />

        {/* Output Ports */}
        <div className="flex flex-col space-y-2 items-end flex-1 min-w-0">
          {outputs.length === 0 && (
            <span className="text-github-text-muted italic text-[10px]">No outputs</span>
          )}
          {outputs.map((port) => (
            <div key={port.id} className="flex items-center h-6 relative justify-end">
              <span 
                className={`truncate max-w-[80px] ${isExternal ? 'text-accent-pink/50' : 'text-accent-pink'}`}
                title={port.name}
              >
                {port.name}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={port.id}
                className="!w-3 !h-3 !bg-accent-pink !border-2 !border-accent-pink/70 !rounded-full !-right-[18px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
