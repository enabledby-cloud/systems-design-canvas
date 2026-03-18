/**
 * Main Zustand store for System canvas state.
 * Manages system data, navigation, canvas transform, and all interactions.
 */

import { create } from 'zustand';
import type {
  SystemData,
  SystemNode,
  SystemEdge,
  InternalSystem,
  FlattenedView,
  RenderGroup,
  RenameModalState,
  EntityId,
  NodeMap,
  BoundsCache,
} from '@/types';
import { generateId, getBoundsRecursive, NODE_WIDTH, NODE_BASE_HEIGHT, PORT_SPACING } from '@/utils';
import { StorageService, type SavedSystemMeta } from '@/utils/storage-service';
import { initialSystemData } from './initial-data';
import {
  ENTITY_DATABASE,
  type EntityCategory,
  type EntityTemplate,
  instantiateEntity,
  instantiateEntities,
  getTemplate,
  searchTemplates,
  flattenCategories,
} from '@/data';

/** Store state interface */
interface SystemState {
  // Core data
  systemData: SystemData;
  currentPath: EntityId[];
  currentSaveId: string | null; // ID of the currently loaded saved system

  // View state
  viewDepth: number;
  jsonError: string | null;

  // Modal state
  editingNode: SystemNode | null;
  editingEdge: SystemEdge | null;
  isClearModalOpen: boolean;
  renameModal: RenameModalState;
  isLibraryModalOpen: boolean;
  isExportModalOpen: boolean;
  isImportModalOpen: boolean;

  // Storage state
  savedSystems: SavedSystemMeta[];
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;

  // Computed getters
  getCurrentSystem: () => InternalSystem;
  getParentNode: () => SystemNode | null;
  getFlattenedView: () => FlattenedView | null;
  isFlattened: () => boolean;
  getMaxDepth: () => number;

  // System data actions
  setSystemData: (data: SystemData) => void;
  updateCurrentSystem: (updater: (sys: InternalSystem) => void) => void;

  // Navigation actions
  enterNode: (nodeId: EntityId) => void;
  navigateUp: (index: number) => void;
  setCurrentPath: (path: EntityId[]) => void;

  // View actions
  setViewDepth: (depth: number) => void;
  incrementViewDepth: () => void;
  decrementViewDepth: () => void;
  setJsonError: (error: string | null) => void;

  // Node actions
  setEditingNode: (node: SystemNode | null) => void;
  openNodeEditor: (node?: SystemNode | null) => void;
  saveNode: () => void;
  deleteNode: (nodeId: EntityId) => void;

  // Edge actions
  setEditingEdge: (edge: SystemEdge | null) => void;
  saveEdge: () => void;
  deleteEditingEdge: () => void;
  createEdge: (edge: Omit<SystemEdge, 'id'>) => void;

  // Modal actions
  setIsClearModalOpen: (open: boolean) => void;
  handleClearAll: () => void;
  openRenameModal: () => void;
  setRenameModal: (state: RenameModalState) => void;
  saveRename: () => void;

  // Library modal actions
  setIsLibraryModalOpen: (open: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsImportModalOpen: (open: boolean) => void;

  // Storage actions
  refreshSavedSystems: () => void;
  saveToLibrary: (asNew?: boolean) => void;
  loadSystemFromLibrary: (id: string) => void;
  deleteSystemFromLibrary: (id: string) => void;
  duplicateSystemInLibrary: (id: string) => void;
  createNewSystem: (name?: string) => void;
  loadDefaultSystem: () => void;
  autoSave: () => void;
  markUnsaved: () => void;

  // Entity database state
  isEntityPickerOpen: boolean;
  entitySearchQuery: string;
  
  // Entity database actions
  setIsEntityPickerOpen: (open: boolean) => void;
  setEntitySearchQuery: (query: string) => void;
  getEntityDatabase: () => EntityCategory[];
  searchEntityTemplates: (query: string) => EntityTemplate[];
  addEntityFromTemplate: (templateId: string, x?: number, y?: number) => SystemNode | undefined;
  addEntitiesFromTemplates: (templateIds: string[], startX?: number, startY?: number) => SystemNode[];
}

/**
 * Deep clones an object using JSON serialization.
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const useSystemStore = create<SystemState>((set, get) => ({
  // Initial state
  systemData: initialSystemData,
  currentPath: [],
  currentSaveId: null,
  viewDepth: 0,
  jsonError: null,
  editingNode: null,
  editingEdge: null,
  isClearModalOpen: false,
  renameModal: { isOpen: false, name: '', emergence: '' },
  isLibraryModalOpen: false,
  isExportModalOpen: false,
  isImportModalOpen: false,
  savedSystems: [],
  hasUnsavedChanges: false,
  lastSavedAt: null,
  isEntityPickerOpen: false,
  entitySearchQuery: '',

  // Computed getters
  getCurrentSystem: () => {
    const { systemData, currentPath } = get();
    let current: InternalSystem = systemData;

    for (const nodeId of currentPath) {
      const node = current.nodes.find((n) => n.id === nodeId);
      if (!node) break;
      if (!node.internal) {
        node.internal = { nodes: [], edges: [] };
      }
      current = node.internal;
    }

    return current;
  },

  getParentNode: () => {
    const { systemData, currentPath } = get();
    if (currentPath.length === 0) return null;

    let current: InternalSystem = systemData;
    let parentNode: SystemNode | null = null;

    for (const nodeId of currentPath) {
      parentNode = current.nodes.find((n) => n.id === nodeId) ?? null;
      if (!parentNode) break;
      if (!parentNode.internal) {
        parentNode.internal = { nodes: [], edges: [] };
      }
      current = parentNode.internal;
    }

    return parentNode;
  },

  getFlattenedView: () => {
    const { viewDepth } = get();
    if (viewDepth === 0) return null;

    const currentSystem = get().getCurrentSystem();
    const nodeMap: NodeMap = {};
    const expandedSet = new Set<EntityId>();

    function buildMaps(node: SystemNode, currentDepthLevel: number): void {
      nodeMap[node.id] = node;
      const isExpanded =
        currentDepthLevel < viewDepth &&
        node.internal?.nodes &&
        node.internal.nodes.length > 0;

      if (isExpanded) {
        expandedSet.add(node.id);
        node.internal!.nodes.forEach((child) =>
          buildMaps(child, currentDepthLevel + 1)
        );
      }
    }

    currentSystem.nodes.forEach((n) => buildMaps(n, 0));

    // Edge resolution for flattened view:
    // - External edges connect TO the group's boundary port
    // - Internal boundary edges connect FROM the group's boundary port TO internal nodes
    // - Both use same position handle, creating visual pass-through effect
    
    const resolvedEdges: SystemEdge[] = [];
    
    // Add all top-level edges (external edges connect to group boundary ports)
    currentSystem.edges.forEach((e) => {
      resolvedEdges.push({ ...e });
    });
    
    // Add internal edges from expanded groups
    expandedSet.forEach((groupId) => {
      const node = nodeMap[groupId];
      if (node.internal?.edges) {
        node.internal.edges.forEach((e) => {
          if (e.fromNode === 'BOUNDARY_IN') {
            // Boundary input -> internal node
            // Use _inner handle so it connects from the same visual point
            resolvedEdges.push({
              ...e,
              id: `${groupId}_${e.id}`,
              fromNode: groupId,
              fromPort: `${e.fromPort}_inner`,
            });
          } else if (e.toNode === 'BOUNDARY_OUT') {
            // Internal node -> boundary output
            // Use _inner handle so it connects to the same visual point
            resolvedEdges.push({
              ...e,
              id: `${groupId}_${e.id}`,
              toNode: groupId,
              toPort: `${e.toPort}_inner`,
            });
          } else {
            // Internal edge between internal nodes
            resolvedEdges.push(e);
          }
        });
      }
    });

    const renderNodes: SystemNode[] = [];
    const renderGroups: RenderGroup[] = [];
    const boundsCache: BoundsCache = {};

    function computeNodes(node: SystemNode, absX: number, absY: number): void {
      const x = absX + (node.x || 0);
      const y = absY + (node.y || 0);

      if (expandedSet.has(node.id)) {
        const bounds = getBoundsRecursive(
          node.id,
          nodeMap,
          expandedSet,
          boundsCache
        );
        renderGroups.push({
          id: node.id,
          name: node.name,
          inputs: node.inputs,
          outputs: node.outputs,
          x: x + bounds.minX,
          y: y + bounds.minY,
          width: bounds.maxX - bounds.minX,
          height: bounds.maxY - bounds.minY,
        });
        node.internal!.nodes.forEach((child) => computeNodes(child, x, y));
      } else {
        renderNodes.push({ ...node, x, y });
      }
    }

    currentSystem.nodes.forEach((n) => computeNodes(n, 0, 0));

    return { renderNodes, renderGroups, resolvedEdges };
  },

  isFlattened: () => get().viewDepth > 0,

  getMaxDepth: () => {
    const currentSystem = get().getCurrentSystem();
    
    function calcDepth(nodes: SystemNode[]): number {
      if (nodes.length === 0) return 0;
      
      let maxChildDepth = 0;
      for (const node of nodes) {
        if (node.internal?.nodes && node.internal.nodes.length > 0) {
          const childDepth = 1 + calcDepth(node.internal.nodes);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      }
      return maxChildDepth;
    }
    
    return calcDepth(currentSystem.nodes);
  },

  // System data actions
  setSystemData: (data) => set({ systemData: data, jsonError: null, hasUnsavedChanges: true }),

  updateCurrentSystem: (updater) => {
    const { systemData, currentPath } = get();
    const newState = deepClone(systemData);
    let current: InternalSystem = newState;

    for (const nodeId of currentPath) {
      const node = current.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      if (!node.internal) node.internal = { nodes: [], edges: [] };
      current = node.internal;
    }

    updater(current);
    set({ systemData: newState, hasUnsavedChanges: true });
  },

  // Navigation actions
  enterNode: (nodeId) => {
    const { currentPath } = get();
    set({
      currentPath: [...currentPath, nodeId],
      viewDepth: 0,
    });
  },

  navigateUp: (index) => {
    const { currentPath } = get();
    set({
      currentPath: currentPath.slice(0, index),
      viewDepth: 0,
    });
  },

  setCurrentPath: (path) => set({ currentPath: path }),

  // View actions
  setViewDepth: (depth) => set({ viewDepth: depth }),
  incrementViewDepth: () => {
    const maxDepth = get().getMaxDepth();
    set((state) => ({ viewDepth: Math.min(state.viewDepth + 1, maxDepth) }));
  },
  decrementViewDepth: () =>
    set((state) => ({ viewDepth: Math.max(0, state.viewDepth - 1) })),
  setJsonError: (error) => set({ jsonError: error }),

  // Node actions
  setEditingNode: (node) => set({ editingNode: node }),

  openNodeEditor: (node) => {
    if (node) {
      set({ editingNode: deepClone(node) });
    } else {
      const currentSystem = get().getCurrentSystem();
      
      // Calculate position with spacing from existing nodes
      let newX: number;
      let newY: number;
      
      if (currentSystem.nodes.length === 0) {
        // First node: place at origin (React Flow will center via fitView)
        newX = 0;
        newY = 0;
      } else {
        // Find the rightmost and lowest node to position new node
        const NODE_SPACING_X = 280; // Node width (220) + gap (60)
        const NODE_SPACING_Y = 200; // Typical node height + gap
        
        let maxX = -Infinity;
        let maxY = -Infinity;
        let rightmostY = 0;
        
        for (const n of currentSystem.nodes) {
          const nodeX = n.x ?? 0;
          const nodeY = n.y ?? 0;
          if (nodeX > maxX) {
            maxX = nodeX;
            rightmostY = nodeY;
          }
          maxY = Math.max(maxY, nodeY);
        }
        
        // Place new node to the right of the rightmost node
        newX = maxX + NODE_SPACING_X;
        newY = rightmostY;
        
        // If there are too many nodes in a row, start a new row
        if (newX > 1200) {
          const minX = Math.min(...currentSystem.nodes.map(n => n.x ?? 0));
          newX = minX;
          newY = maxY + NODE_SPACING_Y;
        }
      }

      set({
        editingNode: {
          id: generateId('node'),
          name: 'New Entity',
          process: 'Action',
          operand: 'Target',
          isExternal: false,
          emergence: '',
          x: newX,
          y: newY,
          inputs: [{ id: generateId('in'), name: 'In 1' }],
          outputs: [{ id: generateId('out'), name: 'Out 1' }],
          internal: { nodes: [], edges: [] },
          isNew: true,
        },
      });
    }
  },

  saveNode: () => {
    const { editingNode, updateCurrentSystem } = get();
    if (!editingNode || !editingNode.name.trim()) return;

    updateCurrentSystem((sys) => {
      if (editingNode.isNew) {
        const nodeToSave = { ...editingNode };
        delete nodeToSave.isNew;
        sys.nodes.push(nodeToSave);
      } else {
        const idx = sys.nodes.findIndex((n) => n.id === editingNode.id);
        if (idx > -1) {
          sys.nodes[idx] = editingNode;
        }

        // Clean up edges referencing removed ports
        const validPorts = new Set([
          ...editingNode.inputs.map((p) => p.id),
          ...editingNode.outputs.map((p) => p.id),
        ]);
        sys.edges = sys.edges.filter((e) => {
          if (e.fromNode === editingNode.id && !validPorts.has(e.fromPort))
            return false;
          if (e.toNode === editingNode.id && !validPorts.has(e.toPort))
            return false;
          return true;
        });
      }
    });

    set({ editingNode: null });
  },

  deleteNode: (nodeId) => {
    get().updateCurrentSystem((sys) => {
      sys.nodes = sys.nodes.filter((n) => n.id !== nodeId);
      sys.edges = sys.edges.filter(
        (e) => e.fromNode !== nodeId && e.toNode !== nodeId
      );
    });
  },

  // Edge actions
  setEditingEdge: (edge) => set({ editingEdge: edge }),

  saveEdge: () => {
    const { editingEdge, updateCurrentSystem } = get();
    if (!editingEdge) return;

    updateCurrentSystem((sys) => {
      const idx = sys.edges.findIndex((e) => e.id === editingEdge.id);
      if (idx > -1) {
        sys.edges[idx] = editingEdge;
      }
    });

    set({ editingEdge: null });
  },

  deleteEditingEdge: () => {
    const { editingEdge, updateCurrentSystem } = get();
    if (!editingEdge) return;

    updateCurrentSystem((sys) => {
      sys.edges = sys.edges.filter((e) => e.id !== editingEdge.id);
    });

    set({ editingEdge: null });
  },

  createEdge: (edgeData) => {
    get().updateCurrentSystem((sys) => {
      const isDuplicate = sys.edges.some(
        (e) =>
          e.fromNode === edgeData.fromNode &&
          e.fromPort === edgeData.fromPort &&
          e.toNode === edgeData.toNode &&
          e.toPort === edgeData.toPort
      );

      if (!isDuplicate) {
        sys.edges.push({
          id: generateId('edge'),
          ...edgeData,
        });
      }
    });
  },

  // Modal actions
  setIsClearModalOpen: (open) => set({ isClearModalOpen: open }),

  handleClearAll: () => {
    get().updateCurrentSystem((sys) => {
      sys.nodes = [];
      sys.edges = [];
    });
    set({ isClearModalOpen: false });
  },

  openRenameModal: () => {
    const { systemData, currentPath, getParentNode } = get();
    const parentNode = getParentNode();

    const currentName =
      currentPath.length === 0 ? systemData.name : parentNode?.name ?? '';
    const currentEmergence =
      currentPath.length === 0
        ? systemData.emergence ?? ''
        : parentNode?.emergence ?? '';

    set({
      renameModal: {
        isOpen: true,
        name: currentName,
        emergence: currentEmergence,
      },
    });
  },

  setRenameModal: (state) => set({ renameModal: state }),

  saveRename: () => {
    const { renameModal, systemData, currentPath } = get();
    if (!renameModal.name.trim()) return;

    const newState = deepClone(systemData);

    if (currentPath.length === 0) {
      newState.name = renameModal.name;
      newState.emergence = renameModal.emergence;
    } else {
      let current: InternalSystem = newState;
      for (let i = 0; i < currentPath.length; i++) {
        const nodeId = currentPath[i];
        const node = current.nodes.find((n) => n.id === nodeId);
        if (node) {
          if (i === currentPath.length - 1) {
            node.name = renameModal.name;
            node.emergence = renameModal.emergence;
          }
          if (node.internal) {
            current = node.internal;
          }
        }
      }
    }

    set({
      systemData: newState,
      renameModal: { isOpen: false, name: '', emergence: '' },
      hasUnsavedChanges: true,
    });
  },

  // Library modal actions
  setIsLibraryModalOpen: (open) => {
    if (open) {
      get().refreshSavedSystems();
    }
    set({ isLibraryModalOpen: open });
  },

  setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setIsImportModalOpen: (open) => set({ isImportModalOpen: open }),

  // Storage actions
  refreshSavedSystems: () => {
    const systems = StorageService.listSavedSystems();
    set({ savedSystems: systems });
  },

  saveToLibrary: (asNew = false) => {
    const { systemData, currentSaveId } = get();
    const saveId = asNew ? undefined : currentSaveId ?? undefined;
    const savedSystem = StorageService.saveSystem(systemData, saveId);
    
    set({
      currentSaveId: savedSystem.id,
      hasUnsavedChanges: false,
      lastSavedAt: savedSystem.updatedAt,
    });
    
    get().refreshSavedSystems();
  },

  loadSystemFromLibrary: (id) => {
    const savedSystem = StorageService.loadSystem(id);
    if (savedSystem) {
      set({
        systemData: savedSystem.data,
        currentPath: [],
        viewDepth: 0,
        currentSaveId: savedSystem.id,
        hasUnsavedChanges: false,
        lastSavedAt: savedSystem.updatedAt,
        jsonError: null,
      });
    }
  },

  deleteSystemFromLibrary: (id) => {
    StorageService.deleteSystem(id);
    get().refreshSavedSystems();
    
    // If we deleted the currently loaded system, mark as unsaved
    const { currentSaveId } = get();
    if (currentSaveId === id) {
      set({ currentSaveId: null, hasUnsavedChanges: true });
    }
  },

  duplicateSystemInLibrary: (id) => {
    StorageService.duplicateSystem(id);
    get().refreshSavedSystems();
  },

  createNewSystem: (name = 'Untitled System') => {
    const newSystem = StorageService.createBlankSystem(name);
    set({
      systemData: newSystem,
      currentPath: [],
      viewDepth: 0,
      currentSaveId: null,
      hasUnsavedChanges: false,
      lastSavedAt: null,
      jsonError: null,
    });
  },

  loadDefaultSystem: () => {
    const defaultSystem = StorageService.getDefaultSystem();
    set({
      systemData: defaultSystem,
      currentPath: [],
      viewDepth: 0,
      currentSaveId: null,
      hasUnsavedChanges: false,
      lastSavedAt: null,
      jsonError: null,
    });
  },

  autoSave: () => {
    const { systemData, hasUnsavedChanges } = get();
    if (hasUnsavedChanges) {
      StorageService.saveCurrentSystem(systemData);
    }
  },

  markUnsaved: () => {
    set({ hasUnsavedChanges: true });
  },

  // Entity database actions
  setIsEntityPickerOpen: (open) => set({ isEntityPickerOpen: open }),
  
  setEntitySearchQuery: (query) => set({ entitySearchQuery: query }),
  
  getEntityDatabase: () => ENTITY_DATABASE,
  
  searchEntityTemplates: (query) => {
    if (!query.trim()) {
      return flattenCategories(ENTITY_DATABASE).map(({ template }) => template);
    }
    return searchTemplates(ENTITY_DATABASE, query);
  },
  
  addEntityFromTemplate: (templateId, x, y) => {
    const template = getTemplate(templateId);
    if (!template) return undefined;
    
    const currentSystem = get().getCurrentSystem();
    
    // Calculate position if not provided
    let posX = x;
    let posY = y;
    
    if (posX === undefined || posY === undefined) {
      const NODE_SPACING_X = 280;
      const NODE_SPACING_Y = 200;
      
      if (currentSystem.nodes.length === 0) {
        posX = posX ?? 0;
        posY = posY ?? 0;
      } else {
        let maxX = -Infinity;
        let maxY = -Infinity;
        let rightmostY = 0;
        
        for (const n of currentSystem.nodes) {
          const nodeX = n.x ?? 0;
          const nodeY = n.y ?? 0;
          if (nodeX > maxX) {
            maxX = nodeX;
            rightmostY = nodeY;
          }
          maxY = Math.max(maxY, nodeY);
        }
        
        posX = posX ?? maxX + NODE_SPACING_X;
        posY = posY ?? rightmostY;
        
        // Start a new row if too far right
        if (posX > 1200) {
          const minX = Math.min(...currentSystem.nodes.map(n => n.x ?? 0));
          posX = minX;
          posY = maxY + NODE_SPACING_Y;
        }
      }
    }
    
    const { node } = instantiateEntity(template, posX, posY);
    
    get().updateCurrentSystem((sys) => {
      sys.nodes.push(node);
    });
    
    return node;
  },
  
  addEntitiesFromTemplates: (templateIds, startX = 0, startY = 0) => {
    const templates = templateIds
      .map(id => getTemplate(id))
      .filter((t): t is EntityTemplate => t !== undefined);
    
    if (templates.length === 0) return [];
    
    const nodes = instantiateEntities(templates, startX, startY);
    
    get().updateCurrentSystem((sys) => {
      sys.nodes.push(...nodes);
    });
    
    return nodes;
  },
}));
