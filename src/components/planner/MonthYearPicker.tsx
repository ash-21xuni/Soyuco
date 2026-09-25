"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

const MONTHS = Array.from({ length: 12 }, (_, m) =>
  new Date(2000, m, 1).toLocaleDateString("en-US", { month: "long" }),
);
const YEARS_BACK = 50;
const YEARS_AHEAD = 30;

// Month/year title that opens two scrollable columns to jump the calendar.
// Picking a year keeps the panel open; picking a month applies and closes it.
export function MonthYearPicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const monthsRef = useRef<HTMLDivElement>(null);
  const yearsRef = useRef<HTMLDivElement>(null);

  const month = value.getMonth();
  const year = value.getFullYear();
  const thisYear = new Date().getFullYear();
  const years = Array.from(
    { length: YEARS_BACK + YEARS_AHEAD + 1 },
    (_, i) => thisYear - YEARS_BACK + i,
  );

  // Centre the current month and year in their columns when the panel opens.
  useLayoutEffect(() => {
    if (!open) return;
    for (const col of [monthsRef.current, yearsRef.current]) {
      const selected = col?.querySelector<HTMLElement>("[aria-selected='true']");
      if (col && selected) {
        col.scrollTop = selected.offsetTop - col.clientHeight / 2 + selected.clientHeight / 2;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="my-picker" ref={rootRef}>
      <button
        type="button"
        className={`my-picker-trigger${open ? " open" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {MONTHS[month]} {year}
        <SettingsIcon name="chevronDown" size={13} />
      </button>

      {open && (
        <div className="my-picker-pop" role="dialog" aria-label="Choose month and year">
          <div className="my-picker-cols">
            <div className="my-picker-col" ref={monthsRef} role="listbox" aria-label="Month">
              {MONTHS.map((name, m) => (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={m === month}
                  className={`my-picker-opt${m === month ? " selected" : ""}`}
                  onClick={() => {
                    onChange(new Date(year, m, 1));
                    setOpen(false);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="my-picker-col" ref={yearsRef} role="listbox" aria-label="Year">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  role="option"
                  aria-selected={y === year}
                  className={`my-picker-opt${y === year ? " selected" : ""}${y === thisYear ? " current" : ""}`}
                  onClick={() => onChange(new Date(y, month, 1))}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="my-picker-today"
            onClick={() => {
              const now = new Date();
              onChange(new Date(now.getFullYear(), now.getMonth(), 1));
              setOpen(false);
            }}
          >
            Jump to this month
          </button>
        </div>
      )}
    </div>
  );
}
