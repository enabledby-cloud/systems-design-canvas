# SysWeaver - Copilot Instructions

> Systems Thinking diagramming tool with infinite canvas and semantic zooming.

## Project Overview

SysWeaver is a **frontend-only** Next.js application for modeling systems using a visual, node-based canvas. It implements hierarchical decomposition (drill into subsystems), layered analysis (semantic zoom), and exports/imports system definitions as JSON.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2+ | App Router, React Server Components |
| **React** | 18.3+ | UI rendering (Client Components for canvas) |
| **TypeScript** | 5.5+ | Type safety |
| **@xyflow/react** | 12.10+ | Canvas engine (nodes, edges, pan/zoom) |
| **Zustand** | 4.5+ | Global state management |
| **Tailwind CSS** | 3.4+ | Styling (dark "blueprint" aesthetic) |
| **Lucide React** | 0.400+ | Icons |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Main entry point
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles + Tailwind
│
├── components/
│   ├── system-canvas-flow.tsx   # Main canvas (React Flow wrapper)
│   ├── canvas/             # Canvas overlays (system boundary, indicators)
│   ├── flow/               # React Flow node/edge components
│   │   ├── system-node.tsx     # Standard entity node
│   │   ├── boundary-node.tsx   # Subsystem boundary ports
│   │   ├── group-node.tsx      # Flattened/expanded group box
│   │   └── system-edge.tsx     # Connection with labels
│   ├── layout/             # UI chrome (TopBar, Breadcrumbs, JsonEditor)
│   └── modals/             # Modal dialogs
│
├── store/
│   ├── use-system-store.ts # Zustand store (single source of truth)
│   └── initial-data.ts     # Default system data
│
├── types/
│   ├── system.ts           # Domain types (SystemNode, SystemEdge, etc.)
│   └── react-flow.ts       # React Flow type extensions
│
└── utils/
    ├── canvas-math.ts      # Bezier curves, ID generation, bounds calc
    └── flow-converters.ts  # System data ↔ React Flow format
```

## Key Patterns

### 1. State Management (Zustand)
- **Single store** at `src/store/use-system-store.ts`
- Store contains: `systemData`, `currentPath`, `viewDepth`, modal states
- Use **selectors** to minimize re-renders:
  ```typescript
  const viewDepth = useSystemStore((state) => state.viewDepth);
  ```

### 2. React Flow Integration
- Custom node types: `system`, `boundary`, `group`
- Custom edge type: `system`
- Nodes map to `SystemNode`, edges map to `SystemEdge`
- Converters in `utils/flow-converters.ts` transform between formats

### 3. Hierarchical Navigation
- `currentPath: EntityId[]` tracks drill-down breadcrumb
- `enterNode(nodeId)` pushes to path
- `navigateUp(index)` slices path
- Each node may have `internal: { nodes, edges }` for subsystems

### 4. Layered Analysis (Semantic Zoom)
- `viewDepth` controls how many levels to flatten
- `getFlattenedView()` recursively expands subsystems
- In flattened mode, editing is disabled—only analysis

### 5. Node Types
- **Internal entities** (`isExternal: false`): inside the system boundary
- **External/context entities** (`isExternal: true`): dashed border, outside boundary
- **Boundary pseudo-nodes**: `BOUNDARY_IN`, `BOUNDARY_OUT` for subsystem ports

## Coding Conventions

### TypeScript
- Strict mode enabled
- Prefer `interface` for object shapes, `type` for unions/aliases
- Use path alias `@/` for imports from `src/`
- All component props should be typed

### Components
- Mark client components with `'use client';`
- Use `memo()` for React Flow nodes/edges
- Keep components small and focused
- Co-locate styles with components using Tailwind

### Styling
- **Dark blueprint theme**: `bg-slate-950`, `bg-slate-900`, `bg-slate-800`
- **Accent colors**: `indigo-*` (primary), `emerald-*` (inputs), `red-*` (danger)
- **Border style**: `border-slate-700`, dashed for external entities
- Node width constant: `220px` (see `NODE_WIDTH` in canvas-math.ts)

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Types: `PascalCase`
- Store actions: verb-first (`saveNode`, `deleteEdge`, `openRenameModal`)

## Critical Domain Concepts

### System Data Model
```typescript
interface SystemData {
  id: EntityId;
  name: string;
  emergence?: string;      // Emergent property of the system
  nodes: SystemNode[];
  edges: SystemEdge[];
}

interface SystemNode {
  id: EntityId;
  name: string;
  process: string;         // Function verb (e.g., "Harvest")
  operand: string;         // Function target (e.g., "Materials")
  isExternal: boolean;     // Outside system boundary?
  inputs: Port[];
  outputs: Port[];
  internal?: InternalSystem;  // Nested subsystem
}

interface SystemEdge {
  fromNode: EntityId;
  fromPort: EntityId;
  toNode: EntityId;
  toPort: EntityId;
  interaction?: string;    // What flows (e.g., "Material")
  structure?: string;      // How it flows (e.g., "Pipeline")
}
```

### Boundary Connections
When inside a subsystem:
- `BOUNDARY_IN` pseudo-node connects parent inputs to child nodes
- `BOUNDARY_OUT` pseudo-node connects child nodes to parent outputs

## Common Tasks

### Adding a New Modal
1. Create `src/components/modals/my-modal.tsx`
2. Add state to store: `isMyModalOpen`, `openMyModal()`, `closeMyModal()`
3. Export from `src/components/modals/index.ts`
4. Render in `system-canvas-flow.tsx`

### Adding a New Node Type
1. Create component in `src/components/flow/`
2. Register in `nodeTypes` object in `system-canvas-flow.tsx`
3. Add converter logic in `utils/flow-converters.ts`

### Modifying Canvas Math
- All calculations in `src/utils/canvas-math.ts`
- Constants: `NODE_WIDTH`, `NODE_BASE_HEIGHT`, `PORT_SPACING`
- Bezier curve: `calculateBezier()` handles forward/backward connections

## Testing Commands
```bash
yarn dev          # Start dev server
yarn build        # Production build
yarn lint         # ESLint
yarn type-check   # TypeScript check
```

## What NOT to Do
- Don't import from relative paths when `@/` alias works
- Don't use inline styles except for dynamic values (positions, sizes)
- Don't add server-side data fetching (this is a client-only canvas app)
- Don't break the dark theme aesthetic
- Don't modify Bezier math without understanding backward-connection handling
