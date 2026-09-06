"use client";

import { useState } from "react";
import { usePlanner, type Priority } from "@/lib/planner/planner-context";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY } from "@/lib/theme/theme-copy";
import { TodoModal } from "@/components/modals/TodoModal";

export function Tasks() {
  const { plannerDay, todos, addTodo, updateTodo, toggleTodo, deleteTodo } = usePlanner();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];

  const dayKey = plannerDay.toDateString();
  const dayTodos = todos.filter((t) => t.day === dayKey);
  const done = dayTodos.filter((t) => t.done).length;

  const [editId, setEditId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const editing = editId !== null ? dayTodos.find((t) => t.id === editId) : undefined;

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">{copy.tasks}</div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text3)" }}>
          {done}/{dayTodos.length}
        </span>
      </div>
      <div className="planner-card-body">
        <div>
          {dayTodos.length === 0 ? (
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", padding: "8px 0" }}>
              No tasks yet
            </div>
          ) : (
            dayTodos.map((t) => (
              <div key={t.id} className="todo-item">
                <div className={`todo-check${t.done ? " done" : ""}`} onClick={() => toggleTodo(t.id)}>
                  {t.done ? "✓" : ""}
                </div>
                <div className={`todo-priority p-${t.priority}`} title={`${t.priority} priority`} />
                <div className={`todo-text${t.done ? " done" : ""}`} style={{ flex: 1 }}>
                  {t.text}
                </div>
                <button
                  onClick={() => {
                    setEditId(t.id);
                    setOpen(true);
                  }}
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text3)",
                    padding: "2px 6px",
                    background: "none",
                    border: "1px solid transparent",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                  }}
                >
                  ✎
                </button>
              </div>
            ))
          )}
        </div>
        <button
          className="add-todo"
          onClick={() => {
            setEditId(null);
            setOpen(true);
          }}
        >
          + Add task
        </button>
      </div>

      <TodoModal
        open={open}
        isEdit={editId !== null}
        initialText={editing?.text ?? ""}
        initialPriority={editing?.priority ?? "med"}
        onCancel={() => setOpen(false)}
        onSave={(text, priority) => {
          if (editId !== null) updateTodo(editId, text, priority);
          else addTodo(text, priority as Priority);
          setOpen(false);
        }}
        onDelete={() => {
          if (editId !== null) deleteTodo(editId);
          setOpen(false);
        }}
      />
    </div>
  );
}
