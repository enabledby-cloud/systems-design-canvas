---
description: "Rules for using shared UI components. Always reuse existing primitives instead of writing inline HTML elements."
applyTo: "**/*.tsx, **/*.ts"
---

# UI Component Reuse Rules

## Mandatory: Use Shared UI Primitives

The project provides shared, styled UI primitives in `src/components/ui/`. These **must** be used instead of raw HTML elements for consistency, accessibility, and maintainability.

### Available Components

| Component | Import | Use Instead Of |
|-----------|--------|----------------|
| `Button` | `@/components/ui` | `<button>` elements with action/navigation styling |
| `Input` | `@/components/ui` | `<input>` form fields (text, email, etc.) |
| `Textarea` | `@/components/ui` | `<textarea>` elements |
| `Checkbox` | `@/components/ui` | `<input type="checkbox">` |
| `Modal` | `@/components/ui` | Custom modal/dialog wrappers |
| `ModalFooter` | `@/components/ui` | Footer sections inside modals |

### Button Variants

```tsx
import { Button } from '@/components/ui';

// Standard actions
<Button variant="primary" size="sm" icon={<Save size={16} />}>Save</Button>
<Button variant="secondary" size="sm" icon={<FolderOpen size={16} />}>Open</Button>
<Button variant="danger" size="sm" icon={<Trash2 size={16} />}>Delete</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="gradient" size="sm" icon={<Sparkles size={16} />}>Special</Button>

// Icon-only buttons (close, toggle, etc.)
<Button variant="ghost" size="sm" className="!p-2" aria-label="Close">
  <X size={20} />
</Button>
```

### Input Usage

```tsx
import { Input, Textarea } from '@/components/ui';

<Input label="Name" placeholder="Enter name..." accentColor="blue" />
<Textarea label="Description" rows={4} />
```

### Modal Usage

```tsx
import { Modal, ModalFooter, Button } from '@/components/ui';

<Modal isOpen={isOpen} onClose={handleClose} title="Edit Entity" size="lg">
  {/* content */}
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSave}>Save</Button>
  </ModalFooter>
</Modal>
```

---

## When Raw HTML Elements Are Acceptable

Raw `<button>` or `<input>` elements are **only** acceptable in these cases:

1. **React Flow node controls** — Tiny icon buttons inside flow nodes that require the `nodrag` class and node-specific event handling.
2. **Hidden file inputs** — `<input type="file" className="hidden">` for file upload triggers.
3. **Custom compound widgets** — Specialized controls (e.g., sort tabs, tree navigation items) where the Button component's styling is semantically wrong.

In all other cases, use the shared component.

---

## Creating New Shared Components

If you find yourself writing the same inline pattern 3+ times, extract it into a shared component:

1. Create the component in `src/components/ui/`
2. Export it from `src/components/ui/index.ts`
3. Use it everywhere the pattern was repeated

### Candidate patterns for extraction:
- Search inputs with icon prefix → Consider adding `icon` prop to `Input`
- Close buttons → Use `<Button variant="ghost" size="sm" className="!p-2">`
- Card containers with consistent border/shadow → Create `Card` component
- Badge/tag elements → Create `Badge` component

---

## Anti-Patterns (Do NOT Do This)

```tsx
// ❌ WRONG: Inline button with duplicated styling
<button className="flex items-center space-x-1 bg-github-bg text-github-text-secondary hover:bg-github-elevated px-2.5 py-1.5 rounded-md text-sm transition-colors border border-github-border">
  <Save size={16} />
  Save
</button>

// ✅ CORRECT: Use shared Button component
<Button variant="secondary" size="sm" icon={<Save size={16} />}>Save</Button>
```

```tsx
// ❌ WRONG: Raw input with duplicated focus/border styles
<input className="w-full bg-github-bg border border-github-border rounded-md px-3 py-2 text-sm text-github-text focus:outline-none focus:border-accent-blue" />

// ✅ CORRECT: Use shared Input component
<Input placeholder="Search..." accentColor="blue" />
```

---

## Checklist Before Submitting UI Code

- [ ] No raw `<button>` elements outside the exceptions listed above
- [ ] No raw `<input type="text|email|password">` outside exceptions
- [ ] No raw `<textarea>` outside exceptions
- [ ] All modals use the `Modal` component wrapper
- [ ] Modal footer buttons use `ModalFooter` + `Button`
- [ ] Close buttons use `Button variant="ghost"` pattern
