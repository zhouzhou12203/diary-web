import type { DiaryEntry } from '../../types/index.ts';

export interface ArchiveSubGroup {
  key: string;
  title: string;
  entries: DiaryEntry[];
  count: number;
}

export interface ArchiveGroup {
  key: string;
  title: string;
  entries: DiaryEntry[];
  count: number;
  subGroups?: ArchiveSubGroup[];
}

export type ArchiveDisplayMode = 'list' | 'cards' | 'compact' | 'timeline';
export type ArchiveHeaderStyle = 'simple' | 'minimal' | 'timeline' | 'badge';
export type ArchiveGroupBy = 'year' | 'month' | 'week';
