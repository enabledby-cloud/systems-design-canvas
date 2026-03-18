'use client';

/**
 * Hook for auto-saving and recovering system state.
 * Saves to localStorage on changes and recovers state on page load.
 */

import { useEffect, useRef, useCallback } from 'react';
import { StorageService } from './storage-service';
import type { SystemData } from '@/types';

/** Debounce delay for auto-save (ms) */
const AUTOSAVE_DEBOUNCE_MS = 1000;

interface UseAutoSaveOptions {
  /** System data to save */
  systemData: SystemData;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Callback when state is recovered */
  onRecover: (data: SystemData) => void;
  /** Callback to mark state as saved to current storage */
  onAutoSaved: () => void;
}

/**
 * Hook that automatically saves system state to localStorage.
 * - Saves with debounce on every change
 * - Saves immediately on tab close/hide
 * - Recovers saved state on mount
 */
export function useAutoSave({
  systemData,
  hasUnsavedChanges,
  onRecover,
  onAutoSaved,
}: UseAutoSaveOptions): void {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const lastSavedJsonRef = useRef<string>('');

  // Function to save current state
  const saveCurrentState = useCallback(() => {
    const currentJson = JSON.stringify(systemData);
    
    // Don't save if nothing changed
    if (currentJson === lastSavedJsonRef.current) return;
    
    StorageService.saveCurrentSystem(systemData);
    lastSavedJsonRef.current = currentJson;
    onAutoSaved();
  }, [systemData, onAutoSaved]);

  // Recover state on initial mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const savedData = StorageService.loadCurrentSystem();
    if (savedData) {
      // Validate the saved data has required structure
      if (savedData.id && savedData.name && Array.isArray(savedData.nodes)) {
        onRecover(savedData);
        lastSavedJsonRef.current = JSON.stringify(savedData);
      }
    }
  }, [onRecover]);

  // Debounced auto-save on data changes
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!hasUnsavedChanges) return;

    // Clear any pending save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule new save
    debounceTimerRef.current = setTimeout(() => {
      saveCurrentState();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [systemData, hasUnsavedChanges, saveCurrentState]);

  // Save immediately on window close or tab hide
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear any pending debounce and save immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      StorageService.saveCurrentSystem(systemData);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving the tab - save immediately
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        StorageService.saveCurrentSystem(systemData);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [systemData]);
}
