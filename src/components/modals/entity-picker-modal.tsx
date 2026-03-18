'use client';

/**
 * EntityPickerModal - Modal for browsing and adding entities from the template database.
 * Features hierarchical category navigation, search, and template preview.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  Box,
  Code,
  Briefcase,
  Brain,
  Shield,
  Server,
  Layers,
  Tag,
  Sparkles,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useSystemStore } from '@/store';
import {
  type EntityCategory,
  type EntityTemplate,
  flattenCategories,
} from '@/data';
import { useEscapeKey } from '@/utils/use-escape-key';

/** Icon mapping for category icons */
const CATEGORY_ICONS: Record<string, typeof Box> = {
  code: Code,
  briefcase: Briefcase,
  brain: Brain,
  shield: Shield,
  server: Server,
  box: Box,
};

/** Gets the icon component for a category */
function getCategoryIcon(iconName?: string) {
  if (!iconName) return Box;
  return CATEGORY_ICONS[iconName] ?? Box;
}

/** Recursive category tree item */
function CategoryTreeItem({
  category,
  selectedCategoryId,
  onSelect,
  depth = 0,
  expandedIds,
  onToggleExpand,
}: {
  category: EntityCategory;
  selectedCategoryId: string | null;
  onSelect: (category: EntityCategory) => void;
  depth?: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedCategoryId === category.id;
  const Icon = getCategoryIcon(category.icon);

  // Calculate total template count including subcategories
  const getTotalCount = (cat: EntityCategory): number => {
    let count = cat.templates.length;
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        count += getTotalCount(sub);
      }
    }
    return count;
  };
  const totalCount = getTotalCount(category);

  return (
    <div>
      <button
        onClick={() => {
          onSelect(category);
          if (hasSubcategories) {
            onToggleExpand(category.id);
          }
        }}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
          isSelected
            ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
            : 'text-github-text-secondary hover:bg-github-elevated hover:text-github-text'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasSubcategories ? (
          isExpanded ? (
            <ChevronDown size={14} className="shrink-0" />
          ) : (
            <ChevronRight size={14} className="shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <Icon size={16} className={isSelected ? 'text-accent-blue' : 'text-github-text-muted'} />
        <span className="truncate">{category.name}</span>
        <span className="ml-auto text-xs text-github-text-muted">
          {totalCount}
        </span>
      </button>

      {hasSubcategories && isExpanded && (
        <div className="mt-0.5">
          {category.subcategories!.map((sub) => (
            <CategoryTreeItem
              key={sub.id}
              category={sub}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Template card for displaying an entity template */
function TemplateCard({
  template,
  onAdd,
}: {
  template: EntityTemplate;
  onAdd: (templateId: string) => void;
}) {
  const hasInternal = !!template.internal;

  return (
    <div className="bg-github-bg border border-github-border rounded-lg p-4 hover:border-accent-blue/50 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-github-text truncate">{template.name}</h4>
            {hasInternal && (
              <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple text-[10px] rounded-full border border-accent-purple/30">
                <Layers size={10} />
                Composite
              </span>
            )}
            {template.isExternal && (
              <span className="shrink-0 px-1.5 py-0.5 bg-accent-orange/20 text-accent-orange text-[10px] rounded-full border border-accent-orange/30">
                External
              </span>
            )}
          </div>
          <p className="text-sm text-github-text-secondary mt-1">
            <span className="text-accent-blue">{template.process}</span>
            {' '}
            <span className="text-github-text-muted">{template.operand}</span>
          </p>
        </div>
        <button
          onClick={() => onAdd(template.templateId)}
          className="shrink-0 p-2 bg-accent-blue/20 hover:bg-accent-blue text-accent-blue hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Add to canvas"
        >
          <Plus size={16} />
        </button>
      </div>

      {template.description && (
        <p className="text-xs text-github-text-muted mb-3">{template.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-accent-green">⬤</span>
          <span className="text-github-text-muted">
            {template.inputs.length} input{template.inputs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-accent-pink">⬤</span>
          <span className="text-github-text-muted">
            {template.outputs.length} output{template.outputs.length !== 1 ? 's' : ''}
          </span>
        </div>
        {hasInternal && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-accent-purple">⬤</span>
            <span className="text-github-text-muted">
              {template.internal!.nodes.length} internal nodes
            </span>
          </div>
        )}
      </div>

      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-github-elevated text-github-text-muted text-[10px] rounded-full"
            >
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="px-2 py-0.5 text-github-text-muted text-[10px]">
              +{template.tags.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function EntityPickerModal() {
  const {
    isEntityPickerOpen,
    setIsEntityPickerOpen,
    entitySearchQuery,
    setEntitySearchQuery,
    getEntityDatabase,
    searchEntityTemplates,
    addEntityFromTemplate,
    isFlattened,
    isEntityDatabaseLoading,
  } = useSystemStore();

  const [selectedCategory, setSelectedCategory] = useState<EntityCategory | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['stocks_flows', 'feedback', 'archetypes']));
  const [addedToast, setAddedToast] = useState<{ name: string; id: number } | null>(null);

  const database = getEntityDatabase();
  const flattened = isFlattened();

  // Auto-hide toast after 2 seconds
  useEffect(() => {
    if (addedToast) {
      const timer = setTimeout(() => setAddedToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [addedToast]);

  const handleClose = useCallback(() => {
    setIsEntityPickerOpen(false);
    setEntitySearchQuery('');
  }, [setIsEntityPickerOpen, setEntitySearchQuery]);

  useEscapeKey(handleClose, isEntityPickerOpen);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Get templates to display
  const displayTemplates = useMemo(() => {
    if (entitySearchQuery.trim()) {
      return searchEntityTemplates(entitySearchQuery);
    }
    if (selectedCategory) {
      // Get all templates from selected category and its subcategories
      const getAllTemplates = (cat: EntityCategory): EntityTemplate[] => {
        const templates = [...cat.templates];
        if (cat.subcategories) {
          for (const sub of cat.subcategories) {
            templates.push(...getAllTemplates(sub));
          }
        }
        return templates;
      };
      return getAllTemplates(selectedCategory);
    }
    // Show all templates when nothing selected
    return flattenCategories(database).map(({ template }) => template);
  }, [entitySearchQuery, selectedCategory, database, searchEntityTemplates]);

  const handleAdd = useCallback(
    (templateId: string) => {
      const node = addEntityFromTemplate(templateId);
      if (node) {
        setAddedToast({ name: node.name, id: Date.now() });
      }
    },
    [addEntityFromTemplate]
  );

  if (!isEntityPickerOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-github-surface rounded-xl shadow-2xl border border-github-border w-[900px] max-w-[95vw] h-[700px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-github-border shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="text-accent-blue" size={24} />
            <h2 className="text-lg font-semibold gradient-text-primary">Entity Library</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-github-elevated rounded-lg transition-colors text-github-text-secondary hover:text-github-text"
          >
            <X size={20} />
          </button>
        </div>

        {flattened && (
          <div className="px-6 py-3 bg-accent-orange/10 border-b border-accent-orange/30 text-accent-orange text-sm">
            ⚠️ Cannot add entities while viewing flattened layers. Set depth to 1 first.
          </div>
        )}

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-github-border shrink-0">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-github-text-secondary"
            />
            <input
              type="text"
              placeholder="Search entities by name, tags, or function..."
              value={entitySearchQuery}
              onChange={(e) => setEntitySearchQuery(e.target.value)}
              className="w-full bg-github-bg border border-github-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-github-text placeholder:text-github-text-muted focus:outline-none focus:border-accent-blue"
              autoFocus
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {isEntityDatabaseLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 size={48} className="animate-spin text-accent-blue" />
              <div className="text-center">
                <p className="text-github-text font-medium">Loading Entity Library</p>
                <p className="text-sm text-github-text-secondary mt-1">Preparing systems thinking entities...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Category Sidebar */}
              <div className="w-64 border-r border-github-border overflow-y-auto p-3 shrink-0">
                <div className="mb-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      !selectedCategory && !entitySearchQuery
                        ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                        : 'text-github-text-secondary hover:bg-github-elevated hover:text-github-text'
                    }`}
                  >
                    <Box size={16} />
                    <span>All Entities</span>
                    <span className="ml-auto text-xs text-github-text-muted">
                      {flattenCategories(database).length}
                    </span>
                  </button>
                </div>

                <div className="h-px bg-github-border my-2" />

                {database.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    selectedCategoryId={selectedCategory?.id ?? null}
                    onSelect={setSelectedCategory}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                  />
                ))}
              </div>

              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {entitySearchQuery && (
                  <div className="mb-4 text-sm text-github-text-secondary">
                    Found {displayTemplates.length} entit{displayTemplates.length !== 1 ? 'ies' : 'y'} matching "{entitySearchQuery}"
                  </div>
                )}

                {displayTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-github-text-muted">
                    <Box size={48} className="mb-4 opacity-50" />
                    <p className="text-lg">No entities found</p>
                    <p className="text-sm">Try a different search or category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayTemplates.map((template) => (
                      <TemplateCard
                        key={template.templateId}
                        template={template}
                        onAdd={flattened ? () => {} : handleAdd}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-github-border shrink-0 flex items-center justify-between text-xs text-github-text-muted relative">
          <span>
            {displayTemplates.length} entit{displayTemplates.length !== 1 ? 'ies' : 'y'} available
          </span>
          <span>Click + to add an entity to the canvas</span>

          {/* Added Toast Notification */}
          {addedToast && (
            <div
              key={addedToast.id}
              className="absolute left-1/2 -translate-x-1/2 -top-12 flex items-center gap-2 px-4 py-2 bg-accent-green/20 border border-accent-green/40 text-accent-green rounded-lg text-sm font-medium shadow-lg animate-in"
            >
              <CheckCircle size={16} />
              <span>Added "{addedToast.name}" to canvas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
