"use client";

import { useEffect, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { signedImageUrl } from "@/lib/journal/images";
import { LayoutToolbar, useWidthResize, type Wrap } from "./LayoutControls";

/** Resolves a private storage path to a signed link; plain `src` passes through. */
function useImageUrl(path: string | null, src: string | null) {
  const [signed, setSigned] = useState<{ path: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    signedImageUrl(path).then((url) => {
      if (!cancelled) setSigned({ path, url });
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return { url: src, failed: false };
  if (signed?.path !== path) return { url: null, failed: false };
  return { url: signed.url, failed: signed.url === null };
}

function ImageView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const { path, src, alt, width, wrap } = node.attrs as {
    path: string | null;
    src: string | null;
    alt: string | null;
    width: number | null;
    wrap: Wrap;
  };
  const { url, failed } = useImageUrl(path, src);
  const active = selected;
  const { liveWidth, startResize } = useWidthResize({
    minWidth: 60,
    onCommit: (w) => updateAttributes({ width: w }),
  });
  const shownWidth = liveWidth ?? width;

  return (
    <NodeViewWrapper
      className={`jimg jwrap-${wrap}${active ? " is-active" : ""}`}
      style={{ width: shownWidth ? `${shownWidth}px` : undefined }}
      data-drag-handle=""
    >
      {active && (
        <LayoutToolbar
          wrap={wrap}
          onWrap={(w) => updateAttributes({ wrap: w })}
          onDelete={deleteNode}
          deleteLabel="Delete image"
        />
      )}
      {url ? (
        <img src={url} alt={alt ?? ""} draggable={false} />
      ) : (
        <div className="jimg-placeholder">{failed ? "Image unavailable" : "Loading image…"}</div>
      )}
      {active && (
        <>
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
        </>
      )}
    </NodeViewWrapper>
  );
}

// Block image with Word-style wrapping and a draggable width. Uploaded images
// store only their private storage path (data-path), never a public link.
export const JournalImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      path: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-path"),
        renderHTML: (attrs) => (attrs.path ? { "data-path": attrs.path } : {}),
      },
      // Only for images pasted from elsewhere; uploads use `path`.
      src: {
        default: null,
        parseHTML: (el) => (el.getAttribute("data-path") ? null : el.getAttribute("src")),
        renderHTML: (attrs) => (attrs.src ? { src: attrs.src } : {}),
      },
      alt: { default: null },
      width: {
        default: null,
        parseHTML: (el) => Number(el.getAttribute("width")) || null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      wrap: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-wrap") ?? "center",
        renderHTML: (attrs) => ({ "data-wrap": attrs.wrap }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-path]" }, { tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
