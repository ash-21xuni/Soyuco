"use client";

import { useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/lib/toast/toast-context";
import { copyLayout, type BoardColumn, type BoardLayout } from "@/lib/board/layout";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

export type BoardCards<Id extends string> = Record<Id, { label: string; render: () => ReactNode }>;

// Pressing on these inside a card's title bar should act on them, not drag.
const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']";

function sameLayout<Id extends string>(a: BoardLayout<Id>, b: BoardLayout<Id>) {
  return a.left.join() === b.left.join() && a.right.join() === b.right.join();
}

function SortableCard({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  // Like Google Keep, grab a card by its title bar (or the grip) to move it.
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const target = e.target as Element;
    if (!target.closest(".planner-card-header") || target.closest(INTERACTIVE)) return;
    listeners?.onPointerDown?.(e);
  }

  return (
    <div
      ref={setNodeRef}
      className={`planner-sortable${isDragging ? " is-dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onPointerDown={onPointerDown}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="planner-drag-grip"
        aria-label={`Move ${label} card`}
        title="Drag to move"
        {...attributes}
        {...listeners}
      >
        <SettingsIcon name="gripHorizontal" size={14} />
      </button>
      {children}
    </div>
  );
}

function Column<Id extends string>({ id, ids, cards }: { id: BoardColumn; ids: Id[]; cards: BoardCards<Id> }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext id={id} items={ids} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={`planner-col${isOver && !ids.length ? " is-over" : ""}`}>
        {ids.map((card) => (
          <SortableCard key={card} id={card} label={cards[card].label}>
            {cards[card].render()}
          </SortableCard>
        ))}
        {!ids.length && <div className="planner-col-empty">Drop cards here</div>}
      </div>
    </SortableContext>
  );
}

type CardBoardProps<Id extends string> = {
  cards: BoardCards<Id>;
  layout: BoardLayout<Id>;
  defaultLayout: BoardLayout<Id>;
  onSave: (layout: BoardLayout<Id>) => Promise<{ error: string | null }>;
};

// Cards in two columns that can be dragged and reordered, within or between
// columns. The arrangement is handed to `onSave` to keep on the account.
export function CardBoard<Id extends string>({ cards, layout: savedLayout, defaultLayout, onSave }: CardBoardProps<Id>) {
  const { showToast } = useToast();
  const [layout, setLayout] = useState(savedLayout);

  // Follow the saved layout when it changes (e.g. from another device).
  const [lastSaved, setLastSaved] = useState(savedLayout);
  if (savedLayout !== lastSaved) {
    setLastSaved(savedLayout);
    setLayout(savedLayout);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function columnOf(id: UniqueIdentifier, from: BoardLayout<Id> = layout): BoardColumn | null {
    if (id === "left" || id === "right") return id;
    if (from.left.includes(id as Id)) return "left";
    if (from.right.includes(id as Id)) return "right";
    return null;
  }

  function save(next: BoardLayout<Id>) {
    if (sameLayout(next, savedLayout)) return;
    onSave(next).then(({ error }) => {
      if (error) showToast(`Couldn't save card layout: ${error}`, "error");
    });
  }

  // Moving into the other column happens while dragging, so cards make room.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setLayout((prev) => {
      const from = columnOf(active.id, prev);
      const to = columnOf(over.id, prev);
      if (!from || !to || from === to) return prev;
      const card = active.id as Id;
      const target = prev[to].filter((c) => c !== card);
      const overIndex = target.indexOf(over.id as Id);
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, card);
      return { ...prev, [from]: prev[from].filter((c) => c !== card), [to]: target };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    let next = layout;
    const col = columnOf(active.id);
    if (over && col && col === columnOf(over.id)) {
      const ids = layout[col];
      const from = ids.indexOf(active.id as Id);
      const to = over.id === col ? ids.length - 1 : ids.indexOf(over.id as Id);
      if (from !== to && to >= 0) next = { ...layout, [col]: arrayMove(ids, from, to) };
    }
    setLayout(next);
    save(next);
  }

  const isDefault = sameLayout(layout, defaultLayout);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setLayout(savedLayout)}
    >
      <div className="planner-grid">
        <Column id="left" ids={layout.left} cards={cards} />
        <Column id="right" ids={layout.right} cards={cards} />
      </div>
      {!isDefault && (
        <button
          type="button"
          className="planner-reset-layout"
          onClick={() => {
            const next = copyLayout(defaultLayout);
            setLayout(next);
            save(next);
          }}
        >
          Reset card layout
        </button>
      )}
    </DndContext>
  );
}
