"use client";

import { useEffect, useRef } from "react";
import type { ThemeId } from "@/lib/theme/theme-context";

// Premium themes' mouse effects: particles shed as the mouse moves and a burst
// on click, drawn on one canvas above the app that never takes clicks. Each
// theme supplies an effect below. Only runs for a mouse, and not at all when
// the system asks for reduced motion.

type Shape = "square" | "circle" | "bubble" | "star" | "heart" | "glyph" | "ring" | "confetti";

type Particle = {
  shape: Shape;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  /** Blur radius of the glow, 0 for none. */
  glow: number;
  gravity: number;
  /** Side-to-side sway, for bubbles and falling hearts. */
  sway: number;
  phase: number;
  /** Rotation and spin, for confetti. */
  rot: number;
  spin: number;
  /** Height as a fraction of width, for confetti (1 = square). */
  aspect: number;
  char?: string;
};

type Spawn = Partial<Particle> & Pick<Particle, "shape" | "x" | "y" | "color">;
type Add = (p: Spawn) => void;

type Effect = {
  /** "lighter" makes overlapping colours glow on dark themes. */
  blend: GlobalCompositeOperation;
  /** A fading line behind the cursor. */
  streak?: { colors: string[]; width: number; glow: number };
  move: (x: number, y: number, speed: number, dx: number, dy: number, add: Add) => void;
  click: (x: number, y: number, add: Add) => void;
};

const MAX_PARTICLES = 200;
const STREAK_LIFE = 18;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function burst(x: number, y: number, n: number, speed: [number, number], make: (vx: number, vy: number) => Spawn, add: Add) {
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
    const s = rand(...speed);
    add(make(Math.cos(angle) * s, Math.sin(angle) * s));
  }
}

// Neon District: a pink/cyan light streak throwing sparks and code glyphs.
const NEON: Effect = {
  blend: "lighter",
  streak: { colors: ["#ff2a6d", "#05d9e8"], width: 3, glow: 12 },
  move(x, y, speed, dx, dy, add) {
    for (let i = 0; i < Math.min(4, 1 + Math.floor(speed / 14)); i++) {
      const max = rand(24, 44);
      add({
        shape: "square", x: x + rand(-3, 3), y: y + rand(-3, 3),
        vx: -dx * 0.06 + rand(-0.8, 0.8), vy: -dy * 0.06 + rand(-0.8, 0.8),
        life: max, max, size: rand(1.2, 2.8), glow: 8, gravity: 0.04,
        color: Math.random() < 0.12 ? "#f9f002" : pick(["#ff2a6d", "#05d9e8"]),
      });
    }
    if (Math.random() < 0.08) {
      add({ shape: "glyph", x: x + rand(-10, 10), y, vy: rand(0.6, 1.4), life: 50, max: 50, size: 12, glow: 6, color: "#05d9e8", char: pick([..."01アイウエオカキクケコサシスセソﾀﾁﾂﾃﾄ<>/#$%"]) });
    }
  },
  click(x, y, add) {
    add({ shape: "ring", x, y, life: 26, max: 26, size: 38, glow: 14, color: "#05d9e8" });
    add({ shape: "ring", x, y, life: 18, max: 18, size: 26, glow: 14, color: "#ff2a6d" });
    burst(x, y, 14, [1.5, 3.5], (vx, vy) => ({ shape: "square", x, y, vx, vy, life: 30, max: 30, size: rand(1.5, 3), glow: 8, color: pick(["#ff2a6d", "#05d9e8", "#f9f002"]) }), add);
  },
};

// Sunny Reef: bubbles that wobble up and away; a click makes a ripple.
const BUBBLES: Effect = {
  blend: "source-over",
  move(x, y, speed, _dx, _dy, add) {
    if (Math.random() > 0.35 + speed / 60) return;
    const max = rand(55, 90);
    add({
      shape: "bubble", x: x + rand(-6, 6), y: y + rand(-4, 4), vx: 0, vy: rand(-1.4, -0.6),
      life: max, max, size: rand(2.5, 7), sway: rand(0.4, 1.1), phase: rand(0, 6),
      color: pick(["#0055bb", "#0077dd", "#2b9be0"]),
    });
  },
  click(x, y, add) {
    add({ shape: "ring", x, y, life: 30, max: 30, size: 30, color: "#0077dd" });
    add({ shape: "ring", x, y, life: 22, max: 22, size: 18, color: "#f4c430" });
    for (let i = 0; i < 9; i++) {
      const max = rand(50, 80);
      add({ shape: "bubble", x: x + rand(-10, 10), y: y + rand(-6, 6), vx: rand(-0.6, 0.6), vy: rand(-2.4, -1), life: max, max, size: rand(3, 9), sway: rand(0.5, 1.2), phase: rand(0, 6), color: "#0055bb" });
    }
  },
};

// Queen Bee: twinkling sparkles and the odd heart drifting down.
const SPARKLES: Effect = {
  blend: "source-over",
  move(x, y, speed, dx, dy, add) {
    if (Math.random() < 0.55 + speed / 40) {
      const max = rand(30, 55);
      add({
        shape: "star", x: x + rand(-8, 8), y: y + rand(-8, 8), vx: -dx * 0.03 + rand(-0.3, 0.3), vy: -dy * 0.03 + rand(-0.2, 0.5),
        life: max, max, size: rand(3, 7), glow: 6, phase: rand(0, 6),
        color: pick(["#ff1493", "#ff69b4", "#ffd166", "#ffffff"]),
      });
    }
    if (Math.random() < 0.06) {
      add({ shape: "heart", x, y, vy: rand(0.4, 0.9), life: 70, max: 70, size: rand(5, 8), sway: rand(0.6, 1.2), phase: rand(0, 6), color: pick(["#ff1493", "#ff69b4"]) });
    }
  },
  click(x, y, add) {
    add({ shape: "ring", x, y, life: 24, max: 24, size: 28, glow: 8, color: "#ff69b4" });
    burst(x, y, 8, [1.5, 2.8], (vx, vy) => ({ shape: "heart", x, y, vx, vy, life: 40, max: 40, size: rand(5, 8), gravity: 0.03, color: pick(["#ff1493", "#ff69b4"]) }), add);
    burst(x, y, 10, [0.8, 2.2], (vx, vy) => ({ shape: "star", x, y, vx, vy, life: 34, max: 34, size: rand(3, 6), glow: 6, phase: rand(0, 6), color: pick(["#ffd166", "#ffffff"]) }), add);
  },
};

// Pixel Quarry: blocky debris that tumbles down; a click breaks a block and
// drops a couple of XP orbs.
const PIXELS: Effect = {
  blend: "source-over",
  move(x, y, speed, _dx, _dy, add) {
    for (let i = 0; i < Math.min(3, Math.floor(speed / 10)); i++) {
      const max = rand(28, 42);
      add({
        shape: "square", x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-1.2, 1.2), vy: rand(-2.2, -0.6),
        life: max, max, size: pick([3, 4, 5]), gravity: 0.22,
        color: pick(["#55cc22", "#3e9e18", "#7a5230", "#5a3a1f", "#8b8b8b"]),
      });
    }
  },
  click(x, y, add) {
    burst(x, y, 16, [1.5, 3.5], (vx, vy) => ({ shape: "square", x, y, vx, vy: vy - 1.5, life: 40, max: 40, size: pick([4, 5, 6]), gravity: 0.25, color: pick(["#7a5230", "#5a3a1f", "#8b8b8b", "#6b6b6b", "#55cc22"]) }), add);
    for (let i = 0; i < 3; i++) {
      add({ shape: "circle", x: x + rand(-8, 8), y, vx: rand(-0.8, 0.8), vy: rand(-2.6, -1.6), life: 50, max: 50, size: rand(3, 4.5), glow: 10, gravity: 0.06, color: "#aaff44" });
    }
  },
};

const PARTY_COLORS = ["#ff3cac", "#2bd2ff", "#ffe53b", "#3cff9e", "#a855f7", "#ff8a3d"];

// Afterglow: a rainbow light streak scattering confetti; a click sets off a firework.
const PARTY: Effect = {
  blend: "lighter",
  streak: { colors: PARTY_COLORS, width: 3, glow: 14 },
  move(x, y, speed, dx, dy, add) {
    for (let i = 0; i < Math.min(3, 1 + Math.floor(speed / 16)); i++) {
      const max = rand(40, 65);
      add({
        shape: "confetti", x: x + rand(-4, 4), y: y + rand(-4, 4),
        vx: -dx * 0.04 + rand(-1, 1), vy: rand(-1.6, -0.2), gravity: 0.07,
        life: max, max, size: rand(3, 6), glow: 6, rot: rand(0, Math.PI), spin: rand(-0.25, 0.25),
        color: pick(PARTY_COLORS),
      });
    }
    if (Math.random() < 0.25) {
      add({ shape: "circle", x, y, vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), life: 30, max: 30, size: rand(1.5, 3), glow: 12, color: pick(PARTY_COLORS) });
    }
  },
  click(x, y, add) {
    add({ shape: "ring", x, y, life: 24, max: 24, size: 34, glow: 14, color: pick(PARTY_COLORS) });
    burst(x, y, 22, [2, 4.5], (vx, vy) => ({ shape: "circle", x, y, vx, vy, gravity: 0.06, life: 44, max: 44, size: rand(1.5, 2.6), glow: 12, color: pick(PARTY_COLORS) }), add);
    burst(x, y, 10, [1, 3], (vx, vy) => ({ shape: "confetti", x, y, vx, vy: vy - 1, gravity: 0.08, life: 60, max: 60, size: rand(3, 6), glow: 4, rot: rand(0, Math.PI), spin: rand(-0.3, 0.3), color: pick(PARTY_COLORS) }), add);
  },
};

// Lumen: a soft iridescent light ribbon shedding tiny drifting diamonds; a
// click sends out thin sonar rings.
const LUMEN: Effect = {
  blend: "source-over",
  streak: { colors: ["#4f6bff", "#00c2ff", "#b388ff"], width: 2.5, glow: 10 },
  move(x, y, speed, _dx, _dy, add) {
    if (Math.random() > 0.3 + speed / 50) return;
    const max = rand(40, 70);
    add({
      shape: "confetti", x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-0.3, 0.3), vy: rand(-0.7, -0.2),
      life: max, max, size: rand(2, 4), glow: 6, rot: Math.PI / 4, spin: rand(-0.04, 0.04), aspect: 1,
      color: pick(["#4f6bff", "#00c2ff", "#b388ff", "#9aa8c7"]),
    });
  },
  click(x, y, add) {
    add({ shape: "ring", x, y, life: 34, max: 34, size: 44, glow: 6, color: "#4f6bff" });
    add({ shape: "ring", x, y, life: 26, max: 26, size: 30, glow: 6, color: "#00c2ff" });
    add({ shape: "ring", x, y, life: 18, max: 18, size: 18, glow: 6, color: "#b388ff" });
    burst(x, y, 8, [0.8, 1.6], (vx, vy) => ({ shape: "circle", x, y, vx, vy, life: 30, max: 30, size: 1.6, glow: 6, color: "#4f6bff" }), add);
  },
};

export const CURSOR_EFFECTS: Partial<Record<ThemeId, Effect>> = {
  cyberpunk: NEON,
  partylights: PARTY,
  lumen: LUMEN,
  spongebob: BUBBLES,
  meangirls: SPARKLES,
  minecraft: PIXELS,
};

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.45, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  ctx.fill();
}

export function CursorTrail({ effect }: { effect: Effect }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let particles: Particle[] = [];
    let streak: { x: number; y: number; life: number }[] = [];
    let last: { x: number; y: number } | null = null;
    let frame = 0;

    const add: Add = (p) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({ vx: 0, vy: 0, life: 40, max: 40, size: 3, glow: 0, gravity: 0, sway: 0, phase: 0, rot: 0, spin: 0, aspect: 0.5, ...p });
    };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function start() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const { clientX: x, clientY: y } = e;
      const dx = last ? x - last.x : 0;
      const dy = last ? y - last.y : 0;
      last = { x, y };
      if (effect.streak) streak.push({ x, y, life: STREAK_LIFE });
      effect.move(x, y, Math.hypot(dx, dy), dx, dy, add);
      start();
    }

    function onDown(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      effect.click(e.clientX, e.clientY, add);
      start();
    }

    function onLeave() {
      last = null;
    }

    function draw() {
      frame = 0;
      const c = ctx!;
      c.clearRect(0, 0, window.innerWidth, window.innerHeight);
      c.globalCompositeOperation = effect.blend;
      c.lineCap = "round";

      if (effect.streak) {
        const { colors, width, glow } = effect.streak;
        streak = streak.filter((p) => --p.life > 0);
        for (let i = 1; i < streak.length; i++) {
          const t = streak[i].life / STREAK_LIFE;
          c.strokeStyle = colors[i % colors.length];
          c.shadowColor = c.strokeStyle;
          c.shadowBlur = glow;
          c.globalAlpha = t * 0.8;
          c.lineWidth = 1 + t * width;
          c.beginPath();
          c.moveTo(streak[i - 1].x, streak[i - 1].y);
          c.lineTo(streak[i].x, streak[i].y);
          c.stroke();
        }
      }

      particles = particles.filter((p) => --p.life > 0);
      for (const p of particles) {
        const t = p.life / p.max;
        p.phase += 0.12;
        p.vy += p.gravity;
        p.vx *= 0.96;
        p.x += p.vx + Math.sin(p.phase) * p.sway;
        p.y += p.vy;

        c.globalAlpha = Math.min(1, t * 1.4);
        c.shadowColor = p.color;
        c.shadowBlur = p.glow;
        c.fillStyle = p.color;
        c.strokeStyle = p.color;

        switch (p.shape) {
          case "square":
            c.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
            break;
          case "circle":
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();
            break;
          case "bubble":
            c.lineWidth = 1.2;
            c.fillStyle = "rgba(255, 255, 255, 0.35)";
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.fillStyle = "rgba(255, 255, 255, 0.9)";
            c.beginPath();
            c.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.25, 0, Math.PI * 2);
            c.fill();
            break;
          case "star":
            drawStar(c, p.x, p.y, p.size * (0.6 + 0.4 * Math.abs(Math.sin(p.phase))));
            break;
          case "heart":
            drawHeart(c, p.x, p.y, p.size);
            break;
          case "glyph":
            c.font = `${p.size}px 'Share Tech Mono', monospace`;
            c.fillText(p.char ?? "", p.x, p.y);
            break;
          case "confetti":
            p.rot += p.spin;
            c.save();
            c.translate(p.x, p.y);
            c.rotate(p.rot);
            c.fillRect(-p.size / 2, (-p.size * p.aspect) / 2, p.size, p.size * p.aspect);
            c.restore();
            break;
          case "ring":
            c.lineWidth = 2 * t;
            c.beginPath();
            c.arc(p.x, p.y, (1 - t) * p.size + 4, 0, Math.PI * 2);
            c.stroke();
            break;
        }
      }

      c.globalAlpha = 1;
      c.shadowBlur = 0;
      c.globalCompositeOperation = "source-over";
      // Stop drawing once everything has faded; the next move starts it again.
      if (particles.length || streak.length) start();
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [effect]);

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />;
}
