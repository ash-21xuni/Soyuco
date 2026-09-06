"use client";

import { useMemo, useState } from "react";
import { useJournal } from "@/lib/journal/journal-context";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function EntryList() {
  const { entries, activeCollectionId, currentEntryId, selectEntry } = useJournal();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = entries.filter(
      (e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q),
    );
    if (activeCollectionId !== null) {
      list = list.filter((e) => e.collections.includes(activeCollectionId));
    }
    return list.slice().sort((a, b) => b.date - a.date);
  }, [entries, search, activeCollectionId]);

  return (
    <div className="entry-list">
      <div className="entry-list-header">
        <input
          className="entry-search"
          type="text"
          placeholder="Search entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 16px" }}>
            <div className="empty-sub">
              No entries yet.
              <br />
              Create your first one!
            </div>
          </div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className={`entry-card${e.id === currentEntryId ? " active" : ""}`}
              onClick={() => selectEntry(e.id)}
            >
              <div className="entry-card-date">{formatDate(e.date)}</div>
              <div className="entry-card-title">{e.title || "Untitled"}</div>
              <div className="entry-card-preview">
                {e.body ? e.body.substring(0, 120) : <em>No content</em>}
              </div>
              <div className="entry-card-tags">
                {e.tags.map((t) => (
                  <span key={t} className="tag accent">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
