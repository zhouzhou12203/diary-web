import { act, cleanup, fireEvent, screen } from '@testing-library/react';
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
    title: '隐藏冬天',
    content: '这篇属于隐藏内容，不应出现在访客搜索结果中',
    content_type: 'markdown',
    mood: 'neutral',
    weather: 'cloudy',
    tags: ['私密'],
    images: [],
    location: null,
    hidden: true,
    created_at: '2026-12-13T09:00:00.000Z',
    updated_at: '2026-12-13T09:00:00.000Z',
  },
  {
    id: 3,
    title: '隐藏项目',
    content: '这篇隐藏记录没有标签，也不应泄露年份和无标签统计',
    content_type: 'markdown',
    mood: 'sad',
    weather: 'rainy',
    tags: [],
    images: [],
    location: null,
    hidden: true,
    created_at: '2025-12-13T09:00:00.000Z',
    updated_at: '2025-12-13T09:00:00.000Z',
  },
];

describe('SearchBar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
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
        availableYears={['2026', '2025']}
        availableMonthsByYear={{ '2026': ['12', '04'], '2025': ['12'] }}
        untaggedEntryCount={1}
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

  it('sanitizes guest filter metadata when props include hidden-only tags and dates', () => {
    renderWithTheme(
      <SearchBar
        entries={sampleEntries}
        isAdminAuthenticated={false}
        availableTags={['公开', '私密']}
        availableYears={['2026', '2025']}
        availableMonthsByYear={{ '2026': ['12', '04'], '2025': ['12'] }}
        untaggedEntryCount={1}
        onSearchResults={vi.fn()}
        onClearSearch={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /筛选/i }));

    expect(screen.getByRole('option', { name: '#公开' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '#私密' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '无标签 (0)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '无标签 (1)' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2026年' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '2025年' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('年份'), { target: { value: '2026' } });

    expect(screen.getByRole('option', { name: '4月' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '12月' })).not.toBeInTheDocument();
  });
});
