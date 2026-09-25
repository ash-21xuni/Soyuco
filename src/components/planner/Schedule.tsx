"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner/planner-context";
import { EventModal } from "@/components/modals/EventModal";
import { hourLabel } from "@/lib/planner/time";

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export function Schedule() {
  const { plannerDay, events, saveEvent } = usePlanner();
  const dayKey = plannerDay.toDateString();
  const [modalHour, setModalHour] = useState<number | null>(null);
  const [modalIsEdit, setModalIsEdit] = useState(false);

  const open = modalHour !== null;
  const existing = modalHour !== null ? events[dayKey]?.[modalHour] : undefined;

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">⏱ Schedule</div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "0.68rem", padding: "3px 8px" }}
          onClick={() => {
            setModalHour(9);
            setModalIsEdit(false);
          }}
        >
          + Event
        </button>
      </div>
      <div className="planner-card-body">
        {HOURS.map((h) => {
          const ev = events[dayKey]?.[h];
          return (
            <div key={h} className="time-block">
              <div className="time-label">{hourLabel(h)}</div>
              {ev ? (
                <div
                  className={`time-event${ev.ai ? " ai-generated" : ""}`}
                  onClick={() => {
                    setModalHour(h);
                    setModalIsEdit(true);
                  }}
                >
                  {ev.text}
                </div>
              ) : (
                <div
                  className="time-empty"
                  onClick={() => {
                    setModalHour(h);
                    setModalIsEdit(false);
                  }}
                >
                  –
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EventModal
        open={open}
        hour={modalHour ?? 0}
        isEdit={modalIsEdit}
        initialText={modalIsEdit ? existing?.text ?? "" : ""}
        onCancel={() => setModalHour(null)}
        onSave={(text) => {
          if (modalHour !== null) saveEvent(dayKey, modalHour, text);
          setModalHour(null);
        }}
        onDelete={() => {
          if (modalHour !== null) saveEvent(dayKey, modalHour, "");
          setModalHour(null);
        }}
      />
    </div>
  );
}
