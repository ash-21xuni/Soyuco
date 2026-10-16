import type { ThemeId } from "./theme-context";
import type { SettingsIconName } from "@/components/settings/SettingsIcon";

export type ThemeCopy = {
  /** Icon shown on the empty journal screen. */
  empty: SettingsIconName;
  emptyTitle: string;
  schedule: string;
  tasks: string;
  habits: string;
  quote: string;
  aiTitle: string;
};

const DEFAULT_COPY: ThemeCopy = {
  empty: "penLine",
  emptyTitle: "Begin your story",
  schedule: "Schedule",
  tasks: "Tasks",
  habits: "Habits",
  quote: "Daily Spark",
  aiTitle: "AI Day Planner",
};

export const THEME_COPY: Record<ThemeId, ThemeCopy> = {
  default: DEFAULT_COPY,
  parchment: { ...DEFAULT_COPY, empty: "feather" },
  ocean: { ...DEFAULT_COPY, empty: "waves" },
  forest: { ...DEFAULT_COPY, empty: "leaf" },
  rose: { ...DEFAULT_COPY, empty: "flower" },
  terminal: {
    empty: "terminal",
    emptyTitle: "$ ./begin_story.sh",
    schedule: "# SCHEDULE",
    tasks: "# TASKS",
    habits: "# HABITS",
    quote: "# QUOTE",
    aiTitle: "$ AI_PLANNER --run",
  },
  lavender: { ...DEFAULT_COPY, empty: "sparkles" },
  // Premium theme ids are kept stable for saved preferences; display names are
  // Sunny Reef (spongebob), Queen Bee (meangirls) and Pixel Quarry (minecraft).
  spongebob: {
    empty: "fish",
    emptyTitle: "Ready, set, splash!",
    schedule: "Today's Adventures",
    tasks: "Chores (don't skip!)",
    habits: "Good Habits",
    quote: "Words of Wisdom",
    aiTitle: "Reef AI Planner",
  },
  meangirls: {
    empty: "crown",
    emptyTitle: "Start writing, babe",
    schedule: "My Schedule",
    tasks: "Top Priorities",
    habits: "Glow-Up Habits",
    quote: "Quote of the Day",
    aiTitle: "AI Planner, Darling",
  },
  minecraft: {
    empty: "pickaxe",
    emptyTitle: "NEW WORLD CREATED",
    schedule: "TODAY'S QUESTS",
    tasks: "INVENTORY TASKS",
    habits: "DAILY SKILLS",
    quote: "WISDOM SCROLL",
    aiTitle: "AI QUEST MASTER",
  },
  // Neon District.
  cyberpunk: {
    empty: "cpu",
    emptyTitle: "> JACK IN. START WRITING_",
    schedule: "Run Schedule",
    tasks: "Active Jobs",
    habits: "Daily Upgrades",
    quote: "Signal from the Net",
    aiTitle: "Netrunner AI Planner",
  },
  matcha: { ...DEFAULT_COPY, empty: "leaf" },
  midnight: { ...DEFAULT_COPY, empty: "feather" },
  sakura: {
    empty: "flower",
    emptyTitle: "Let a new page bloom",
    schedule: "Today's Blossoms",
    tasks: "To Tend",
    habits: "Daily Rituals",
    quote: "Petal of Wisdom",
    aiTitle: "Blossom AI Planner",
  },
  cafe: {
    empty: "coffee",
    emptyTitle: "Pour a fresh page",
    schedule: "Today's Menu",
    tasks: "Orders Up",
    habits: "The Daily Grind",
    quote: "Barista's Note",
    aiTitle: "Café AI Planner",
  },
  starlight: {
    empty: "sparkles",
    emptyTitle: "Make a wish. Start writing.",
    schedule: "Star Chart",
    tasks: "Missions",
    habits: "Orbits",
    quote: "Word from the Stars",
    aiTitle: "Starlight AI Planner",
  },
  academia: {
    empty: "bookOpen",
    emptyTitle: "Dip the quill and begin",
    schedule: "Lectures & Hours",
    tasks: "Assignments",
    habits: "Disciplines",
    quote: "From the Archives",
    aiTitle: "Archivist AI Planner",
  },
  // Afterglow.
  partylights: {
    empty: "music",
    emptyTitle: "The night is young. Start writing!",
    schedule: "Tonight's Lineup",
    tasks: "Setlist",
    habits: "Good Vibes",
    quote: "Spin of the Day",
    aiTitle: "AI Party Planner",
  },
  // Lumen.
  lumen: {
    empty: "orbit",
    emptyTitle: "A clean slate. Begin.",
    schedule: "Timeline",
    tasks: "Objectives",
    habits: "Routines",
    quote: "Insight",
    aiTitle: "Lumen AI Planner",
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

export const NEON_DISTRICT_QUOTES: Quote[] = [
  { text: "The future is already here. Write it down before it reboots.", author: "Neon District" },
  { text: "Every great run starts with a plan and a little static.", author: "Neon District" },
  { text: "Upgrade your mind. The rest is just chrome.", author: "Neon District" },
  { text: "In a city that never sleeps, your journal is the one quiet signal.", author: "Neon District" },
];

export const SAKURA_QUOTES: Quote[] = [
  { text: "Blossoms don't rush, and still they bloom on time.", author: "Sakura" },
  { text: "Every season of your life has its own beauty.", author: "Sakura" },
  { text: "Let small, gentle things fill your page today.", author: "Sakura" },
  { text: "Petals fall so new buds have room to grow.", author: "Sakura" },
];

export const COFFEEHOUSE_QUOTES: Quote[] = [
  { text: "First coffee, then conquer the day.", author: "Coffeehouse" },
  { text: "Life happens. Coffee helps. Writing makes sense of it.", author: "Coffeehouse" },
  { text: "Good ideas are best served warm.", author: "Coffeehouse" },
  { text: "Slow sips, clear thoughts.", author: "Coffeehouse" },
];

export const STARLIGHT_QUOTES: Quote[] = [
  { text: "Aim for the stars and write down the route.", author: "Starlight" },
  { text: "Even the brightest star started as dust.", author: "Starlight" },
  { text: "Your story is a constellation. Connect the dots.", author: "Starlight" },
  { text: "Look up. There's always more sky.", author: "Starlight" },
];

export const OLD_LIBRARY_QUOTES: Quote[] = [
  { text: "A well-kept journal is a library of one.", author: "The Archivist" },
  { text: "Read widely, write daily, think deeply.", author: "The Archivist" },
  { text: "Every great work began as a humble first draft.", author: "The Archivist" },
  { text: "Knowledge kept is knowledge gained twice.", author: "The Archivist" },
];

export const AFTERGLOW_QUOTES: Quote[] = [
  { text: "Turn it up. Today deserves a soundtrack.", author: "Afterglow" },
  { text: "Dance like the lights are on you, because they are.", author: "Afterglow" },
  { text: "Good vibes are a habit. Practise daily.", author: "Afterglow" },
  { text: "Every great night starts with one bright idea.", author: "Afterglow" },
];

export const LUMEN_QUOTES: Quote[] = [
  { text: "Clarity is the ultimate upgrade.", author: "Lumen" },
  { text: "Design your day like the future depends on it.", author: "Lumen" },
  { text: "Less noise. More signal.", author: "Lumen" },
  { text: "The best way to predict the future is to write it.", author: "Lumen" },
];

export function quotePoolForTheme(theme: ThemeId): Quote[] {
  if (theme === "spongebob") return REEF_QUOTES;
  if (theme === "meangirls") return QUEEN_BEE_QUOTES;
  if (theme === "minecraft") return PIXEL_QUARRY_QUOTES;
  if (theme === "cyberpunk") return NEON_DISTRICT_QUOTES;
  if (theme === "partylights") return AFTERGLOW_QUOTES;
  if (theme === "sakura") return SAKURA_QUOTES;
  if (theme === "cafe") return COFFEEHOUSE_QUOTES;
  if (theme === "starlight") return STARLIGHT_QUOTES;
  if (theme === "academia") return OLD_LIBRARY_QUOTES;
  if (theme === "lumen") return LUMEN_QUOTES;
  return QUOTES;
}
