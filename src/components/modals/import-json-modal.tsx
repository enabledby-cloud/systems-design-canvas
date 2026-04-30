'use client';

/**
 * ImportJsonModal - Live JSON editor for importing system data with validation.
 * Only allows valid JSON that matches the SystemData model with full integrity checks.
 */

import { useState, useCallback, useMemo } from 'react';
import { X, Upload, AlertCircle, CheckCircle, FileUp, Info } from 'lucide-react';
import { useSystemStore } from '@/store';
import { useEscapeKey } from '@/utils/use-escape-key';
import { Button } from '@/components/ui';
import type { SystemData } from '@/types';

/** Validation result */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Collects all node IDs and their port IDs recursively.
 */
function collectNodeAndPortIds(
  nodes: unknown[],
  nodeIds: Set<string>,
  portMap: Map<string, Set<string>>,
  path: string
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as Record<string, unknown>;
    if (!node || typeof node !== 'object') continue;

    const nodeId = node.id as string;
    if (typeof nodeId === 'string' && nodeId.trim()) {
      if (nodeIds.has(nodeId)) {
        errors.push(`${path}[${i}].id: duplicate node ID "${nodeId}"`);
      }
      nodeIds.add(nodeId);

      // Collect port IDs
      const ports = new Set<string>();
      if (Array.isArray(node.inputs)) {
        for (const port of node.inputs as Array<Record<string, unknown>>) {
          if (port && typeof port.id === 'string') {
            if (ports.has(port.id)) {
              errors.push(`${path}[${i}]: duplicate port ID "${port.id}"`);
            }
            ports.add(port.id);
          }
        }
      }
      if (Array.isArray(node.outputs)) {
        for (const port of node.outputs as Array<Record<string, unknown>>) {
          if (port && typeof port.id === 'string') {
            if (ports.has(port.id)) {
              errors.push(`${path}[${i}]: duplicate port ID "${port.id}"`);
            }
            ports.add(port.id);
          }
        }
      }
      portMap.set(nodeId, ports);

      // Recurse into internal nodes
      if (node.internal && typeof node.internal === 'object') {
        const internal = node.internal as Record<string, unknown>;
        if (Array.isArray(internal.nodes)) {
          errors.push(
            ...collectNodeAndPortIds(
              internal.nodes as unknown[],
              nodeIds,
              portMap,
              `${path}[${i}].internal.nodes`
            )
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Validates a Port object.
 */
function validatePort(port: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!port || typeof port !== 'object') {
    errors.push(`${path}: must be an object`);
    return errors;
  }
  const p = port as Record<string, unknown>;
  if (typeof p.id !== 'string' || !p.id.trim()) {
    errors.push(`${path}.id: required string`);
  }
  if (typeof p.name !== 'string' || !p.name.trim()) {
    errors.push(`${path}.name: required string`);
  }
  return errors;
}

/**
 * Validates a SystemEdge object with referential integrity.
 */
function validateEdge(
  edge: unknown,
  index: number,
  nodeIds: Set<string>,
  portMap: Map<string, Set<string>>,
  isInternal: boolean,
  path: string
): string[] {
  const errors: string[] = [];
  const edgePath = `${path}[${index}]`;

  if (!edge || typeof edge !== 'object') {
    errors.push(`${edgePath}: must be an object`);
    return errors;
  }

  const e = edge as Record<string, unknown>;

  // Required string fields
  if (typeof e.id !== 'string' || !e.id.trim()) {
    errors.push(`${edgePath}.id: required string`);
  }
  if (typeof e.fromNode !== 'string' || !e.fromNode.trim()) {
    errors.push(`${edgePath}.fromNode: required string`);
  }
  if (typeof e.fromPort !== 'string' || !e.fromPort.trim()) {
    errors.push(`${edgePath}.fromPort: required string`);
  }
  if (typeof e.toNode !== 'string' || !e.toNode.trim()) {
    errors.push(`${edgePath}.toNode: required string`);
  }
  if (typeof e.toPort !== 'string' || !e.toPort.trim()) {
    errors.push(`${edgePath}.toPort: required string`);
  }

  // Optional fields type check
  if (e.interaction !== undefined && typeof e.interaction !== 'string') {
    errors.push(`${edgePath}.interaction: must be string if provided`);
  }
  if (e.structure !== undefined && typeof e.structure !== 'string') {
    errors.push(`${edgePath}.structure: must be string if provided`);
  }

  // Referential integrity: check that fromNode and toNode exist
  const fromNode = e.fromNode as string;
  const toNode = e.toNode as string;
  const fromPort = e.fromPort as string;
  const toPort = e.toPort as string;

  // Special boundary nodes for internal edges
  const validBoundaryNodes = isInternal ? ['BOUNDARY_IN', 'BOUNDARY_OUT'] : [];

  if (fromNode && !nodeIds.has(fromNode) && !validBoundaryNodes.includes(fromNode)) {
    errors.push(`${edgePath}.fromNode: references unknown node "${fromNode}"`);
  }
  if (toNode && !nodeIds.has(toNode) && !validBoundaryNodes.includes(toNode)) {
    errors.push(`${edgePath}.toNode: references unknown node "${toNode}"`);
  }

  // Check port exists on node (skip boundary nodes as they use parent ports)
  if (fromNode && fromPort && portMap.has(fromNode)) {
    const ports = portMap.get(fromNode)!;
    if (!ports.has(fromPort)) {
      errors.push(`${edgePath}.fromPort: port "${fromPort}" not found on node "${fromNode}"`);
    }
  }
  if (toNode && toPort && portMap.has(toNode)) {
    const ports = portMap.get(toNode)!;
    if (!ports.has(toPort)) {
      errors.push(`${edgePath}.toPort: port "${toPort}" not found on node "${toNode}"`);
    }
  }

  return errors;
}

/**
 * Validates a SystemNode object recursively.
 */
function validateNode(
  node: unknown,
  path: string,
  nodeIds: Set<string>,
  portMap: Map<string, Set<string>>
): string[] {
  const errors: string[] = [];

  if (!node || typeof node !== 'object') {
    errors.push(`${path}: must be an object`);
    return errors;
  }

  const n = node as Record<string, unknown>;

  // Required string fields
  if (typeof n.id !== 'string' || !n.id.trim()) {
    errors.push(`${path}.id: required string`);
  }
  if (typeof n.name !== 'string' || !n.name.trim()) {
    errors.push(`${path}.name: required string`);
  }
  if (typeof n.process !== 'string' || !n.process.trim()) {
    errors.push(`${path}.process: required string`);
  }
  if (typeof n.operand !== 'string' || !n.operand.trim()) {
    errors.push(`${path}.operand: required string`);
  }

  // Boolean field
  if (typeof n.isExternal !== 'boolean') {
    errors.push(`${path}.isExternal: required boolean`);
  }

  // Number fields
  if (typeof n.x !== 'number' || !Number.isFinite(n.x)) {
    errors.push(`${path}.x: required number`);
  }
  if (typeof n.y !== 'number' || !Number.isFinite(n.y)) {
    errors.push(`${path}.y: required number`);
  }

  // Optional string field
  if (n.emergence !== undefined && typeof n.emergence !== 'string') {
    errors.push(`${path}.emergence: must be string if provided`);
  }

  // Inputs array
  if (!Array.isArray(n.inputs)) {
    errors.push(`${path}.inputs: required array`);
  } else {
    (n.inputs as unknown[]).forEach((port, i) => {
      errors.push(...validatePort(port, `${path}.inputs[${i}]`));
    });
  }

  // Outputs array
  if (!Array.isArray(n.outputs)) {
    errors.push(`${path}.outputs: required array`);
  } else {
    (n.outputs as unknown[]).forEach((port, i) => {
      errors.push(...validatePort(port, `${path}.outputs[${i}]`));
    });
  }

  // Optional internal subsystem
  if (n.internal !== undefined) {
    if (!n.internal || typeof n.internal !== 'object') {
      errors.push(`${path}.internal: must be object if provided`);
    } else {
      const internal = n.internal as Record<string, unknown>;

      if (!Array.isArray(internal.nodes)) {
        errors.push(`${path}.internal.nodes: required array`);
      } else {
        (internal.nodes as unknown[]).forEach((childNode, i) => {
          errors.push(...validateNode(childNode, `${path}.internal.nodes[${i}]`, nodeIds, portMap));
        });
      }

      if (!Array.isArray(internal.edges)) {
        errors.push(`${path}.internal.edges: required array`);
      } else {
        // Build local node/port map for internal validation
        const internalNodeIds = new Set<string>();
        const internalPortMap = new Map<string, Set<string>>();
        if (Array.isArray(internal.nodes)) {
          collectNodeAndPortIds(internal.nodes as unknown[], internalNodeIds, internalPortMap, `${path}.internal.nodes`);
        }

        (internal.edges as unknown[]).forEach((edge, i) => {
          errors.push(...validateEdge(edge, i, internalNodeIds, internalPortMap, true, `${path}.internal.edges`));
        });
      }
    }
  }

  return errors;
}

/**
 * Validates the entire SystemData object with full schema and referential integrity.
 */
function validateSystemData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Root: must be an object'], warnings };
  }

  const d = data as Record<string, unknown>;

  // Handle wrapped format (from export files)
  let systemData = d;
  if (d.system && typeof d.system === 'object') {
    systemData = d.system as Record<string, unknown>;
    warnings.push('Detected wrapped export format. Using nested system object.');
  }

  // Required root fields
  if (typeof systemData.id !== 'string' || !systemData.id.trim()) {
    errors.push('id: required string (typically "root")');
  }
  if (typeof systemData.name !== 'string' || !systemData.name.trim()) {
    errors.push('name: required string');
  }

  // Optional emergence
  if (systemData.emergence !== undefined && typeof systemData.emergence !== 'string') {
    errors.push('emergence: must be string if provided');
  }

  // Collect all node IDs and port IDs for referential integrity
  const nodeIds = new Set<string>();
  const portMap = new Map<string, Set<string>>();

  // Nodes array
  if (!Array.isArray(systemData.nodes)) {
    errors.push('nodes: required array');
  } else {
    // First pass: collect IDs
    errors.push(...collectNodeAndPortIds(systemData.nodes as unknown[], nodeIds, portMap, 'nodes'));

    // Second pass: validate structure
    (systemData.nodes as unknown[]).forEach((node, i) => {
      errors.push(...validateNode(node, `nodes[${i}]`, nodeIds, portMap));
    });
  }

  // Edges array
  if (!Array.isArray(systemData.edges)) {
    errors.push('edges: required array');
  } else {
    (systemData.edges as unknown[]).forEach((edge, i) => {
      errors.push(...validateEdge(edge, i, nodeIds, portMap, false, 'edges'));
    });
  }

  // Check for edge ID duplicates
  if (Array.isArray(systemData.edges)) {
    const edgeIds = new Set<string>();
    (systemData.edges as Array<Record<string, unknown>>).forEach((edge, i) => {
      if (edge && typeof edge.id === 'string') {
        if (edgeIds.has(edge.id)) {
          errors.push(`edges[${i}].id: duplicate edge ID "${edge.id}"`);
        }
        edgeIds.add(edge.id);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extracts SystemData from potentially wrapped format.
 */
function extractSystemData(data: unknown): SystemData | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  // Handle wrapped format
  if (d.system && typeof d.system === 'object') {
    return d.system as SystemData;
  }

  // Direct format
  if (d.id && d.nodes && d.edges) {
    return d as unknown as SystemData;
  }

  return null;
}

export function ImportJsonModal() {
  const { isImportModalOpen, setIsImportModalOpen, setSystemData } = useSystemStore();

  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setIsImportModalOpen(false);
    setJsonText('');
    setParseError(null);
  }, [setIsImportModalOpen]);

  // Close on Escape key
  useEscapeKey(handleClose, isImportModalOpen);

  const validation = useMemo((): ValidationResult | null => {
    if (!jsonText.trim()) return null;

    try {
      const parsed = JSON.parse(jsonText);
      setParseError(null);
      return validateSystemData(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid JSON syntax');
      return null;
    }
  }, [jsonText]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
  }, []);

  const handleImport = useCallback(() => {
    if (!validation?.isValid) return;

    try {
      const parsed = JSON.parse(jsonText);
      const systemData = extractSystemData(parsed);

      if (systemData) {
        setSystemData(systemData);
        setIsImportModalOpen(false);
        setJsonText('');
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  }, [jsonText, validation, setSystemData, setIsImportModalOpen]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  }, []);

  if (!isImportModalOpen) return null;

  const hasContent = jsonText.trim().length > 0;
  const canImport = validation?.isValid === true;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-github-surface rounded-xl shadow-2xl border border-github-border w-[850px] max-w-[95vw] h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-github-border">
          <div className="flex items-center gap-3">
            <Upload className="text-accent-blue" size={24} />
            <h2 className="text-lg font-semibold gradient-text-primary">Import System JSON</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="!p-2"
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </div>

        {/* File Upload */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-github-border">
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-github-bg hover:bg-github-elevated border border-dashed border-github-border hover:border-accent-blue rounded-lg cursor-pointer transition-colors">
            <FileUp size={18} className="text-github-text-secondary" />
            <span className="text-sm text-github-text-secondary">
              Drop a .json file or click to browse
            </span>
            <input
              type="file"
              accept=".json,.system.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* JSON Editor - Takes most of the space */}
        <div className="flex-1 p-4 overflow-hidden min-h-0">
          <textarea
            value={jsonText}
            onChange={handleTextChange}
            placeholder={`Paste your system JSON here...

Required schema:
{
  "id": "root",
  "name": "System Name",
  "emergence": "Optional purpose",
  "nodes": [
    {
      "id": "node_1",
      "name": "Entity Name",
      "process": "Action Verb",
      "operand": "Target Object",
      "isExternal": false,
      "x": 100,
      "y": 100,
      "inputs": [{ "id": "in_1", "name": "Input" }],
      "outputs": [{ "id": "out_1", "name": "Output" }]
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "fromNode": "node_1",
      "fromPort": "out_1",
      "toNode": "node_2",
      "toPort": "in_1"
    }
  ]
}`}
            className="w-full h-full bg-github-bg border border-github-border rounded-lg p-4 font-mono text-xs text-accent-green focus:outline-none focus:border-accent-blue resize-none whitespace-pre overflow-auto custom-scrollbar placeholder:text-github-text-muted"
            spellCheck="false"
          />
        </div>

        {/* Validation Status */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-github-border max-h-40 overflow-y-auto custom-scrollbar">
          {!hasContent && (
            <div className="flex items-center gap-2 text-sm text-github-text-secondary">
              <Info size={16} />
              Paste JSON or upload a file to validate against the schema
            </div>
          )}

          {hasContent && parseError && (
            <div className="flex items-start gap-2 text-accent-pink">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium">JSON Syntax Error: </span>
                {parseError}
              </div>
            </div>
          )}

          {hasContent && validation && !validation.isValid && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-accent-pink">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">Schema Validation Failed ({validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''})</span>
                </div>
              </div>
              <ul className="ml-6 text-xs text-accent-pink/80 space-y-0.5">
                {validation.errors.slice(0, 15).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
                {validation.errors.length > 15 && (
                  <li className="text-github-text-secondary">...and {validation.errors.length - 15} more errors</li>
                )}
              </ul>
            </div>
          )}

          {hasContent && validation?.isValid && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent-green">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Valid SystemData — ready to import</span>
              </div>
              {validation.warnings.length > 0 && (
                <ul className="ml-6 text-xs text-accent-orange space-y-0.5">
                  {validation.warnings.map((warning, i) => (
                    <li key={i}>⚠ {warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-github-border flex items-center justify-between">
          <span className="text-xs text-github-text-muted">
            Press Esc to close
          </span>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImport} disabled={!canImport}>
              <Upload size={16} />
              Import System
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
