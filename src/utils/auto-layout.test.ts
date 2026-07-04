import { describe, it, expect } from 'vitest';
import { computeAutoLayout } from './auto-layout';
import { NODE_WIDTH, NODE_BASE_HEIGHT } from './canvas-math';
import type { SystemNode, SystemEdge } from '@/types';

function node(id: string, opts: Partial<SystemNode> = {}): SystemNode {
  return {
    id,
    name: id,
    process: '',
    operand: '',
    isExternal: false,
    x: 0,
    y: 0,
    inputs: [],
    outputs: [],
    ...opts,
  };
}

describe('computeAutoLayout', () => {
  it('returns empty results for an empty graph', async () => {
    const result = await computeAutoLayout([], []);
    expect(result).toEqual({ positions: [], edgeWaypoints: {} });
  });

  it('lays out a source -> middle -> sink chain left to right with no overlaps', async () => {
    const source = node('source', { outputs: [{ id: 'source_out', name: 'out' }] });
    const middle = node('middle', {
      inputs: [{ id: 'middle_in', name: 'in' }],
      outputs: [{ id: 'middle_out', name: 'out' }],
    });
    const sink = node('sink', { inputs: [{ id: 'sink_in', name: 'in' }] });

    const edges: SystemEdge[] = [
      { id: 'e1', fromNode: 'source', fromPort: 'source_out', toNode: 'middle', toPort: 'middle_in' },
      { id: 'e2', fromNode: 'middle', fromPort: 'middle_out', toNode: 'sink', toPort: 'sink_in' },
    ];

    const { positions } = await computeAutoLayout([source, middle, sink], edges);
    expect(positions).toHaveLength(3);

    const byId = Object.fromEntries(positions.map((p) => [p.id, p]));

    // Pure source/sink nodes must land at the extremes; the chain reads left to right.
    expect(byId.source.x).toBeLessThan(byId.middle.x);
    expect(byId.middle.x).toBeLessThan(byId.sink.x);

    // No two nodes should overlap in flow space (default box sizes, since none set width/height).
    const boxes = positions.map((p) => ({
      x0: p.x,
      y0: p.y,
      x1: p.x + NODE_WIDTH,
      y1: p.y + NODE_BASE_HEIGHT,
    }));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapsX = a.x0 < b.x1 && b.x0 < a.x1;
        const overlapsY = a.y0 < b.y1 && b.y0 < a.y1;
        expect(overlapsX && overlapsY).toBe(false);
      }
    }
  });

  it('places an isolated node (no edges) without crashing', async () => {
    const isolated = node('isolated');
    const { positions } = await computeAutoLayout([isolated], []);
    expect(positions).toHaveLength(1);
    expect(positions[0].id).toBe('isolated');
  });

  it('ignores edges that reference an unknown or self node', async () => {
    const a = node('a', { outputs: [{ id: 'a_out', name: 'out' }] });
    const badEdges: SystemEdge[] = [
      { id: 'e1', fromNode: 'a', fromPort: 'a_out', toNode: 'missing', toPort: 'x' },
      { id: 'e2', fromNode: 'a', fromPort: 'a_out', toNode: 'a', toPort: 'a_out' },
    ];

    const { positions } = await computeAutoLayout([a], badEdges);
    expect(positions).toHaveLength(1);
  });
});
