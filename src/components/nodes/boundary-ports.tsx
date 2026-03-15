'use client';

/**
 * BoundaryPorts component - renders input/output ports at system boundary when decomposed.
 */

import { useSystemStore } from '@/store';
import type { EntityId } from '@/types';

export function BoundaryPorts() {
  const { getParentNode, viewDepth, setDraftEdge, draftEdge, offset, scale } =
    useSystemStore();

  const parentNode = getParentNode();
  if (!parentNode) return null;

  const handlePortPointerDown = (
    e: React.PointerEvent,
    nodeId: EntityId,
    portId: EntityId,
    isOutput: boolean
  ) => {
    e.stopPropagation();
    if (viewDepth > 0) return;

    // Get canvas-relative coordinates
    const canvasElement = document.querySelector('[data-canvas]');
    const canvasRect = canvasElement?.getBoundingClientRect();
    if (!canvasRect) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const startX = (rect.left + rect.width / 2 - canvasRect.left - offset.x) / scale;
    const startY = (rect.top + rect.height / 2 - canvasRect.top - offset.y) / scale;

    setDraftEdge({
      fromNode: isOutput ? nodeId : null,
      fromPort: isOutput ? portId : null,
      toNode: !isOutput ? nodeId : null,
      toPort: !isOutput ? portId : null,
      startX,
      startY,
      endX: startX,
      endY: startY,
      isOutputStart: isOutput,
    });
  };

  const handlePortPointerUp = (
    e: React.PointerEvent,
    nodeId: EntityId,
    portId: EntityId,
    isOutput: boolean
  ) => {
    e.stopPropagation();
    if (viewDepth > 0) {
      useSystemStore.getState().setDraftEdge(null);
      return;
    }

    const currentDraftEdge = useSystemStore.getState().draftEdge;
    if (currentDraftEdge) {
      if (currentDraftEdge.isOutputStart === isOutput) {
        useSystemStore.getState().setDraftEdge(null);
        return;
      }

      const newEdge = {
        fromNode: currentDraftEdge.isOutputStart
          ? currentDraftEdge.fromNode!
          : nodeId,
        fromPort: currentDraftEdge.isOutputStart
          ? currentDraftEdge.fromPort!
          : portId,
        toNode: !currentDraftEdge.isOutputStart
          ? currentDraftEdge.toNode!
          : nodeId,
        toPort: !currentDraftEdge.isOutputStart
          ? currentDraftEdge.toPort!
          : portId,
      };

      useSystemStore.getState().createEdge(newEdge);
    }
    useSystemStore.getState().setDraftEdge(null);
  };

  return (
    <>
      {/* Boundary Inputs (left side) */}
      <div className="absolute left-[50px] top-[150px] flex flex-col space-y-4 pointer-events-auto w-[140px]">
        <div className="h-[24px] flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
          Boundary Inputs
        </div>
        {parentNode.inputs.map((port) => (
          <div
            key={port.id}
            className="flex items-center justify-between relative bg-slate-800/80 border border-slate-700 rounded-r shadow-sm h-8 px-3"
          >
            <span className="text-slate-300 text-xs font-medium truncate pr-2">
              {port.name}
            </span>
            <div
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full cursor-crosshair hover:bg-indigo-500"
              onPointerDown={(e) =>
                handlePortPointerDown(e, 'BOUNDARY_IN', port.id, true)
              }
              onPointerUp={(e) =>
                handlePortPointerUp(e, 'BOUNDARY_IN', port.id, true)
              }
            />
          </div>
        ))}
      </div>

      {/* Boundary Outputs (right side) */}
      <div className="absolute left-[1000px] top-[150px] flex flex-col space-y-4 pointer-events-auto w-[140px]">
        <div className="h-[24px] flex items-center justify-end text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
          Boundary Outputs
        </div>
        {parentNode.outputs.map((port) => (
          <div
            key={port.id}
            className="flex items-center justify-end relative bg-slate-800/80 border border-slate-700 rounded-l shadow-sm h-8 px-3"
          >
            <div
              className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-emerald-500 rounded-full cursor-crosshair hover:bg-emerald-500"
              onPointerDown={(e) =>
                handlePortPointerDown(e, 'BOUNDARY_OUT', port.id, false)
              }
              onPointerUp={(e) =>
                handlePortPointerUp(e, 'BOUNDARY_OUT', port.id, false)
              }
            />
            <span className="text-slate-300 text-xs font-medium truncate pl-2">
              {port.name}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
