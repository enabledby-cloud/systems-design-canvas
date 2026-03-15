'use client';

/**
 * ArrowheadDefs - SVG marker definitions for edge arrowheads.
 */

export function ArrowheadDefs() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
      </marker>
      <marker
        id="arrowhead-hover"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" />
      </marker>
      <marker
        id="arrowhead-draft"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" />
      </marker>
    </defs>
  );
}
