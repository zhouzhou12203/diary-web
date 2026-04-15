import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
    title: '隐藏项目',
    content: '隐藏记录',
    content_type: 'markdown',
    mood: 'neutral',
    weather: 'cloudy',
    tags: ['公开'],
    images: [],
    location: null,
    hidden: true,
    created_at: '2026-04-13T09:00:00.000Z',
    updated_at: '2026-04-13T09:00:00.000Z',
  },
];

describe('QuickFilters', () => {
  it('renders for guests and excludes hidden entries from guest quick-filter results', async () => {
    const onFilterResults = vi.fn();
    const onClearFilter = vi.fn();

    renderWithTheme(
      <QuickFilters
        entries={sampleEntries}
        enabled
        isAdminAuthenticated={false}
        availableTags={['公开']}
        availableYears={['2026']}
        availableMonths={['04']}
        availableMonthsByYear={{ '2026': ['04'] }}
        untaggedEntryCount={0}
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
});
