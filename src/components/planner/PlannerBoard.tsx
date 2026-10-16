"use client";

import { usePlanner } from "@/lib/planner/planner-context";
import { DEFAULT_PLANNER_LAYOUT, type PlannerCardId } from "@/lib/planner/layout";
import { CardBoard, type BoardCards } from "@/components/board/CardBoard";
import { Calendar } from "@/components/planner/Calendar";
import { Schedule } from "@/components/planner/Schedule";
import { Tasks } from "@/components/planner/Tasks";
import { Habits } from "@/components/planner/Habits";
import { MoodChart } from "@/components/planner/MoodChart";
import { DailyQuote } from "@/components/planner/DailyQuote";

const CARDS: BoardCards<PlannerCardId> = {
  calendar: { label: "Calendar", render: () => <Calendar /> },
  schedule: { label: "Schedule", render: () => <Schedule /> },
  tasks: { label: "Tasks", render: () => <Tasks /> },
  habits: { label: "Habits", render: () => <Habits /> },
  mood: { label: "Mood", render: () => <MoodChart /> },
  quote: { label: "Daily quote", render: () => <DailyQuote /> },
};

// Day Planner cards in two draggable columns, saved to the account.
export function PlannerBoard() {
  const { plannerLayout, setPlannerLayout } = usePlanner();
  return (
    <CardBoard
      cards={CARDS}
      layout={plannerLayout}
      defaultLayout={DEFAULT_PLANNER_LAYOUT}
      onSave={setPlannerLayout}
    />
  );
}
