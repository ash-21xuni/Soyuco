"use client";

import { useLayoutEffect } from "react";

// Top-level cards that fade up into view, like the landing page sections.
// Nested items (todo rows, plan items) are left alone to avoid double motion.
const TARGETS = [
  ".planner-card",
  ".entry-card",
  ".market-card",
  ".market-tier-card",
  ".ai-insight-card",
  ".ai-msg",
].join(",");

const STAGGER_MS = 60;
const MAX_STAGGER_STEPS = 6;
// Longest reveal transition in themes.css (.reveal) plus a little slack.
const REVEAL_MS = 700;

// Watches `container` (and anything added to it later) and reveals matching
// cards as they scroll into view. Classes are removed once the reveal is done
// so each card's own hover transitions and transforms behave as before.
export function ScrollReveal({ container }: { container: string }) {
  useLayoutEffect(() => {
    const root = document.querySelector(container);
    if (
      !root ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timers = new Set<ReturnType<typeof setTimeout>>();

    const finish = (el: HTMLElement) => {
      el.classList.remove("reveal", "is-revealed");
      el.style.transitionDelay = "";
    };

    const io = new IntersectionObserver(
      (entries) => {
        let step = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          const delay = Math.min(step++, MAX_STAGGER_STEPS) * STAGGER_MS;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-revealed");
          const timer = setTimeout(() => {
            timers.delete(timer);
            finish(el);
          }, delay + REVEAL_MS);
          timers.add(timer);
        }
      },
      { threshold: 0.08 },
    );

    const prepare = (el: HTMLElement) => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      el.classList.add("reveal");
      io.observe(el);
    };

    const scan = (node: Element) => {
      if (node.matches(TARGETS)) prepare(node as HTMLElement);
      node.querySelectorAll<HTMLElement>(TARGETS).forEach(prepare);
    };

    scan(root);
    // New tabs, AI replies and search results mount later; MutationObserver
    // callbacks run before paint, so they never flash in un-hidden.
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) scan(n);
        });
      }
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [container]);

  return null;
}
