/**
 * Canvas math utilities for SysWeaver.
 * Contains Bezier curve calculations, ID generation, and bounding box math.
 */

import type { BoundingBox, SystemNode, NodeMap, BoundsCache, Port } from '@/types';

/** Node width constant in pixels */
export const NODE_WIDTH = 220;

/** Node header height in pixels */
export const NODE_HEADER_HEIGHT = 40;

/** Node function box height in pixels */
export const NODE_FUNCTION_HEIGHT = 40;

/** Port spacing in pixels */
export const PORT_SPACING = 32;

/** Base node height (header + function box + padding) */
export const NODE_BASE_HEIGHT = 116;

/** Port connector offset from edge */
export const PORT_OFFSET = 8;

/**
 * Generates a unique ID with a given prefix.
 * @param prefix - The prefix for the ID (e.g., 'node', 'edge', 'in', 'out')
 * @returns A unique string identifier
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculates the SVG path for a Bezier curve between two points.
 * Handles both forward and backward connections with appropriate curve offsets.
 *
 * @param startX - Starting X coordinate (output port)
 * @param startY - Starting Y coordinate
 * @param endX - Ending X coordinate (input port)
 * @param endY - Ending Y coordinate
 * @returns SVG path data string for the Bezier curve
 */
export function calculateBezier(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const adjustedStartX = startX + PORT_OFFSET;
  const adjustedEndX = endX - PORT_OFFSET;

  const dx = adjustedEndX - adjustedStartX;
  const dy = Math.abs(endY - startY);
  const isBackwards = dx < 0;

  let curveOffset = isBackwards
    ? Math.max(120, dy * 0.6 + Math.abs(dx) * 0.2)
    : Math.max(dx * 0.5, 60);

  if (!isBackwards && dy > 100) {
    curveOffset += Math.min(dy * 0.25, 100);
  }

  const cp1x = adjustedStartX + curveOffset;
  const cp2x = adjustedEndX - curveOffset;

  return `M ${adjustedStartX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${adjustedEndX} ${endY}`;
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
 * Calculates the bounding box for a node.
 *
 * @param node - The node to calculate bounds for
 * @returns Bounding box with min/max coordinates
 */
export function getNodeBounds(node: SystemNode): BoundingBox {
  const height = calculateNodeHeight(node.inputs, node.outputs);
  return {
    minX: 0,
    minY: 0,
    maxX: NODE_WIDTH,
    maxY: height,
  };
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
    const portCount = Math.max(node.inputs.length, node.outputs.length);
    const height = NODE_BASE_HEIGHT + portCount * PORT_SPACING;
    return { minX: 0, minY: 0, maxX: NODE_WIDTH, maxY: height };
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
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
    const nodeHeight = calculateNodeHeight(node.inputs, node.outputs);
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

/**
 * Clamps a scale value within the allowed zoom range.
 *
 * @param scale - Scale value to clamp
 * @param min - Minimum scale (default 0.1)
 * @param max - Maximum scale (default 4)
 * @returns Clamped scale value
 */
export function clampScale(scale: number, min = 0.1, max = 4): number {
  return Math.min(Math.max(scale, min), max);
}

/** Base grid spacing in pixels */
const BASE_GRID_SIZE = 24;

/** Grid size multiplier levels for different zoom ranges */
const GRID_LEVELS = [1, 2, 4, 8];

/** Minimum visible grid spacing in screen pixels */
const MIN_GRID_SCREEN_SIZE = 12;

/** Maximum visible grid spacing in screen pixels */
const MAX_GRID_SCREEN_SIZE = 48;

/**
 * Grid configuration for dynamic scaling
 */
export interface DynamicGridConfig {
  /** Primary grid size in screen pixels */
  primarySize: number;
  /** Primary grid opacity (0-1) */
  primaryOpacity: number;
  /** Secondary (larger) grid size in screen pixels */
  secondarySize: number;
  /** Secondary grid opacity (0-1) */
  secondaryOpacity: number;
}

/**
 * Calculates dynamic grid configuration based on current zoom scale.
 * Creates a smooth transition between grid levels as you zoom.
 *
 * @param scale - Current zoom scale
 * @returns Grid configuration with sizes and opacities for two grid layers
 */
export function calculateDynamicGrid(scale: number): DynamicGridConfig {
  // Calculate the effective grid size at current scale
  const effectiveSize = BASE_GRID_SIZE * scale;

  // Find the appropriate grid level
  let levelIndex = 0;
  for (let i = 0; i < GRID_LEVELS.length; i++) {
    const levelSize = BASE_GRID_SIZE * GRID_LEVELS[i] * scale;
    if (levelSize >= MIN_GRID_SCREEN_SIZE) {
      levelIndex = i;
      break;
    }
  }

  // Primary grid (smaller)
  const primaryMultiplier = GRID_LEVELS[levelIndex];
  const primarySize = BASE_GRID_SIZE * primaryMultiplier * scale;

  // Secondary grid (larger, next level up)
  const secondaryIndex = Math.min(levelIndex + 1, GRID_LEVELS.length - 1);
  const secondaryMultiplier = GRID_LEVELS[secondaryIndex];
  const secondarySize = BASE_GRID_SIZE * secondaryMultiplier * scale;

  // Calculate opacity based on where we are in the transition
  // Fade out primary grid as it gets too small, fade in as it reaches proper size
  const primaryProgress = (primarySize - MIN_GRID_SCREEN_SIZE) / (MAX_GRID_SCREEN_SIZE - MIN_GRID_SCREEN_SIZE);
  const primaryOpacity = Math.max(0, Math.min(1, primaryProgress * 1.5));

  // Secondary grid fades in as primary gets larger
  const secondaryProgress = (primarySize - MIN_GRID_SCREEN_SIZE * 1.5) / (MAX_GRID_SCREEN_SIZE - MIN_GRID_SCREEN_SIZE);
  const secondaryOpacity = Math.max(0, Math.min(0.3, secondaryProgress * 0.3));

  return {
    primarySize,
    primaryOpacity: primaryOpacity * 0.6, // Base opacity for dots
    secondarySize,
    secondaryOpacity,
  };
}
