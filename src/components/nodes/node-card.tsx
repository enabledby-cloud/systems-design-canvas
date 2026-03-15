'use client';

/**
 * NodeCard component - renders a system node with ports and controls.
 */

import { Box, Edit2, Maximize2, Trash2 } from 'lucide-react';
import { useSystemStore } from '@/store';
import type { SystemNode, EntityId } from '@/types';

interface NodeCardProps {
  node: SystemNode;
}

interface PortHandlers {
  onPointerDown: (
    e: React.PointerEvent,
    nodeId: EntityId,
    portId: EntityId,
    isOutput: boolean
  ) => void;
  onPointerUp: (
    e: React.PointerEvent,
    nodeId: EntityId,
    portId: EntityId,
    isOutput: boolean
  ) => void;
}

export function NodeCard({ node }: NodeCardProps) {
  const {
    isFlattened,
    setDraggingNode,
    openNodeEditor,
    enterNode,
    deleteNode,
    viewDepth,
    setDraftEdge,
    draftEdge,
    offset,
    scale,
  } = useSystemStore();

  const flattened = isFlattened();

  const wrapperClass = node.isExternal
    ? 'absolute w-[220px] bg-slate-800/80 border-2 border-dashed border-slate-500 rounded-lg shadow-xl flex flex-col select-none pointer-events-auto'
    : 'absolute w-[220px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col select-none pointer-events-auto';

  const headerClass = node.isExternal
    ? 'h-[40px] px-3 bg-slate-800/80 border-b-2 border-dashed border-slate-500 rounded-t-lg flex justify-between items-center cursor-move hover:bg-slate-750'
    : 'h-[40px] px-3 bg-slate-800 border-b border-slate-700 rounded-t-lg flex justify-between items-center cursor-move hover:bg-slate-750';

  const handlePortPointerDown = (
    e: React.PointerEvent,
    nodeId: EntityId,
    portId: EntityId,
    isOutput: boolean
  ) => {
    e.stopPropagation();
    if (viewDepth > 0) return;

    // Get canvas coordinates - we need to calculate based on the actual port position in canvas space
    // The port element's bounding rect gives us screen position, convert to canvas coordinates
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
    <div
      className={wrapperClass}
      style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
    >
      {/* Header */}
      <div
        className={headerClass}
        onPointerDown={(e) => {
          e.stopPropagation();
          setDraggingNode(node.id);
        }}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          <Box
            size={14}
            className={
              node.isExternal
                ? 'text-slate-400 flex-shrink-0'
                : 'text-blue-400 flex-shrink-0'
            }
          />
          <span
            className={`font-medium text-sm truncate ${
              node.isExternal ? 'text-slate-300 italic' : 'text-slate-200'
            }`}
          >
            {node.name}
          </span>
        </div>
        {!flattened && (
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openNodeEditor(node);
              }}
              className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white"
              title="Edit Entity"
              aria-label="Edit Entity"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                enterNode(node.id);
              }}
              className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white"
              title="Decompose (View Internals)"
              aria-label="Decompose"
            >
              <Maximize2 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
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
        className={`mx-3 mt-3 mb-1 h-[40px] bg-slate-900/50 rounded flex flex-col items-center justify-center border border-slate-700/50 pointer-events-none overflow-hidden ${
          node.isExternal ? 'opacity-70' : ''
        }`}
      >
        <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider leading-tight">
          {node.process || 'Process'}
        </span>
        <span className="text-slate-200 font-bold text-xs tracking-wide truncate leading-tight">
          {node.operand || 'Operand'}
        </span>
      </div>

      {/* Ports */}
      <div className="flex justify-between py-2 text-xs relative z-10">
        {/* Input Ports */}
        <div className="flex flex-col space-y-2 w-1/2">
          {node.inputs.map((port) => (
            <div key={port.id} className="flex items-center relative h-6">
              <div
                className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-emerald-500 rounded-full cursor-crosshair hover:bg-emerald-500 transition-colors ${
                  node.isExternal ? 'opacity-70' : ''
                }`}
                onPointerDown={(e) =>
                  handlePortPointerDown(e, node.id, port.id, false)
                }
                onPointerUp={(e) =>
                  handlePortPointerUp(e, node.id, port.id, false)
                }
                title="Drag to connect"
              />
              <span
                className={`ml-4 truncate pr-1 ${
                  node.isExternal ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {port.name}
              </span>
            </div>
          ))}
        </div>

        {/* Output Ports */}
        <div className="flex flex-col space-y-2 w-1/2 items-end">
          {node.outputs.map((port) => (
            <div
              key={port.id}
              className="flex items-center justify-end relative h-6 w-full"
            >
              <span
                className={`mr-4 truncate pl-1 ${
                  node.isExternal ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {port.name}
              </span>
              <div
                className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full cursor-crosshair hover:bg-indigo-500 transition-colors ${
                  node.isExternal ? 'opacity-70' : ''
                }`}
                onPointerDown={(e) =>
                  handlePortPointerDown(e, node.id, port.id, true)
                }
                onPointerUp={(e) =>
                  handlePortPointerUp(e, node.id, port.id, true)
                }
                title="Drag to connect"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
