/**
 * Data module exports
 * 
 * entity-database: Types, factory functions, and search utilities (always loaded)
 * entity-templates: Large template data (lazy-loaded via dynamic import)
 */

// Core types and utilities - always available
export * from './entity-database';

// Re-export template data for components that need it synchronously
// Note: For better code-splitting, prefer using loadEntityTemplates() instead
export { 
  ENTITY_DATABASE, 
  ALL_TEMPLATES, 
  getTemplate, 
  createEntityFromTemplate 
} from './entity-templates';

/**
 * Lazy-loads the entity template database.
 * Use this for code-splitting to reduce initial bundle size.
 * 
 * @example
 * const { ENTITY_DATABASE, getTemplate } = await loadEntityTemplates();
 */
export async function loadEntityTemplates() {
  return import('./entity-templates');
}
