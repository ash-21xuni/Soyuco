import type { ThemeId } from "@/lib/theme/theme-context";

export type Tier = "essential" | "enhanced" | "signature";

// Price scales with how much a theme changes: colours only, then pattern and
// themed copy, then bespoke effects.
export const TIERS: Record<Tier, { label: string; price: number; includes: string[] }> = {
  essential: {
    label: "Essential",
    price: 29,
    includes: ["Colour palette", "Font pairing"],
  },
  enhanced: {
    label: "Enhanced",
    price: 39,
    includes: ["Everything in Essential", "Background pattern", "Themed headings & quotes"],
  },
  signature: {
    label: "Signature",
    price: 49,
    includes: ["Everything in Enhanced", "Custom cursor & shapes", "Special effects"],
  },
};

export const TIER_ORDER: Tier[] = ["essential", "enhanced", "signature"];

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
    tier: "enhanced",
    themeId: "spongebob",
    description: "Bright, bubbly and cheerful. An underwater day out for your journal.",
    features: ["Sunshine palette", "Playful display font", "Bubble pattern", "Reef-themed copy & quotes"],
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
    tier: "enhanced",
    themeId: "meangirls",
    description: "Pink, polished and unapologetically confident.",
    features: ["Pink palette", "Script display font", "Sparkle pattern", "Glam headings & quotes"],
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
    tier: "signature",
    themeId: "minecraft",
    description: "Blocky, retro and built for questing through your day.",
    features: ["Pixel font", "Square-cornered UI", "Block pattern", "Custom cursor", "Quest-style copy"],
    preview: {
      bg: "#1a1a1a",
      panel: "#2d2d2d",
      surface: "#404040",
      text: "#f5f5f0",
      accent: "#55cc22",
      radius: 0,
    },
  },
  placeholder(1, "essential"),
  placeholder(2, "essential"),
  placeholder(3, "enhanced"),
  placeholder(4, "enhanced"),
  placeholder(5, "signature"),
  placeholder(6, "signature"),
];

export function formatPrice(rands: number) {
  return `R${rands}`;
}
