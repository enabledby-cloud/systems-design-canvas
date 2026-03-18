'use client';

/**
 * EdgeEditorModal - modal for editing edge properties.
 */

import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal, Button, Input, ModalFooter } from '@/components/ui';

export function EdgeEditorModal() {
  const { editingEdge, setEditingEdge, saveEdge, deleteEditingEdge } =
    useSystemStore();

  const handleClose = useCallback(() => {
    setEditingEdge(null);
  }, [setEditingEdge]);

  if (!editingEdge) return null;

  const updateEdge = (updates: Partial<typeof editingEdge>) => {
    setEditingEdge({ ...editingEdge, ...updates });
  };

  return (
    <Modal
      isOpen={!!editingEdge}
      onClose={handleClose}
      title="Edit Connection"
      size="sm"
      footer={
        <ModalFooter align="between">
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={deleteEditingEdge}
            className="text-accent-pink hover:bg-accent-pink/10"
          >
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={saveEdge}>
              Save
            </Button>
          </div>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        <Input
          label="Interaction (What flows)"
          value={editingEdge.interaction || ''}
          onChange={(e) => updateEdge({ interaction: e.target.value })}
          placeholder="e.g. Material"
        />

        <Input
          label="Structure (Physical medium)"
          value={editingEdge.structure || ''}
          onChange={(e) => updateEdge({ structure: e.target.value })}
          placeholder="e.g. Pipeline, Truck"
        />
      </div>
    </Modal>
  );
}
