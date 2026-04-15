import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';
import { renderWithTheme } from '../test/renderWithTheme';
import type { DiaryEntry } from '../types';

const sampleEntries: DiaryEntry[] = [
  {
    id: 1,
    title: '公开散步',
    content: '记录公开的公园散步',
    content_type: 'markdown',
    mood: 'happy',
    weather: 'sunny',
    tags: ['公开'],
    images: [],
    location: null,
    hidden: false,
    created_at: '2026-04-14T09:00:00.000Z',
    updated_at: '2026-04-14T09:00:00.000Z',
  },
  {
    id: 2,
    title: '隐藏项目',
    content: '这篇属于隐藏内容，不应出现在访客搜索结果中',
    content_type: 'markdown',
    mood: 'neutral',
    weather: 'cloudy',
    tags: ['私密'],
    images: [],
    location: null,
    hidden: true,
    created_at: '2026-04-13T09:00:00.000Z',
    updated_at: '2026-04-13T09:00:00.000Z',
  },
];

describe('SearchBar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders for guests and keeps hidden entries out of guest search results', () => {
    const onSearchResults = vi.fn();
    const onClearSearch = vi.fn();

    renderWithTheme(
      <SearchBar
        entries={sampleEntries}
        isAdminAuthenticated={false}
        availableTags={['公开', '私密']}
        availableYears={['2026']}
        availableMonthsByYear={{ '2026': ['04'] }}
        untaggedEntryCount={0}
        onSearchResults={onSearchResults}
        onClearSearch={onClearSearch}
      />
    );

    expect(screen.getByPlaceholderText('搜索标题、正文、标签，或直接按条件筛选')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    onSearchResults.mockClear();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '项目' } });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onSearchResults).toHaveBeenLastCalledWith([]);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '散步' } });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onSearchResults).toHaveBeenLastCalledWith([sampleEntries[0]]);
  });
});
