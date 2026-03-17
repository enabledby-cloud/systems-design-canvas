'use client';

/**
 * BoundaryNode - A React Flow node representing parent system boundary ports.
 * Rendered on left (inputs) and right (outputs) when inside a subsystem.
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { SystemFlowNode } from '@/types';

export const BoundaryNode = memo(function BoundaryNode({
  data,
}: NodeProps<SystemFlowNode>) {
  const { boundaryType, boundaryPorts = [], boundaryLabel } = data;
  const isInput = boundaryType === 'input';

  return (
    <div className="flex flex-col space-y-2 min-w-[140px]">
      <div className={`text-xs font-bold text-github-text-muted uppercase tracking-wider mb-1 ${isInput ? 'text-left' : 'text-right'}`}>
        {boundaryLabel || (isInput ? 'Boundary Inputs' : 'Boundary Outputs')}
      </div>
      {boundaryPorts.length === 0 && (
        <div className={`text-xs text-github-text-muted italic px-3 ${isInput ? 'text-left' : 'text-right'}`}>
          No {isInput ? 'inputs' : 'outputs'}
        </div>
      )}
      {boundaryPorts.map((port) => (
        <div
          key={port.id}
          className={`flex items-center relative bg-github-surface/90 border border-github-border shadow-lg h-9 backdrop-blur-sm ${
            isInput ? 'rounded-r-lg pl-3 pr-6' : 'rounded-l-lg pr-3 pl-6'
          }`}
        >
          {isInput ? (
            <>
              <span className="text-github-text text-xs font-medium whitespace-nowrap">
                {port.name}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={port.id}
                className="!w-4 !h-4 !bg-github-bg !border-2 !border-accent-pink !rounded-full hover:!bg-accent-pink !transition-colors !-right-2"
                style={{ top: 'auto' }}
              />
            </>
          ) : (
            <>
              <Handle
                type="target"
                position={Position.Left}
                id={port.id}
                className="!w-4 !h-4 !bg-github-bg !border-2 !border-accent-green !rounded-full hover:!bg-accent-green !transition-colors !-left-2"
                style={{ top: 'auto' }}
              />
              <span className="text-github-text text-xs font-medium whitespace-nowrap">
                {port.name}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
});
