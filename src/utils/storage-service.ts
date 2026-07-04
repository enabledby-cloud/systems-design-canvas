/**
 * Storage service for persisting, loading, exporting, and importing system data.
 * Uses localStorage for browser persistence and supports JSON file operations.
 */

import type { SystemData } from '@/types';
import { initialSystemData } from '@/store/initial-data';

/** Storage keys for localStorage */
const STORAGE_KEYS = {
  LIBRARY: 'system-canvas-library',
  CURRENT: 'system-canvas-current',
  SETTINGS: 'system-canvas-settings',
} as const;

/** Schema version for future migration support */
const SCHEMA_VERSION = 1;

/** Metadata for a saved system */
export interface SavedSystemMeta {
  id: string;
  name: string;
  emergence?: string;
  savedAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
  schemaVersion: number;
}

/** Full saved system with data */
export interface SavedSystem extends SavedSystemMeta {
  data: SystemData;
}

/** System library containing all saved systems */
export interface SystemLibrary {
  version: number;
  systems: SavedSystem[];
}

/** Storage settings */
export interface StorageSettings {
  autoSave: boolean;
  autoSaveIntervalMs: number;
  lastOpenedId?: string;
}

const DEFAULT_SETTINGS: StorageSettings = {
  autoSave: true,
  autoSaveIntervalMs: 30000, // 30 seconds
};

/**
 * Generates a unique ID for saved systems.
 */
function generateSaveId(): string {
  return `sys_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Counts total nodes recursively including nested subsystems.
 */
function countNodesRecursive(nodes: SystemData['nodes']): number {
  let count = nodes.length;
  for (const node of nodes) {
    if (node.internal?.nodes) {
      count += countNodesRecursive(node.internal.nodes);
    }
  }
  return count;
}

/**
 * Counts total edges recursively including nested subsystems.
 */
function countEdgesRecursive(nodes: SystemData['nodes'], edges: SystemData['edges']): number {
  let count = edges.length;
  for (const node of nodes) {
    if (node.internal) {
      count += countEdgesRecursive(node.internal.nodes, node.internal.edges);
    }
  }
  return count;
}

/**
 * Storage service class providing all persistence operations.
 */
export class StorageService {
  /**
   * Gets the system library from localStorage.
   */
  static getLibrary(): SystemLibrary {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LIBRARY);
      if (raw) {
        const library = JSON.parse(raw) as SystemLibrary;
        return library;
      }
    } catch (error) {
      console.error('Failed to load system library:', error);
    }
    return { version: SCHEMA_VERSION, systems: [] };
  }

  /**
   * Saves the system library to localStorage.
   */
  static saveLibrary(library: SystemLibrary): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(library));
    } catch (error) {
      console.error('Failed to save system library:', error);
      throw new Error('Failed to save to local storage. Storage may be full.');
    }
  }

  /**
   * Gets list of saved systems (metadata only).
   */
  static listSavedSystems(): SavedSystemMeta[] {
    const library = this.getLibrary();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure to drop `data`, keep only metadata
    return library.systems.map(({ data, ...meta }) => meta);
  }

  /**
   * Saves a system to the library.
   * If id is provided, updates existing; otherwise creates new.
   */
  static saveSystem(systemData: SystemData, existingId?: string): SavedSystem {
    const library = this.getLibrary();
    const now = new Date().toISOString();
    
    const nodeCount = countNodesRecursive(systemData.nodes);
    const edgeCount = countEdgesRecursive(systemData.nodes, systemData.edges);

    let savedSystem: SavedSystem;

    if (existingId) {
      const existingIndex = library.systems.findIndex((s) => s.id === existingId);
      if (existingIndex >= 0) {
        savedSystem = {
          ...library.systems[existingIndex],
          name: systemData.name,
          emergence: systemData.emergence,
          updatedAt: now,
          nodeCount,
          edgeCount,
          data: systemData,
        };
        library.systems[existingIndex] = savedSystem;
      } else {
        // ID not found, create new
        savedSystem = {
          id: generateSaveId(),
          name: systemData.name,
          emergence: systemData.emergence,
          savedAt: now,
          updatedAt: now,
          nodeCount,
          edgeCount,
          schemaVersion: SCHEMA_VERSION,
          data: systemData,
        };
        library.systems.unshift(savedSystem);
      }
    } else {
      savedSystem = {
        id: generateSaveId(),
        name: systemData.name,
        emergence: systemData.emergence,
        savedAt: now,
        updatedAt: now,
        nodeCount,
        edgeCount,
        schemaVersion: SCHEMA_VERSION,
        data: systemData,
      };
      library.systems.unshift(savedSystem);
    }

    this.saveLibrary(library);
    return savedSystem;
  }

  /**
   * Loads a system from the library by ID.
   */
  static loadSystem(id: string): SavedSystem | null {
    const library = this.getLibrary();
    return library.systems.find((s) => s.id === id) ?? null;
  }

  /**
   * Deletes a system from the library by ID.
   */
  static deleteSystem(id: string): boolean {
    const library = this.getLibrary();
    const initialLength = library.systems.length;
    library.systems = library.systems.filter((s) => s.id !== id);
    
    if (library.systems.length < initialLength) {
      this.saveLibrary(library);
      return true;
    }
    return false;
  }

  /**
   * Duplicates a saved system in the library.
   */
  static duplicateSystem(id: string): SavedSystem | null {
    const original = this.loadSystem(id);
    if (!original) return null;

    const duplicatedData: SystemData = {
      ...JSON.parse(JSON.stringify(original.data)),
      name: `${original.data.name} (Copy)`,
    };

    return this.saveSystem(duplicatedData);
  }

  /**
   * Exports system data to a downloadable JSON file.
   */
  static exportToFile(systemData: SystemData, filename?: string): void {
    const exportData = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      system: systemData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (filename ?? systemData.name)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    
    link.href = url;
    link.download = `${safeName}.system.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports system data from a JSON file.
   * Returns a promise that resolves with the imported data.
   */
  static importFromFile(): Promise<SystemData> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.system.json';

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const text = await file.text();
          const parsed = JSON.parse(text);

          // Handle both old format (direct SystemData) and new format (with wrapper)
          let systemData: SystemData;
          if (parsed.system && typeof parsed.schemaVersion === 'number') {
            systemData = parsed.system;
          } else if (parsed.id && parsed.nodes && parsed.edges) {
            systemData = parsed;
          } else {
            throw new Error('Invalid system file format');
          }

          // Validate required fields
          if (!systemData.id || !systemData.name || !Array.isArray(systemData.nodes)) {
            throw new Error('Invalid system data structure');
          }

          resolve(systemData);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to parse file'));
        }
      };

      input.oncancel = () => {
        reject(new Error('File selection cancelled'));
      };

      input.click();
    });
  }

  /**
   * Saves current working system to quick-access storage.
   */
  static saveCurrentSystem(systemData: SystemData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT, JSON.stringify({
        savedAt: new Date().toISOString(),
        data: systemData,
      }));
    } catch (error) {
      console.error('Failed to auto-save current system:', error);
    }
  }

  /**
   * Loads the last working system from quick-access storage.
   */
  static loadCurrentSystem(): SystemData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT);
      if (raw) {
        const { data } = JSON.parse(raw);
        return data;
      }
    } catch (error) {
      console.error('Failed to load current system:', error);
    }
    return null;
  }

  /**
   * Clears the current working system from quick-access storage.
   */
  static clearCurrentSystem(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT);
  }

  /**
   * Gets storage settings.
   */
  static getSettings(): StorageSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Saves storage settings.
   */
  static saveSettings(settings: Partial<StorageSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Gets the default system data.
   */
  static getDefaultSystem(): SystemData {
    return JSON.parse(JSON.stringify(initialSystemData));
  }

  /**
   * Creates a new blank system.
   */
  static createBlankSystem(name = 'Untitled System'): SystemData {
    return {
      id: 'root',
      name,
      emergence: '',
      nodes: [],
      edges: [],
    };
  }

  /**
   * Calculates approximate storage usage.
   */
  static getStorageUsage(): { used: number; available: number; percentage: number } {
    let totalUsed = 0;
    
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        totalUsed += item.length * 2; // UTF-16 characters = 2 bytes each
      }
    }

    // localStorage is typically 5-10MB, assume 5MB
    const ESTIMATED_QUOTA = 5 * 1024 * 1024;

    return {
      used: totalUsed,
      available: ESTIMATED_QUOTA - totalUsed,
      percentage: (totalUsed / ESTIMATED_QUOTA) * 100,
    };
  }
}
