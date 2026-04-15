import type { DiaryEntry } from '../../types/index.ts';
import {
  formatTimelineDate,
  getSmartTimeDisplay,
  normalizeTimeString,
  type TimeDisplay,
} from '../../utils/timeUtils.ts';

export interface TimelineDateItem {
  type: 'date';
  key: string;
  data: {
    anchorId: string;
    entryCount: number;
    dateGroup: string;
    isFirst: boolean;
  };
}

export interface TimelineTimeItem {
  type: 'time';
  key: string;
  data: {
    timeDisplay: TimeDisplay;
  };
}

export interface TimelineEntryItem {
  type: 'entry';
  key: string;
  data: DiaryEntry;
}

export type TimelineListItem = TimelineDateItem | TimelineTimeItem | TimelineEntryItem;

function createDateAnchorId(dateGroup: string, dateIndex: number) {
  const normalized = dateGroup
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `timeline-date-${dateIndex}-${normalized || 'group'}`;
}

export function groupEntriesByDate(entries: DiaryEntry[]): Record<string, DiaryEntry[]> {
  const groups: Record<string, DiaryEntry[]> = {};

  entries.forEach((entry) => {
    if (!entry.created_at) {
      return;
    }

    const dateGroup = formatTimelineDate(entry.created_at);

    if (!groups[dateGroup]) {
      groups[dateGroup] = [];
    }

    groups[dateGroup].push(entry);
  });

  Object.keys(groups).forEach((key) => {
    groups[key].sort(
      (a, b) =>
        new Date(normalizeTimeString(b.created_at!)).getTime() -
        new Date(normalizeTimeString(a.created_at!)).getTime()
    );
  });

  return groups;
}

export function createTimelineItems(entries: DiaryEntry[]): TimelineListItem[] {
  const groupedEntries = groupEntriesByDate(entries);
  const items: TimelineListItem[] = [];

  Object.entries(groupedEntries).forEach(([dateGroup, groupedDateEntries], dateIndex) => {
    items.push({
      type: 'date',
      key: `date-${dateGroup}`,
      data: {
        anchorId: createDateAnchorId(dateGroup, dateIndex),
        entryCount: groupedDateEntries.length,
        dateGroup,
        isFirst: dateIndex === 0,
      },
    });

    groupedDateEntries.forEach((entry, entryIndex) => {
      if (entryIndex > 0) {
        items.push({
          type: 'time',
          key: `time-${entry.id}`,
          data: {
            timeDisplay: getSmartTimeDisplay(entry.created_at!),
          },
        });
      }

      items.push({
        type: 'entry',
        key: `entry-${entry.id}`,
        data: entry,
      });
    });
  });

  return items;
}
