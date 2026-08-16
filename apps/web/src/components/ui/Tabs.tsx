import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  /** Beschriftung der Reiterleiste für Screenreader. */
  label: string;
  className?: string;
}

/**
 * Reiter nach dem ARIA-Muster: Pfeiltasten wechseln, Pos1 und Ende springen an
 * den Rand, und nur der aktive Reiter ist per Tabulator erreichbar. Der Wechsel
 * erfolgt sofort beim Fokussieren – die Inhalte sind schon geladen, ein
 * zusätzlicher Tastendruck wäre nur Umweg.
 */
export function Tabs({ items, label, className }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const active = items.find((item) => item.id === activeId) ?? items[0];
  if (!active) return null;

  const focusTab = (id: string) => {
    setActiveId(id);
    tabRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    const target =
      event.key === 'ArrowRight'
        ? items[index === last ? 0 : index + 1]
        : event.key === 'ArrowLeft'
          ? items[index === 0 ? last : index - 1]
          : event.key === 'Home'
            ? items[0]
            : event.key === 'End'
              ? items[last]
              : null;

    if (!target) return;
    event.preventDefault();
    focusTab(target.id);
  };

  return (
    <div className={cn('flex min-h-0 flex-col gap-4', className)}>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const selected = item.id === active.id;

          return (
            <button
              key={item.id}
              ref={(element) => {
                if (element) tabRefs.current.set(item.id, element);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'rounded-btn border px-4 py-2 font-semibold transition-colors',
                selected
                  ? 'border-cat-1 bg-surface-hi text-text'
                  : 'border-border text-text-muted hover:bg-surface-hi',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/*
        tabIndex am Panel: Der Inhalt kann scrollen, und ein scrollbarer Bereich
        muss mit der Tastatur erreichbar sein.
      */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-${active.id}`}
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {active.content}
      </div>
    </div>
  );
}
