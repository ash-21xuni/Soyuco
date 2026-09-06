import type { ThemeId } from "./theme-context";

export type ThemeCopy = {
  empty: string;
  emptyTitle: string;
  schedule: string;
  tasks: string;
  habits: string;
  quote: string;
  aiTitle: string;
};

const DEFAULT_COPY: ThemeCopy = {
  empty: "✦",
  emptyTitle: "Begin your story",
  schedule: "⏱ Schedule",
  tasks: "☑ Tasks",
  habits: "◈ Habits",
  quote: "✦ Daily Spark",
  aiTitle: "⬡ AI Day Planner",
};

export const THEME_COPY: Record<ThemeId, ThemeCopy> = {
  default: DEFAULT_COPY,
  parchment: { ...DEFAULT_COPY, empty: "✒" },
  ocean: { ...DEFAULT_COPY, empty: "🌊" },
  forest: { ...DEFAULT_COPY, empty: "🌿" },
  rose: { ...DEFAULT_COPY, empty: "🌸" },
  terminal: {
    empty: ">_",
    emptyTitle: "$ ./begin_story.sh",
    schedule: "# SCHEDULE",
    tasks: "# TASKS",
    habits: "# HABITS",
    quote: "# QUOTE",
    aiTitle: "$ AI_PLANNER --run",
  },
  lavender: { ...DEFAULT_COPY, empty: "✨" },
  spongebob: {
    empty: "🧽",
    emptyTitle: "I'm ready!",
    schedule: "🕐 Today's Adventures",
    tasks: "📋 Chores (don't skip!)",
    habits: "🌟 Good Habits",
    quote: "🍍 Words of Wisdom",
    aiTitle: "🧽 Krabby AI Planner",
  },
  meangirls: {
    empty: "💅",
    emptyTitle: "Start writing, babe",
    schedule: "💗 My Schedule",
    tasks: "💕 On Wednesdays We Task",
    habits: "✨ Glow-Up Habits",
    quote: "👑 Quote of the Day",
    aiTitle: "💅 AI Planner (fetch!)",
  },
  minecraft: {
    empty: "⛏",
    emptyTitle: "NEW WORLD CREATED",
    schedule: "⏱ TODAY'S QUESTS",
    tasks: "📦 INVENTORY TASKS",
    habits: "⚔ DAILY SKILLS",
    quote: "📜 WISDOM SCROLL",
    aiTitle: "🤖 AI QUEST MASTER",
  },
};

export type Quote = { text: string; author: string };

export const QUOTES: Quote[] = [
  { text: "The art of writing is the art of discovering what you believe.", author: "Gustave Flaubert" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "Write hard and clear about what hurts.", author: "Ernest Hemingway" },
  { text: "A journal is your completely unaltered voice.", author: "Lucy Dacus" },
  {
    text: "Start writing, no matter what. The water does not flow until the faucet is turned on.",
    author: "Louis L'Amour",
  },
];

export const SPONGEBOB_QUOTES: Quote[] = [
  { text: "I'm ready! I'm ready! I'm ready!", author: "SpongeBob SquarePants" },
  {
    text: "If you believe in yourself and with a tiny pinch of magic, all your dreams can come true.",
    author: "SpongeBob SquarePants",
  },
  { text: "I don't need a license to drive a sandwich.", author: "SpongeBob SquarePants" },
  { text: "Imagination!", author: "SpongeBob SquarePants" },
];

export const MEANGIRLS_QUOTES: Quote[] = [
  { text: "On Wednesdays we wear pink.", author: "Mean Girls" },
  { text: "You can't sit with us.", author: "Mean Girls" },
  { text: "She doesn't even go here.", author: "Mean Girls" },
  { text: "Get in loser, we're going shopping.", author: "Mean Girls" },
];

export const MINECRAFT_QUOTES: Quote[] = [
  { text: "ACHIEVEMENT UNLOCKED: STARTED A JOURNAL.", author: "Steve" },
  { text: "DIAMONDS ARE EVERYWHERE. YOU JUST HAVE TO DIG.", author: "Minecraft Wisdom" },
  { text: "DON'T MINE STRAIGHT DOWN. (AND DON'T SKIP JOURNALING.)", author: "Steve" },
  { text: "BUILD YOUR DAY BLOCK BY BLOCK.", author: "Minecraft Wisdom" },
];

export function quotePoolForTheme(theme: ThemeId): Quote[] {
  if (theme === "spongebob") return SPONGEBOB_QUOTES;
  if (theme === "meangirls") return MEANGIRLS_QUOTES;
  if (theme === "minecraft") return MINECRAFT_QUOTES;
  return QUOTES;
}
