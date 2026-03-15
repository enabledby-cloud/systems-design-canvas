'use client';

/**
 * SystemBoundary component - renders the red dashed boundary box around system entities.
 * Works within React Flow's viewport coordinate system.
 */

import { Layers } from 'lucide-react';
import { useViewport } from '@xyflow/react';
import { useSystemStore } from '@/store';
import { calculateSystemBoundary } from '@/utils';

export function SystemBoundary() {
  const { isFlattened, getCurrentSystem } = useSystemStore();
  const { x, y, zoom } = useViewport();

  if (isFlattened()) return null;

  const currentSystem = getCurrentSystem();
  const bounds = calculateSystemBoundary(currentSystem.nodes);

  if (!bounds) return null;

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY + 35; // Extra height for label

  return (
    <div
      className="absolute border-4 border-dashed border-red-500/40 bg-red-500/5 rounded-xl pointer-events-none"
      style={{
        left: bounds.minX * zoom + x,
        top: bounds.minY * zoom + y,
        width: width * zoom,
        height: height * zoom,
        zIndex: -1,
      }}
    >
      <div 
        className="text-red-400 font-black uppercase tracking-widest px-5 py-2 flex items-center gap-2 opacity-80"
        style={{ fontSize: `${11 * zoom}px` }}
      >
        <Layers size={14 * zoom} /> SYSTEM BOUNDARY
      </div>
    </div>
  );
}
