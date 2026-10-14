"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEditorState, type Editor } from "@tiptap/react";
import { SettingsIcon, type SettingsIconName } from "@/components/settings/SettingsIcon";
import { DEFAULT_TEXT_BOX_WIDTH } from "@/components/journal/extensions/TextBox";
import { ToolbarScroller } from "@/components/journal/ToolbarScroller";

// Text colours are mid-tone so they read on both light and dark themes.
const TEXT_COLORS = [
  { label: "Red", value: "#e05252" },
  { label: "Orange", value: "#e8863a" },
  { label: "Gold", value: "#c9a227" },
  { label: "Green", value: "#3faa62" },
  { label: "Blue", value: "#3a86e8" },
  { label: "Purple", value: "#9b59d0" },
  { label: "Pink", value: "#e05aa0" },
  { label: "Grey", value: "#8a8a8a" },
];

// Highlights are translucent so the theme's text colour stays legible on top.
const HIGHLIGHTS = [
  { label: "Yellow", value: "rgba(250, 214, 60, 0.45)" },
  { label: "Orange", value: "rgba(245, 150, 60, 0.4)" },
  { label: "Green", value: "rgba(90, 200, 120, 0.38)" },
  { label: "Blue", value: "rgba(80, 160, 240, 0.38)" },
  { label: "Purple", value: "rgba(170, 120, 230, 0.38)" },
  { label: "Pink", value: "rgba(240, 110, 170, 0.38)" },
];

function ToolButton({
  icon,
  label,
  active,
  onClick,
  children,
}: {
  icon?: SettingsIconName;
  label: string;
  active?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tool-btn${active ? " active" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={active}
      // Keep the text selection: clicking a button must not blur the editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icon ? <SettingsIcon name={icon} size={15} /> : children}
    </button>
  );
}

// Matches .swatch-menu-pop: 164px content + padding + border.
const POPOVER_WIDTH = 186;

function SwatchMenu({
  icon,
  label,
  current,
  swatches,
  onPick,
  onClear,
  clearLabel,
}: {
  icon: SettingsIconName;
  label: string;
  current: string | null;
  swatches: { label: string; value: string }[];
  onPick: (value: string) => void;
  onClear: () => void;
  clearLabel: string;
}) {
  // The popover is portalled with fixed coordinates so the toolbar's
  // horizontal scroll track can't clip it.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const open = pos !== null;
  const ref = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (open || !ref.current) {
      setPos(null);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8)),
    });
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !popRef.current?.contains(t)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    // Fixed coordinates go stale once anything scrolls or resizes.
    function onScroll(e: Event) {
      if (!popRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="swatch-menu" ref={ref}>
      <button
        type="button"
        className={`tool-btn swatch-menu-trigger${open ? " active" : ""}`}
        title={label}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        <SettingsIcon name={icon} size={15} />
        <span className="swatch-menu-bar" style={{ background: current ?? "currentColor" }} />
      </button>
      {pos &&
        createPortal(
          <div
            ref={popRef}
            className="swatch-menu-pop"
            role="menu"
            aria-label={label}
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="swatch-menu-grid">
              {swatches.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="menuitem"
                  className={`swatch-menu-item${current === s.value ? " active" : ""}`}
                  style={{ background: s.value }}
                  title={s.label}
                  aria-label={s.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(s.value);
                    setPos(null);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              role="menuitem"
              className="swatch-menu-clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onClear();
                setPos(null);
              }}
            >
              {clearLabel}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function FormatToolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      taskList: e.isActive("taskList"),
      table: e.isActive("table"),
      color: (e.getAttributes("textStyle").color as string | undefined) ?? null,
      highlight: (e.getAttributes("highlight").color as string | undefined) ?? null,
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <>
      <ToolButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </ToolButton>
      <ToolButton label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <i>I</i>
      </ToolButton>
      <ToolButton
        label="Underline"
        active={state.underline}
        onClick={() => chain().toggleUnderline().run()}
      >
        <u>U</u>
      </ToolButton>

      <div className="editor-toolbar-sep" />

      <SwatchMenu
        icon="textColor"
        label="Text colour"
        current={state.color}
        swatches={TEXT_COLORS}
        onPick={(c) => chain().setColor(c).run()}
        onClear={() => chain().unsetColor().run()}
        clearLabel="Default colour"
      />
      <SwatchMenu
        icon="highlighter"
        label="Highlight"
        current={state.highlight}
        swatches={HIGHLIGHTS}
        onPick={(c) => chain().setHighlight({ color: c }).run()}
        onClear={() => chain().unsetHighlight().run()}
        clearLabel="No highlight"
      />

      <div className="editor-toolbar-sep" />

      <ToolButton
        icon="listBullets"
        label="Bulleted list"
        active={state.bulletList}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolButton
        icon="listNumbers"
        label="Numbered list"
        active={state.orderedList}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolButton
        icon="listChecks"
        label="Checklist"
        active={state.taskList}
        onClick={() => chain().toggleTaskList().run()}
      />
      <ToolButton
        icon="table"
        label="Insert table"
        active={state.table}
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <ToolButton icon="image" label="Insert image" onClick={onPickImage} />
      <ToolButton
        icon="textBox"
        label="Insert text box"
        onClick={() =>
          chain()
            .insertContent({
              type: "textBox",
              attrs: { width: DEFAULT_TEXT_BOX_WIDTH, wrap: "right" },
              content: [{ type: "paragraph" }],
            })
            .run()
        }
      />
      <ToolButton
        icon="clearFormat"
        label="Clear formatting"
        onClick={() => chain().unsetAllMarks().clearNodes().run()}
      />
    </>
  );
}

// Shown under the toolbar only while the cursor is inside a table.
export function TableToolbar({ editor }: { editor: Editor }) {
  const inTable = useEditorState({ editor, selector: ({ editor: e }) => e.isActive("table") });
  if (!inTable) return null;

  const chain = () => editor.chain().focus();
  const actions: { label: string; run: () => void; danger?: boolean }[] = [
    { label: "+ Row", run: () => chain().addRowAfter().run() },
    { label: "+ Column", run: () => chain().addColumnAfter().run() },
    { label: "− Row", run: () => chain().deleteRow().run() },
    { label: "− Column", run: () => chain().deleteColumn().run() },
    { label: "Header row", run: () => chain().toggleHeaderRow().run() },
    { label: "Delete table", run: () => chain().deleteTable().run(), danger: true },
  ];

  return (
    <ToolbarScroller className="table-toolbar" label="Table">
      <span className="table-toolbar-label">Table</span>
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className={`tool-btn${a.danger ? " danger" : ""}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={a.run}
        >
          {a.label}
        </button>
      ))}
    </ToolbarScroller>
  );
}
