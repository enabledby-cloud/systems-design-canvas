'use client';

/**
 * Custom React Flow edge component for system connections.
 * Renders bezier edges with interaction and structure labels.
 */

import { memo, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react';
import { useSystemStore } from '@/store';
import type { SystemEdgeProps } from '@/types';

export const SystemEdge = memo(function SystemEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: SystemEdgeProps) {
  const { setEditingEdge, isFlattened, getCurrentSystem } = useSystemStore();
  const flattened = isFlattened();

  // Calculate the edge path using React Flow's bezier helper
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.25,
  });

  const handleClick = useCallback(() => {
    if (flattened) return;
    
    // Find the full edge data from the store
    const currentSystem = getCurrentSystem();
    const edge = currentSystem.edges.find((e) => e.id === id);
    if (edge) {
      setEditingEdge(edge);
    }
  }, [id, flattened, getCurrentSystem, setEditingEdge]);

  const interaction = data?.interaction;
  const structure = data?.structure;

  return (
    <>
      {/* Edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#818cf8' : '#475569',
          strokeWidth: 2,
        }}
        interactionWidth={20}
      />

      {/* Labels rendered via EdgeLabelRenderer for proper positioning */}
      {(interaction || structure) && (
        <EdgeLabelRenderer>
          <div
            className={`absolute pointer-events-auto nodrag nopan ${
              !flattened ? 'cursor-pointer' : ''
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={handleClick}
          >
            {/* Interaction label */}
            {interaction && (
              <div className="text-center text-xs font-medium text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded shadow-sm border border-slate-700/50 hover:text-indigo-300 hover:border-indigo-500/50 transition-colors">
                {interaction}
              </div>
            )}
            {/* Structure label */}
            {structure && (
              <div className="text-center text-[10px] font-bold text-slate-500 mt-0.5 hover:text-indigo-400 transition-colors">
                [{structure}]
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
