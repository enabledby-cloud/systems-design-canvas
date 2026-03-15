**Role:** You are an expert Next.js frontend architect and React developer.

**Task:** I have built a fully functional prototype of a "Systems Thinking" diagramming tool. Currently, it is written as a single, monolithic ~1,000-line React component (`SystemCanvas.jsx`). I want you to scaffold a new Next.js frontend-only application and thoroughly refactor this monolithic file into a clean, modular, and maintainable architecture.

**Tech Stack:**
- Next.js 14+ (App Router)
- React (Client Components as needed)
- TypeScript (Please convert the JS to strongly-typed TS)
- Tailwind CSS
- Lucide React (for icons)
- State Management: Use React Context (or Zustand) to manage the complex canvas state to avoid prop-drilling.

**Core Features to Preserve (CRITICAL - DO NOT LOSE THESE):**
1. **Infinite Canvas:** Pan (drag background) and Zoom (mouse wheel / controls).
2. **Bezier Connections:** The exact `calculateBezier` math, SVG rendering, and directional arrowheads (`marker-end`).
3. **Graph Flattening (Semantic Zooming):** The complex `useMemo` logic that recursively calculates bounding boxes for nested systems, renders translucent boundary boxes, and routes internal edges to external boundary ports.
4. **Draggable Nodes:** Both standard nodes and expanded subsystem boxes.
5. **Modals:** Node Editor, Connection Editor, System Properties, and Clear Canvas.
6. **Live JSON Codification:** The two-way bound JSON editor sidebar.
7. **System & Context Boundaries:** The red dashed "System Boundary" box math and rendering.

**Target Architecture / Folder Structure:**
Please break the code down into logical components. Here is a suggested structure:
- `src/app/page.tsx` (Main entry point)
- `src/store/useSystemStore.ts` (Put the main state, like systemData, viewDepth, pan/zoom, and graph flattening logic here)
- `src/utils/canvasMath.ts` (Bezier calculations, ID generation, bounding box math)
- `src/components/layout/` (TopBar, Breadcrumbs, Sidebar/JsonEditor)
- `src/components/canvas/` (Main Canvas wrapper, ZoomControls)
- `src/components/nodes/` (StandardNode, ContextNode, FlattenedGroupNode)
- `src/components/edges/` (EdgeLines, DraftEdge, ArrowheadDefs)
- `src/components/modals/` (NodeEditorModal, EdgeEditorModal, RenameSystemModal, ClearAllModal)

**Instructions:**
1. Review the provided monolithic code below to understand the state and logic.
2. Plan the global state interface (Context or Zustand).
3. Step-by-step, generate the required modular files to reconstruct this application in Next.js.
4. Ensure all Tailwind classes are copied exactly so the dark "blueprint" aesthetic is perfectly maintained.

--- 
**Source Code (Monolith to refactor):**

```jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Code, Box, GitCommit, ArrowLeft, Download, Upload, 
  Maximize2, Trash2, Settings, Zap, Edit2, ZoomIn, ZoomOut, Maximize, AlertTriangle, Layers
} from 'lucide-react';

// --- Default Data ---
const initialSystem = {
  id: "root",
  name: "Engineering Support System",
  emergence: "Increased Product Delivery Speed",
  nodes: [
    {
      id: "node_eng", name: "Engineering Team", process: "Develop", operand: "Products", isContext: true,
      x: 50, y: 100, inputs: [{id: "in_eng_1", name: "Clarifications"}], outputs: [{id: "out_eng_1", name: "Support Request"}, {id: "out_eng_2", name: "Code"}]
    },
    {
      id: "node_dev_prod", name: "Dev Product", process: "Serve", operand: "Customers", isContext: true,
      x: 50, y: 550, inputs: [{id: "in_prod_1", name: "Code Updates"}], outputs: []
    },
    {
      id: "node_ticket", name: "Ticket", process: "Store", operand: "Support", isContext: false,
      x: 400, y: 100, inputs: [{id: "in_t_1", name: "Form Input"}], outputs: [{id: "out_t_1", name: "Ticket Data"}]
    },
    {
      id: "node_ticket_sys", name: "Ticket System", process: "Store", operand: "Ticket", isContext: false,
      x: 400, y: 325, inputs: [{id: "in_ts_1", name: "Submission"}], outputs: [{id: "out_ts_1", name: "Prioritized Ticket"}]
    },
    {
      id: "node_devops", name: "DevOps Team", process: "Solve", operand: "Ticket", isContext: false,
      x: 400, y: 550, inputs: [{id: "in_do_1", name: "Work Item"}], outputs: [{id: "out_do_1", name: "System Action"}, {id: "out_do_2", name: "Questions"}]
    },
    {
      id: "node_affected", name: "Affected System", process: "Host", operand: "Product", isContext: true,
      x: 750, y: 550, inputs: [{id: "in_as_1", name: "Command"}], outputs: []
    }
  ],
  edges: [
    { id: "e1", fromNode: "node_eng", fromPort: "out_eng_1", toNode: "node_ticket", toPort: "in_t_1", interaction: "Creates/Passes Ticket", structure: "Text Form" },
    { id: "e2", fromNode: "node_ticket", fromPort: "out_t_1", toNode: "node_ticket_sys", toPort: "in_ts_1", interaction: "Receives & Stores", structure: "System API / UI" },
    { id: "e3", fromNode: "node_ticket_sys", fromPort: "out_ts_1", toNode: "node_devops", toPort: "in_do_1", interaction: "Pulls from Queue", structure: "Computer Screen / Website" },
    { id: "e4", fromNode: "node_devops", fromPort: "out_do_1", toNode: "node_affected", toPort: "in_as_1", interaction: "Directly Acts on System", structure: "SSH Connection" },
    { id: "e5", fromNode: "node_devops", fromPort: "out_do_2", toNode: "node_eng", toPort: "in_eng_1", interaction: "Communicates Details", structure: "Shared Physical Location" },
    { id: "e6", fromNode: "node_eng", fromPort: "out_eng_2", toNode: "node_dev_prod", toPort: "in_prod_1", interaction: "Writes, Tests, Ships Code", structure: "Codebase" }
  ]
};

// --- Helpers ---
const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

const calculateBezier = (startX, startY, endX, endY) => {
  const adjustedStartX = startX + 8;
  const adjustedEndX = endX - 8; 
  
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
};

// --- Main Application ---
export default function SystemCanvas() {
  const [systemData, setSystemData] = useState(initialSystem);
  const [currentPath, setCurrentPath] = useState([]); 
  const [showJson, setShowJson] = useState(false);
  const [jsonError, setJsonError] = useState(null);
  const [viewDepth, setViewDepth] = useState(0); 
  
  const [editingNode, setEditingNode] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState({ isOpen: false, name: '', emergence: '' });

  const canvasRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [draftEdge, setDraftEdge] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); 
  const [scale, setScale] = useState(1); 
  const [isPanning, setIsPanning] = useState(false);

  const getCurrentSystemAndParent = useCallback(() => {
    let current = systemData;
    let parentNode = null;
    
    for (const nodeId of currentPath) {
      parentNode = current.nodes.find(n => n.id === nodeId);
      if (!parentNode) break;
      if (!parentNode.internal) {
        parentNode.internal = { nodes: [], edges: [] };
      }
      current = parentNode.internal;
    }
    return { system: current, parentNode };
  }, [systemData, currentPath]);

  const { system: currentSystem, parentNode } = getCurrentSystemAndParent();

  const updateCurrentSystem = (updater) => {
    setSystemData(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      let current = newState;
      for (const nodeId of currentPath) {
        const node = current.nodes.find(n => n.id === nodeId);
        if (!node.internal) node.internal = { nodes: [], edges: [] };
        current = node.internal;
      }
      updater(current);
      return newState;
    });
  };

  const openNodeEditor = (node = null) => {
    if (node) {
      setEditingNode(JSON.parse(JSON.stringify(node))); 
    } else {
      const rect = canvasRef.current?.getBoundingClientRect() || { width: 800, height: 600, left: 0, top: 0 };
      const centerX = (rect.width / 2 - offset.x) / scale - 110; 
      const centerY = (rect.height / 2 - offset.y) / scale - 50; 

      setEditingNode({
        id: generateId('node'),
        name: 'New Entity',
        process: 'Action',
        operand: 'Target',
        isContext: false,
        emergence: '',
        x: centerX,
        y: centerY,
        inputs: [{ id: generateId('in'), name: `In 1` }],
        outputs: [{ id: generateId('out'), name: `Out 1` }],
        internal: { nodes: [], edges: [] },
        isNew: true
      });
    }
  };

  const saveNode = () => {
    if (!editingNode.name.trim()) return;

    updateCurrentSystem(sys => {
      if (editingNode.isNew) {
        delete editingNode.isNew;
        sys.nodes.push(editingNode);
      } else {
        const idx = sys.nodes.findIndex(n => n.id === editingNode.id);
        if (idx > -1) {
          sys.nodes[idx] = editingNode;
        }
      }

      if (!editingNode.isNew) {
         const validPorts = new Set([
           ...editingNode.inputs.map(p => p.id),
           ...editingNode.outputs.map(p => p.id)
         ]);
         sys.edges = sys.edges.filter(e => {
            if (e.fromNode === editingNode.id && !validPorts.has(e.fromPort)) return false;
            if (e.toNode === editingNode.id && !validPorts.has(e.toPort)) return false;
            return true;
         });
      }
    });
    setEditingNode(null);
  };

  const saveEdge = () => {
    updateCurrentSystem(sys => {
       const idx = sys.edges.findIndex(e => e.id === editingEdge.id);
       if (idx > -1) sys.edges[idx] = editingEdge;
    });
    setEditingEdge(null);
  };

  const deleteEditingEdge = () => {
    updateCurrentSystem(sys => {
       sys.edges = sys.edges.filter(e => e.id !== editingEdge.id);
    });
    setEditingEdge(null);
  };

  const handleClearAll = () => {
    updateCurrentSystem(sys => {
      sys.nodes = [];
      sys.edges = [];
    });
    setIsClearModalOpen(false);
  };

  const openRenameModal = () => {
    const currentName = currentPath.length === 0 ? systemData.name : parentNode.name;
    const currentEmergence = currentPath.length === 0 ? systemData.emergence : parentNode.emergence;
    setRenameModal({ isOpen: true, name: currentName || '', emergence: currentEmergence || '' });
  };

  const saveRename = () => {
    if (!renameModal.name.trim()) return;
    setSystemData(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      if (currentPath.length === 0) {
        newState.name = renameModal.name;
        newState.emergence = renameModal.emergence;
      } else {
        let current = newState;
        for (let i = 0; i < currentPath.length; i++) {
          const nodeId = currentPath[i];
          const node = current.nodes.find(n => n.id === nodeId);
          if (i === currentPath.length - 1) {
            node.name = renameModal.name;
            node.emergence = renameModal.emergence;
          }
          current = node.internal;
        }
      }
      return newState;
    });
    setRenameModal({ isOpen: false, name: '', emergence: '' });
  };

  const handleDeleteNode = (id) => {
    updateCurrentSystem(sys => {
      sys.nodes = sys.nodes.filter(n => n.id !== id);
      sys.edges = sys.edges.filter(e => e.fromNode !== id && e.toNode !== id);
    });
  };

  const zoomTo = useCallback((newScale, clientX, clientY) => {
    const clampedScale = Math.min(Math.max(newScale, 0.1), 4);
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (clientX !== undefined ? clientX : rect.left + rect.width / 2) - rect.left;
    const mouseY = (clientY !== undefined ? clientY : rect.top + rect.height / 2) - rect.top;

    const newOffsetX = mouseX - ((mouseX - offset.x) / scale) * clampedScale;
    const newOffsetY = mouseY - ((mouseY - offset.y) / scale) * clampedScale;

    setScale(clampedScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [scale, offset]);

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.005;
      const delta = -e.deltaY * zoomSensitivity;
      const zoomFactor = Math.exp(delta);
      zoomTo(scale * zoomFactor, e.clientX, e.clientY);
    } else {
      setOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handlePointerDownCanvas = (e) => {
    if ((e.button === 0 || e.button === 1) && (e.target === canvasRef.current || e.target.tagName === 'svg')) {
      setIsPanning(true);
    }
  };

  const handlePointerMove = (e) => {
    if (isPanning) {
      setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
    
    if (draggingNode) {
      updateCurrentSystem(sys => {
        function findNode(nodes) {
           for (const n of nodes) {
              if (n.id === draggingNode) return n;
              if (n.internal && n.internal.nodes) {
                 const found = findNode(n.internal.nodes);
                 if (found) return found;
              }
           }
           return null;
        }
        
        const node = findNode(sys.nodes);
        if (node) {
          node.x = (node.x || 0) + e.movementX / scale;
          node.y = (node.y || 0) + e.movementY / scale;
        }
      });
    }

    if (draftEdge) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDraftEdge(prev => ({
        ...prev,
        endX: (e.clientX - rect.left - offset.x) / scale,
        endY: (e.clientY - rect.top - offset.y) / scale
      }));
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
    setDraftEdge(null);
  };

  const handlePortPointerDown = (e, nodeId, portId, isOutput) => {
    e.stopPropagation();
    if (viewDepth > 0) return; 
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = (e.clientX - rect.left - offset.x) / scale;
    const startY = (e.clientY - rect.top - offset.y) / scale;
    
    setDraftEdge({
      fromNode: isOutput ? nodeId : null,
      fromPort: isOutput ? portId : null,
      toNode: !isOutput ? nodeId : null,
      toPort: !isOutput ? portId : null,
      startX, startY,
      endX: startX, endY: startY,
      isOutputStart: isOutput
    });
  };

  const handlePortPointerUp = (e, nodeId, portId, isOutput) => {
    e.stopPropagation();
    if (viewDepth > 0) { setDraftEdge(null); return; } 
    if (draftEdge) {
      if (draftEdge.isOutputStart === isOutput) {
        setDraftEdge(null);
        return;
      }

      const newEdge = {
        id: generateId('edge'),
        fromNode: draftEdge.isOutputStart ? draftEdge.fromNode : nodeId,
        fromPort: draftEdge.isOutputStart ? draftEdge.fromPort : portId,
        toNode: !draftEdge.isOutputStart ? draftEdge.toNode : nodeId,
        toPort: !draftEdge.isOutputStart ? draftEdge.toPort : portId,
      };

      const isDuplicate = currentSystem.edges.some(
        e => e.fromNode === newEdge.fromNode && e.fromPort === newEdge.fromPort && 
             e.toNode === newEdge.toNode && e.toPort === newEdge.toPort
      );

      if (!isDuplicate) {
        updateCurrentSystem(sys => { sys.edges.push(newEdge); });
      }
    }
    setDraftEdge(null);
  };

  const enterNode = (nodeId) => {
    setCurrentPath([...currentPath, nodeId]);
    setOffset({ x: 0, y: 0 }); 
    setScale(1); 
    setViewDepth(0); 
  };

  const navigateUp = (index) => {
    setCurrentPath(currentPath.slice(0, index));
    setOffset({ x: 0, y: 0 });
    setScale(1);
    setViewDepth(0);
  };

  const flattenedView = useMemo(() => {
    if (viewDepth === 0) return null;

    const nodeMap = {};
    const expandedSet = new Set();

    function buildMaps(node, currentDepth) {
      nodeMap[node.id] = node;
      const isExpanded = currentDepth < viewDepth && node.internal && node.internal.nodes && node.internal.nodes.length > 0;
      if (isExpanded) {
        expandedSet.add(node.id);
        node.internal.nodes.forEach(child => buildMaps(child, currentDepth + 1));
      }
    }
    currentSystem.nodes.forEach(n => buildMaps(n, 0));

    let resolvedEdges = [...currentSystem.edges];
    expandedSet.forEach(nodeId => {
      const node = nodeMap[nodeId];
      node.internal.edges.forEach(e => {
        resolvedEdges.push({
          ...e,
          fromNode: e.fromNode === 'BOUNDARY_IN' ? nodeId : e.fromNode,
          toNode: e.toNode === 'BOUNDARY_OUT' ? nodeId : e.toNode,
        });
      });
    });

    let renderNodes = [];
    let renderGroups = [];

    const boundsCache = {};
    function getBounds(nodeId) {
      if (boundsCache[nodeId]) return boundsCache[nodeId];
      
      if (!expandedSet.has(nodeId)) {
        const n = nodeMap[nodeId];
        if (!n) return { minX: 0, minY: 0, maxX: 220, maxY: 150 };
        const portCount = Math.max(n.inputs.length, n.outputs.length);
        const height = 116 + portCount * 32;
        return { minX: 0, minY: 0, maxX: 220, maxY: height };
      }
      
      const node = nodeMap[nodeId];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      node.internal.nodes.forEach(child => {
        const cb = getBounds(child.id);
        minX = Math.min(minX, (child.x || 0) + cb.minX);
        minY = Math.min(minY, (child.y || 0) + cb.minY);
        maxX = Math.max(maxX, (child.x || 0) + cb.maxX);
        maxY = Math.max(maxY, (child.y || 0) + cb.maxY);
      });
      
      if (minX === Infinity) { minX = 0; minY = 0; maxX = 220; maxY = 150; }
      
      const portCount = Math.max(node.inputs.length, node.outputs.length);
      const minHeightForPorts = 40 + portCount * 32 + 16;
      
      let computedMinY = minY - 48; 
      let computedMaxY = maxY + 24;
      if (computedMaxY - computedMinY < minHeightForPorts) {
          computedMaxY = computedMinY + minHeightForPorts;
      }

      const res = { minX: minX - 32, minY: computedMinY, maxX: maxX + 32, maxY: computedMaxY };
      boundsCache[nodeId] = res;
      return res;
    }

    function computeNodes(node, absX, absY) {
      const x = absX + (node.x || 0);
      const y = absY + (node.y || 0);
      
      if (expandedSet.has(node.id)) {
        const bounds = getBounds(node.id);
        renderGroups.push({ 
          id: node.id, name: node.name, 
          inputs: node.inputs, outputs: node.outputs, 
          x: x + bounds.minX, y: y + bounds.minY, 
          width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY
        });
        node.internal.nodes.forEach(child => computeNodes(child, x, y));
      } else {
        renderNodes.push({ ...node, x, y });
      }
    }
    currentSystem.nodes.forEach(n => computeNodes(n, 0, 0));

    return { renderNodes, renderGroups, resolvedEdges };
  }, [currentSystem, viewDepth]);

  const isFlattened = viewDepth > 0;
  const nodesToRender = isFlattened && flattenedView ? flattenedView.renderNodes : currentSystem.nodes;
  const edgesToRender = isFlattened && flattenedView ? flattenedView.resolvedEdges : currentSystem.edges;

  const getNodeCoordinates = (nodeId, portId, isOutput) => {
    if (nodeId === 'BOUNDARY_IN') {
      const idx = parentNode?.inputs.findIndex(p => p.id === portId) || 0;
      return { x: 190, y: 206 + idx * 48 }; 
    }
    if (nodeId === 'BOUNDARY_OUT') {
      const idx = parentNode?.outputs.findIndex(p => p.id === portId) || 0;
      return { x: 1000, y: 206 + idx * 48 }; 
    }

    let node, absX, absY;
    let isGroup = false;
       
    if (isFlattened && flattenedView) {
       node = flattenedView.renderGroups.find(g => g.id === nodeId);
       if (node) {
           isGroup = true;
       } else {
           node = flattenedView.renderNodes.find(n => n.id === nodeId);
       }
       if (!node) return { x: 0, y: 0 };
       absX = node.x; 
       absY = node.y;
    } else {
       node = currentSystem.nodes.find(n => n.id === nodeId);
       if (!node) return { x: 0, y: 0 };
       absX = node.x;
       absY = node.y;
    }
    
    let isOutputPort = isOutput;
    let portList = isOutputPort ? node.outputs : node.inputs;
    let portIndex = portList.findIndex(p => p.id === portId);

    if (portIndex === -1) {
        isOutputPort = !isOutput;
        portList = isOutputPort ? node.outputs : node.inputs;
        portIndex = portList.findIndex(p => p.id === portId);
    }
    
    if (isGroup) {
        const x = absX + (isOutputPort ? node.width : 0);
        const y = absY + 40 + (portIndex * 32); 
        return { x, y };
    } else {
        const x = absX + (isOutputPort ? 220 : 0);
        const y = absY + 116 + (portIndex * 32); 
        return { x, y };
    }
  };

  const renderBreadcrumbs = () => {
    const paths = [{ id: 'root', name: systemData.name, emergence: systemData.emergence }];
    let current = systemData;
    for (const pid of currentPath) {
      const n = current.nodes.find(x => x.id === pid);
      if (n) {
        paths.push({ id: n.id, name: n.name, emergence: n.emergence });
        current = n.internal || { nodes: [] };
      }
    }

    return (
      <div className="flex items-center p-3 bg-slate-900 border-b border-slate-800 text-sm min-h-[52px]">
        <div className="flex items-center space-x-2 flex-1">
          {paths.map((p, idx) => {
            const isLast = idx === paths.length - 1;
            return (
              <React.Fragment key={p.id}>
                {idx > 0 && <span className="text-slate-600">/</span>}
                {isLast ? (
                  <div className="flex items-center">
                    <div 
                      onClick={openRenameModal}
                      className="group flex items-center text-blue-400 font-semibold cursor-pointer hover:text-blue-300 transition-colors"
                      title="Edit System Properties"
                    >
                      <span className="text-base">{p.name}</span>
                      <Edit2 size={14} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {p.emergence && (
                      <div className="ml-4 flex items-center px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200/90 text-xs font-medium tracking-wide shadow-sm" title="System Emergence">
                         <Zap size={12} className="mr-1.5 text-amber-400" />
                         Emergence: {p.emergence}
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => navigateUp(idx)}
                    className="text-slate-400 hover:text-slate-200 transition-colors text-base"
                  >
                    {p.name}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNode = (node) => {
    const wrapperClass = node.isContext 
      ? "absolute w-[220px] bg-slate-800/80 border-2 border-dashed border-slate-500 rounded-lg shadow-xl flex flex-col select-none pointer-events-auto"
      : "absolute w-[220px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col select-none pointer-events-auto";

    const headerClass = node.isContext
      ? "h-[40px] px-3 bg-slate-800/80 border-b-2 border-dashed border-slate-500 rounded-t-lg flex justify-between items-center cursor-move hover:bg-slate-750"
      : "h-[40px] px-3 bg-slate-800 border-b border-slate-700 rounded-t-lg flex justify-between items-center cursor-move hover:bg-slate-750";

    return (
      <div 
        key={node.id}
        className={wrapperClass}
        style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
      >
        <div 
          className={headerClass}
          onPointerDown={(e) => { e.stopPropagation(); setDraggingNode(node.id); }}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <Box size={14} className={node.isContext ? "text-slate-400 flex-shrink-0" : "text-blue-400 flex-shrink-0"} />
            <span className={`font-medium text-sm truncate ${node.isContext ? 'text-slate-300 italic' : 'text-slate-200'}`}>
              {node.name}
            </span>
          </div>
          {!isFlattened && (
            <div className="flex space-x-1">
              <button onClick={(e) => { e.stopPropagation(); openNodeEditor(node); }} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="Edit Entity"><Edit2 size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); enterNode(node.id); }} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="Decompose (View Internals)"><Maximize2 size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400" title="Delete Entity"><Trash2 size={12} /></button>
            </div>
          )}
        </div>

        <div className={`mx-3 mt-3 mb-1 h-[40px] bg-slate-900/50 rounded flex flex-col items-center justify-center border border-slate-700/50 pointer-events-none overflow-hidden ${node.isContext ? 'opacity-70' : ''}`}>
          <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider leading-tight">{node.process || 'Process'}</span>
          <span className="text-slate-200 font-bold text-xs tracking-wide truncate leading-tight">{node.operand || 'Operand'}</span>
        </div>

        <div className="flex justify-between py-2 text-xs relative z-10">
          <div className="flex flex-col space-y-2 w-1/2">
            {node.inputs.map((port) => (
              <div key={port.id} className="flex items-center relative h-6">
                <div 
                  className={`absolute -left-2 w-4 h-4 bg-slate-900 border-2 border-emerald-500 rounded-full cursor-crosshair hover:bg-emerald-500 transition-colors ${node.isContext ? 'opacity-70' : ''}`}
                  onPointerDown={(e) => handlePortPointerDown(e, node.id, port.id, false)}
                  onPointerUp={(e) => handlePortPointerUp(e, node.id, port.id, false)}
                  title="Drag to connect"
                />
                <span className={`ml-4 truncate pr-1 ${node.isContext ? 'text-slate-500' : 'text-slate-400'}`}>{port.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-2 w-1/2 items-end">
            {node.outputs.map((port) => (
              <div key={port.id} className="flex items-center justify-end relative h-6 w-full">
                <span className={`mr-4 truncate pl-1 ${node.isContext ? 'text-slate-500' : 'text-slate-400'}`}>{port.name}</span>
                <div 
                  className={`absolute -right-2 w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full cursor-crosshair hover:bg-indigo-500 transition-colors ${node.isContext ? 'opacity-70' : ''}`}
                  onPointerDown={(e) => handlePortPointerDown(e, node.id, port.id, true)}
                  onPointerUp={(e) => handlePortPointerUp(e, node.id, port.id, true)}
                  title="Drag to connect"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBoundaryPorts = () => {
    if (!parentNode) return null;

    return (
      <>
        <div className="absolute left-[50px] top-[150px] flex flex-col space-y-4 pointer-events-auto w-[140px]">
          <div className="h-[24px] flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">Boundary Inputs</div>
          {parentNode.inputs.map((port, idx) => (
            <div key={port.id} className="flex items-center justify-between relative bg-slate-800/80 border border-slate-700 rounded-r shadow-sm h-8 px-3">
              <span className="text-slate-300 text-xs font-medium truncate pr-2">{port.name}</span>
              <div 
                className="absolute -right-2 top-2 w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full cursor-crosshair hover:bg-indigo-500"
                onPointerDown={(e) => handlePortPointerDown(e, 'BOUNDARY_IN', port.id, true)}
                onPointerUp={(e) => handlePortPointerUp(e, 'BOUNDARY_IN', port.id, true)}
              />
            </div>
          ))}
        </div>

        <div className="absolute left-[1000px] top-[150px] flex flex-col space-y-4 pointer-events-auto w-[140px]">
          <div className="h-[24px] flex items-center justify-end text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Boundary Outputs</div>
          {parentNode.outputs.map((port, idx) => (
            <div key={port.id} className="flex items-center justify-end relative bg-slate-800/80 border border-slate-700 rounded-l shadow-sm h-8 px-3">
              <div 
                className="absolute -left-2 top-2 w-4 h-4 bg-slate-900 border-2 border-emerald-500 rounded-full cursor-crosshair hover:bg-emerald-500"
                onPointerDown={(e) => handlePortPointerDown(e, 'BOUNDARY_OUT', port.id, false)}
                onPointerUp={(e) => handlePortPointerUp(e, 'BOUNDARY_OUT', port.id, false)}
              />
              <span className="text-slate-300 text-xs font-medium truncate pl-2">{port.name}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderSystemBoundary = () => {
    if (isFlattened) return null; 
    
    const sysNodes = currentSystem.nodes.filter(n => !n.isContext);
    if (sysNodes.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sysNodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 220);
      const portCount = Math.max(n.inputs.length, n.outputs.length);
      const nodeHeight = 116 + portCount * 32;
      maxY = Math.max(maxY, n.y + nodeHeight);
    });

    const padding = 45;

    return (
      <div 
        className="absolute border-4 border-dashed border-red-500/40 bg-red-500/5 rounded-xl pointer-events-none"
        style={{ left: minX - padding, top: minY - padding - 35, width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 + 35, zIndex: 5 }}
      >
        <div className="text-red-400 font-black uppercase tracking-widest text-[11px] px-5 py-2 flex items-center gap-2 opacity-80">
           <Layers size={14}/> SYSTEM BOUNDARY
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans text-slate-200 overflow-hidden" 
         onPointerMove={handlePointerMove} 
         onPointerUp={handlePointerUp}>
      
      <div className="flex-1 flex flex-col relative">
        <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 h-14 z-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-lg">
            <GitCommit size={24} />
            <span>SysWeaver</span>
          </div>
          <div className="h-6 w-px bg-slate-700 mx-2 hidden sm:block"></div>
          
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-md p-1 mr-2 shadow-inner">
            <div className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
               <Layers size={14} /> Layers
            </div>
            <button onClick={() => setViewDepth(Math.max(0, viewDepth - 1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors">-</button>
            <div className="w-4 text-center text-sm font-mono font-bold text-indigo-400">{viewDepth + 1}</div>
            <button onClick={() => setViewDepth(viewDepth + 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors">+</button>
          </div>

          {!isFlattened && (
            <>
              <button onClick={() => openNodeEditor(null)} className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors">
                <Plus size={16} /> <span className="hidden sm:inline">Add Entity</span>
              </button>
              <button onClick={() => setIsClearModalOpen(true)} className="flex items-center space-x-1 bg-red-900/30 hover:bg-red-800/60 text-red-300 px-3 py-1.5 rounded-md text-sm transition-colors border border-red-900/50">
                <Trash2 size={16} /> <span className="hidden sm:inline">Clear All</span>
              </button>
            </>
          )}
          {currentPath.length > 0 && (
              <button onClick={() => navigateUp(currentPath.length - 1)} className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-sm transition-colors border border-slate-700">
                <ArrowLeft size={16} /> <span>Go Up</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowJson(!showJson)} className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors border ${showJson ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
              <Code size={16} /> <span>{showJson ? 'Hide JSON' : 'Show JSON'}</span>
            </button>
          </div>
        </div>

        {renderBreadcrumbs()}

        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDownCanvas}
          onWheel={handleWheel}
          style={{ 
            backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
            backgroundSize: `${24 * scale}px ${24 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
            touchAction: 'none' 
          }}
        >
          {isFlattened && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 px-4 py-2 rounded-full text-xs font-medium shadow-lg z-30 flex items-center gap-2 backdrop-blur-sm pointer-events-none">
              <Layers size={14} /> Layered Analysis Active: Structural editing is disabled. Drag entities to analyze flow.
            </div>
          )}

          <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', width: '100%', height: '100%', position: 'absolute', pointerEvents: 'none' }}>
            
            {renderSystemBoundary()}

            {isFlattened && flattenedView && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
                {flattenedView.renderGroups.map(g => (
                  <div key={g.id} className="absolute border-2 border-dashed rounded-xl pointer-events-none bg-indigo-900/10 border-indigo-500/40" style={{ left: g.x, top: g.y, width: g.width, height: g.height }}>
                    <div className="absolute -top-3 left-4 bg-slate-900 px-3 py-1 rounded shadow-sm border border-indigo-500/50 cursor-move pointer-events-auto flex items-center gap-2 hover:bg-slate-800 transition-colors" onPointerDown={(e) => { e.stopPropagation(); setDraggingNode(g.id); }}>
                      <Layers size={14} className="text-indigo-400" />
                      <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">{g.name}</span>
                    </div>
                    <div className="absolute left-0 top-0 h-full w-0 flex flex-col pointer-events-none">
                       {g.inputs.map((port, idx) => (
                          <div key={port.id} className="absolute -left-2 w-4 h-4 bg-slate-900 border-2 border-emerald-500 rounded-full" style={{ top: `${40 + idx * 32 - 8}px` }} title={port.name} />
                       ))}
                    </div>
                    <div className="absolute right-0 top-0 h-full w-0 flex flex-col pointer-events-none">
                       {g.outputs.map((port, idx) => (
                          <div key={port.id} className="absolute -right-2 w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full" style={{ top: `${40 + idx * 32 - 8}px` }} title={port.name} />
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 8 }}>
              <style>
                {`.edge-path { marker-end: url(#arrowhead); } .group:hover .edge-path { stroke: #818cf8; marker-end: url(#arrowhead-hover); }`}
              </style>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#475569" /></marker>
                <marker id="arrowhead-hover" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" /></marker>
                <marker id="arrowhead-draft" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" /></marker>
              </defs>

              {edgesToRender.map(edge => {
                const start = getNodeCoordinates(edge.fromNode, edge.fromPort, true);
                const end = getNodeCoordinates(edge.toNode, edge.toPort, false);
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                
                return (
                  <g key={edge.id} className={`group pointer-events-auto ${!isFlattened ? 'cursor-pointer' : ''}`} onClick={() => !isFlattened && setEditingEdge(edge)}>
                    <path d={calculateBezier(start.x, start.y, end.x, end.y)} fill="none" stroke="transparent" strokeWidth="20" />
                    <path d={calculateBezier(start.x, start.y, end.x, end.y)} fill="none" stroke="#475569" strokeWidth="2" className="edge-path transition-colors duration-200" />
                    {(edge.interaction || edge.structure) && (
                      <g className="pointer-events-none">
                        <text x={midX} y={midY - 8} fontSize="12" fontWeight="medium" textAnchor="middle" stroke="#0f172a" strokeWidth="4" strokeLinejoin="round">{edge.interaction}</text>
                        <text x={midX} y={midY - 8} fontSize="12" fontWeight="medium" textAnchor="middle" fill="#94a3b8" className="group-hover:fill-indigo-300 transition-colors">{edge.interaction}</text>
                        {edge.structure && (
                          <>
                            <text x={midX} y={midY + 6} fontSize="10" fontWeight="bold" textAnchor="middle" stroke="#0f172a" strokeWidth="4" strokeLinejoin="round">[{edge.structure}]</text>
                            <text x={midX} y={midY + 6} fontSize="10" fontWeight="bold" textAnchor="middle" fill="#64748b" className="group-hover:fill-indigo-400 transition-colors">[{edge.structure}]</text>
                          </>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

              {draftEdge && (
                <path d={calculateBezier(draftEdge.isOutputStart ? draftEdge.startX : draftEdge.endX, draftEdge.isOutputStart ? draftEdge.startY : draftEdge.endY, !draftEdge.isOutputStart ? draftEdge.startX : draftEdge.endX, !draftEdge.isOutputStart ? draftEdge.startY : draftEdge.endY)} fill="none" stroke="#818cf8" strokeWidth="3" strokeDasharray="5,5" markerEnd="url(#arrowhead-draft)" />
              )}
            </svg>

            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
              {nodesToRender.map(renderNode)}
              {!isFlattened && renderBoundaryPorts()}
            </div>
          </div>
          
          <div className="absolute bottom-6 right-6 flex items-center bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-20">
            <button onClick={() => zoomTo(scale * 1.2)} className="p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" title="Zoom In"><ZoomIn size={18}/></button>
            <div className="text-slate-300 font-mono text-xs border-x border-slate-700 w-16 text-center select-none cursor-default">{Math.round(scale * 100)}%</div>
            <button onClick={() => zoomTo(scale / 1.2)} className="p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" title="Zoom Out"><ZoomOut size={18}/></button>
            <button onClick={() => { setScale(1); setOffset({x: 0, y: 0}); }} className="p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border-l border-slate-700" title="Reset View"><Maximize size={18}/></button>
          </div>
        </div>
      </div>

      {showJson && (
        <div className="w-[400px] bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2"><DatabaseIcon size={16} /> System Blueprint</h3>
          </div>
          <div className="flex-1 p-4 flex flex-col relative">
            {jsonError && (<div className="absolute top-4 left-4 right-4 bg-red-900/50 border border-red-500 text-red-200 p-2 rounded text-xs z-10">{jsonError}</div>)}
            <textarea className="flex-1 w-full bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs text-green-400 focus:outline-none focus:border-indigo-500 resize-none whitespace-pre" value={JSON.stringify(systemData, null, 2)} onChange={(e) => {try { const parsed = JSON.parse(e.target.value); setSystemData(parsed); setJsonError(null); } catch (err) { setJsonError(err.message); } }} spellCheck="false" />
          </div>
          <div className="p-4 border-t border-slate-800 text-xs text-slate-500">Edit the JSON directly to update the visual canvas. Context entities (<code className="text-slate-300">isContext: true</code>) sit outside the main system boundary.</div>
        </div>
      )}

      {editingNode && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 w-[500px] max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">{editingNode.isNew ? 'Create Entity' : 'Edit Entity'}</h2>
            <div className="space-y-5 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              <div className="flex items-center p-3 bg-slate-900/50 border border-slate-700 rounded-md">
                <input type="checkbox" id="context-toggle" checked={editingNode.isContext} onChange={e => setEditingNode({...editingNode, isContext: e.target.checked})} className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2" />
                <label htmlFor="context-toggle" className="ml-2 text-sm font-medium text-slate-300 cursor-pointer flex-1">Context Entity <span className="text-slate-500 text-xs font-normal ml-1">(Sits outside the System Boundary)</span></label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Entity Name</label>
                <input type="text" value={editingNode.name} onChange={e => setEditingNode({...editingNode, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Function: Process</label>
                  <input type="text" value={editingNode.process || ''} onChange={e => setEditingNode({...editingNode, process: e.target.value})} placeholder="e.g. Harvest" className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Function: Operand</label>
                  <input type="text" value={editingNode.operand || ''} onChange={e => setEditingNode({...editingNode, operand: e.target.value})} placeholder="e.g. Materials" className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-700/50">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inputs</label>
                    <button onClick={() => setEditingNode(prev => ({ ...prev, inputs: [...prev.inputs, { id: generateId('in'), name: `New Input` }] }))} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {editingNode.inputs.map((port, idx) => (
                      <div key={port.id} className="flex space-x-2">
                        <input type="text" value={port.name} onChange={e => { const newInputs = [...editingNode.inputs]; newInputs[idx].name = e.target.value; setEditingNode({...editingNode, inputs: newInputs}); }} className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 outline-none" />
                        <button onClick={() => setEditingNode(prev => ({ ...prev, inputs: prev.inputs.filter(p => p.id !== port.id) }))} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                      </div>
                    ))}
                    {editingNode.inputs.length === 0 && <div className="text-xs text-slate-500 italic text-center py-2">No inputs</div>}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outputs</label>
                    <button onClick={() => setEditingNode(prev => ({ ...prev, outputs: [...prev.outputs, { id: generateId('out'), name: `New Output` }] }))} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {editingNode.outputs.map((port, idx) => (
                      <div key={port.id} className="flex space-x-2">
                        <input type="text" value={port.name} onChange={e => { const newOutputs = [...editingNode.outputs]; newOutputs[idx].name = e.target.value; setEditingNode({...editingNode, outputs: newOutputs}); }} className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 outline-none" />
                        <button onClick={() => setEditingNode(prev => ({ ...prev, outputs: prev.outputs.filter(p => p.id !== port.id) }))} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                      </div>
                    ))}
                    {editingNode.outputs.length === 0 && <div className="text-xs text-slate-500 italic text-center py-2">No outputs</div>}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-700">
              <button onClick={() => setEditingNode(null)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">Cancel</button>
              <button onClick={saveNode} className="px-5 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors shadow-lg shadow-cyan-900/50">Save Entity</button>
            </div>
          </div>
        </div>
      )}

      {editingEdge && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-slate-800 p-5 rounded-xl shadow-2xl border border-slate-600 w-80">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wider">Edit Connection</h3>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Interaction (What flows)</label>
              <input type="text" value={editingEdge.interaction || editingEdge.label || ''} onChange={e => setEditingEdge({...editingEdge, interaction: e.target.value, label: e.target.value})} placeholder="e.g. Material" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Structure (Physical medium)</label>
              <input type="text" value={editingEdge.structure || ''} onChange={e => setEditingEdge({...editingEdge, structure: e.target.value})} placeholder="e.g. Pipeline, Truck" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex justify-between items-center">
              <button onClick={deleteEditingEdge} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 p-1 rounded hover:bg-red-900/30 transition-colors"><Trash2 size={14} /> Delete</button>
              <div className="flex space-x-2">
                <button onClick={() => setEditingEdge(null)} className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded transition-colors">Cancel</button>
                <button onClick={saveEdge} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renameModal.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-600 w-96">
            <h3 className="text-sm font-semibold text-slate-200 mb-5 uppercase tracking-wider flex items-center gap-2"><Settings size={16} className="text-indigo-400"/> System Properties</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">System Name</label>
                <input type="text" value={renameModal.name} onChange={e => setRenameModal({...renameModal, name: e.target.value})} onKeyDown={e => e.key === 'Enter' && saveRename()} placeholder="Enter system name" autoFocus className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"/>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 flex justify-between"><span>Emergence <span className="text-slate-500 italic">(Optional)</span></span></label>
                <input type="text" value={renameModal.emergence} onChange={e => setRenameModal({...renameModal, emergence: e.target.value})} onKeyDown={e => e.key === 'Enter' && saveRename()} placeholder="e.g. Continuous Flow of Value" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"/>
                <p className="text-[10px] text-slate-500 mt-1.5">The property or behavior that arises from the interaction of the parts, but is not present in the parts themselves.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
              <button onClick={() => setRenameModal({ isOpen: false, name: '', emergence: '' })} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">Cancel</button>
              <button onClick={saveRename} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-lg shadow-indigo-900/50">Save</button>
            </div>
          </div>
        </div>
      )}

      {isClearModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-600 w-96 max-w-full">
            <div className="flex items-center space-x-3 mb-4 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-semibold uppercase tracking-wider text-slate-100">Clear Canvas</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">Are you sure you want to delete all entities and connections in the current view? This cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsClearModalOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors">Cancel</button>
              <button onClick={handleClearAll} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors shadow-lg shadow-red-900/50">Yes, Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DatabaseIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  );
}