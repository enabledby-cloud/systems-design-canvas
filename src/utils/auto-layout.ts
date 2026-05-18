/**
 * Auto-layout using elkjs (Eclipse Layout Kernel).
 *
 * Runs ELK Layered in both RIGHT and DOWN directions, then picks
 * whichever result has an aspect ratio closest to 16:10.
 *
 * Port constraints use FIXED_ORDER so ELK knows port side and order
 * but can freely space ports for optimal edge routing and crossing
 * minimisation.
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import type { SystemNode, SystemEdge, EntityId } from '@/types';
import { NODE_WIDTH, NODE_BASE_HEIGHT, PORT_SPACING } from './canvas-math';

// ─── Constants ─────────────────────────────────────────────────────

const GRID = 12;
const PORT_SIZE = 10;
const TARGET_ASPECT = 16 / 10;

// ─── Public interface ──────────────────────────────────────────────

export interface LayoutPosition {
  id: EntityId;
  x: number;
  y: number;
}

// ─── Helpers ───────────────────────────────────────────────────────

function nw(n: SystemNode): number { return n.width ?? NODE_WIDTH; }
function nh(n: SystemNode): number {
  return n.height ?? (NODE_BASE_HEIGHT + Math.max(n.inputs.length, n.outputs.length) * PORT_SPACING);
}
function snap(v: number): number { return Math.round(v / GRID) * GRID; }

// ─── Shared layout options (direction-independent) ────────────────

const SHARED_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.spacing.nodeNode': '40',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.spacing.edgeNode': '25',
  'elk.layered.spacing.edgeNodeBetweenLayers': '35',
  'elk.spacing.edgeEdge': '12',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '15',
  'elk.spacing.portPort': String(PORT_SPACING),
  'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
  'elk.layered.thoroughness': '12',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
  'elk.layered.nodePlacement.favorStraightEdges': 'true',
  'elk.edgeRouting': 'POLYLINE',
  'elk.portAlignment.default': 'BEGIN',
  'elk.separateConnectedComponents': 'true',
  'elk.spacing.componentComponent': '60',
  'elk.padding': '[top=40,left=40,bottom=40,right=40]',
};

// ─── Graph builder ────────────────────────────────────────────────

type Dir = 'RIGHT' | 'DOWN';

function buildGraph(nodes: SystemNode[], edges: SystemEdge[], dir: Dir): ElkNode {
  const ids = new Set(nodes.map((n) => n.id));

  // Port ownership for validation
  const portOf = new Map<string, string>();
  for (const n of nodes) {
    for (const p of n.inputs) portOf.set(p.id, n.id);
    for (const p of n.outputs) portOf.set(p.id, n.id);
  }

  // Port sides depend on flow direction
  const inSide = dir === 'RIGHT' ? 'WEST' : 'NORTH';
  const outSide = dir === 'RIGHT' ? 'EAST' : 'SOUTH';

  // Track which nodes have invalid port references (need relaxed constraints)
  const relaxed = new Set<string>();

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
        layoutOptions: { 'elk.port.side': inSide, 'elk.port.index': String(i) },
      })),
      ...node.outputs.map((p, i) => ({
        id: p.id,
        width: PORT_SIZE,
        height: PORT_SIZE,
        layoutOptions: { 'elk.port.side': outSide, 'elk.port.index': String(i) },
      })),
    ];

    // FIXED_ORDER: ELK knows side + order, can freely space ports
    // FIXED_SIDE: fallback when port ref is invalid (node-level edge)
    const constraint = relaxed.has(node.id) ? 'FIXED_SIDE' : 'FIXED_ORDER';

    return {
      id: node.id,
      width: w,
      height: h,
      ports,
      layoutOptions: { 'elk.portConstraints': constraint },
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
    layoutOptions: { ...SHARED_OPTIONS, 'elk.direction': dir },
  };
}

// ─── Layout execution ─────────────────────────────────────────────

const elk = new ELK();

function extract(result: ElkNode): LayoutPosition[] {
  return (result.children ?? []).map((c) => ({
    id: c.id as EntityId,
    x: snap(c.x ?? 0),
    y: snap(c.y ?? 0),
  }));
}

function calcAspect(pos: LayoutPosition[], nodes: SystemNode[]): number {
  if (pos.length === 0) return Infinity;
  const m = new Map(nodes.map((n) => [n.id, n]));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pos) {
    const n = m.get(p.id);
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + (n ? nw(n) : NODE_WIDTH));
    y1 = Math.max(y1, p.y + (n ? nh(n) : NODE_BASE_HEIGHT));
  }
  const h = y1 - y0;
  return h === 0 ? Infinity : (x1 - x0) / h;
}

export async function computeAutoLayout(
  nodes: SystemNode[],
  edges: SystemEdge[]
): Promise<LayoutPosition[]> {
  if (nodes.length === 0) return [];

  // Run both directions independently (one failing doesn't kill the other)
  const [rightResult, downResult] = await Promise.allSettled([
    elk.layout(buildGraph(nodes, edges, 'RIGHT')),
    elk.layout(buildGraph(nodes, edges, 'DOWN')),
  ]);

  const rightPos = rightResult.status === 'fulfilled' ? extract(rightResult.value) : [];
  const downPos = downResult.status === 'fulfilled' ? extract(downResult.value) : [];

  if (rightPos.length === 0 && downPos.length === 0) {
    console.error('[auto-layout] Both ELK directions failed');
    return [];
  }
  if (rightPos.length === 0) return downPos;
  if (downPos.length === 0) return rightPos;

  // Pick whichever aspect ratio is closest to 16:10
  const rScore = Math.abs(Math.log(calcAspect(rightPos, nodes) / TARGET_ASPECT));
  const dScore = Math.abs(Math.log(calcAspect(downPos, nodes) / TARGET_ASPECT));

  return rScore <= dScore ? rightPos : downPos;
}
