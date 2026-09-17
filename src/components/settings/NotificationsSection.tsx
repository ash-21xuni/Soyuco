"use client";

import { useState } from "react";
import {
  DEFAULT_REMINDER_TIME,
  REMINDER_ENABLED_KEY,
  REMINDER_TIME_KEY,
} from "@/lib/notifications/reminder";
import { useToast } from "@/lib/toast/toast-context";

function readStoredEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REMINDER_ENABLED_KEY) === "true";
}

function readStoredTime() {
  if (typeof window === "undefined") return DEFAULT_REMINDER_TIME;
  return localStorage.getItem(REMINDER_TIME_KEY) || DEFAULT_REMINDER_TIME;
}

export function NotificationsSection() {
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(readStoredEnabled);
  const [time, setTime] = useState(readStoredTime);

  async function toggleEnabled() {
    if (!enabled) {
      if (typeof Notification === "undefined") {
        showToast("This browser doesn't support notifications.", "error");
        return;
      }
      const permission =
        Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Notification permission was denied.", "error");
        return;
      }
    }
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(REMINDER_ENABLED_KEY, String(next));
    showToast(next ? "Daily reminder enabled." : "Daily reminder disabled.");
  }

  function updateTime(value: string) {
    setTime(value);
    localStorage.setItem(REMINDER_TIME_KEY, value);
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">🔔 Notifications</div>
      </div>
      <div className="planner-card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--text)" }}>
              Daily journal reminder
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: "var(--text3)", marginTop: 2 }}>
              Browser notification while Soyuco is open in a tab
            </div>
          </div>
          <button
            className={`switch${enabled ? " on" : ""}`}
            role="switch"
            aria-checked={enabled}
            onClick={toggleEnabled}
          >
            <span className="switch-knob" />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: enabled ? 1 : 0.5 }}>
          <label className="login-label" style={{ marginBottom: 0 }}>
            Reminder time
          </label>
          <input
            type="time"
            className="login-input"
            style={{ width: 120 }}
            value={time}
            disabled={!enabled}
            onChange={(e) => updateTime(e.target.value)}
          />
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--text)" }}>
              Weekly email summary
              <span className="premium-badge" style={{ marginLeft: 6 }}>SOON</span>
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: "var(--text3)", marginTop: 2 }}>
              A recap of your entries and mood, delivered every Monday
            </div>
          </div>
          <button
            className="switch"
            role="switch"
            aria-checked={false}
            onClick={() => showToast("Email summaries are coming soon.", "info")}
          >
            <span className="switch-knob" />
          </button>
        </div>
      </div>
    </div>
  );
}
