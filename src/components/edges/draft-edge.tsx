'use client';

/**
 * DraftEdge component - renders the in-progress edge during creation.
 */

import { useSystemStore } from '@/store';
import { calculateBezier } from '@/utils';

export function DraftEdge() {
  const { draftEdge } = useSystemStore();

  if (!draftEdge) return null;

  const pathData = calculateBezier(
    draftEdge.isOutputStart ? draftEdge.startX : draftEdge.endX,
    draftEdge.isOutputStart ? draftEdge.startY : draftEdge.endY,
    !draftEdge.isOutputStart ? draftEdge.startX : draftEdge.endX,
    !draftEdge.isOutputStart ? draftEdge.startY : draftEdge.endY
  );

  return (
    <path
      d={pathData}
      fill="none"
      stroke="#818cf8"
      strokeWidth="3"
      strokeDasharray="5,5"
      markerEnd="url(#arrowhead-draft)"
    />
  );
}
