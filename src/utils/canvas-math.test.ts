import { describe, it, expect } from 'vitest';
import {
  generateId,
  calculateNodeHeight,
  calculateSystemBoundary,
  getBoundsRecursive,
  NODE_WIDTH,
  NODE_BASE_HEIGHT,
  PORT_SPACING,
} from './canvas-math';
import type { SystemNode, NodeMap, BoundsCache } from '@/types';

function makeNode(overrides: Partial<SystemNode> = {}): SystemNode {
  return {
    id: 'n1',
    name: 'Node',
    process: '',
    operand: '',
    isExternal: false,
    x: 0,
    y: 0,
    inputs: [],
    outputs: [],
    ...overrides,
  };
}

describe('generateId', () => {
  it('prefixes the id and produces unique values', () => {
    const a = generateId('node');
    const b = generateId('node');
    expect(a).toMatch(/^node_/);
    expect(a).not.toBe(b);
  });
});

describe('calculateNodeHeight', () => {
  it('returns the base height when there are no ports', () => {
    expect(calculateNodeHeight([], [])).toBe(NODE_BASE_HEIGHT);
  });

  it('grows with the larger of input/output port counts', () => {
    const inputs = [{ id: 'i1', name: 'a' }, { id: 'i2', name: 'b' }];
    const outputs = [{ id: 'o1', name: 'c' }];
    expect(calculateNodeHeight(inputs, outputs)).toBe(NODE_BASE_HEIGHT + 2 * PORT_SPACING);
  });
});

describe('calculateSystemBoundary', () => {
  it('returns null when there are no internal (non-external) nodes', () => {
    const nodes = [makeNode({ isExternal: true })];
    expect(calculateSystemBoundary(nodes)).toBeNull();
  });

  it('bounds only internal nodes, ignoring external ones', () => {
    const internal = makeNode({ id: 'internal', x: 0, y: 0 });
    const external = makeNode({ id: 'external', isExternal: true, x: 1000, y: 1000 });
    const bounds = calculateSystemBoundary([internal, external]);

    expect(bounds).not.toBeNull();
    // The external node sits far away; if it leaked into the calculation the
    // boundary would stretch out to x/y ~1000+.
    expect(bounds!.maxX).toBeLessThan(500);
    expect(bounds!.maxY).toBeLessThan(500);
  });
});

describe('getBoundsRecursive', () => {
  it('returns a default-sized box for a collapsed node', () => {
    const node = makeNode({ width: 300, height: 150 });
    const nodeMap: NodeMap = { [node.id]: node };
    const bounds = getBoundsRecursive(node.id, nodeMap, new Set(), {});

    expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 300, maxY: 150 });
  });

  it('falls back to NODE_WIDTH-based defaults when width/height are unset', () => {
    const node = makeNode();
    const nodeMap: NodeMap = { [node.id]: node };
    const bounds = getBoundsRecursive(node.id, nodeMap, new Set(), {});

    expect(bounds.maxX).toBe(NODE_WIDTH);
    expect(bounds.maxY).toBe(NODE_BASE_HEIGHT);
  });

  it('expands around child positions for an expanded (decomposed) node', () => {
    const child = makeNode({ id: 'child', x: 100, y: 50 });
    const parent = makeNode({
      id: 'parent',
      internal: { nodes: [child], edges: [] },
    });
    const nodeMap: NodeMap = { [parent.id]: parent, [child.id]: child };
    const cache: BoundsCache = {};
    const bounds = getBoundsRecursive(parent.id, nodeMap, new Set([parent.id]), cache);

    // Child sits at (100, 50); the parent's box must fully contain it.
    expect(bounds.minX).toBeLessThanOrEqual(100);
    expect(bounds.minY).toBeLessThanOrEqual(50);
    expect(bounds.maxX).toBeGreaterThanOrEqual(100 + NODE_WIDTH);
    // Result should be memoized in the cache under the parent id.
    expect(cache[parent.id]).toBe(bounds);
  });
});
