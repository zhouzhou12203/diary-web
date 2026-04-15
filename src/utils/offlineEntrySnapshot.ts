import type { DiaryEntry } from '../types/index.ts';

const OFFLINE_ENTRY_SNAPSHOT_KEY = 'diary_offline_public_entries_v1';
const MAX_OFFLINE_ENTRIES = 120;

export interface OfflineEntrySnapshot {
  savedAt: string;
  entries: DiaryEntry[];
}

function sanitizeEntry(entry: DiaryEntry): DiaryEntry {
  return {
    ...entry,
    hidden: false,
  };
}

function isValidEntryArray(value: unknown): value is DiaryEntry[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'object' && entry !== null);
}

export function readOfflineEntrySnapshot(): OfflineEntrySnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(OFFLINE_ENTRY_SNAPSHOT_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<OfflineEntrySnapshot>;
    if (!parsedValue.savedAt || !isValidEntryArray(parsedValue.entries)) {
      return null;
    }

    return {
      savedAt: parsedValue.savedAt,
      entries: parsedValue.entries.map(sanitizeEntry),
    };
  } catch {
    return null;
  }
}

export function writeOfflineEntrySnapshot(entries: DiaryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const safeEntries = entries
      .filter((entry) => !entry.hidden)
      .slice(0, MAX_OFFLINE_ENTRIES)
      .map(sanitizeEntry);

    const payload: OfflineEntrySnapshot = {
      savedAt: new Date().toISOString(),
      entries: safeEntries,
    };

    window.localStorage.setItem(OFFLINE_ENTRY_SNAPSHOT_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private-mode failures and keep online behavior unchanged.
  }
}

export function clearOfflineEntrySnapshot(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(OFFLINE_ENTRY_SNAPSHOT_KEY);
  } catch {
    // Ignore storage failures when clearing offline cache.
  }
}
