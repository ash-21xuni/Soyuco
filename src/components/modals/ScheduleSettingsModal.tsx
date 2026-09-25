"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner/planner-context";
import { DEFAULT_SCHEDULE_HOURS, hourLabel } from "@/lib/planner/time";
import { useToast } from "@/lib/toast/toast-context";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function ScheduleSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scheduleHours, setScheduleHours } = usePlanner();
  const { showToast } = useToast();
  const [start, setStart] = useState(scheduleHours.start);
  const [end, setEnd] = useState(scheduleHours.end);
  const [saving, setSaving] = useState(false);

  // Start from the saved window each time the popup opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStart(scheduleHours.start);
      setEnd(scheduleHours.end);
    }
  }

  useEscapeToClose(open, onClose);
  if (!open) return null;

  const valid = end >= start;
  const slots = end - start + 1;
  const unchanged = start === scheduleHours.start && end === scheduleHours.end;

  async function save() {
    if (!valid) return;
    setSaving(true);
    const { error } = await setScheduleHours(start, end);
    setSaving(false);
    if (error) {
      showToast(`Couldn't save: ${error}`, "error");
      return;
    }
    showToast(`Schedule now runs ${hourLabel(start)} – ${hourLabel(end)}.`, "success");
    onClose();
  }

  return (
    <div className="planner-settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="planner-settings" role="dialog" aria-modal="true" aria-labelledby="schedule-settings-title">
        <div className="planner-settings-head">
          <div id="schedule-settings-title" className="planner-settings-title">
            Schedule settings
          </div>
          <button type="button" className="panel-toggle" onClick={onClose} aria-label="Close">
            <SettingsIcon name="close" />
          </button>
        </div>

        <div className="planner-settings-body">
          <div className="planner-settings-option" style={{ cursor: "default", flexDirection: "column", gap: 0 }}>
            <span className="planner-settings-option-title">Schedule hours</span>
            <span className="planner-settings-option-desc">
              Choose the first and last hour your day planner shows.
            </span>
            <div className="schedule-hours-row">
              <label className="schedule-hours-field">
                <span>From</span>
                <select value={start} onChange={(e) => setStart(Number(e.target.value))}>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="schedule-hours-field">
                <span>To</span>
                <select value={end} onChange={(e) => setEnd(Number(e.target.value))}>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <span className={`schedule-hours-note${valid ? "" : " is-error"}`}>
              {valid
                ? `${slots} hourly slot${slots === 1 ? "" : "s"}. Events outside this range are kept, just hidden.`
                : "The end time must be the same as or after the start time."}
            </span>
          </div>
        </div>

        <div className="planner-settings-foot" style={{ justifyContent: "space-between" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setStart(DEFAULT_SCHEDULE_HOURS.start);
              setEnd(DEFAULT_SCHEDULE_HOURS.end);
            }}
          >
            Reset to 6am – 9pm
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid || saving || unchanged}
            onClick={save}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
