"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

/** Cloud sync state of one entry, shown Word-style next to the editor toolbar. */
export type SaveStatus = "saved" | "pending" | "saving" | "error";

// How long typing has to pause before the entry is pushed to the cloud.
const AUTOSAVE_DELAY_MS = 1200;

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
  /** True once the initial cloud pull for this sign-in has finished. */
  synced: boolean;
  entries: JournalEntry[];
  collections: Collection[];
  activeCollectionId: number | null;
  currentEntryId: number | null;
  /** Per-entry sync state; entries never edited this session have no status. */
  saveStatus: Record<number, SaveStatus>;
  saveError: Record<number, string>;
  createEntry: () => number;
  selectEntry: (id: number | null) => void;
  updateEntry: (id: number, patch: Partial<Pick<JournalEntry, "title" | "body">>) => void;
  /** Saves now, skipping the autosave delay. */
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
  const [synced, setSynced] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({});
  const [saveError, setSaveError] = useState<Record<number, string>>({});

  // Autosave bookkeeping lives in refs so timers always see the latest entries.
  const entriesRef = useRef(entries);
  const userRef = useRef(user);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(new Map<number, Promise<{ error: string | null }>>());
  const resaveQueued = useRef(new Set<number>());
  // Bumped on every edit, so a save that finishes mid-typing doesn't claim "saved".
  const editVersion = useRef(new Map<number, number>());
  useEffect(() => {
    entriesRef.current = entries;
    userRef.current = user;
  }, [entries, user]);

  const setStatus = useCallback((id: number, status: SaveStatus, error?: string) => {
    setSaveStatus((prev) => (prev[id] === status ? prev : { ...prev, [id]: status }));
    setSaveError((prev) => {
      if (error) return { ...prev, [id]: error };
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // One upsert per entry at a time; edits made while a save is running queue
  // exactly one follow-up save rather than racing it.
  const saveNow = useCallback(
    (id: number) => {
      const save = (id: number): Promise<{ error: string | null }> => {
        const timer = timers.current.get(id);
        if (timer) clearTimeout(timer);
        timers.current.delete(id);

        // The in-flight promise covers any queued follow-up save as well.
        const running = inFlight.current.get(id);
        if (running) {
          resaveQueued.current.add(id);
          return running;
        }

        const currentUser = userRef.current;
        const entry = entriesRef.current.find((e) => e.id === id);
        if (!currentUser || !entry) return Promise.resolve({ error: null });

        const version = editVersion.current.get(id) ?? 0;
        setStatus(id, "saving");
        const upsert = (async () => {
          const { error } = await supabase.from("entries").upsert({
            id: entry.id,
            user_id: currentUser.id,
            title: entry.title,
            body: entry.body,
            date: new Date(entry.date).toISOString(),
            tags: entry.tags ?? [],
            collections: entry.collections ?? [],
          });
          return { error: error?.message ?? null };
        })().catch((e: unknown) => ({
          error: e instanceof Error ? e.message : "Network error",
        }));
        const run = upsert.then((result) => {
          inFlight.current.delete(id);
          if (resaveQueued.current.delete(id)) return save(id);
          if (result.error) setStatus(id, "error", result.error);
          else if ((editVersion.current.get(id) ?? 0) === version) setStatus(id, "saved");
          else setStatus(id, "pending");
          return result;
        });
        inFlight.current.set(id, run);
        return run;
      };
      return save(id);
    },
    [setStatus],
  );

  const scheduleSave = useCallback(
    (id: number) => {
      editVersion.current.set(id, (editVersion.current.get(id) ?? 0) + 1);
      if (!inFlight.current.has(id)) setStatus(id, "pending");
      const timer = timers.current.get(id);
      if (timer) clearTimeout(timer);
      timers.current.set(
        id,
        setTimeout(() => void saveNow(id), AUTOSAVE_DELAY_MS),
      );
    },
    [saveNow, setStatus],
  );

  // Flush pending edits when the tab is hidden or closed, and warn before
  // leaving with changes that haven't reached the cloud yet.
  useEffect(() => {
    const flush = () => {
      for (const id of [...timers.current.keys()]) void saveNow(id);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!timers.current.size && !inFlight.current.size) return;
      flush();
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush();
    };
  }, [saveNow]);

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
      })
      .then(
        () => !cancelled && setSynced(true),
        () => !cancelled && setSynced(true),
      );

    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<JournalContextValue>(
    () => ({
      synced,
      entries,
      collections,
      activeCollectionId,
      currentEntryId,
      saveStatus,
      saveError,

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
        scheduleSave(id);
      },

      saveEntryToCloud(id) {
        return saveNow(id);
      },

      async deleteEntry(id) {
        const timer = timers.current.get(id);
        if (timer) clearTimeout(timer);
        timers.current.delete(id);
        // Let a running upsert land first so it can't resurrect the row.
        await inFlight.current.get(id);
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
        scheduleSave(id);
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
        scheduleSave(entryId);
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
    [
      synced,
      entries,
      collections,
      activeCollectionId,
      currentEntryId,
      user,
      saveStatus,
      saveError,
      saveNow,
      scheduleSave,
    ],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used within a JournalProvider");
  return ctx;
}
