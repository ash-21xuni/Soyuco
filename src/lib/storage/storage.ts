"use client";

import { supabase } from "@/lib/supabase/client";

// How much space a user's data takes up, and the packs that add more.
// Sizes are measured in the database (see supabase/sql/storage_quota.sql).

export type StorageCategory = "journal" | "images" | "planner" | "budget" | "ai";

export type StorageUsage = {
  byCategory: Record<StorageCategory, number>;
  used: number;
  free: number;
  bought: number;
  /** free + bought */
  quota: number;
};

export const STORAGE_CATEGORIES: { id: StorageCategory; label: string; hint: string }[] = [
  { id: "images", label: "Journal images", hint: "Photos and pictures added to entries" },
  { id: "journal", label: "Journal entries", hint: "Entry text and collections" },
  { id: "planner", label: "Planner", hint: "Tasks, events, habits and moods" },
  { id: "budget", label: "Budget", hint: "Transactions, goals and limits" },
  { id: "ai", label: "AI chats", hint: "Your conversations with the assistant" },
];

// Keep in step with storage_packs in supabase/sql/storage_quota.sql.
export const STORAGE_PACKS: { id: string; bytes: number; price: number; badge?: string }[] = [
  { id: "storage-500mb", bytes: 500 * 1024 ** 2, price: 300 },
  { id: "storage-1gb", bytes: 1024 ** 3, price: 500, badge: "Popular" },
  { id: "storage-5gb", bytes: 5 * 1024 ** 3, price: 1500, badge: "Best value" },
];

export async function fetchStorageUsage(): Promise<StorageUsage | { error: string }> {
  const { data, error } = await supabase.rpc("storage_usage");
  if (error || !data) return { error: error?.message ?? "Couldn't load storage usage." };

  const raw = data as Record<string, number>;
  const byCategory = Object.fromEntries(
    STORAGE_CATEGORIES.map((c) => [c.id, Number(raw[c.id] ?? 0)]),
  ) as Record<StorageCategory, number>;
  const used = Object.values(byCategory).reduce((sum, n) => sum + n, 0);
  const free = Number(raw.free_bytes ?? 0);
  const bought = Number(raw.bought_bytes ?? 0);
  return { byCategory, used, free, bought, quota: free + bought };
}

/** Share of the allowance in use, 0–100. */
export function usagePercent(usage: StorageUsage): number {
  if (usage.quota <= 0) return 0;
  return Math.min(100, (usage.used / usage.quota) * 100);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const digits = value >= 100 || Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(digits)} ${units[i]}`;
}
