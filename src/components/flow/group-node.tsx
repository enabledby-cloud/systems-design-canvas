'use client';

/**
 * GroupNode - Visual container for an expanded subsystem in layered view.
 * 
 * Edges flow THROUGH the boundary:
 * - External edges connect TO the boundary port (target handle)
 * - Internal edges connect FROM the same boundary port (source handle) to internal nodes
 * - Both handles at same position create visual pass-through effect
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import type { SystemFlowNode } from '@/types';

export const GroupNode = memo(function GroupNode({
  data,
}: NodeProps<SystemFlowNode>) {
  const { name, inputs = [], outputs = [], groupWidth, groupHeight } = data;
  
  const width = (groupWidth || 300) as number;
  const height = (groupHeight || 200) as number;

  // Calculate vertical spacing for ports
  const inputSpacing = inputs.length > 0 ? Math.min(40, (height - 60) / inputs.length) : 40;
  const outputSpacing = outputs.length > 0 ? Math.min(40, (height - 60) / outputs.length) : 40;

  return (
    <div
      className="border-2 border-dashed rounded-xl border-indigo-500/40 bg-indigo-900/10 relative"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Group Header */}
      <div className="absolute -top-3 left-4 bg-slate-900 px-3 py-1 rounded shadow-sm border border-indigo-500/50 flex items-center gap-2 z-10">
        <Layers size={14} className="text-indigo-400" />
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
          {name}
        </span>
      </div>

      {/* LEFT SIDE - Input ports: external edges IN from left, internal edges OUT to internal nodes */}
      {inputs.map((port, idx) => {
        const yPos = 40 + idx * inputSpacing;
        return (
          <div 
            key={`in-${port.id}`} 
            className="absolute" 
            style={{ top: yPos - 8, left: -8 }}
          >
            {/* Label above the connector */}
            <span className="absolute -top-4 left-0 text-[10px] text-emerald-400 whitespace-nowrap font-medium">
              {port.name}
            </span>
            {/* Target handle - receives external edges */}
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-emerald-400 !rounded-full !relative !transform-none !inset-auto"
            />
            {/* Source handle - same position, sends to internal nodes (invisible) */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${port.id}_inner`}
              className="!w-4 !h-4 !bg-transparent !border-0 !rounded-full !absolute !transform-none !top-0 !left-0"
            />
          </div>
        );
      })}

      {/* RIGHT SIDE - Output ports: internal edges IN, external edges OUT to right */}
      {outputs.map((port, idx) => {
        const yPos = 40 + idx * outputSpacing;
        return (
          <div 
            key={`out-${port.id}`} 
            className="absolute" 
            style={{ top: yPos - 8, right: -8 }}
          >
            {/* Label above the connector */}
            <span className="absolute -top-4 right-0 text-[10px] text-indigo-400 whitespace-nowrap font-medium">
              {port.name}
            </span>
            {/* Target handle - receives from internal nodes (invisible, same position) */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${port.id}_inner`}
              className="!w-4 !h-4 !bg-transparent !border-0 !rounded-full !absolute !transform-none !top-0 !left-0"
            />
            {/* Source handle - sends to external nodes */}
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              className="!w-4 !h-4 !bg-indigo-500 !border-2 !border-indigo-400 !rounded-full !relative !transform-none !inset-auto"
            />
          </div>
        );
      })}
    </div>
  );
});
