'use client';

/**
 * EdgeLayer component - SVG layer containing all edges.
 */

import { useSystemStore } from '@/store';
import { ArrowheadDefs } from './arrowhead-defs';
import { EdgeLine } from './edge-line';
import { DraftEdge } from './draft-edge';

export function EdgeLayer() {
  const { isFlattened, getCurrentSystem, getFlattenedView } = useSystemStore();

  const flattened = isFlattened();
  const currentSystem = getCurrentSystem();
  const flattenedView = getFlattenedView();

  const edgesToRender =
    flattened && flattenedView
      ? flattenedView.resolvedEdges
      : currentSystem.edges;

  return (
    <svg
      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
      style={{ zIndex: 8 }}
    >
      <style>
        {`.edge-path { marker-end: url(#arrowhead); } .group:hover .edge-path { stroke: #818cf8; marker-end: url(#arrowhead-hover); }`}
      </style>

      <ArrowheadDefs />

      {edgesToRender.map((edge) => (
        <EdgeLine key={edge.id} edge={edge} />
      ))}

      <DraftEdge />
    </svg>
  );
}
