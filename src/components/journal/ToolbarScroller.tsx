"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

// Keeps a toolbar on one line: anything that doesn't fit scrolls sideways,
// with arrow buttons that only appear when there's more in that direction.
export function ToolbarScroller({
  className,
  label,
  trailing,
  children,
}: {
  className: string;
  label: string;
  /** Pinned after the scrolling row, so it is always visible. */
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const inner = innerRef.current;
    if (!track || !inner) return;
    update();
    // Panels resizing the pane and buttons changing label both change the fit.
    const ro = new ResizeObserver(update);
    ro.observe(track);
    ro.observe(inner);
    track.addEventListener("scroll", update, { passive: true });
    // A plain mouse wheel scrolls the row sideways.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (track.scrollWidth <= track.clientWidth) return;
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      track.removeEventListener("scroll", update);
      track.removeEventListener("wheel", onWheel);
    };
  }, [update]);

  function scrollByPage(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <div
      className={`${className} toolbar-scroller${canLeft ? " can-left" : ""}${canRight ? " can-right" : ""}`}
      role="toolbar"
      aria-label={label}
    >
      {canLeft && (
        <button
          type="button"
          className="toolbar-scroll-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => scrollByPage(-1)}
          aria-label="Show earlier tools"
          title="More tools"
        >
          <SettingsIcon name="chevronLeft" size={14} />
        </button>
      )}
      <div className="toolbar-scroll-track" ref={trackRef}>
        <div className="toolbar-scroll-inner" ref={innerRef}>
          {children}
        </div>
      </div>
      {canRight && (
        <button
          type="button"
          className="toolbar-scroll-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => scrollByPage(1)}
          aria-label="Show more tools"
          title="More tools"
        >
          <SettingsIcon name="chevronRight" size={14} />
        </button>
      )}
      {trailing}
    </div>
  );
}
