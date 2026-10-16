import type { ThemeId } from "@/lib/theme/theme-context";

export type Tier = "essential" | "enhanced" | "signature" | "pro";

// Price (in Soyucoins) scales with how much a theme changes: colours only,
// then pattern and themed copy, then bespoke effects, then Pro themes with
// animated graphics and interactive cursor effects.
export const TIERS: Record<Tier, { label: string; price: number; includes: string[] }> = {
  essential: {
    label: "Essential",
    price: 300,
    includes: ["Colour palette", "Font pairing"],
  },
  enhanced: {
    label: "Enhanced",
    price: 400,
    includes: ["Everything in Essential", "Background pattern", "Themed headings & quotes"],
  },
  signature: {
    label: "Signature",
    price: 500,
    includes: ["Everything in Enhanced", "Custom cursor & shapes", "Special effects"],
  },
  pro: {
    label: "Pro",
    price: 750,
    includes: ["Everything in Signature", "Animated scenes & graphics", "Interactive cursor trail"],
  },
};

export const TIER_ORDER: Tier[] = ["essential", "enhanced", "signature", "pro"];

export type ThemePreview = {
  bg: string;
  panel: string;
  surface: string;
  text: string;
  accent: string;
  radius: number;
};

export type ThemeListing = {
  id: string;
  name: string;
  tier: Tier;
  description: string;
  features: string[];
  preview: ThemePreview;
  /** Set when the theme already exists in the app and can be previewed. */
  themeId?: ThemeId;
  /** Placeholder listings stand in for themes that aren't designed yet. */
  placeholder?: boolean;
  /** Overrides the tier's price for this theme. */
  price?: number;
};

const PLACEHOLDER_PREVIEW: ThemePreview = {
  bg: "#2a2a2a",
  panel: "#333333",
  surface: "#3d3d3d",
  text: "#8a8a8a",
  accent: "#6a6a6a",
  radius: 6,
};

function placeholder(n: number, tier: Tier): ThemeListing {
  const num = String(n).padStart(2, "0");
  return {
    id: `placeholder-${num}`,
    name: `Theme ${num}`,
    tier,
    description: "Placeholder listing. Theme name, artwork and details coming soon.",
    features: TIERS[tier].includes.filter((f) => !f.startsWith("Everything")),
    preview: PLACEHOLDER_PREVIEW,
    placeholder: true,
  };
}

export const CATALOG: ThemeListing[] = [
  {
    id: "sunny-reef",
    name: "Sunny Reef",
    tier: "pro",
    themeId: "spongebob",
    description: "Bright, bubbly and cheerful. An underwater day out for your journal.",
    features: ["Sunshine palette", "Playful display font", "Underwater banner with rising bubbles", "Rolling waves in the top bar", "Fish cursor with bubble trail", "Reef-themed copy & quotes"],
    preview: {
      bg: "#fff7b0",
      panel: "#ffe97a",
      surface: "#fffde0",
      text: "#1a0a00",
      accent: "#0055bb",
      radius: 12,
    },
  },
  {
    id: "queen-bee",
    name: "Queen Bee",
    tier: "pro",
    price: 500,
    themeId: "meangirls",
    description: "Pink, polished and unapologetically confident.",
    features: ["Pink palette", "Script display font", "Glossy banner with twinkling sparkles", "Shimmering top bar", "Heart cursor with sparkle trail", "Glam headings & quotes"],
    preview: {
      bg: "#fff0f5",
      panel: "#ffe0ee",
      surface: "#fff8fb",
      text: "#3a0020",
      accent: "#ff1493",
      radius: 20,
    },
  },
  {
    id: "pixel-quarry",
    name: "Pixel Quarry",
    tier: "pro",
    themeId: "minecraft",
    description: "Blocky, retro and built for questing through your day.",
    features: ["Pixel font", "Bevelled block UI", "Pixel sky, clouds & ground banner", "Grass-block top bar", "Pickaxe cursor with block-break trail", "Quest-style copy"],
    preview: {
      bg: "#1a1a1a",
      panel: "#2d2d2d",
      surface: "#404040",
      text: "#f5f5f0",
      accent: "#55cc22",
      radius: 0,
    },
  },
  {
    id: "neon-district",
    name: "Neon District",
    tier: "pro",
    themeId: "cyberpunk",
    description: "Rain-slick neon, a glowing skyline and a cursor that throws sparks wherever it goes.",
    features: [
      "Neon pink & cyan palette",
      "Futuristic HUD fonts",
      "Animated city skyline & neon grid",
      "Glitch headings & scanlines",
      "Neon cursor with spark trail",
      "Cyberpunk copy & quotes",
    ],
    preview: {
      bg: "#07060d",
      panel: "#0d0b1a",
      surface: "#1a1638",
      text: "#e8f7ff",
      accent: "#ff2a6d",
      radius: 2,
    },
  },
  {
    id: "afterglow",
    name: "Afterglow",
    tier: "pro",
    themeId: "partylights",
    description: "Neon party lights, a spinning disco ball and confetti that follows your every move.",
    features: [
      "Multicolour neon palette",
      "Retro party display font",
      "Twinkling string lights in the top bar",
      "Disco ball, stage beams & equalizer banner",
      "Disco-ball cursor with confetti trail & fireworks",
      "Party copy & quotes",
    ],
    preview: {
      bg: "#0a0612",
      panel: "#120a1f",
      surface: "#1a0f2c",
      text: "#fff4fd",
      accent: "#ff3cac",
      radius: 14,
    },
  },
  {
    id: "lumen",
    name: "Lumen",
    tier: "pro",
    price: 500,
    themeId: "lumen",
    description: "Bright, clean and futuristic. Frosted glass, soft holographic light and quiet motion.",
    features: [
      "Crisp white & iridescent palette",
      "Modern geometric fonts",
      "Frosted-glass panels",
      "Holographic orb & orbit-ring banner",
      "Minimal ring cursor with light-ribbon trail",
      "Calm, focused copy & quotes",
    ],
    preview: {
      bg: "#f6f8fb",
      panel: "#eef2f7",
      surface: "#ffffff",
      text: "#0f1724",
      accent: "#4f6bff",
      radius: 14,
    },
  },
  placeholder(1, "essential"),
  placeholder(2, "essential"),
  placeholder(3, "enhanced"),
  placeholder(4, "enhanced"),
  placeholder(5, "signature"),
  placeholder(6, "signature"),
];

/** What a theme costs: its own price if it has one, otherwise its tier's. */
export function listingPrice(listing: ThemeListing) {
  return listing.price ?? TIERS[listing.tier].price;
}

/** The cheapest real theme in a tier, and whether others in it cost more. */
export function tierPricing(tier: Tier) {
  const prices = CATALOG.filter((l) => l.tier === tier && !l.placeholder).map(listingPrice);
  if (!prices.length) return { from: TIERS[tier].price, varies: false };
  const from = Math.min(...prices);
  return { from, varies: prices.some((p) => p !== from) };
}

export type CoinPack = {
  id: string;
  coins: number;
  /** Price in rand. */
  price: number;
  badge?: string;
};

// 1000 Soyucoins = R100 is the reference rate; smaller packs cost a little more
// per coin and larger ones a little less.
export const COIN_PACKS: CoinPack[] = [
  { id: "coins-300", coins: 300, price: 40 },
  { id: "coins-500", coins: 500, price: 60 },
  { id: "coins-1000", coins: 1000, price: 100, badge: "Popular" },
  { id: "coins-2500", coins: 2500, price: 225, badge: "Best value" },
];

/** Percentage saved per coin compared with the smallest pack. */
export function packSaving(pack: CoinPack) {
  const base = COIN_PACKS[0].price / COIN_PACKS[0].coins;
  return Math.round((1 - pack.price / pack.coins / base) * 100);
}

export function formatRands(rands: number) {
  return `R${rands}`;
}

export function formatCoins(coins: number) {
  return coins.toLocaleString("en-ZA");
}
