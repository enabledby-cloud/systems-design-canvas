'use client';

/**
 * ExportJsonModal - Displays the current system as formatted JSON for copying.
 */

import { useState, useCallback } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { useSystemStore } from '@/store';
import { StorageService } from '@/utils/storage-service';
import { useEscapeKey } from '@/utils/use-escape-key';

export function ExportJsonModal() {
  const { systemData, isExportModalOpen, setIsExportModalOpen } = useSystemStore();
  const [copied, setCopied] = useState(false);

  const handleClose = useCallback(() => {
    setIsExportModalOpen(false);
  }, [setIsExportModalOpen]);

  // Close on Escape key
  useEscapeKey(handleClose, isExportModalOpen);

  const jsonString = JSON.stringify(systemData, null, 2);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [jsonString]);

  const handleDownload = useCallback(() => {
    StorageService.exportToFile(systemData);
  }, [systemData]);

  if (!isExportModalOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-github-surface rounded-xl shadow-2xl border border-github-border w-[800px] max-w-[95vw] h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-github-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold gradient-text-primary">Export System JSON</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                copied
                  ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                  : 'bg-github-elevated hover:bg-github-border text-github-text border border-github-border'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg text-sm transition-colors"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-github-elevated rounded-lg transition-colors text-github-text-secondary hover:text-github-text"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* JSON Display - Scrollable */}
        <div className="flex-1 p-4 overflow-hidden min-h-0">
          <div className="h-full bg-github-bg border border-github-border rounded-lg overflow-auto custom-scrollbar">
            <pre className="p-4 font-mono text-xs text-accent-green whitespace-pre">
              {jsonString}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-github-border text-xs text-github-text-secondary flex items-center justify-between">
          <span>Copy this JSON to share or back up your system design.</span>
          <span className="text-github-text-muted">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
}
