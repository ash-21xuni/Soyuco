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
import { usePlanner } from "@/lib/planner/planner-context";
import { useToast } from "@/lib/toast/toast-context";
import {
  DEFAULT_PLANNER_LAYOUT,
  type PlannerCardId,
  type PlannerColumn,
  type PlannerLayout,
} from "@/lib/planner/layout";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { Calendar } from "@/components/planner/Calendar";
import { Schedule } from "@/components/planner/Schedule";
import { Tasks } from "@/components/planner/Tasks";
import { Habits } from "@/components/planner/Habits";
import { MoodChart } from "@/components/planner/MoodChart";
import { DailyQuote } from "@/components/planner/DailyQuote";

const CARDS: Record<PlannerCardId, { label: string; render: () => ReactNode }> = {
  calendar: { label: "Calendar", render: () => <Calendar /> },
  schedule: { label: "Schedule", render: () => <Schedule /> },
  tasks: { label: "Tasks", render: () => <Tasks /> },
  habits: { label: "Habits", render: () => <Habits /> },
  mood: { label: "Mood", render: () => <MoodChart /> },
  quote: { label: "Daily quote", render: () => <DailyQuote /> },
};

// Pressing on these inside a card's title bar should act on them, not drag.
const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']";

function sameLayout(a: PlannerLayout, b: PlannerLayout) {
  return a.left.join() === b.left.join() && a.right.join() === b.right.join();
}

function SortableCard({ id }: { id: PlannerCardId }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const { label, render } = CARDS[id];

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
      {render()}
    </div>
  );
}

function Column({ id, cards }: { id: PlannerColumn; cards: PlannerCardId[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext id={id} items={cards} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={`planner-col${isOver && !cards.length ? " is-over" : ""}`}>
        {cards.map((card) => (
          <SortableCard key={card} id={card} />
        ))}
        {!cards.length && <div className="planner-col-empty">Drop cards here</div>}
      </div>
    </SortableContext>
  );
}

// Day Planner cards in two columns that can be dragged and reordered,
// within or between columns. The arrangement is saved to the account.
export function PlannerBoard() {
  const { plannerLayout, setPlannerLayout } = usePlanner();
  const { showToast } = useToast();
  const [layout, setLayout] = useState(plannerLayout);

  // Follow the saved layout when it changes (e.g. from another device).
  const [savedLayout, setSavedLayout] = useState(plannerLayout);
  if (plannerLayout !== savedLayout) {
    setSavedLayout(plannerLayout);
    setLayout(plannerLayout);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function columnOf(id: UniqueIdentifier, from: PlannerLayout = layout): PlannerColumn | null {
    if (id === "left" || id === "right") return id;
    if (from.left.includes(id as PlannerCardId)) return "left";
    if (from.right.includes(id as PlannerCardId)) return "right";
    return null;
  }

  function save(next: PlannerLayout) {
    if (sameLayout(next, plannerLayout)) return;
    setPlannerLayout(next).then(({ error }) => {
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
      const card = active.id as PlannerCardId;
      const target = prev[to].filter((c) => c !== card);
      const overIndex = target.indexOf(over.id as PlannerCardId);
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, card);
      return { ...prev, [from]: prev[from].filter((c) => c !== card), [to]: target };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    let next = layout;
    const col = columnOf(active.id);
    if (over && col && col === columnOf(over.id)) {
      const cards = layout[col];
      const from = cards.indexOf(active.id as PlannerCardId);
      const to = over.id === col ? cards.length - 1 : cards.indexOf(over.id as PlannerCardId);
      if (from !== to && to >= 0) next = { ...layout, [col]: arrayMove(cards, from, to) };
    }
    setLayout(next);
    save(next);
  }

  const isDefault = sameLayout(layout, DEFAULT_PLANNER_LAYOUT);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setLayout(plannerLayout)}
    >
      <div className="planner-grid">
        <Column id="left" cards={layout.left} />
        <Column id="right" cards={layout.right} />
      </div>
      {!isDefault && (
        <button
          type="button"
          className="planner-reset-layout"
          onClick={() => {
            const next = { left: [...DEFAULT_PLANNER_LAYOUT.left], right: [...DEFAULT_PLANNER_LAYOUT.right] };
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
