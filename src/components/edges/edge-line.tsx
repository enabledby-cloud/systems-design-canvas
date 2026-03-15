'use client';

/**
 * EdgeLine component - renders a single edge with Bezier curve and labels.
 */

import { useSystemStore } from '@/store';
import { calculateBezier, NODE_WIDTH, NODE_BASE_HEIGHT, PORT_SPACING } from '@/utils';
import type { SystemEdge, SystemNode, RenderGroup, EntityId } from '@/types';

interface EdgeLineProps {
  edge: SystemEdge;
}

export function EdgeLine({ edge }: EdgeLineProps) {
  const {
    isFlattened,
    setEditingEdge,
    getCurrentSystem,
    getParentNode,
    getFlattenedView,
  } = useSystemStore();

  const flattened = isFlattened();
  const currentSystem = getCurrentSystem();
  const parentNode = getParentNode();
  const flattenedView = getFlattenedView();

  /**
   * Get coordinates for a node's port.
   */
  const getNodeCoordinates = (
    nodeId: EntityId,
    portId: EntityId,
    isOutput: boolean
  ): { x: number; y: number } => {
    // Handle boundary ports
    // Boundary inputs: left-[50px] + w-[140px] = 190px for port circle center at -right-2
    // Container: top-[150px], header h-[24px], then ports with space-y-4 (16px) and h-8 (32px)
    // First port center Y: 150 + 24 + 16 + 16 (half of h-8) = 206px
    // Port spacing: h-8 (32px) + space-y-4 (16px) = 48px
    if (nodeId === 'BOUNDARY_IN') {
      const idx = parentNode?.inputs.findIndex((p) => p.id === portId) ?? 0;
      return { x: 190, y: 206 + idx * 48 };
    }
    // Boundary outputs: left-[1000px], port circle at -left-2 so center at 1000px
    if (nodeId === 'BOUNDARY_OUT') {
      const idx = parentNode?.outputs.findIndex((p) => p.id === portId) ?? 0;
      return { x: 1000, y: 206 + idx * 48 };
    }

    let node: SystemNode | RenderGroup | undefined;
    let absX: number;
    let absY: number;
    let isGroup = false;

    if (flattened && flattenedView) {
      // Check groups first
      node = flattenedView.renderGroups.find((g) => g.id === nodeId);
      if (node) {
        isGroup = true;
      } else {
        node = flattenedView.renderNodes.find((n) => n.id === nodeId);
      }
      if (!node) return { x: 0, y: 0 };
      absX = node.x;
      absY = node.y;
    } else {
      node = currentSystem.nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      absX = node.x;
      absY = node.y;
    }

    // Find port index
    let isOutputPort = isOutput;
    let portList = isOutputPort ? node.outputs : node.inputs;
    let portIndex = portList.findIndex((p) => p.id === portId);

    if (portIndex === -1) {
      isOutputPort = !isOutput;
      portList = isOutputPort ? node.outputs : node.inputs;
      portIndex = portList.findIndex((p) => p.id === portId);
    }

    if (isGroup) {
      const groupNode = node as RenderGroup;
      const x = absX + (isOutputPort ? groupNode.width : 0);
      const y = absY + 40 + portIndex * 32;
      return { x, y };
    } else {
      const x = absX + (isOutputPort ? NODE_WIDTH : 0);
      const y = absY + NODE_BASE_HEIGHT + portIndex * PORT_SPACING;
      return { x, y };
    }
  };

  const start = getNodeCoordinates(edge.fromNode, edge.fromPort, true);
  const end = getNodeCoordinates(edge.toNode, edge.toPort, false);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const pathData = calculateBezier(start.x, start.y, end.x, end.y);

  const handleClick = () => {
    if (!flattened) {
      setEditingEdge(edge);
    }
  };

  return (
    <g
      className={`group pointer-events-auto ${!flattened ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {/* Invisible hit area */}
      <path d={pathData} fill="none" stroke="transparent" strokeWidth="20" />

      {/* Visible edge */}
      <path
        d={pathData}
        fill="none"
        stroke="#475569"
        strokeWidth="2"
        className="edge-path transition-colors duration-200"
      />

      {/* Labels */}
      {(edge.interaction || edge.structure) && (
        <g className="pointer-events-none">
          {/* Interaction label */}
          <text
            x={midX}
            y={midY - 8}
            fontSize="12"
            fontWeight="medium"
            textAnchor="middle"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinejoin="round"
          >
            {edge.interaction}
          </text>
          <text
            x={midX}
            y={midY - 8}
            fontSize="12"
            fontWeight="medium"
            textAnchor="middle"
            fill="#94a3b8"
            className="group-hover:fill-indigo-300 transition-colors"
          >
            {edge.interaction}
          </text>

          {/* Structure label */}
          {edge.structure && (
            <>
              <text
                x={midX}
                y={midY + 6}
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                stroke="#0f172a"
                strokeWidth="4"
                strokeLinejoin="round"
              >
                [{edge.structure}]
              </text>
              <text
                x={midX}
                y={midY + 6}
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                fill="#64748b"
                className="group-hover:fill-indigo-400 transition-colors"
              >
                [{edge.structure}]
              </text>
            </>
          )}
        </g>
      )}
    </g>
  );
}
