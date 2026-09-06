"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";

export type JournalEntry = {
  id: number;
  title: string;
  body: string;
  date: number;
  tags: string[];
  collections: number[];
};

export type Collection = { id: number; name: string };

const ENTRIES_KEY = "soyuco_entries";
const COLLECTIONS_KEY = "soyuco_collections";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

type JournalContextValue = {
  entries: JournalEntry[];
  collections: Collection[];
  activeCollectionId: number | null;
  currentEntryId: number | null;
  createEntry: () => number;
  selectEntry: (id: number | null) => void;
  updateEntry: (id: number, patch: Partial<Pick<JournalEntry, "title" | "body">>) => void;
  saveEntryToCloud: (id: number) => Promise<{ error: string | null }>;
  deleteEntry: (id: number) => Promise<void>;
  addTag: (id: number, tag: string) => void;
  toggleEntryCollection: (entryId: number, collectionId: number, add: boolean) => void;
  createCollection: (name: string) => void;
  deleteCollection: (id: number) => void;
  selectCollection: (id: number | null) => void;
};

const JournalContext = createContext<JournalContextValue | undefined>(undefined);

export function JournalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>(() => readJson(ENTRIES_KEY, []));
  const [collections, setCollections] = useState<Collection[]>(() =>
    readJson(COLLECTIONS_KEY, []),
  );
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);

  // Persist to localStorage whenever entries/collections change.
  useEffect(() => {
    window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    window.localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  }, [collections]);

  // Pull cloud entries once per sign-in, same table Soyuco has always used.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.length) return;
        setEntries(
          data.map((row) => ({
            id: row.id,
            title: row.title ?? "",
            body: row.body ?? "",
            date: new Date(row.date).getTime(),
            tags: row.tags ?? [],
            collections: row.collections ?? [],
          })),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<JournalContextValue>(
    () => ({
      entries,
      collections,
      activeCollectionId,
      currentEntryId,

      createEntry() {
        const id = Date.now();
        setEntries((prev) => [{ id, title: "", body: "", date: Date.now(), tags: [] , collections: []}, ...prev]);
        setCurrentEntryId(id);
        return id;
      },

      selectEntry(id) {
        setCurrentEntryId(id);
      },

      updateEntry(id, patch) {
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      },

      async saveEntryToCloud(id) {
        if (!user) return { error: null };
        const entry = entries.find((e) => e.id === id);
        if (!entry) return { error: null };
        const { error } = await supabase.from("entries").upsert({
          id: entry.id,
          user_id: user.id,
          title: entry.title,
          body: entry.body,
          date: new Date(entry.date).toISOString(),
          tags: entry.tags ?? [],
          collections: entry.collections ?? [],
        });
        return { error: error?.message ?? null };
      },

      async deleteEntry(id) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setCurrentEntryId((cur) => (cur === id ? null : cur));
        if (user) {
          await supabase.from("entries").delete().eq("id", id);
        }
      },

      addTag(id, tag) {
        const clean = tag.trim().toLowerCase();
        if (!clean) return;
        const entry = entries.find((e) => e.id === id);
        if (!entry) return;

        const exists = collections.some((c) => c.name.toLowerCase() === clean);
        const newCollection = exists
          ? null
          : { id: Date.now() + Math.floor(Math.random() * 1000), name: clean };
        const tags = entry.tags.includes(clean) ? entry.tags : [...entry.tags, clean];
        const entryCollections = newCollection
          ? [...entry.collections, newCollection.id]
          : entry.collections;

        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, tags, collections: entryCollections } : e)),
        );
        if (newCollection) setCollections((prev) => [...prev, newCollection]);
      },

      toggleEntryCollection(entryId, collectionId, add) {
        setEntries((prev) =>
          prev.map((e) => {
            if (e.id !== entryId) return e;
            const collections = add
              ? e.collections.includes(collectionId)
                ? e.collections
                : [...e.collections, collectionId]
              : e.collections.filter((cid) => cid !== collectionId);
            return { ...e, collections };
          }),
        );
      },

      createCollection(name) {
        const clean = name.trim();
        if (!clean) return;
        setCollections((prev) => [...prev, { id: Date.now(), name: clean }]);
      },

      deleteCollection(id) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        setEntries((prev) =>
          prev.map((e) => ({ ...e, collections: e.collections.filter((cid) => cid !== id) })),
        );
        setActiveCollectionId((cur) => (cur === id ? null : cur));
      },

      selectCollection(id) {
        setActiveCollectionId((cur) => (cur === id ? null : id));
      },
    }),
    [entries, collections, activeCollectionId, currentEntryId, user],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used within a JournalProvider");
  return ctx;
}
