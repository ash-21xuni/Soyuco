"use client";

import { useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { clampWidth, type PanelBounds, type PanelSide } from "@/lib/usePanelLayout";

// Pressing on these inside a panel's header should act on them, not drag.
const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']";
const KEY_STEP = 16;

/**
 * Drag a side panel by its header (or grip) and drop it on either side of
 * its container. Spread `onPointerDown` on the header, render `preview`, and
 * put `grip` somewhere in the header for a visible, keyboard-reachable handle.
 */
export function usePanelDock(label: string, side: PanelSide, onDock: (side: PanelSide) => void) {
  const [preview, setPreview] = useState<{ target: PanelSide; rect: DOMRect; width: number } | null>(null);

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    const target = e.target as Element;
    if (e.button !== 0 || (target.closest(INTERACTIVE) && !target.closest(".panel-dock-grip"))) return;
    const panel = e.currentTarget.closest<HTMLElement>("[data-panel]");
    const container = panel?.parentElement;
    if (!panel || !container) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;
    let dropSide = side;

    function move(ev: PointerEvent) {
      if (!dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
        dragging = true;
        document.body.classList.add("panel-docking");
      }
      const rect = container!.getBoundingClientRect();
      dropSide = ev.clientX < rect.left + rect.width / 2 ? "left" : "right";
      setPreview({ target: dropSide, rect, width: panel!.offsetWidth });
    }
    function finish(commit: boolean) {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", escape);
      document.body.classList.remove("panel-docking");
      setPreview(null);
      if (dragging && commit && dropSide !== side) onDock(dropSide);
    }
    const drop = () => finish(true);
    const cancel = () => finish(false);
    const escape = (ev: KeyboardEvent) => ev.key === "Escape" && finish(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", escape);
  }

  function onGripKeyDown(e: ReactKeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      onDock(e.key === "ArrowLeft" ? "left" : "right");
    }
  }

  const grip = (
    <button
      type="button"
      className="panel-dock-grip"
      aria-label={`Move ${label} — drag to the other side, or use the arrow keys`}
      title="Drag to move to the other side"
      onKeyDown={onGripKeyDown}
    >
      <SettingsIcon name="gripHorizontal" size={14} />
    </button>
  );

  // Portalled so page transitions (transforms) can't offset the fixed overlay.
  const previewEl =
    preview &&
    createPortal(
      <div
        className="panel-dock-preview"
        aria-hidden
        style={{
          top: preview.rect.top,
          height: preview.rect.height,
          width: preview.width,
          left: preview.target === "left" ? preview.rect.left : preview.rect.right - preview.width,
        }}
      />,
      document.body,
    );

  return { onPointerDown, grip, preview: previewEl, docking: preview !== null };
}

/**
 * The draggable edge between a side panel and the content beside it. Render
 * it as the panel's next sibling; CSS orders it onto the panel's inner edge.
 * Dragging it past the minimum width snaps the panel down to its icon rail
 * (`collapsedWidth`), and dragging back out opens it again.
 */
export function PanelResizer({
  label,
  side,
  width,
  bounds,
  collapsed,
  collapsedWidth,
  onResize,
  onReset,
  onCollapsedChange,
}: {
  label: string;
  side: PanelSide;
  width: number;
  bounds: PanelBounds;
  collapsed: boolean;
  collapsedWidth: number;
  onResize: (width: number) => void;
  onReset: () => void;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  // Dragging away from the panel's docked edge makes it wider.
  const grow = side === "left" ? 1 : -1;
  // Below halfway between the rail and the minimum width, the panel snaps shut.
  const snapAt = (collapsedWidth + bounds.minWidth) / 2;
  const current = collapsed ? collapsedWidth : width;

  function resizeTo(next: number) {
    const shut = next < snapAt;
    if (shut !== collapsed) onCollapsedChange(shut);
    if (!shut) onResize(clampWidth(next, bounds));
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    const handle = e.currentTarget;
    const startX = e.clientX;
    const startWidth = current;
    let shut = collapsed;
    handle.setPointerCapture(e.pointerId);
    document.body.classList.add("panel-resizing");

    function move(ev: PointerEvent) {
      const next = startWidth + grow * (ev.clientX - startX);
      const nextShut = next < snapAt;
      if (nextShut !== shut) {
        shut = nextShut;
        onCollapsedChange(shut);
      }
      if (!shut) onResize(clampWidth(next, bounds));
    }
    function end() {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      document.body.classList.remove("panel-resizing");
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  function onKeyDown(e: ReactKeyboardEvent) {
    let next: number | null = null;
    // Stepping narrower from the minimum collapses; wider from the rail reopens.
    const narrower = collapsed ? collapsedWidth : width <= bounds.minWidth ? collapsedWidth : width - KEY_STEP;
    const wider = collapsed ? bounds.minWidth : width + KEY_STEP;
    if (e.key === "ArrowRight") next = grow > 0 ? wider : narrower;
    else if (e.key === "ArrowLeft") next = grow > 0 ? narrower : wider;
    else if (e.key === "Home") next = collapsedWidth;
    else if (e.key === "End") next = bounds.maxWidth;
    else if (e.key === "Enter") {
      if (collapsed) onCollapsedChange(false);
      return onReset();
    }
    if (next === null) return;
    e.preventDefault();
    resizeTo(next);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label}`}
      aria-valuenow={current}
      aria-valuemin={collapsedWidth}
      aria-valuemax={bounds.maxWidth}
      tabIndex={0}
      title="Drag to resize or collapse · double-click to reset"
      className={`panel-resizer side-${side}`}
      onPointerDown={onPointerDown}
      onDoubleClick={() => {
        if (collapsed) onCollapsedChange(false);
        onReset();
      }}
      onKeyDown={onKeyDown}
    />
  );
}
