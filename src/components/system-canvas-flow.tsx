'use client';

/**
 * SystemCanvas - Main canvas component using React Flow.
 * Provides infinite canvas with pan, zoom, node-based editing.
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  PanOnScrollMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Map, X } from 'lucide-react';

import { useSystemStore } from '@/store';
import {
  systemToFlowWithBoundaries,
  flattenedViewToFlow,
  generateId,
} from '@/utils';
import { SystemNode } from './flow/system-node';
import { SystemEdge } from './flow/system-edge';
import { BoundaryNode } from './flow/boundary-node';
import { GroupNode } from './flow/group-node';
import {
  TopBar,
  Breadcrumbs,
  JsonEditor,
  NodeEditorModal,
  EdgeEditorModal,
  RenameSystemModal,
  ClearAllModal,
} from '@/components';
import { SystemBoundary } from './canvas/system-boundary';
import { LayeredModeIndicator } from './canvas/layered-mode-indicator';
import type { SystemFlowNode, SystemFlowEdge } from '@/types';

// Define custom node types
const nodeTypes: NodeTypes = {
  system: SystemNode,
  boundary: BoundaryNode,
  group: GroupNode,
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  system: SystemEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: 'system',
  animated: false,
};

function SystemCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  // Minimap visibility state
  const [showMinimap, setShowMinimap] = useState(true);

  // Get stable primitive values from store for dependency tracking
  const systemData = useSystemStore((state) => state.systemData);
  const viewDepth = useSystemStore((state) => state.viewDepth);
  const currentPath = useSystemStore((state) => state.currentPath);
  const showJson = useSystemStore((state) => state.showJson);
  
  // Get functions (stable references)
  const getCurrentSystem = useSystemStore((state) => state.getCurrentSystem);
  const isFlattened = useSystemStore((state) => state.isFlattened);
  const getFlattenedView = useSystemStore((state) => state.getFlattenedView);
  const updateCurrentSystem = useSystemStore((state) => state.updateCurrentSystem);
  const createEdge = useSystemStore((state) => state.createEdge);
  const getParentNode = useSystemStore((state) => state.getParentNode);

  const flattened = isFlattened();
  const parentNode = getParentNode();

  // Convert system data to React Flow format
  const flowData = useMemo(() => {
    const currentSystem = getCurrentSystem();
    const flattenedView = getFlattenedView();
    const parent = getParentNode();
    
    if (flattened && flattenedView) {
      // Use the new converter that creates group nodes with proper handles
      return flattenedViewToFlow(flattenedView);
    }
    
    // Use boundary-aware converter when inside a subsystem
    return systemToFlowWithBoundaries(currentSystem, parent);
  }, [systemData, viewDepth, currentPath, flattened, getCurrentSystem, getFlattenedView, getParentNode]);

  // React Flow state - initialize from flowData
  const [nodes, setNodes, onNodesChange] = useNodesState<SystemFlowNode>(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<SystemFlowEdge>(flowData.edges);

  // Track last synced data to avoid unnecessary updates
  const lastSyncedRef = useRef<string>('');
  
  // Sync React Flow state with store when source data changes
  useEffect(() => {
    const currentKey = JSON.stringify(flowData);
    
    // Only update if the data actually changed
    if (currentKey !== lastSyncedRef.current) {
      lastSyncedRef.current = currentKey;
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
    }
  }, [flowData, setNodes, setEdges]);

  // Handle node position changes (drag)
  const handleNodesChange: OnNodesChange<SystemFlowNode> = useCallback(
    (changes: NodeChange<SystemFlowNode>[]) => {
      // Apply changes to React Flow state
      onNodesChange(changes);

      // Sync position changes back to store (skip in flattened mode)
      if (flattened) return;

      const positionChanges = changes.filter(
        (change) => change.type === 'position' && change.position && change.dragging === false
      );

      if (positionChanges.length > 0) {
        updateCurrentSystem((sys) => {
          for (const change of positionChanges) {
            if (change.type === 'position' && change.position) {
              const node = sys.nodes.find((n) => n.id === change.id);
              if (node) {
                node.x = change.position.x;
                node.y = change.position.y;
              }
            }
          }
        });
      }
    },
    [onNodesChange, updateCurrentSystem, flattened]
  );

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange<SystemFlowEdge> = useCallback(
    (changes: EdgeChange<SystemFlowEdge>[]) => {
      onEdgesChange(changes);

      // Handle edge removals
      if (flattened) return;

      const removeChanges = changes.filter((change) => change.type === 'remove');
      if (removeChanges.length > 0) {
        updateCurrentSystem((sys) => {
          for (const change of removeChanges) {
            if (change.type === 'remove') {
              sys.edges = sys.edges.filter((e) => e.id !== change.id);
            }
          }
        });
      }
    },
    [onEdgesChange, updateCurrentSystem, flattened]
  );

  // Handle new connections
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (flattened) return;
      if (!connection.source || !connection.target) return;

      // Create edge in store
      createEdge({
        fromNode: connection.source,
        fromPort: connection.sourceHandle || '',
        toNode: connection.target,
        toPort: connection.targetHandle || '',
      });
    },
    [createEdge, flattened]
  );

  // Connection validation
  const isValidConnection = useCallback(
    (connection: Connection | SystemFlowEdge) => {
      // Prevent self-connections
      if (connection.source === connection.target) return false;

      // Check for duplicate connections
      const sourceHandle = 'sourceHandle' in connection ? connection.sourceHandle : null;
      const targetHandle = 'targetHandle' in connection ? connection.targetHandle : null;
      
      const isDuplicate = edges.some(
        (e) =>
          e.source === connection.source &&
          e.sourceHandle === sourceHandle &&
          e.target === connection.target &&
          e.targetHandle === targetHandle
      );

      return !isDuplicate;
    },
    [edges]
  );

  return (
    <div className="flex h-screen w-full bg-github-bg font-sans text-github-text overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        <TopBar />
        <Breadcrumbs />

        {/* Main Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={4}
            snapToGrid
            snapGrid={[12, 12]}
            connectionLineStyle={{ stroke: '#ff5e84', strokeWidth: 2 }}
            connectionMode={ConnectionMode.Loose}
            proOptions={{ hideAttribution: true }}
            className="bg-github-bg"
            nodesDraggable={!flattened}
            nodesConnectable={!flattened}
            elementsSelectable={!flattened}
            panOnScroll
            panOnScrollMode={PanOnScrollMode.Free}
            zoomOnScroll={false}
            zoomOnPinch
            zoomOnDoubleClick={false}
          >
            {/* Background grid */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="#30363D"
            />

            {/* System Boundary overlay (only in non-flattened view) */}
            {!flattened && (
              <Panel position="top-left" className="pointer-events-none !m-0 !p-0 absolute inset-0">
                <SystemBoundary />
              </Panel>
            )}

            {/* Layered mode indicator */}
            <LayeredModeIndicator />

            {/* Zoom controls */}
            <Controls
              className="!bg-github-surface !border-github-border !rounded-lg !shadow-xl"
              showInteractive={false}
            />

            {/* Mini map with toggle button */}
            <Panel position="bottom-right" className="!m-4 flex flex-col items-end gap-2">
              <button
                onClick={() => setShowMinimap(!showMinimap)}
                className="p-2 bg-github-surface hover:bg-github-elevated border border-github-border rounded-lg shadow-xl text-github-text-secondary hover:text-github-text transition-colors"
                title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
                aria-label={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
              >
                {showMinimap ? <X size={16} /> : <Map size={16} />}
              </button>
              {showMinimap && (
                <MiniMap
                  className="!bg-github-surface !border-github-border !rounded-lg !relative !m-0"
                  nodeColor={(node) => {
                    const data = node.data as SystemFlowNode['data'];
                    return data?.isExternal ? '#8B949E' : '#3e8bff';
                  }}
                  maskColor="rgba(13, 17, 23, 0.8)"
                  pannable
                  zoomable
                />
              )}
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* JSON Editor Sidebar */}
      {showJson && <JsonEditor />}

      {/* Modals */}
      <NodeEditorModal />
      <EdgeEditorModal />
      <RenameSystemModal />
      <ClearAllModal />
    </div>
  );
}

// Wrap with ReactFlowProvider
export function SystemCanvas() {
  return (
    <ReactFlowProvider>
      <SystemCanvasInner />
    </ReactFlowProvider>
  );
}
