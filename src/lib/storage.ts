import { useSyncExternalStore } from "react";
import { z } from "zod";
import { LearningPathSchema, PathRequestSchema } from "./schema";

const KEY = "pathfinder:paths";

const SavedPathSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  request: PathRequestSchema,
  path: LearningPathSchema,
  /** Checked checkpoint items, keyed "stageIndex-itemIndex". */
  checked: z.array(z.string()),
});

export type SavedPath = z.infer<typeof SavedPathSchema>;

// A tiny localStorage-backed store, read through useSyncExternalStore.
let cache: SavedPath[] | null = null;
const listeners = new Set<() => void>();

function read(): SavedPath[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    // Drop anything that no longer matches the schema instead of crashing.
    return raw.flatMap((item) => {
      const result = SavedPathSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

function getSnapshot(): SavedPath[] {
  cache ??= read();
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updatePaths(update: (prev: SavedPath[]) => SavedPath[]) {
  cache = update(getSnapshot());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable (e.g. private mode): progress just won't persist.
  }
  listeners.forEach((l) => l());
}

/** Saved paths, or null during server render / before hydration. */
export function useSavedPaths(): SavedPath[] | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function checkKey(stageIndex: number, itemIndex: number) {
  return `${stageIndex}-${itemIndex}`;
}

export function progressOf(saved: SavedPath) {
  const total = saved.path.stages.reduce((sum, s) => sum + s.checkpoint.length, 0);
  return { done: saved.checked.length, total, percent: total ? Math.round((saved.checked.length / total) * 100) : 0 };
}
