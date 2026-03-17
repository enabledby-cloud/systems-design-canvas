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
      bg: 'bg-accent-green/10',
      text: 'text-accent-green',
      border: 'border-accent-green/30',
      status: 'Comfortable',
    };
  }
  if (count <= MILLER_OPTIMAL) {
    return {
      bg: 'bg-accent-orange/10',
      text: 'text-accent-orange',
      border: 'border-accent-orange/30',
      status: 'Optimal',
    };
  }
  if (count <= MILLER_LIMIT) {
    return {
      bg: 'bg-accent-orange/20',
      text: 'text-accent-orange',
      border: 'border-accent-orange/40',
      status: 'At Limit',
    };
  }
  return {
    bg: 'bg-accent-pink/10',
    text: 'text-accent-pink',
    border: 'border-accent-pink/30',
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
    <div className="flex items-center p-3 bg-github-surface border-b border-github-border text-sm min-h-[52px]">
      <div className="flex items-center space-x-2 flex-1">
        {paths.map((p, idx) => {
          const isLast = idx === paths.length - 1;

          return (
            <React.Fragment key={p.id}>
              {idx > 0 && <span className="text-github-text-muted">/</span>}
              {isLast ? (
                <div className="flex items-center">
                  <div
                    onClick={openRenameModal}
                    className="group flex items-center text-accent-blue font-semibold cursor-pointer hover:text-accent-blue/80 transition-colors"
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
                      className="ml-4 flex items-center px-2.5 py-1 rounded-full border border-accent-orange/30 bg-accent-orange/10 text-accent-orange text-xs font-medium tracking-wide shadow-sm"
                      title="System Emergence"
                    >
                      <Zap size={12} className="mr-1.5 text-accent-orange" />
                      Emergence: {p.emergence}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigateUp(idx)}
                  className="text-github-text-secondary hover:text-github-text transition-colors text-base"
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
          <span className="text-xs text-github-text-secondary">in system</span>
          {entityCounts.external > 0 && (
            <>
              <span className="text-github-text-muted">·</span>
              <span className="text-xs text-github-text-secondary">
                {entityCounts.external} external
              </span>
            </>
          )}
        </div>
        {entityCounts.internal > MILLER_LIMIT && (
          <AlertTriangle size={14} className="text-accent-pink animate-pulse" />
        )}
      </div>
    </div>
  );
}
