"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner/planner-context";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY } from "@/lib/theme/theme-copy";
import { TodoModal } from "@/components/modals/TodoModal";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCollapsed } from "@/lib/useCollapsed";
import {
  repeatLabel,
  deadlineOf,
  deadlineState,
  deadlineWhen,
  tasksForDay,
  type TaskOccurrence,
} from "@/lib/planner/tasks";

function TaskRow({
  task,
  now,
  onToggle,
  onEdit,
}: {
  task: TaskOccurrence;
  now: Date;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const due = deadlineOf(task);
  const state = due && !task.doneOnDay ? deadlineState(due, now) : null;

  return (
    <div className={`todo-item${task.doneOnDay ? " is-done" : ""}`}>
      <button
        type="button"
        className={`todo-check${task.doneOnDay ? " done" : ""}`}
        onClick={onToggle}
        aria-label={task.doneOnDay ? "Mark as not done" : "Mark as done"}
        aria-pressed={task.doneOnDay}
      >
        {task.doneOnDay && <SettingsIcon name="check" size={11} />}
      </button>
      <div className={`todo-priority p-${task.priority}`} title={`${task.priority} priority`} />
      <div className="todo-main">
        <div className={`todo-text${task.doneOnDay ? " done" : ""}`}>{task.text}</div>
        {(task.repeat !== "none" || due) && (
          <div className="todo-meta">
            {task.repeat !== "none" && (
              <span className="todo-badge">
                <SettingsIcon name="repeat" size={11} /> {repeatLabel(task)}
              </span>
            )}
            {due &&
              (state === "overdue" ? (
                <span className="todo-badge todo-due is-overdue">
                  <SettingsIcon name="alert" size={11} /> Overdue · {deadlineWhen(task, due)}
                </span>
              ) : (
                <span className={`todo-badge todo-due${state ? ` is-${state}` : ""}`}>
                  <SettingsIcon name="clock" size={11} /> Due {deadlineWhen(task, due)}
                </span>
              ))}
          </div>
        )}
      </div>
      <button type="button" className="todo-edit" aria-label="Edit task" title="Edit task" onClick={onEdit}>
        <SettingsIcon name="pencil" size={13} />
      </button>
    </div>
  );
}

export function Tasks() {
  const { plannerDay, todos, addTodo, updateTodo, toggleTodo, deleteTodo } = usePlanner();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [completedCollapsed, toggleCompleted] = useCollapsed("soyuco_tasks_completed_collapsed");

  const dayKey = plannerDay.toDateString();
  const dayTodos = tasksForDay(todos, dayKey);
  const openTasks = dayTodos.filter((t) => !t.doneOnDay);
  const completed = dayTodos.filter((t) => t.doneOnDay);
  const now = new Date();

  const [editId, setEditId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const editing = editId !== null ? todos.find((t) => t.id === editId) : undefined;

  function row(t: TaskOccurrence) {
    return (
      <TaskRow
        key={t.id}
        task={t}
        now={now}
        onToggle={() => toggleTodo(t.id, dayKey)}
        onEdit={() => {
          setEditId(t.id);
          setOpen(true);
        }}
      />
    );
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">{copy.tasks}</div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text3)" }}>
          {completed.length}/{dayTodos.length}
        </span>
      </div>
      <div className="planner-card-body">
        <div>
          {openTasks.length === 0 ? (
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text3)", padding: "8px 0" }}>
              {completed.length ? "All done for today" : "No tasks yet"}
            </div>
          ) : (
            openTasks.map(row)
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

        {completed.length > 0 && (
          <div className="todo-completed">
            <button
              type="button"
              className="todo-completed-toggle"
              onClick={toggleCompleted}
              aria-expanded={!completedCollapsed}
            >
              <SettingsIcon name={completedCollapsed ? "chevronRight" : "chevronDown"} size={13} />
              {completed.length} completed
            </button>
            {!completedCollapsed && <div>{completed.map(row)}</div>}
          </div>
        )}
      </div>

      <TodoModal
        open={open}
        isEdit={editId !== null}
        initialText={editing?.text ?? ""}
        initialPriority={editing?.priority ?? "med"}
        initialDetails={
          editing
            ? {
                dueDate: editing.dueDate,
                dueTime: editing.dueTime,
                repeat: editing.repeat,
                repeatDays: editing.repeatDays,
                repeatInterval: editing.repeatInterval,
              }
            : undefined
        }
        startDay={editing?.day ?? dayKey}
        onCancel={() => setOpen(false)}
        onSave={(text, priority, details) => {
          if (editId !== null) updateTodo(editId, text, priority, details);
          else addTodo(text, priority, details);
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
