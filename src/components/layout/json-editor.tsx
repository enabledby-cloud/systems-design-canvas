'use client';

/**
 * JSON Editor sidebar for live editing of system data.
 */

import { useSystemStore } from '@/store';

/** Database icon SVG component */
function DatabaseIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

export function JsonEditor() {
  const { systemData, jsonError, setSystemData, setJsonError } =
    useSystemStore();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setSystemData(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div className="w-[400px] bg-github-surface border-l border-github-border flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-github-border">
        <h3 className="font-semibold text-github-text flex items-center gap-2">
          <DatabaseIcon size={16} /> <span className="gradient-text-primary">System Blueprint</span>
        </h3>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 flex flex-col relative">
        {jsonError && (
          <div className="absolute top-4 left-4 right-4 bg-accent-pink/20 border border-accent-pink text-accent-pink p-2 rounded text-xs z-10">
            {jsonError}
          </div>
        )}
        <textarea
          className="flex-1 w-full bg-github-bg border border-github-border rounded p-4 font-mono text-xs text-accent-green focus:outline-none focus:border-accent-blue resize-none whitespace-pre"
          value={JSON.stringify(systemData, null, 2)}
          onChange={handleChange}
          spellCheck="false"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-github-border text-xs text-github-text-secondary">
        Edit the JSON directly to update the visual canvas. External entities (
        <code className="text-github-text">isExternal: true</code>) sit outside
        the main system boundary.
      </div>
    </div>
  );
}
