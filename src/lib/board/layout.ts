// Order of a page's draggable cards across its two columns.

export type BoardColumn = "left" | "right";
export type BoardLayout<Id extends string> = Record<BoardColumn, Id[]>;

export function copyLayout<Id extends string>(layout: BoardLayout<Id>): BoardLayout<Id> {
  return { left: [...layout.left], right: [...layout.right] };
}

/**
 * Accepts whatever was saved and returns a valid layout: unknown or repeated
 * cards are dropped and any missing card (e.g. one added in a later version)
 * is appended to the shorter column.
 */
export function normalizeBoardLayout<Id extends string>(
  raw: unknown,
  cards: readonly Id[],
  fallback: BoardLayout<Id>,
): BoardLayout<Id> {
  const saved = (raw ?? {}) as Partial<Record<BoardColumn, unknown>>;
  const seen = new Set<Id>();
  const clean = (list: unknown): Id[] =>
    (Array.isArray(list) ? list : []).filter((id): id is Id => {
      if (!cards.includes(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

  const layout: BoardLayout<Id> = { left: clean(saved.left), right: clean(saved.right) };
  if (!seen.size) return copyLayout(fallback);
  for (const id of cards) {
    if (!seen.has(id)) (layout.left.length <= layout.right.length ? layout.left : layout.right).push(id);
  }
  return layout;
}
