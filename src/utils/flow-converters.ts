/**
 * Conversion utilities between SystemData format and React Flow format.
 * Handles bidirectional conversion for seamless integration.
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  SystemNode,
  SystemEdge,
  InternalSystem,
  SystemNodeData,
  SystemEdgeData,
  SystemFlowNode,
  SystemFlowEdge,
} from '@/types';

/**
 * Converts a SystemNode to a React Flow Node.
 */
export function systemNodeToFlowNode(node: SystemNode): SystemFlowNode {
  return {
    id: node.id,
    type: 'system',
    position: { x: node.x, y: node.y },
    data: {
      name: node.name,
      process: node.process,
      operand: node.operand,
      isExternal: node.isExternal,
      emergence: node.emergence,
      inputs: node.inputs || [],
      outputs: node.outputs || [],
      internal: node.internal,
      isNew: node.isNew,
    },
  };
}

/**
 * Converts a React Flow Node back to a SystemNode.
 */
export function flowNodeToSystemNode(node: SystemFlowNode): SystemNode {
  return {
    id: node.id,
    name: node.data.name,
    process: node.data.process,
    operand: node.data.operand,
    isExternal: node.data.isExternal,
    emergence: node.data.emergence,
    x: node.position.x,
    y: node.position.y,
    inputs: node.data.inputs,
    outputs: node.data.outputs,
    internal: node.data.internal,
    isNew: node.data.isNew,
  };
}

/**
 * Converts a SystemEdge to a React Flow Edge.
 */
export function systemEdgeToFlowEdge(edge: SystemEdge): SystemFlowEdge {
  return {
    id: edge.id,
    type: 'system',
    source: edge.fromNode,
    target: edge.toNode,
    sourceHandle: edge.fromPort,
    targetHandle: edge.toPort,
    data: {
      interaction: edge.interaction || edge.label,
      structure: edge.structure,
      sourceHandleId: edge.fromPort,
      targetHandleId: edge.toPort,
    },
  };
}

/**
 * Converts a React Flow Edge back to a SystemEdge.
 */
export function flowEdgeToSystemEdge(edge: SystemFlowEdge): SystemEdge {
  return {
    id: edge.id,
    fromNode: edge.source,
    fromPort: edge.sourceHandle || edge.data?.sourceHandleId || '',
    toNode: edge.target,
    toPort: edge.targetHandle || edge.data?.targetHandleId || '',
    interaction: edge.data?.interaction,
    structure: edge.data?.structure,
  };
}

/**
 * Converts an entire InternalSystem to React Flow nodes and edges.
 */
export function systemToFlow(system: InternalSystem): {
  nodes: SystemFlowNode[];
  edges: SystemFlowEdge[];
} {
  return {
    nodes: system.nodes.map(systemNodeToFlowNode),
    edges: system.edges.map(systemEdgeToFlowEdge),
  };
}

/**
 * Converts an InternalSystem to React Flow format with boundary nodes for subsystem view.
 * Boundary nodes represent the parent's input/output ports.
 */
export function systemToFlowWithBoundaries(
  system: InternalSystem,
  parentNode: SystemNode | null
): {
  nodes: SystemFlowNode[];
  edges: SystemFlowEdge[];
} {
  const systemNodes = system.nodes.map(systemNodeToFlowNode);
  const systemEdges = system.edges.map(systemEdgeToFlowEdge);

  if (!parentNode) {
    return { nodes: systemNodes, edges: systemEdges };
  }

  // Calculate bounds to position boundary nodes
  let minX = 0, maxX = 500;
  if (systemNodes.length > 0) {
    minX = Math.min(...systemNodes.map(n => n.position.x)) - 300;
    maxX = Math.max(...systemNodes.map(n => n.position.x)) + 500;
  }

  // Create boundary input node (left side)
  const boundaryInputNode: SystemFlowNode = {
    id: 'BOUNDARY_IN',
    type: 'boundary',
    position: { x: minX, y: 50 },
    draggable: false,
    selectable: false,
    data: {
      name: 'Boundary Inputs',
      process: '',
      operand: '',
      isExternal: false,
      inputs: [],
      outputs: parentNode.inputs, // Parent's inputs become outputs here
      boundaryType: 'input',
      boundaryPorts: parentNode.inputs,
      boundaryLabel: 'Boundary Inputs',
    },
  };

  // Create boundary output node (right side)  
  const boundaryOutputNode: SystemFlowNode = {
    id: 'BOUNDARY_OUT',
    type: 'boundary',
    position: { x: maxX, y: 50 },
    draggable: false,
    selectable: false,
    data: {
      name: 'Boundary Outputs',
      process: '',
      operand: '',
      isExternal: false,
      inputs: parentNode.outputs, // Parent's outputs become inputs here
      outputs: [],
      boundaryType: 'output',
      boundaryPorts: parentNode.outputs,
      boundaryLabel: 'Boundary Outputs',
    },
  };

  return {
    nodes: [boundaryInputNode, boundaryOutputNode, ...systemNodes],
    edges: systemEdges,
  };
}

/**
 * Converts a flattened view to React Flow format.
 * Renders expanded nodes as group nodes with proper handles for edges.
 */
export function flattenedViewToFlow(flattenedView: {
  renderNodes: SystemNode[];
  renderGroups: Array<{
    id: string;
    name: string;
    inputs: Array<{ id: string; name: string }>;
    outputs: Array<{ id: string; name: string }>;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  resolvedEdges: SystemEdge[];
}): {
  nodes: SystemFlowNode[];
  edges: SystemFlowEdge[];
} {
  // Convert regular nodes
  const systemNodes = flattenedView.renderNodes.map(systemNodeToFlowNode);
  
  // Convert groups to group nodes (so they can have handles for edges)
  const groupNodes: SystemFlowNode[] = flattenedView.renderGroups.map((group) => ({
    id: group.id,
    type: 'group' as const,
    position: { x: group.x, y: group.y },
    draggable: false,
    selectable: false,
    data: {
      name: group.name,
      process: '',
      operand: '',
      isExternal: false,
      inputs: group.inputs,
      outputs: group.outputs,
      groupWidth: group.width,
      groupHeight: group.height,
    },
    // Ensure groups are rendered below regular nodes
    zIndex: -1,
  }));
  
  // Convert edges
  const edges = flattenedView.resolvedEdges.map(systemEdgeToFlowEdge);
  
  // Groups first (lower z-index), then regular nodes on top
  return {
    nodes: [...groupNodes, ...systemNodes],
    edges,
  };
}

/**
 * Converts React Flow nodes and edges back to an InternalSystem.
 */
export function flowToSystem(
  nodes: SystemFlowNode[],
  edges: SystemFlowEdge[]
): InternalSystem {
  return {
    nodes: nodes.map(flowNodeToSystemNode),
    edges: edges.map(flowEdgeToSystemEdge),
  };
}
