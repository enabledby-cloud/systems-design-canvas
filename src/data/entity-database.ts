/**
 * Hierarchical Composition Entity Database
 * 
 * Provides a sophisticated template system for defining reusable system entities.
 * Uses a hierarchical category structure for organizing entity archetypes and
 * supports composite (subsystem) templates with pre-wired internal structures.
 * 
 * @module data/entity-database
 */

import type { SystemNode, SystemEdge, InternalSystem, Port, EntityId } from '@/types';
import { generateId } from '@/utils';

// ============================================================================
// CORE TEMPLATE TYPES
// ============================================================================

/** Port definition template (name only, ID generated on instantiation) */
export interface PortTemplate {
  name: string;
}

/** Internal subsystem template for composite entities */
export interface InternalTemplate {
  nodes: EntityTemplate[];
  /** Edge templates use node template IDs which get remapped during instantiation */
  edges: EdgeTemplate[];
}

/** Edge template for internal connections */
export interface EdgeTemplate {
  /** Source node template ID (use 'BOUNDARY_IN' for input boundary) */
  fromNode: string;
  /** Source port index (0-based) for templates, or port name for boundary */
  fromPortIndex: number | string;
  /** Target node template ID (use 'BOUNDARY_OUT' for output boundary) */
  toNode: string;
  /** Target port index (0-based) for templates, or port name for boundary */
  toPortIndex: number | string;
  interaction?: string;
  structure?: string;
}

/**
 * Entity template defining a reusable archetype.
 * Templates are instantiated into SystemNode objects with generated IDs.
 */
export interface EntityTemplate {
  /** Template identifier (used for reference, not the generated entity ID) */
  templateId: string;
  /** Display name for the entity */
  name: string;
  /** Systems thinking: the verb/action this entity performs */
  process: string;
  /** Systems thinking: the object/target of the process */
  operand: string;
  /** Whether this template represents an external/context entity */
  isExternal: boolean;
  /** Optional emergence property for subsystems */
  emergence?: string;
  /** Input port templates */
  inputs: PortTemplate[];
  /** Output port templates */
  outputs: PortTemplate[];
  /** Optional internal subsystem template for composite entities */
  internal?: InternalTemplate;
  /** Human-readable description for UI display */
  description?: string;
  /** Keywords for search/filtering */
  tags?: string[];
}

/**
 * Category in the hierarchical entity taxonomy.
 * Categories can contain both entities and subcategories.
 */
export interface EntityCategory {
  /** Unique category identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category description */
  description?: string;
  /** Icon identifier (for UI rendering) */
  icon?: string;
  /** Entity templates in this category */
  templates: EntityTemplate[];
  /** Nested subcategories */
  subcategories?: EntityCategory[];
}

/**
 * Result of instantiating a template - the created node and ID mappings.
 */
export interface InstantiatedEntity {
  node: SystemNode;
  /** Map from template IDs to generated IDs (for edge remapping) */
  idMap: Map<string, EntityId>;
  /** Map from template port indices to generated port IDs */
  portIdMap: Map<string, EntityId>;
}

// ============================================================================
// TEMPLATE FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a simple entity template with basic inputs/outputs.
 */
export function createSimpleTemplate(
  templateId: string,
  name: string,
  process: string,
  operand: string,
  options: {
    isExternal?: boolean;
    inputs?: PortTemplate[];
    outputs?: PortTemplate[];
    description?: string;
    tags?: string[];
    emergence?: string;
  } = {}
): EntityTemplate {
  return {
    templateId,
    name,
    process,
    operand,
    isExternal: options.isExternal ?? false,
    emergence: options.emergence,
    inputs: options.inputs ?? [{ name: 'Input' }],
    outputs: options.outputs ?? [{ name: 'Output' }],
    description: options.description,
    tags: options.tags,
  };
}

/**
 * Creates a composite entity template with internal subsystem structure.
 */
export function createCompositeTemplate(
  templateId: string,
  name: string,
  process: string,
  operand: string,
  internal: InternalTemplate,
  options: {
    isExternal?: boolean;
    inputs?: PortTemplate[];
    outputs?: PortTemplate[];
    description?: string;
    tags?: string[];
    emergence?: string;
  } = {}
): EntityTemplate {
  return {
    ...createSimpleTemplate(templateId, name, process, operand, options),
    internal,
  };
}

// ============================================================================
// ENTITY INSTANTIATION
// ============================================================================

/**
 * Instantiates an entity from a template at the specified position.
 * Generates unique IDs for the entity and all its ports.
 * 
 * @param template - The entity template to instantiate
 * @param x - X position on canvas
 * @param y - Y position on canvas
 * @returns Instantiated entity with ID mappings
 */
export function instantiateEntity(
  template: EntityTemplate,
  x: number,
  y: number
): InstantiatedEntity {
  const idMap = new Map<string, EntityId>();
  const portIdMap = new Map<string, EntityId>();
  
  // Generate main entity ID
  const entityId = generateId('node');
  idMap.set(template.templateId, entityId);
  
  // Generate input port IDs
  const inputs: Port[] = template.inputs.map((p, idx) => {
    const portId = generateId('in');
    portIdMap.set(`${template.templateId}_in_${idx}`, portId);
    return { id: portId, name: p.name };
  });
  
  // Generate output port IDs
  const outputs: Port[] = template.outputs.map((p, idx) => {
    const portId = generateId('out');
    portIdMap.set(`${template.templateId}_out_${idx}`, portId);
    return { id: portId, name: p.name };
  });
  
  // Instantiate internal subsystem if present
  let internal: InternalSystem | undefined;
  if (template.internal) {
    internal = instantiateInternalSystem(template.internal, idMap, portIdMap, inputs, outputs);
  }
  
  const node: SystemNode = {
    id: entityId,
    name: template.name,
    process: template.process,
    operand: template.operand,
    isExternal: template.isExternal,
    emergence: template.emergence,
    x,
    y,
    inputs,
    outputs,
    internal,
  };
  
  return { node, idMap, portIdMap };
}

/**
 * Instantiates an internal subsystem from a template.
 */
function instantiateInternalSystem(
  template: InternalTemplate,
  parentIdMap: Map<string, EntityId>,
  parentPortIdMap: Map<string, EntityId>,
  parentInputs: Port[],
  parentOutputs: Port[]
): InternalSystem {
  const childIdMap = new Map<string, EntityId>();
  const childPortIdMap = new Map<string, EntityId>();
  
  // Instantiate child nodes with relative positions
  const nodes: SystemNode[] = [];
  let offsetX = 50;
  let offsetY = 50;
  
  for (const childTemplate of template.nodes) {
    const childResult = instantiateEntity(childTemplate, offsetX, offsetY);
    nodes.push(childResult.node);
    
    // Merge child ID maps
    childResult.idMap.forEach((v, k) => childIdMap.set(k, v));
    childResult.portIdMap.forEach((v, k) => childPortIdMap.set(k, v));
    
    // Position next child
    offsetX += 250;
    if (offsetX > 550) {
      offsetX = 50;
      offsetY += 200;
    }
  }
  
  // Create edges with remapped IDs
  const edges: SystemEdge[] = template.edges.map((edgeTemplate) => {
    let fromNode: EntityId;
    let fromPort: EntityId;
    let toNode: EntityId;
    let toPort: EntityId;
    
    // Handle boundary connections
    if (edgeTemplate.fromNode === 'BOUNDARY_IN') {
      fromNode = 'BOUNDARY_IN';
      const portIndex = typeof edgeTemplate.fromPortIndex === 'number' 
        ? edgeTemplate.fromPortIndex 
        : parseInt(edgeTemplate.fromPortIndex as string, 10);
      fromPort = parentInputs[portIndex]?.id ?? generateId('in');
    } else {
      fromNode = childIdMap.get(edgeTemplate.fromNode) ?? edgeTemplate.fromNode;
      const key = `${edgeTemplate.fromNode}_out_${edgeTemplate.fromPortIndex}`;
      fromPort = childPortIdMap.get(key) ?? generateId('out');
    }
    
    if (edgeTemplate.toNode === 'BOUNDARY_OUT') {
      toNode = 'BOUNDARY_OUT';
      const portIndex = typeof edgeTemplate.toPortIndex === 'number'
        ? edgeTemplate.toPortIndex
        : parseInt(edgeTemplate.toPortIndex as string, 10);
      toPort = parentOutputs[portIndex]?.id ?? generateId('out');
    } else {
      toNode = childIdMap.get(edgeTemplate.toNode) ?? edgeTemplate.toNode;
      const key = `${edgeTemplate.toNode}_in_${edgeTemplate.toPortIndex}`;
      toPort = childPortIdMap.get(key) ?? generateId('in');
    }
    
    return {
      id: generateId('edge'),
      fromNode,
      fromPort,
      toNode,
      toPort,
      interaction: edgeTemplate.interaction,
      structure: edgeTemplate.structure,
    };
  });
  
  return { nodes, edges };
}

/**
 * Batch instantiate multiple entities with automatic layout.
 */
export function instantiateEntities(
  templates: EntityTemplate[],
  startX: number,
  startY: number,
  options: {
    horizontalSpacing?: number;
    verticalSpacing?: number;
    maxPerRow?: number;
  } = {}
): SystemNode[] {
  const {
    horizontalSpacing = 280,
    verticalSpacing = 200,
    maxPerRow = 4,
  } = options;
  
  const nodes: SystemNode[] = [];
  
  templates.forEach((template, idx) => {
    const row = Math.floor(idx / maxPerRow);
    const col = idx % maxPerRow;
    const x = startX + col * horizontalSpacing;
    const y = startY + row * verticalSpacing;
    
    const { node } = instantiateEntity(template, x, y);
    nodes.push(node);
  });
  
  return nodes;
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

/**
 * Flattens a hierarchical category tree into a list of templates with paths.
 */
export function flattenCategories(
  categories: EntityCategory[],
  path: string[] = []
): Array<{ template: EntityTemplate; path: string[] }> {
  const result: Array<{ template: EntityTemplate; path: string[] }> = [];
  
  for (const category of categories) {
    const currentPath = [...path, category.name];
    
    // Add templates from this category
    for (const template of category.templates) {
      result.push({ template, path: currentPath });
    }
    
    // Recurse into subcategories
    if (category.subcategories) {
      result.push(...flattenCategories(category.subcategories, currentPath));
    }
  }
  
  return result;
}

/**
 * Searches templates by name, description, or tags.
 */
export function searchTemplates(
  categories: EntityCategory[],
  query: string
): EntityTemplate[] {
  const lowerQuery = query.toLowerCase();
  const flattened = flattenCategories(categories);
  
  return flattened
    .filter(({ template }) => {
      const nameMatch = template.name.toLowerCase().includes(lowerQuery);
      const descMatch = template.description?.toLowerCase().includes(lowerQuery);
      const tagMatch = template.tags?.some(t => t.toLowerCase().includes(lowerQuery));
      const processMatch = template.process.toLowerCase().includes(lowerQuery);
      const operandMatch = template.operand.toLowerCase().includes(lowerQuery);
      
      return nameMatch || descMatch || tagMatch || processMatch || operandMatch;
    })
    .map(({ template }) => template);
}

/**
 * Gets a template by its ID from the category hierarchy.
 */
export function getTemplateById(
  categories: EntityCategory[],
  templateId: string
): EntityTemplate | undefined {
  const flattened = flattenCategories(categories);
  return flattened.find(({ template }) => template.templateId === templateId)?.template;
}

/**
 * Gets all templates from a category and its subcategories.
 */
export function getAllTemplatesInCategory(category: EntityCategory): EntityTemplate[] {
  const templates = [...category.templates];
  
  if (category.subcategories) {
    for (const sub of category.subcategories) {
      templates.push(...getAllTemplatesInCategory(sub));
    }
  }
  
  return templates;
}

