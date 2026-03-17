/**
 * React Flow specific type definitions.
 * Extends React Flow types with System-specific data.
 */

import type { Node, Edge, NodeProps, EdgeProps } from '@xyflow/react';
import type { Port, EntityId, InternalSystem } from './system';

/** Data stored in a React Flow node for system entities */
export interface SystemNodeData extends Record<string, unknown> {
  name: string;
  process: string;
  operand: string;
  isExternal: boolean;
  emergence?: string;
  inputs: Port[];
  outputs: Port[];
  internal?: InternalSystem;
  /** Transient flag for newly created nodes */
  isNew?: boolean;
  /** For boundary nodes: 'input' or 'output' */
  boundaryType?: 'input' | 'output';
  /** For boundary nodes: the ports to display */
  boundaryPorts?: Port[];
  /** For boundary nodes: the label */
  boundaryLabel?: string;
  /** For group nodes: width of the group bounding box */
  groupWidth?: number;
  /** For group nodes: height of the group bounding box */
  groupHeight?: number;
}

/** Data stored in a React Flow edge for system connections */
export interface SystemEdgeData extends Record<string, unknown> {
  /** Description of what flows through this connection */
  interaction?: string;
  /** Physical medium or structure of the connection */
  structure?: string;
  /** Source handle ID */
  sourceHandleId: string;
  /** Target handle ID */
  targetHandleId: string;
}

/** React Flow node with SystemNodeData */
export type SystemFlowNode = Node<SystemNodeData, 'system' | 'boundary' | 'group'>;

/** React Flow edge with SystemEdgeData */
export type SystemFlowEdge = Edge<SystemEdgeData>;

/** Props for the custom system node component */
export type SystemNodeProps = NodeProps<SystemFlowNode>;

/** Props for the custom system edge component */
export type SystemEdgeProps = EdgeProps<SystemFlowEdge>;
