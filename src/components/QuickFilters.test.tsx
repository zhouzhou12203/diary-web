import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickFilters } from './QuickFilters';
import { renderWithTheme } from '../test/renderWithTheme';
import type { DiaryEntry } from '../types';

const sampleEntries: DiaryEntry[] = [
  {
    id: 1,
    title: '公开散步',
    content: '公开记录',
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
    content: '隐藏记录',
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
    title: '隐藏旧年',
    content: '隐藏旧年记录',
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

describe('QuickFilters', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders for guests and excludes hidden entries from guest quick-filter results', async () => {
    const onFilterResults = vi.fn();
    const onClearFilter = vi.fn();

    renderWithTheme(
      <QuickFilters
        entries={sampleEntries}
        enabled
        isAdminAuthenticated={false}
        availableTags={['公开', '私密']}
        availableYears={['2026', '2025']}
        availableMonths={['12', '04']}
        availableMonthsByYear={{ '2026': ['12', '04'], '2025': ['12'] }}
        untaggedEntryCount={1}
        onFilterResults={onFilterResults}
        onClearFilter={onClearFilter}
      />
    );

    expect(screen.getByText('快速筛选')).toBeInTheDocument();
    onFilterResults.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /选择标签/i }));
    fireEvent.click(screen.getByRole('button', { name: '#公开' }));

    await waitFor(() => {
      expect(onFilterResults).toHaveBeenLastCalledWith([sampleEntries[0]]);
    });
  });

  it('sanitizes guest quick-filter options when props include hidden-only metadata', async () => {
    renderWithTheme(
      <QuickFilters
        entries={sampleEntries}
        enabled
        isAdminAuthenticated={false}
        availableTags={['公开', '私密']}
        availableYears={['2026', '2025']}
        availableMonths={['12', '04']}
        availableMonthsByYear={{ '2026': ['12', '04'], '2025': ['12'] }}
        untaggedEntryCount={1}
        onFilterResults={vi.fn()}
        onClearFilter={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /选择标签/i }));

    expect(screen.getAllByRole('button', { name: '#公开' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: '#私密' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /无标签 \(0\)/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '所有年份' }));

    expect(screen.getByRole('button', { name: '2026年' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2025年' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2026年' }));
    fireEvent.click(screen.getByRole('button', { name: '所有月份' }));

    expect(screen.getByRole('button', { name: '4月' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '12月' })).not.toBeInTheDocument();
  });
});
