import { describe, it, expect } from 'vitest';
import {
  systemNodeToFlowNode,
  systemEdgeToFlowEdge,
  systemToFlowWithBoundaries,
} from './flow-converters';
import type { SystemNode, SystemEdge } from '@/types';

function node(overrides: Partial<SystemNode> = {}): SystemNode {
  return {
    id: 'n1',
    name: 'Node',
    process: 'Process',
    operand: 'Operand',
    isExternal: false,
    x: 10,
    y: 20,
    inputs: [],
    outputs: [],
    ...overrides,
  };
}

function edge(overrides: Partial<SystemEdge> = {}): SystemEdge {
  return {
    id: 'e1',
    fromNode: 'n1',
    fromPort: 'out1',
    toNode: 'n2',
    toPort: 'in1',
    ...overrides,
  };
}

describe('systemNodeToFlowNode', () => {
  it('maps core fields and position', () => {
    const flowNode = systemNodeToFlowNode(node());
    expect(flowNode.id).toBe('n1');
    expect(flowNode.type).toBe('system');
    expect(flowNode.position).toEqual({ x: 10, y: 20 });
    expect(flowNode.data.name).toBe('Node');
  });

  it('only sets a style when a custom width or height is present', () => {
    expect(systemNodeToFlowNode(node()).style).toBeUndefined();
    const resized = systemNodeToFlowNode(node({ width: 300, height: 150 }));
    expect(resized.style).toEqual({ width: 300, height: 150 });
  });
});

describe('systemEdgeToFlowEdge', () => {
  it('carries interaction/structure data and handle ids', () => {
    const flowEdge = systemEdgeToFlowEdge(edge({ interaction: 'Sends data', structure: 'HTTP' }));
    expect(flowEdge.source).toBe('n1');
    expect(flowEdge.target).toBe('n2');
    expect(flowEdge.sourceHandle).toBe('out1');
    expect(flowEdge.targetHandle).toBe('in1');
    expect(flowEdge.data?.interaction).toBe('Sends data');
    expect(flowEdge.data?.structure).toBe('HTTP');
  });

  it('attaches waypoints only when provided', () => {
    expect(systemEdgeToFlowEdge(edge()).data?.waypoints).toBeUndefined();
    const withWaypoints = systemEdgeToFlowEdge(edge(), [{ x: 1, y: 2 }]);
    expect(withWaypoints.data?.waypoints).toEqual([{ x: 1, y: 2 }]);
  });
});

describe('systemToFlowWithBoundaries', () => {
  it('returns plain nodes/edges when there is no parent node', () => {
    const result = systemToFlowWithBoundaries({ nodes: [node()], edges: [] }, null);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].type).toBe('system');
  });

  it('adds boundary nodes exposing the parent ports when a parent is given', () => {
    const parent = node({
      id: 'parent',
      inputs: [{ id: 'p_in', name: 'In' }],
      outputs: [{ id: 'p_out', name: 'Out' }],
    });
    const result = systemToFlowWithBoundaries({ nodes: [node()], edges: [] }, parent);

    const boundaryIn = result.nodes.find((n) => n.id === 'BOUNDARY_IN');
    const boundaryOut = result.nodes.find((n) => n.id === 'BOUNDARY_OUT');
    expect(boundaryIn?.data.outputs).toEqual(parent.inputs);
    expect(boundaryOut?.data.inputs).toEqual(parent.outputs);
    expect(result.nodes).toHaveLength(3); // boundary in + boundary out + the one system node
  });

  it('threads edge waypoints through to the converted edges', () => {
    const waypoints = { e1: [{ x: 5, y: 5 }] };
    const result = systemToFlowWithBoundaries(
      { nodes: [], edges: [edge()] },
      null,
      waypoints
    );
    expect(result.edges[0].data?.waypoints).toEqual([{ x: 5, y: 5 }]);
  });
});
