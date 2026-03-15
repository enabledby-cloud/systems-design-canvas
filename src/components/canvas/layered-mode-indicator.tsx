'use client';

/**
 * LayeredModeIndicator - shows a banner when in layered analysis mode.
 * Uses React Flow's Panel for proper positioning.
 */

import { Layers } from 'lucide-react';
import { Panel } from '@xyflow/react';
import { useSystemStore } from '@/store';

export function LayeredModeIndicator() {
  const { isFlattened } = useSystemStore();

  if (!isFlattened()) return null;

  return (
    <Panel position="top-center" className="!m-4">
      <div className="bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 backdrop-blur-sm pointer-events-none">
        <Layers size={14} />
        Layered Analysis Active: Structural editing is disabled.
      </div>
    </Panel>
  );
}
