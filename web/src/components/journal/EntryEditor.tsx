"use client";

import { useEffect, useRef, useState } from "react";
import { useJournal } from "@/lib/journal/journal-context";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY } from "@/lib/theme/theme-copy";
import { useToast } from "@/lib/toast/toast-context";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { PromptModal } from "@/components/modals/PromptModal";
import { completeText } from "@/lib/ai/client";

const FONT_OPTIONS = [
  { value: "'EB Garamond',serif", label: "Garamond" },
  { value: "'Playfair Display',serif", label: "Playfair" },
  { value: "'Caveat',cursive", label: "Handwritten" },
  { value: "'DM Mono',monospace", label: "Mono" },
  { value: "'Space Grotesk',sans-serif", label: "Grotesk" },
  { value: "'Syne',sans-serif", label: "Syne" },
  { value: "'Bangers',cursive", label: "Bangers" },
  { value: "'Press Start 2P',monospace", label: "Pixel" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function EntryEditor() {
  const {
    entries,
    collections,
    currentEntryId,
    updateEntry,
    saveEntryToCloud,
    deleteEntry,
    addTag,
    toggleEntryCollection,
  } = useJournal();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];

  const entry = entries.find((e) => e.id === currentEntryId) ?? null;

  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(17);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [aiAssisting, setAiAssisting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const prevEntryId = useRef<number | null>(null);
  useEffect(() => {
    if (entry && entry.id !== prevEntryId.current) {
      titleRef.current?.focus();
    }
    prevEntryId.current = entry?.id ?? null;
  }, [entry]);

  if (!entry) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-icon">{copy.empty}</div>
        <div className="empty-title">{copy.emptyTitle}</div>
        <div className="empty-sub">
          Select an entry to read,
          <br />
          or create a new one to start writing.
        </div>
      </div>
    );
  }

  async function handleSave() {
    if (!entry) return;
    const { error } = await saveEntryToCloud(entry.id);
    showToast(error ? `Save failed: ${error}` : "Entry saved!", error ? "error" : "success");
  }

  async function handleConfirmDelete() {
    if (!entry) return;
    await deleteEntry(entry.id);
    setDeleteOpen(false);
  }

  async function handleAiAssist() {
    if (!entry) return;
    if (!entry.body.trim() && !entry.title.trim()) {
      showToast("Write something first!", "error");
      return;
    }

    setAiAssisting(true);
    const prompt = entry.body.trim()
      ? `You are a thoughtful journal writing assistant. The user has started a journal entry titled "${entry.title || "Untitled"}". Continue it naturally in their voice — about 2-3 more paragraphs. Don't add a title, just continue the text:\n\n${entry.body}`
      : `Start a journal entry titled "${entry.title}". Write 2-3 paragraphs in a personal, reflective, first-person voice.`;

    const { text, error } = await completeText(prompt);
    setAiAssisting(false);

    if (error || !text) {
      showToast(error ?? "AI assist failed.", "error");
      return;
    }

    const body = entry.body + (entry.body && !entry.body.endsWith("\n") ? "\n\n" : "") + text;
    updateEntry(entry.id, { body });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="editor-toolbar">
        <select
          className="font-family-picker"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          className="font-size-picker"
          type="number"
          min={10}
          max={36}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value) || 17)}
        />
        <div className="editor-toolbar-sep" />
        <button className="tool-btn" title="Bold">
          <b>B</b>
        </button>
        <button className="tool-btn" title="Italic">
          <i>I</i>
        </button>
        <button className="tool-btn" title="Underline">
          <u>U</u>
        </button>
        <div className="editor-toolbar-sep" />
        <button className="tool-btn" onClick={handleAiAssist} disabled={aiAssisting}>
          {aiAssisting ? (
            <>
              <span className="spin">⬡</span> Writing…
            </>
          ) : (
            "⬡ AI Assist"
          )}
        </button>
        <div className="editor-toolbar-sep" />
        <button className="tool-btn" onClick={handleSave}>
          💾 Save
        </button>
        <button className="tool-btn" style={{ color: "var(--danger)" }} onClick={() => setDeleteOpen(true)}>
          🗑 Delete
        </button>
      </div>

      <input
        ref={titleRef}
        className="entry-title-input"
        type="text"
        placeholder="Untitled entry…"
        style={{ fontFamily }}
        value={entry.title}
        onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
      />

      <div className="entry-meta">
        <div className="meta-item">📅 {formatDate(entry.date)}</div>
        <div className="meta-item editable" onClick={() => setTagModalOpen(true)}>
          🏷 {entry.tags.length ? entry.tags.join(", ") : "Add tag"}
        </div>
        <div className="meta-item word-count">📝 {wordCount(entry.body)} words</div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 32px",
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text3)" }}>
          ◇ Collections:
        </span>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {collections.length === 0 ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text3)" }}>
              No collections yet
            </span>
          ) : (
            collections.map((c) => (
              <label
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.78rem",
                  color: "var(--text2)",
                  cursor: "pointer",
                  padding: "3px 0",
                }}
              >
                <input
                  type="checkbox"
                  checked={entry.collections.includes(c.id)}
                  onChange={(e) => toggleEntryCollection(entry.id, c.id, e.target.checked)}
                  style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                />
                {c.name}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="editor-body">
        <textarea
          className="editor-textarea"
          placeholder="What's on your mind today? Let your thoughts flow freely…"
          style={{ fontFamily, fontSize }}
          value={entry.body}
          onChange={(e) => updateEntry(entry.id, { body: e.target.value })}
        />
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Entry?"
        message="This entry will be permanently deleted and cannot be recovered."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      <PromptModal
        open={tagModalOpen}
        title="Add Tag"
        label="Tag"
        placeholder="e.g. gratitude, ideas, work…"
        confirmLabel="Add Tag"
        onCancel={() => setTagModalOpen(false)}
        onConfirm={(value) => {
          addTag(entry.id, value);
          setTagModalOpen(false);
        }}
      />
    </div>
  );
}
