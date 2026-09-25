"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { SettingsIcon, type SettingsIconName } from "@/components/settings/SettingsIcon";

/** Word-style text wrapping: float left/right with text around it, or centred on its own line. */
export type Wrap = "left" | "center" | "right";

const WRAP_OPTIONS: { value: Wrap; icon: SettingsIconName; label: string }[] = [
  { value: "left", icon: "wrapLeft", label: "Wrap text – left" },
  { value: "center", icon: "wrapCenter", label: "In line – centred" },
  { value: "right", icon: "wrapRight", label: "Wrap text – right" },
];

/** Layout options bar shown on a selected image or text box. */
export function LayoutToolbar({
  wrap,
  onWrap,
  onDelete,
  deleteLabel,
}: {
  wrap: Wrap;
  onWrap: (wrap: Wrap) => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <div className="jlayout-bar" contentEditable={false} role="toolbar" aria-label="Layout options">
      {WRAP_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`jlayout-btn${wrap === o.value ? " active" : ""}`}
          title={o.label}
          aria-label={o.label}
          aria-pressed={wrap === o.value}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onWrap(o.value)}
        >
          <SettingsIcon name={o.icon} size={14} />
        </button>
      ))}
      <span className="jlayout-sep" />
      <button
        type="button"
        className="jlayout-btn danger"
        title={deleteLabel}
        aria-label={deleteLabel}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDelete}
      >
        <SettingsIcon name="trash" size={14} />
      </button>
    </div>
  );
}

/** Whether the editor's selection is on or inside this node. */
export function useNodeActive(editor: Editor, node: PMNode, getPos: () => number | undefined) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const pos = getPos();
      if (typeof pos !== "number") return false;
      const { from, to } = e.state.selection;
      return from >= pos && to <= pos + node.nodeSize;
    },
  });
}

/**
 * Drag-to-resize for a node's width. Returns the live width while dragging
 * and a pointer-down handler for the left/right handles; the final width is
 * committed once, on release.
 */
export function useWidthResize({
  minWidth,
  onCommit,
}: {
  minWidth: number;
  onCommit: (width: number) => void;
}) {
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const drag = useRef<{ startX: number; startWidth: number; side: 1 | -1; max: number } | null>(null);

  function startResize(e: ReactPointerEvent<HTMLElement>, side: "left" | "right") {
    e.preventDefault();
    e.stopPropagation();
    const box = e.currentTarget.parentElement;
    if (!box) return;
    const max = box.parentElement?.clientWidth ?? Infinity;
    drag.current = {
      startX: e.clientX,
      startWidth: box.getBoundingClientRect().width,
      side: side === "right" ? 1 : -1,
      max,
    };
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const next = d.startWidth + (ev.clientX - d.startX) * d.side;
      setLiveWidth(Math.round(Math.min(Math.max(next, minWidth), d.max)));
    };
    const up = (ev: PointerEvent) => {
      const d = drag.current;
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      drag.current = null;
      if (d) {
        const next = d.startWidth + (ev.clientX - d.startX) * d.side;
        onCommit(Math.round(Math.min(Math.max(next, minWidth), d.max)));
      }
      setLiveWidth(null);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  }

  return { liveWidth, startResize };
}
