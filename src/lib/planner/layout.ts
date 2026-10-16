// Order of the Day Planner's cards across its two columns.

import { normalizeBoardLayout, type BoardColumn, type BoardLayout } from "@/lib/board/layout";

export const PLANNER_CARDS = ["calendar", "schedule", "tasks", "habits", "mood", "quote"] as const;
export type PlannerCardId = (typeof PLANNER_CARDS)[number];
export type PlannerColumn = BoardColumn;
export type PlannerLayout = BoardLayout<PlannerCardId>;

export const DEFAULT_PLANNER_LAYOUT: PlannerLayout = {
  left: ["calendar", "schedule"],
  right: ["tasks", "habits", "mood", "quote"],
};

export function normalizeLayout(raw: unknown): PlannerLayout {
  return normalizeBoardLayout(raw, PLANNER_CARDS, DEFAULT_PLANNER_LAYOUT);
}
