'use client';

/**
 * ClearAllModal - confirmation modal for clearing all canvas content.
 */

import { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal, Button } from '@/components/ui';

export function ClearAllModal() {
  const { isClearModalOpen, setIsClearModalOpen, handleClearAll } =
    useSystemStore();

  const handleClose = useCallback(() => {
    setIsClearModalOpen(false);
  }, [setIsClearModalOpen]);

  return (
    <Modal
      isOpen={isClearModalOpen}
      onClose={handleClose}
      title="Clear Canvas"
      titleIcon={<AlertTriangle size={16} className="text-accent-pink" />}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearAll}>
            Yes, Clear All
          </Button>
        </>
      }
    >
      <p className="text-sm text-github-text-secondary">
        Are you sure you want to delete all entities and connections in the
        current view? This cannot be undone.
      </p>
    </Modal>
  );
}
