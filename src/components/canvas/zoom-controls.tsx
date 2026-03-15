'use client';

/**
 * ZoomControls component - provides zoom in/out and reset buttons.
 */

import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useSystemStore } from '@/store';

interface ZoomControlsProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function ZoomControls({ canvasRef }: ZoomControlsProps) {
  const { scale, zoomTo, resetView } = useSystemStore();

  const handleZoomIn = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    zoomTo(scale * 1.2, undefined, undefined, rect ?? undefined);
  };

  const handleZoomOut = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    zoomTo(scale / 1.2, undefined, undefined, rect ?? undefined);
  };

  return (
    <div className="absolute bottom-6 right-6 flex items-center bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-20">
      <button
        onClick={handleZoomIn}
        className="p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <ZoomIn size={18} />
      </button>
      <div className="text-slate-300 font-mono text-xs border-x border-slate-700 w-16 text-center select-none cursor-default">
        {Math.round(scale * 100)}%
      </div>
      <button
        onClick={handleZoomOut}
        className="p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
      <button
        onClick={resetView}
        className="p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border-l border-slate-700"
        title="Reset View"
        aria-label="Reset View"
      >
        <Maximize size={18} />
      </button>
    </div>
  );
}
