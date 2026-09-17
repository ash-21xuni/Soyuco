"use client";

import { useEffect } from "react";

export const REMINDER_ENABLED_KEY = "soyuco_notify_enabled";
export const REMINDER_TIME_KEY = "soyuco_notify_time";
const REMINDER_LAST_FIRED_KEY = "soyuco_notify_last_fired";

export const DEFAULT_REMINDER_TIME = "20:00";

// Fires a browser notification once per day at the saved time, as long as
// the app is open in a tab. There is no push infrastructure (service
// worker + server-sent push), so this cannot wake a closed tab.
export function useJournalReminder() {
  useEffect(() => {
    function check() {
      if (localStorage.getItem(REMINDER_ENABLED_KEY) !== "true") return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

      const todayKey = new Date().toDateString();
      if (localStorage.getItem(REMINDER_LAST_FIRED_KEY) === todayKey) return;

      const time = localStorage.getItem(REMINDER_TIME_KEY) || DEFAULT_REMINDER_TIME;
      const [hours, minutes] = time.split(":").map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      if (new Date() >= target) {
        new Notification("Soyuco", { body: "Time for your daily journal entry ✦" });
        localStorage.setItem(REMINDER_LAST_FIRED_KEY, todayKey);
      }
    }

    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);
}
