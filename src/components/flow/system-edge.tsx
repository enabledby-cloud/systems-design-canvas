'use client';

/**
 * Custom React Flow edge component for system connections.
 * Supports configurable routing (bezier/smoothstep) and draggable labels.
 */

import { memo, useCallback, useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
} from '@xyflow/react';
import { useSystemStore } from '@/store';
import type { SystemEdgeProps } from '@/types';
import type { Point } from '@/types';

/** Builds an SVG path through a sequence of points, rounding interior corners. */
export function roundedPolylinePath(points: Point[], radius: number): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y };
    const toNext = { x: next.x - curr.x, y: next.y - curr.y };
    const distPrev = Math.hypot(toPrev.x, toPrev.y) || 1;
    const distNext = Math.hypot(toNext.x, toNext.y) || 1;
    const r = Math.min(radius, distPrev / 2, distNext / 2);

    const cornerStart = { x: curr.x + (toPrev.x / distPrev) * r, y: curr.y + (toPrev.y / distPrev) * r };
    const cornerEnd = { x: curr.x + (toNext.x / distNext) * r, y: curr.y + (toNext.y / distNext) * r };

    d += ` L ${cornerStart.x},${cornerStart.y} Q ${curr.x},${curr.y} ${cornerEnd.x},${cornerEnd.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

/** Point at the midpoint (by path length) of a polyline — used to anchor the edge label. */
export function polylineMidpoint(points: Point[]): Point {
  const segmentLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segmentLengths.push(len);
    total += len;
  }
  let remaining = total / 2;
  for (let i = 0; i < segmentLengths.length; i++) {
    if (remaining <= segmentLengths[i]) {
      const t = segmentLengths[i] === 0 ? 0 : remaining / segmentLengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    remaining -= segmentLengths[i];
  }
  return points[points.length - 1];
}

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
  const { setEditingEdge, isFlattened, getCurrentSystem, edgeRouting, updateEdgeLabelOffset } = useSystemStore();
  const flattened = isFlattened();

  // Calculate path based on configured routing
  const dx = targetX - sourceX;
  const dy = Math.abs(targetY - sourceY);
  const isBackward = dx < 0;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (data?.waypoints && data.waypoints.length > 0) {
    // Route through ELK's obstacle-avoiding bend points from the last auto-arrange.
    // Endpoints come from React Flow's own measured handle positions (always correct);
    // only the intermediate route comes from ELK.
    const points: Point[] = [{ x: sourceX, y: sourceY }, ...data.waypoints, { x: targetX, y: targetY }];
    edgePath = roundedPolylinePath(points, 16);
    const mid = polylineMidpoint(points);
    labelX = mid.x;
    labelY = mid.y;
  } else if (edgeRouting === 'smoothstep') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 12,
      offset: isBackward ? 40 : 20,
    });
  } else {
    // Dynamic bezier curvature
    let curvature: number;
    if (isBackward) {
      curvature = Math.min(0.8, 0.4 + Math.abs(dx) / 1000);
    } else if (dx < 150) {
      curvature = 0.4 - (dx / 150) * 0.15;
    } else {
      curvature = 0.25;
    }
    if (dy < 50 && isBackward) {
      curvature = Math.min(1.0, curvature + 0.15);
    }

    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      curvature,
    });
  }

  // Apply persisted label offset
  const offsetX = data?.labelOffsetX ?? 0;
  const offsetY = data?.labelOffsetY ?? 0;
  const finalLabelX = labelX + offsetX;
  const finalLabelY = labelY + offsetY;

  // Draggable label logic
  const dragRef = useRef<{ startX: number; startY: number; origOffsetX: number; origOffsetY: number } | null>(null);
  const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number } | null>(null);

  const liveLabelX = finalLabelX + (dragDelta?.dx ?? 0);
  const liveLabelY = finalLabelY + (dragDelta?.dy ?? 0);

  const handleLabelPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (flattened) return;
      e.stopPropagation();
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origOffsetX: offsetX,
        origOffsetY: offsetY,
      };
      setDragDelta({ dx: 0, dy: 0 });
    },
    [flattened, offsetX, offsetY]
  );

  const handleLabelPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      setDragDelta({
        dx: e.clientX - dragRef.current.startX,
        dy: e.clientY - dragRef.current.startY,
      });
    },
    []
  );

  const handleLabelPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      // Only persist if moved more than 3px (avoid accidental drag on click)
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        updateEdgeLabelOffset(
          id,
          dragRef.current.origOffsetX + deltaX,
          dragRef.current.origOffsetY + deltaY
        );
      } else {
        // Treat as a click — open edge editor
        const currentSystem = getCurrentSystem();
        const edge = currentSystem.edges.find((e) => e.id === id);
        if (edge) {
          setEditingEdge(edge);
        }
      }
      dragRef.current = null;
      setDragDelta(null);
    },
    [id, updateEdgeLabelOffset, getCurrentSystem, setEditingEdge]
  );

  const interaction = data?.interaction;
  const structure = data?.structure;

  return (
    <>
      {/* Edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3e8bff' : '#30363D',
          strokeWidth: 2,
        }}
        interactionWidth={20}
      />

      {/* Labels rendered via EdgeLabelRenderer for proper positioning */}
      {(interaction || structure) && (
        <EdgeLabelRenderer>
          <div
            className={`absolute pointer-events-auto nodrag nopan ${
              !flattened ? 'cursor-grab active:cursor-grabbing' : ''
            } ${dragDelta ? 'ring-1 ring-accent-blue/50 rounded shadow-lg' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${liveLabelX}px, ${liveLabelY}px)`,
            }}
            onPointerDown={handleLabelPointerDown}
            onPointerMove={handleLabelPointerMove}
            onPointerUp={handleLabelPointerUp}
          >
            {/* Interaction label */}
            {interaction && (
              <div className="text-center text-xs font-medium text-github-text-secondary bg-github-bg/80 px-2 py-0.5 rounded shadow-sm border border-github-border/50 hover:text-accent-blue hover:border-accent-blue/50 transition-colors">
                {interaction}
              </div>
            )}
            {/* Structure label */}
            {structure && (
              <div className="text-center text-[10px] font-bold text-github-text-muted mt-0.5 hover:text-accent-blue transition-colors">
                [{structure}]
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
