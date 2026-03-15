'use client';

/**
 * Breadcrumbs component - shows navigation path and current system info.
 * Includes Miller's Law indicator for cognitive load awareness.
 */

import React, { useMemo } from 'react';
import { Edit2, Zap, Box, AlertTriangle } from 'lucide-react';
import { useSystemStore } from '@/store';
import type { BreadcrumbItem, InternalSystem } from '@/types';

/** Miller's Law thresholds */
const MILLER_COMFORTABLE = 5;
const MILLER_OPTIMAL = 7;
const MILLER_LIMIT = 9;

/**
 * Get color classes based on entity count (Miller's Law)
 */
function getMillerColor(count: number): {
  bg: string;
  text: string;
  border: string;
  status: string;
} {
  if (count <= MILLER_COMFORTABLE) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      status: 'Comfortable',
    };
  }
  if (count <= MILLER_OPTIMAL) {
    return {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      status: 'Optimal',
    };
  }
  if (count <= MILLER_LIMIT) {
    return {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      status: 'At Limit',
    };
  }
  return {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    status: 'Exceeds Limit',
  };
}

export function Breadcrumbs() {
  const { systemData, currentPath, navigateUp, openRenameModal, getCurrentSystem } =
    useSystemStore();

  // Get current system to count entities
  const currentSystem = getCurrentSystem();
  
  // Count internal vs external entities
  const entityCounts = useMemo(() => {
    const internal = currentSystem.nodes.filter((n) => !n.isExternal).length;
    const external = currentSystem.nodes.filter((n) => n.isExternal).length;
    const total = currentSystem.nodes.length;
    return { internal, external, total };
  }, [currentSystem.nodes]);

  const millerColors = getMillerColor(entityCounts.internal);

  // Build breadcrumb path
  const paths: BreadcrumbItem[] = [
    { id: 'root', name: systemData.name, emergence: systemData.emergence },
  ];

  let current: InternalSystem = systemData;
  for (const pid of currentPath) {
    const node = current.nodes.find((x) => x.id === pid);
    if (node) {
      paths.push({ id: node.id, name: node.name, emergence: node.emergence });
      current = node.internal ?? { nodes: [], edges: [] };
    }
  }

  return (
    <div className="flex items-center p-3 bg-slate-900 border-b border-slate-800 text-sm min-h-[52px]">
      <div className="flex items-center space-x-2 flex-1">
        {paths.map((p, idx) => {
          const isLast = idx === paths.length - 1;

          return (
            <React.Fragment key={p.id}>
              {idx > 0 && <span className="text-slate-600">/</span>}
              {isLast ? (
                <div className="flex items-center">
                  <div
                    onClick={openRenameModal}
                    className="group flex items-center text-blue-400 font-semibold cursor-pointer hover:text-blue-300 transition-colors"
                    title="Edit System Properties"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openRenameModal()}
                  >
                    <span className="text-base">{p.name}</span>
                    <Edit2
                      size={14}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  {p.emergence && (
                    <div
                      className="ml-4 flex items-center px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200/90 text-xs font-medium tracking-wide shadow-sm"
                      title="System Emergence"
                    >
                      <Zap size={12} className="mr-1.5 text-amber-400" />
                      Emergence: {p.emergence}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigateUp(idx)}
                  className="text-slate-400 hover:text-slate-200 transition-colors text-base"
                >
                  {p.name}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Miller's Law Entity Counter */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${millerColors.bg} ${millerColors.border} transition-colors`}
        title={`Miller's Law (7±2): ${entityCounts.internal} internal entities in context. ${millerColors.status}. Consider decomposing if exceeding 9 entities.`}
      >
        <Box size={14} className={millerColors.text} />
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${millerColors.text}`}>
            {entityCounts.internal}
          </span>
          <span className="text-xs text-slate-500">in system</span>
          {entityCounts.external > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-500">
                {entityCounts.external} external
              </span>
            </>
          )}
        </div>
        {entityCounts.internal > MILLER_LIMIT && (
          <AlertTriangle size={14} className="text-red-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}
