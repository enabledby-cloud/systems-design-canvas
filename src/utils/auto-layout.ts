/**
 * Auto-layout using elkjs (Eclipse Layout Kernel).
 *
 * Always lays out LEFT -> RIGHT, matching the only port orientation the app
 * ever renders (inputs on the west/left side, outputs on the east/right side
 * of every node type). Running ELK in a direction that doesn't match the
 * rendered port geometry would make its crossing-minimization solve the
 * wrong problem.
 *
 * Pure source nodes (no incoming edges) are pinned to the first layer and
 * pure sink nodes (no outgoing edges) to the last layer, so context/actor
 * entities land at the periphery instead of being interleaved with the
 * internal cluster.
 *
 * Port constraints use FIXED_ORDER so ELK knows port side and order
 * but can freely space ports for optimal edge routing and crossing
 * minimisation.
 *
 * Edge bend points computed by ELK are extracted alongside node positions
 * so edges can be routed around nodes instead of drawn as naive
 * point-to-point curves.
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import type { SystemNode, SystemEdge, EntityId, Point } from '@/types';
import { NODE_WIDTH, NODE_BASE_HEIGHT, PORT_SPACING } from './canvas-math';

// ─── Constants ─────────────────────────────────────────────────────

const GRID = 12;
const PORT_SIZE = 10;

// ─── Public interface ──────────────────────────────────────────────

export interface LayoutPosition {
  id: EntityId;
  x: number;
  y: number;
}

export interface AutoLayoutResult {
  positions: LayoutPosition[];
  /** Intermediate routing points per edge id, in the same coordinate space as node positions. */
  edgeWaypoints: Record<EntityId, Point[]>;
}

// ─── Helpers ───────────────────────────────────────────────────────

function nw(n: SystemNode): number { return n.width ?? NODE_WIDTH; }
function nh(n: SystemNode): number {
  return n.height ?? (NODE_BASE_HEIGHT + Math.max(n.inputs.length, n.outputs.length) * PORT_SPACING);
}
function snap(v: number): number { return Math.round(v / GRID) * GRID; }

// ─── Shared layout options ─────────────────────────────────────────

const LAYOUT_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  // Generous spacing so the result reads like a table, not a packed cluster.
  // Between-layer spacing in particular needs room for edge labels, which
  // can be 150-250px wide and sit at the midpoint of the gap between columns.
  'elk.spacing.nodeNode': '90',
  'elk.layered.spacing.nodeNodeBetweenLayers': '220',
  'elk.spacing.edgeNode': '40',
  'elk.layered.spacing.edgeNodeBetweenLayers': '50',
  'elk.spacing.edgeEdge': '20',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '24',
  'elk.spacing.portPort': String(PORT_SPACING),
  'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
  'elk.layered.thoroughness': '20',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
  'elk.layered.nodePlacement.favorStraightEdges': 'true',
  'elk.edgeRouting': 'POLYLINE',
  'elk.portAlignment.default': 'BEGIN',
  'elk.separateConnectedComponents': 'true',
  'elk.spacing.componentComponent': '120',
  'elk.padding': '[top=60,left=60,bottom=60,right=60]',
};

// ─── Graph builder ────────────────────────────────────────────────

function buildGraph(nodes: SystemNode[], edges: SystemEdge[]): ElkNode {
  const ids = new Set(nodes.map((n) => n.id));

  // Port ownership for validation
  const portOf = new Map<string, string>();
  for (const n of nodes) {
    for (const p of n.inputs) portOf.set(p.id, n.id);
    for (const p of n.outputs) portOf.set(p.id, n.id);
  }

  // Track which nodes have invalid port references (need relaxed constraints)
  const relaxed = new Set<string>();

  // In/out degree, used to pin pure sources/sinks to the first/last layer
  const indeg = new Map<string, number>();
  const outdeg = new Map<string, number>();
  for (const n of nodes) {
    indeg.set(n.id, 0);
    outdeg.set(n.id, 0);
  }

  // Edges
  const validEdges: Array<{ id: string; src: string; tgt: string }> = [];
  for (const e of edges) {
    if (!ids.has(e.fromNode) || !ids.has(e.toNode) || e.fromNode === e.toNode) continue;
    const srcOk = portOf.get(e.fromPort) === e.fromNode;
    const tgtOk = portOf.get(e.toPort) === e.toNode;
    if (!srcOk) relaxed.add(e.fromNode);
    if (!tgtOk) relaxed.add(e.toNode);
    validEdges.push({
      id: e.id,
      src: srcOk ? e.fromPort : e.fromNode,
      tgt: tgtOk ? e.toPort : e.toNode,
    });
    outdeg.set(e.fromNode, (outdeg.get(e.fromNode) ?? 0) + 1);
    indeg.set(e.toNode, (indeg.get(e.toNode) ?? 0) + 1);
  }

  // Nodes with ports
  const children: ElkNode[] = nodes.map((node) => {
    const w = nw(node);
    const h = nh(node);

    const ports = [
      ...node.inputs.map((p, i) => ({
        id: p.id,
        width: PORT_SIZE,
        height: PORT_SIZE,
        layoutOptions: { 'elk.port.side': 'WEST', 'elk.port.index': String(i) },
      })),
      ...node.outputs.map((p, i) => ({
        id: p.id,
        width: PORT_SIZE,
        height: PORT_SIZE,
        layoutOptions: { 'elk.port.side': 'EAST', 'elk.port.index': String(i) },
      })),
    ];

    // FIXED_ORDER: ELK knows side + order, can freely space ports
    // FIXED_SIDE: fallback when port ref is invalid (node-level edge)
    const constraint = relaxed.has(node.id) ? 'FIXED_SIDE' : 'FIXED_ORDER';

    const layoutOptions: Record<string, string> = { 'elk.portConstraints': constraint };
    const inDeg = indeg.get(node.id) ?? 0;
    const outDeg = outdeg.get(node.id) ?? 0;
    if (inDeg === 0 && outDeg > 0) {
      layoutOptions['elk.layered.layering.layerConstraint'] = 'FIRST_SEPARATE';
    } else if (outDeg === 0 && inDeg > 0) {
      layoutOptions['elk.layered.layering.layerConstraint'] = 'LAST_SEPARATE';
    }

    return {
      id: node.id,
      width: w,
      height: h,
      ports,
      layoutOptions,
    };
  });

  const elkEdges: ElkExtendedEdge[] = validEdges.map((e) => ({
    id: e.id,
    sources: [e.src],
    targets: [e.tgt],
  }));

  return {
    id: 'root',
    children,
    edges: elkEdges,
    layoutOptions: LAYOUT_OPTIONS,
  };
}

// ─── Layout execution ─────────────────────────────────────────────

const elk = new ELK();

function extractPositions(result: ElkNode): LayoutPosition[] {
  return (result.children ?? []).map((c) => ({
    id: c.id as EntityId,
    x: snap(c.x ?? 0),
    y: snap(c.y ?? 0),
  }));
}

function extractEdgeWaypoints(result: ElkNode): Record<EntityId, Point[]> {
  const map: Record<EntityId, Point[]> = {};
  for (const e of result.edges ?? []) {
    const bendPoints = e.sections?.[0]?.bendPoints;
    if (bendPoints && bendPoints.length > 0) {
      map[e.id] = bendPoints.map((p) => ({ x: p.x, y: p.y }));
    }
  }
  return map;
}

export async function computeAutoLayout(
  nodes: SystemNode[],
  edges: SystemEdge[]
): Promise<AutoLayoutResult> {
  if (nodes.length === 0) return { positions: [], edgeWaypoints: {} };

  let result: ElkNode;
  try {
    result = await elk.layout(buildGraph(nodes, edges));
  } catch (err) {
    console.error('[auto-layout] ELK layout failed', err);
    return { positions: [], edgeWaypoints: {} };
  }

  return {
    positions: extractPositions(result),
    edgeWaypoints: extractEdgeWaypoints(result),
  };
}
