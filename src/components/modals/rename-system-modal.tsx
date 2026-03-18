'use client';

/**
 * RenameSystemModal - modal for editing system properties (name and emergence).
 */

import { useCallback } from 'react';
import { Settings } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal, Button, Input } from '@/components/ui';

export function RenameSystemModal() {
  const { renameModal, setRenameModal, saveRename } = useSystemStore();

  const handleClose = useCallback(() => {
    setRenameModal({ isOpen: false, name: '', emergence: '' });
  }, [setRenameModal]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRename();
    }
  };

  return (
    <Modal
      isOpen={renameModal.isOpen}
      onClose={handleClose}
      title="System Properties"
      titleIcon={<Settings size={16} className="text-accent-blue" />}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveRename}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="System Name"
          value={renameModal.name}
          onChange={(e) => setRenameModal({ ...renameModal, name: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Enter system name"
          autoFocus
        />

        <Input
          label="Emergence (Optional)"
          value={renameModal.emergence}
          onChange={(e) => setRenameModal({ ...renameModal, emergence: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Continuous Flow of Value"
          accentColor="orange"
          helper="The property or behavior that arises from the interaction of the parts, but is not present in the parts themselves."
        />
      </div>
    </Modal>
  );
}
