'use client';

/**
 * FlattenedGroups component - renders expanded subsystem bounding boxes in layered view.
 * Works within React Flow's viewport coordinate system.
 */

import { Layers } from 'lucide-react';
import { useViewport } from '@xyflow/react';
import { useSystemStore } from '@/store';

export function FlattenedGroups() {
  const { getFlattenedView, setDraggingNode } = useSystemStore();
  const { x, y, zoom } = useViewport();

  const flattenedView = getFlattenedView();
  if (!flattenedView) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      {flattenedView.renderGroups.map((group) => (
        <div
          key={group.id}
          className="absolute border-2 border-dashed rounded-xl pointer-events-none bg-indigo-900/10 border-indigo-500/40"
          style={{
            left: group.x * zoom + x,
            top: group.y * zoom + y,
            width: group.width * zoom,
            height: group.height * zoom,
          }}
        >
          {/* Group Header */}
          <div
            className="absolute -top-3 left-4 bg-slate-900 px-3 py-1 rounded shadow-sm border border-indigo-500/50 pointer-events-auto flex items-center gap-2 hover:bg-slate-800 transition-colors"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <Layers size={14} className="text-indigo-400" />
            <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
              {group.name}
            </span>
          </div>

          {/* Input Ports */}
          <div className="absolute left-0 top-0 h-full w-0 flex flex-col pointer-events-none">
            {group.inputs.map((port, idx) => (
              <div
                key={port.id}
                className="absolute w-4 h-4 bg-slate-900 border-2 border-emerald-500 rounded-full"
                style={{ 
                  left: -8 * zoom,
                  top: (40 + idx * 32) * zoom - 8,
                  width: 16 * zoom,
                  height: 16 * zoom,
                }}
                title={port.name}
              />
            ))}
          </div>

          {/* Output Ports */}
          <div className="absolute right-0 top-0 h-full w-0 flex flex-col pointer-events-none">
            {group.outputs.map((port, idx) => (
              <div
                key={port.id}
                className="absolute w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full"
                style={{ 
                  right: -8 * zoom,
                  top: (40 + idx * 32) * zoom - 8,
                  width: 16 * zoom,
                  height: 16 * zoom,
                }}
                title={port.name}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
