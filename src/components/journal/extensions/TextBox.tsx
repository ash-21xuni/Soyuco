"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { LayoutToolbar, useNodeActive, useWidthResize, type Wrap } from "./LayoutControls";

export const DEFAULT_TEXT_BOX_WIDTH = 280;

function TextBoxView({ node, updateAttributes, deleteNode, editor, getPos }: ReactNodeViewProps) {
  const { width, wrap } = node.attrs as { width: number; wrap: Wrap };
  const active = useNodeActive(editor, node, getPos);
  const { liveWidth, startResize } = useWidthResize({
    minWidth: 120,
    onCommit: (w) => updateAttributes({ width: w }),
  });

  return (
    <NodeViewWrapper
      className={`jbox jwrap-${wrap}${active ? " is-active" : ""}`}
      style={{ width: `${liveWidth ?? width}px` }}
    >
      <div className="jbox-bar" contentEditable={false}>
        <span className="jbox-grip" data-drag-handle="" title="Drag to move" aria-label="Drag to move">
          <SettingsIcon name="grip" size={13} />
        </span>
        <LayoutToolbar
          wrap={wrap}
          onWrap={(w) => updateAttributes({ wrap: w })}
          onDelete={deleteNode}
          deleteLabel="Delete text box"
        />
      </div>
      <NodeViewContent className="jbox-content" />
      <span
        className="jresize-handle left"
        contentEditable={false}
        onPointerDown={(e) => startResize(e, "left")}
        aria-hidden="true"
      />
      <span
        className="jresize-handle right"
        contentEditable={false}
        onPointerDown={(e) => startResize(e, "right")}
        aria-hidden="true"
      />
    </NodeViewWrapper>
  );
}

// A bordered box of rich text that text can wrap around, like Word's text box.
export const TextBox = Node.create({
  name: "textBox",
  group: "block",
  content: "(paragraph | bulletList | orderedList | taskList | heading)+",
  draggable: true,
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      width: {
        default: DEFAULT_TEXT_BOX_WIDTH,
        parseHTML: (el) => Number(el.getAttribute("data-width")) || DEFAULT_TEXT_BOX_WIDTH,
        renderHTML: (attrs) => ({ "data-width": attrs.width }),
      },
      wrap: {
        default: "right",
        parseHTML: (el) => el.getAttribute("data-wrap") ?? "right",
        renderHTML: (attrs) => ({ "data-wrap": attrs.wrap }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="text-box"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "text-box" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TextBoxView);
  },
});
