import type { DiaryEntry } from '../../types/index.ts';
import { normalizeTimeString } from '../../utils/timeUtils.ts';

export interface FilterMeta {
  visibleEntries: DiaryEntry[];
  availableTags: string[];
  untaggedEntryCount: number;
  availableYears: string[];
  availableMonths: string[];
  availableMonthsByYear: Record<string, string[]>;
}

function getVisibleEntries(entries: DiaryEntry[], includeHidden = false) {
  return entries.filter((entry) => includeHidden || !entry.hidden);
}

function getAvailableTags(entries: DiaryEntry[], includeHidden = false) {
  const tagSet = new Set<string>();

  getVisibleEntries(entries, includeHidden).forEach((entry) => {
    entry.tags?.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

function getUntaggedEntryCount(entries: DiaryEntry[], includeHidden = false) {
  return getVisibleEntries(entries, includeHidden).filter((entry) => !entry.tags || entry.tags.length === 0).length;
}

function getAvailableYears(entries: DiaryEntry[], includeHidden = false) {
  const yearSet = new Set<string>();

  getVisibleEntries(entries, includeHidden).forEach((entry) => {
    if (!entry.created_at) {
      return;
    }

    const year = new Date(normalizeTimeString(entry.created_at)).getFullYear().toString();
    yearSet.add(year);
  });

  return Array.from(yearSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
}

function getAvailableMonths(entries: DiaryEntry[], year?: string, includeHidden = false) {
  const monthSet = new Set<string>();

  getVisibleEntries(entries, includeHidden).forEach((entry) => {
    if (!entry.created_at) {
      return;
    }

    const entryDate = new Date(normalizeTimeString(entry.created_at));
    if (year && entryDate.getFullYear().toString() !== year) {
      return;
    }

    const month = (entryDate.getMonth() + 1).toString().padStart(2, '0');
    monthSet.add(month);
  });

  return Array.from(monthSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
}

function getAvailableMonthsByYear(entries: DiaryEntry[], includeHidden = false) {
  const monthMap = new Map<string, Set<string>>();

  getVisibleEntries(entries, includeHidden).forEach((entry) => {
    if (!entry.created_at) {
      return;
    }

    const entryDate = new Date(normalizeTimeString(entry.created_at));
    const year = entryDate.getFullYear().toString();
    const month = (entryDate.getMonth() + 1).toString().padStart(2, '0');

    if (!monthMap.has(year)) {
      monthMap.set(year, new Set());
    }

    monthMap.get(year)!.add(month);
  });

  return Object.fromEntries(
    Array.from(monthMap.entries()).map(([year, months]) => [
      year,
      Array.from(months).sort((a, b) => parseInt(b, 10) - parseInt(a, 10)),
    ])
  ) as Record<string, string[]>;
}

export function buildFilterMeta(entries: DiaryEntry[], includeHidden = false): FilterMeta {
  const visibleEntries = getVisibleEntries(entries, includeHidden);

  return {
    visibleEntries,
    availableTags: getAvailableTags(entries, includeHidden),
    untaggedEntryCount: getUntaggedEntryCount(entries, includeHidden),
    availableYears: getAvailableYears(entries, includeHidden),
    availableMonths: getAvailableMonths(entries, undefined, includeHidden),
    availableMonthsByYear: getAvailableMonthsByYear(entries, includeHidden),
  };
}
