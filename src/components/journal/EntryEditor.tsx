"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extensions";
import { useJournal, type JournalEntry } from "@/lib/journal/journal-context";
import { bodyToHtml, bodyToText, textToHtml } from "@/lib/journal/body";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY } from "@/lib/theme/theme-copy";
import { useToast } from "@/lib/toast/toast-context";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { PromptModal } from "@/components/modals/PromptModal";
import { FormatToolbar, TableToolbar } from "@/components/journal/FormatToolbar";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
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
  const { entries, currentEntryId } = useJournal();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];

  const entry = entries.find((e) => e.id === currentEntryId) ?? null;

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

  // Keyed so each entry gets a fresh editor loaded with its own content.
  return <EntryEditorView key={entry.id} entry={entry} />;
}

function EntryEditorView({ entry }: { entry: JournalEntry }) {
  const { collections, updateEntry, saveEntryToCloud, deleteEntry, addTag, toggleEntryCollection } =
    useJournal();
  const { showToast } = useToast();

  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(17);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [aiAssisting, setAiAssisting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "What's on your mind today? Let your thoughts flow freely…",
      }),
    ],
    // Legacy plain-text bodies are converted on load; they're only rewritten
    // as HTML once the entry is actually edited.
    content: bodyToHtml(entry.body),
    immediatelyRender: false,
    editorProps: { attributes: { class: "rich-editor-content" } },
    onUpdate: ({ editor: e }) => updateEntry(entry.id, { body: e.getHTML() }),
  });

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const plainBody = bodyToText(entry.body);

  async function handleSave() {
    const { error } = await saveEntryToCloud(entry.id);
    showToast(error ? `Save failed: ${error}` : "Entry saved!", error ? "error" : "success");
  }

  async function handleConfirmDelete() {
    await deleteEntry(entry.id);
    setDeleteOpen(false);
  }

  async function handleAiAssist() {
    if (!editor) return;
    if (!plainBody.trim() && !entry.title.trim()) {
      showToast("Write something first!", "error");
      return;
    }

    setAiAssisting(true);
    const prompt = plainBody.trim()
      ? `You are a thoughtful journal writing assistant. The user has started a journal entry titled "${entry.title || "Untitled"}". Continue it naturally in their voice — about 2-3 more paragraphs. Don't add a title, just continue the text:\n\n${plainBody}`
      : `Start a journal entry titled "${entry.title}". Write 2-3 paragraphs in a personal, reflective, first-person voice.`;

    const { text, error } = await completeText(prompt);
    setAiAssisting(false);

    if (error || !text) {
      showToast(error ?? "AI assist failed.", "error");
      return;
    }

    editor.chain().focus("end").insertContent(textToHtml(text.trim())).run();
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
        {editor && <FormatToolbar editor={editor} />}
        <div className="editor-toolbar-sep" />
        <button className="tool-btn tool-btn-labelled" onClick={handleAiAssist} disabled={aiAssisting}>
          {aiAssisting ? (
            <>
              <span className="spin">⬡</span> Writing…
            </>
          ) : (
            <>
              <SettingsIcon name="sparkles" size={14} /> AI Assist
            </>
          )}
        </button>
        <div className="editor-toolbar-sep" />
        <button className="tool-btn tool-btn-labelled" onClick={handleSave}>
          <SettingsIcon name="save" size={14} /> Save
        </button>
        <button
          className="tool-btn tool-btn-labelled"
          style={{ color: "var(--danger)" }}
          onClick={() => setDeleteOpen(true)}
        >
          <SettingsIcon name="trash" size={14} /> Delete
        </button>
      </div>
      {editor && <TableToolbar editor={editor} />}

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
        <div className="meta-item">
          <SettingsIcon name="calendar" size={13} /> {formatDate(entry.date)}
        </div>
        <div className="meta-item editable" onClick={() => setTagModalOpen(true)}>
          <SettingsIcon name="tag" size={13} /> {entry.tags.length ? entry.tags.join(", ") : "Add tag"}
        </div>
        <div className="meta-item word-count">
          <SettingsIcon name="fileText" size={13} /> {wordCount(plainBody)} words
        </div>
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
        <EditorContent editor={editor} className="rich-editor" style={{ fontFamily, fontSize }} />
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
