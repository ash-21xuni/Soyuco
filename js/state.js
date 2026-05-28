// ===========================
// STATE
// ===========================
let entries = JSON.parse(localStorage.getItem('soyuco_entries') || '[]');
let collections = JSON.parse(localStorage.getItem('soyuco_collections') || '[]');
let activeCollectionId = null; // null = show all entries
let currentEntryId = null;
let currentView = 'journal';
let plannerDay = new Date();
let todos = JSON.parse(localStorage.getItem('soyuco_todos') || '[]');
let habits = JSON.parse(localStorage.getItem('soyuco_habits') || JSON.stringify([
  { id: 1, name: 'Morning pages', days: [false, false, false, false, false, false, false] },
  { id: 2, name: 'Exercise',      days: [false, false, false, false, false, false, false] },
  { id: 3, name: 'Meditate',      days: [false, false, false, false, false, false, false] },
]));
let moodHistory = JSON.parse(localStorage.getItem('soyuco_mood') || '{}');
let aiMessages = [];
let quoteIdx = 0;

// ===========================
// THEME-SPECIFIC UI STRINGS
// ===========================
const THEME_COPY = {
  default:   { empty: '✦',  emptyTitle: 'Begin your story',  schedule: '⏱ Schedule',            tasks: '☑ Tasks',                    habits: '◈ Habits',         quote: '✦ Daily Spark',       aiTitle: '⬡ AI Day Planner'       },
  parchment: { empty: '✒',  emptyTitle: 'Begin your story',  schedule: '⏱ Schedule',            tasks: '☑ Tasks',                    habits: '◈ Habits',         quote: '✦ Daily Spark',       aiTitle: '⬡ AI Day Planner'       },
  ocean:     { empty: '🌊', emptyTitle: 'Begin your story',  schedule: '⏱ Schedule',            tasks: '☑ Tasks',                    habits: '◈ Habits',         quote: '✦ Daily Spark',       aiTitle: '⬡ AI Day Planner'       },
  forest:    { empty: '🌿', emptyTitle: 'Begin your story',  schedule: '⏱ Schedule',            tasks: '☑ Tasks',                    habits: '◈ Habits',         quote: '✦ Daily Spark',       aiTitle: '⬡ AI Day Planner'       },
  rose:      { empty: '🌸', emptyTitle: 'Begin your story',  schedule: '⏱ Schedule',            tasks: '☑ Tasks',                    habits: '◈ Habits',         quote: '✦ Daily Spark',       aiTitle: '⬡ AI Day Planner'       },
  terminal:  { empty: '>_', emptyTitle: '$ ./begin_story.sh',schedule: '# SCHEDULE',            tasks: '# TASKS',                    habits: '# HABITS',         quote: '# QUOTE',             aiTitle: '$ AI_PLANNER --run'     },
  lavender:  { empty: '✨', emptyTitle: 'Begin your story',  schedule: '⏱ Schedule',            tasks: '☑ Tasks',                    habits: '◈ Habits',         quote: '✦ Daily Spark',       aiTitle: '⬡ AI Day Planner'       },
  spongebob: { empty: '🧽', emptyTitle: "I'm ready!",        schedule: "🕐 Today's Adventures", tasks: "📋 Chores (don't skip!)",    habits: '🌟 Good Habits',   quote: '🍍 Words of Wisdom',   aiTitle: '🧽 Krabby AI Planner'   },
  meangirls: { empty: '💅', emptyTitle: 'Start writing, babe',schedule: '💗 My Schedule',       tasks: '💕 On Wednesdays We Task',   habits: '✨ Glow-Up Habits', quote: '👑 Quote of the Day',  aiTitle: '💅 AI Planner (fetch!)' },
  minecraft: { empty: '⛏', emptyTitle: 'NEW WORLD CREATED',  schedule: "⏱ TODAY'S QUESTS",     tasks: '📦 INVENTORY TASKS',         habits: '⚔ DAILY SKILLS',   quote: '📜 WISDOM SCROLL',    aiTitle: '🤖 AI QUEST MASTER'     },
};

// ===========================
// QUOTE POOLS
// ===========================
const QUOTES = [
  { text: "The art of writing is the art of discovering what you believe.", author: "Gustave Flaubert" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "Write hard and clear about what hurts.", author: "Ernest Hemingway" },
  { text: "A journal is your completely unaltered voice.", author: "Lucy Dacus" },
  { text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour" },
];

const SPONGEBOB_QUOTES = [
  { text: "I'm ready! I'm ready! I'm ready!", author: "SpongeBob SquarePants" },
  { text: "If you believe in yourself and with a tiny pinch of magic, all your dreams can come true.", author: "SpongeBob SquarePants" },
  { text: "I don't need a license to drive a sandwich.", author: "SpongeBob SquarePants" },
  { text: "Imagination!", author: "SpongeBob SquarePants" },
];

const MEANGIRLS_QUOTES = [
  { text: "On Wednesdays we wear pink.", author: "Mean Girls" },
  { text: "You can't sit with us.", author: "Mean Girls" },
  { text: "She doesn't even go here.", author: "Mean Girls" },
  { text: "Get in loser, we're going shopping.", author: "Mean Girls" },
];

const MINECRAFT_QUOTES = [
  { text: "ACHIEVEMENT UNLOCKED: STARTED A JOURNAL.", author: "Steve" },
  { text: "DIAMONDS ARE EVERYWHERE. YOU JUST HAVE TO DIG.", author: "Minecraft Wisdom" },
  { text: "DON'T MINE STRAIGHT DOWN. (AND DON'T SKIP JOURNALING.)", author: "Steve" },
  { text: "BUILD YOUR DAY BLOCK BY BLOCK.", author: "Minecraft Wisdom" },
];

// ===========================
// BUDGET STATE
// ===========================
const CAT_LABELS = {
  food: '🍔 Food', transport: '🚗 Transport', housing: '🏠 Housing',
  health: '💊 Health', entertainment: '🎬 Entertainment', shopping: '🛍 Shopping',
  utilities: '💡 Utilities', salary: '💼 Salary', other: '◇ Other',
};
let bTransactions = JSON.parse(localStorage.getItem('soyuco_tx')     || '[]');
let bGoals        = JSON.parse(localStorage.getItem('soyuco_goals')  || '[]');
let bLimits       = JSON.parse(localStorage.getItem('soyuco_limits') || '[]');
let txTypeB = 'expense';

// ===========================
// SHARED UTILITIES
// ===========================
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===========================
// MODAL HELPERS (global)
// ===========================
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  setTimeout(() => {
    const inp = el.querySelector('input, textarea');
    if (inp) inp.focus();
  }, 50);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
