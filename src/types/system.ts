/**
 * Core type definitions for the SysWeaver systems design canvas.
 * Defines the data structures for nodes, edges, ports, and the overall system hierarchy.
 */

/** Unique identifier for entities */
export type EntityId = string;

/** A port represents an input or output connection point on a node */
export interface Port {
  id: EntityId;
  name: string;
}

/** Internal subsystem structure containing nested nodes and edges */
export interface InternalSystem {
  nodes: SystemNode[];
  edges: SystemEdge[];
}

/**
 * A node in the system graph.
 * Can be either an external entity (outside system boundary) or internal entity.
 * May contain an internal subsystem for hierarchical decomposition.
 */
export interface SystemNode {
  id: EntityId;
  name: string;
  process: string;
  operand: string;
  /** When true, entity sits outside the system boundary (external/context entity) */
  isExternal: boolean;
  emergence?: string;
  x: number;
  y: number;
  inputs: Port[];
  outputs: Port[];
  internal?: InternalSystem;
  /** Transient flag for newly created nodes, not persisted */
  isNew?: boolean;
}

/**
 * An edge connecting two ports between nodes.
 * Special node IDs 'BOUNDARY_IN' and 'BOUNDARY_OUT' represent subsystem boundary ports.
 */
export interface SystemEdge {
  id: EntityId;
  fromNode: EntityId;
  fromPort: EntityId;
  toNode: EntityId;
  toPort: EntityId;
  /** Description of what flows through this connection */
  interaction?: string;
  /** Physical medium or structure of the connection */
  structure?: string;
  /** @deprecated Use interaction instead */
  label?: string;
}

/**
 * Root system data structure containing the entire system graph.
 * This is the serializable representation of the canvas state.
 */
export interface SystemData {
  id: EntityId;
  name: string;
  emergence?: string;
  nodes: SystemNode[];
  edges: SystemEdge[];
}

/** 2D point coordinates */
export interface Point {
  x: number;
  y: number;
}

/** Canvas offset for panning */
export interface CanvasOffset {
  x: number;
  y: number;
}

/** Bounding box for rendering calculations */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Draft edge state during edge creation.
 * Tracks the in-progress connection as user drags between ports.
 */
export interface DraftEdge {
  fromNode: EntityId | null;
  fromPort: EntityId | null;
  toNode: EntityId | null;
  toPort: EntityId | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isOutputStart: boolean;
}

/**
 * Rendered group in flattened view.
 * Represents an expanded subsystem as a bounding box with ports.
 */
export interface RenderGroup {
  id: EntityId;
  name: string;
  inputs: Port[];
  outputs: Port[];
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Flattened view calculation result.
 * Contains the resolved nodes, groups, and edges for semantic zoom rendering.
 */
export interface FlattenedView {
  renderNodes: SystemNode[];
  renderGroups: RenderGroup[];
  resolvedEdges: SystemEdge[];
}

/** Modal state for system properties editing */
export interface RenameModalState {
  isOpen: boolean;
  name: string;
  emergence: string;
}

/** Breadcrumb path item for navigation */
export interface BreadcrumbItem {
  id: EntityId;
  name: string;
  emergence?: string;
}

/** Node map for flattening calculations */
export type NodeMap = Record<EntityId, SystemNode>;

/** Bounds cache for memoized bounding box calculations */
export type BoundsCache = Record<EntityId, BoundingBox>;
