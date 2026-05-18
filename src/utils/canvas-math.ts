/**
 * Canvas math utilities for System (enabledby.cloud/system).
 * Contains ID generation and bounding box math for flattened view.
 */

import type { BoundingBox, SystemNode, NodeMap, BoundsCache, Port } from '@/types';

/** Node width constant in pixels */
export const NODE_WIDTH = 220;

/** Port spacing in pixels */
export const PORT_SPACING = 32;

/** Base node height (header + function box + padding) */
export const NODE_BASE_HEIGHT = 116;

/**
 * Generates a unique ID with a given prefix.
 * @param prefix - The prefix for the ID (e.g., 'node', 'edge', 'in', 'out')
 * @returns A unique string identifier
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculates the height of a node based on its port count.
 *
 * @param inputs - Array of input ports
 * @param outputs - Array of output ports
 * @returns The calculated node height in pixels
 */
export function calculateNodeHeight(inputs: Port[], outputs: Port[]): number {
  const portCount = Math.max(inputs.length, outputs.length);
  return NODE_BASE_HEIGHT + portCount * PORT_SPACING;
}

/**
 * Recursively calculates the bounding box for a node in flattened view.
 * For expanded nodes, computes bounds based on child positions.
 *
 * @param nodeId - ID of the node to calculate bounds for
 * @param nodeMap - Map of all nodes by ID
 * @param expandedSet - Set of expanded node IDs
 * @param boundsCache - Cache for memoized bounds
 * @returns Bounding box for the node
 */
export function getBoundsRecursive(
  nodeId: string,
  nodeMap: NodeMap,
  expandedSet: Set<string>,
  boundsCache: BoundsCache
): BoundingBox {
  if (boundsCache[nodeId]) {
    return boundsCache[nodeId];
  }

  if (!expandedSet.has(nodeId)) {
    const node = nodeMap[nodeId];
    if (!node) {
      return { minX: 0, minY: 0, maxX: NODE_WIDTH, maxY: 150 };
    }
    const width = node.width ?? NODE_WIDTH;
    const height = node.height ?? (NODE_BASE_HEIGHT + Math.max(node.inputs.length, node.outputs.length) * PORT_SPACING);
    return { minX: 0, minY: 0, maxX: width, maxY: height };
  }

  const node = nodeMap[nodeId];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (node.internal?.nodes) {
    for (const child of node.internal.nodes) {
      const childBounds = getBoundsRecursive(child.id, nodeMap, expandedSet, boundsCache);
      minX = Math.min(minX, (child.x || 0) + childBounds.minX);
      minY = Math.min(minY, (child.y || 0) + childBounds.minY);
      maxX = Math.max(maxX, (child.x || 0) + childBounds.maxX);
      maxY = Math.max(maxY, (child.y || 0) + childBounds.maxY);
    }
  }

  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = NODE_WIDTH;
    maxY = 150;
  }

  const portCount = Math.max(node.inputs.length, node.outputs.length);
  const minHeightForPorts = 40 + portCount * PORT_SPACING + 16;

  let computedMinY = minY - 48;
  let computedMaxY = maxY + 24;
  if (computedMaxY - computedMinY < minHeightForPorts) {
    computedMaxY = computedMinY + minHeightForPorts;
  }

  const result: BoundingBox = {
    minX: minX - 32,
    minY: computedMinY,
    maxX: maxX + 32,
    maxY: computedMaxY,
  };

  boundsCache[nodeId] = result;
  return result;
}

/**
 * Calculates the system boundary box around non-context nodes.
 *
 * @param nodes - Array of nodes to consider
 * @returns Bounding box for the system boundary, or null if no internal nodes
 */
export function calculateSystemBoundary(nodes: SystemNode[]): BoundingBox | null {
  const internalNodes = nodes.filter((n) => !n.isExternal);
  if (internalNodes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of internalNodes) {
    const nodeWidth = node.width ?? NODE_WIDTH;
    const nodeHeight = node.height ?? calculateNodeHeight(node.inputs, node.outputs);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + nodeWidth);
    maxY = Math.max(maxY, node.y + nodeHeight);
  }

  const padding = 45;
  return {
    minX: minX - padding,
    minY: minY - padding - 35,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}
