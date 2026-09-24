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
  // Premium theme ids are kept stable for saved preferences; display names are
  // Sunny Reef (spongebob), Queen Bee (meangirls) and Pixel Quarry (minecraft).
  spongebob: {
    empty: "🐠",
    emptyTitle: "Ready, set, splash!",
    schedule: "🕐 Today's Adventures",
    tasks: "📋 Chores (don't skip!)",
    habits: "🌟 Good Habits",
    quote: "🐚 Words of Wisdom",
    aiTitle: "🐠 Reef AI Planner",
  },
  meangirls: {
    empty: "💅",
    emptyTitle: "Start writing, babe",
    schedule: "💗 My Schedule",
    tasks: "💕 Top Priorities",
    habits: "✨ Glow-Up Habits",
    quote: "👑 Quote of the Day",
    aiTitle: "💅 AI Planner, Darling",
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

export const REEF_QUOTES: Quote[] = [
  { text: "Every tide brings a fresh start.", author: "Sunny Reef" },
  { text: "Bubbles up! Today is a brand-new adventure.", author: "Sunny Reef" },
  { text: "Even the smallest shell holds the whole song of the sea.", author: "Sunny Reef" },
  { text: "Stay bright, stay curious, and ride the current.", author: "Sunny Reef" },
];

export const QUEEN_BEE_QUOTES: Quote[] = [
  { text: "Confidence is the best accessory.", author: "Queen Bee" },
  { text: "Be the main character of your own story.", author: "Queen Bee" },
  { text: "Pink is a power colour.", author: "Queen Bee" },
  { text: "Write it down, then make it happen.", author: "Queen Bee" },
];

export const PIXEL_QUARRY_QUOTES: Quote[] = [
  { text: "ACHIEVEMENT UNLOCKED: STARTED A JOURNAL.", author: "Quarry Wisdom" },
  { text: "GEMS ARE EVERYWHERE. YOU JUST HAVE TO DIG.", author: "Quarry Wisdom" },
  { text: "EVERY GREAT BUILD STARTS WITH ONE BLOCK.", author: "Quarry Wisdom" },
  { text: "BUILD YOUR DAY BLOCK BY BLOCK.", author: "Quarry Wisdom" },
];

export function quotePoolForTheme(theme: ThemeId): Quote[] {
  if (theme === "spongebob") return REEF_QUOTES;
  if (theme === "meangirls") return QUEEN_BEE_QUOTES;
  if (theme === "minecraft") return PIXEL_QUARRY_QUOTES;
  return QUOTES;
}
