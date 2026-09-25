// Order of the Day Planner's cards across its two columns.

export const PLANNER_CARDS = ["calendar", "schedule", "tasks", "habits", "mood", "quote"] as const;
export type PlannerCardId = (typeof PLANNER_CARDS)[number];
export type PlannerColumn = "left" | "right";
export type PlannerLayout = Record<PlannerColumn, PlannerCardId[]>;

export const DEFAULT_PLANNER_LAYOUT: PlannerLayout = {
  left: ["calendar", "schedule"],
  right: ["tasks", "habits", "mood", "quote"],
};

/**
 * Accepts whatever was saved and returns a valid layout: unknown or repeated
 * cards are dropped and any missing card (e.g. one added in a later version)
 * is appended to the shorter column.
 */
export function normalizeLayout(raw: unknown): PlannerLayout {
  const saved = (raw ?? {}) as Partial<Record<PlannerColumn, unknown>>;
  const seen = new Set<PlannerCardId>();
  const clean = (list: unknown): PlannerCardId[] =>
    (Array.isArray(list) ? list : []).filter((id): id is PlannerCardId => {
      if (!PLANNER_CARDS.includes(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

  const layout: PlannerLayout = { left: clean(saved.left), right: clean(saved.right) };
  if (!seen.size) return { left: [...DEFAULT_PLANNER_LAYOUT.left], right: [...DEFAULT_PLANNER_LAYOUT.right] };
  for (const id of PLANNER_CARDS) {
    if (!seen.has(id)) (layout.left.length <= layout.right.length ? layout.left : layout.right).push(id);
  }
  return layout;
}
