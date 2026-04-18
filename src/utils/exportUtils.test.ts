import { describe, expect, it } from 'vitest';
import type { DiaryEntry } from '../types/index.ts';
import {
  buildDiaryBackupFileName,
  buildDiaryExportFileName,
  createDiaryExportPayload,
  createDiaryTextExport,
  packageDiaryEntryImagesForExport,
} from './exportUtils';

const sampleEntries: DiaryEntry[] = [
  {
    id: 1,
    title: '春日记录',
    content: '今天阳光很好。',
    content_type: 'markdown',
    mood: 'happy',
    weather: 'sunny',
    tags: ['生活', '散步'],
    images: [],
    hidden: false,
    created_at: '2026-04-12T10:00:00.000Z',
    updated_at: '2026-04-12T10:00:00.000Z',
    location: {
      name: '上海徐汇',
      latitude: 31.188,
      longitude: 121.437,
    },
  },
];

describe('exportUtils', () => {
  it('builds stable export file names', () => {
    const date = new Date('2026-04-12T08:00:00.000Z');

    expect(buildDiaryExportFileName('全部日记', date)).toBe('diary-all-2026-04-12');
    expect(buildDiaryExportFileName('搜索结果', date)).toBe('diary-search-2026-04-12');
    expect(buildDiaryExportFileName('自定义结果', date)).toBe('diary-custom-2026-04-12');
    expect(buildDiaryBackupFileName(date)).toBe('diary-backup-2026-04-12');
  });

  it('creates export payload with shared metadata', () => {
    const exportedAt = new Date('2026-04-12T08:00:00.000Z');
    expect(createDiaryExportPayload({
      entries: sampleEntries,
      exportType: '全部日记',
      includeHidden: true,
      exportedAt,
    })).toEqual({
      entries: sampleEntries,
      exportDate: '2026-04-12T08:00:00.000Z',
      exportType: '全部日记',
      totalCount: 1,
      includeHidden: true,
      version: '1.0',
    });
  });

  it('renders text exports with metadata and entry details', () => {
    const text = createDiaryTextExport({
      entries: sampleEntries,
      exportType: '搜索结果',
      includeHidden: false,
      exportedAt: new Date('2026-04-12T08:00:00.000Z'),
    });

    expect(text).toContain('# 搜索结果');
    expect(text).toContain('日记数量: 1 条');
    expect(text).toContain('包含隐藏日记: 否');
    expect(text).toContain('## 1. 春日记录');
    expect(text).toContain('😊 心情: 开心');
    expect(text).toContain('🌤️ 天气: 晴天');
    expect(text).toContain('🏷️ 标签: #生活 #散步');
    expect(text).toContain('📍 位置: 上海徐汇');
    expect(text).toContain('今天阳光很好。');
  });

  it('packages image urls into embedded data urls for portable exports', async () => {
    const result = await packageDiaryEntryImagesForExport({
      entries: [{
        ...sampleEntries[0],
        images: ['/api/images/diary%2Fsample.png'],
      }],
      baseUrl: 'https://example.com',
      fetchImpl: async (input) => {
        const url = input instanceof Request ? input.url : String(input);
        expect(url).toBe('https://example.com/api/images/diary%2Fsample.png');

        return new Response(new Uint8Array([104, 101, 108, 108, 111]), {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
          },
        });
      },
    });

    expect(result.packagedImageCount).toBe(1);
    expect(result.failedImageCount).toBe(0);
    expect(result.entries[0]?.images?.[0]).toBe('data:image/png;base64,aGVsbG8=');
  });

  it('keeps original image urls when packaging fails', async () => {
    const result = await packageDiaryEntryImagesForExport({
      entries: [{
        ...sampleEntries[0],
        images: ['https://cdn.example.com/sample.png'],
      }],
      fetchImpl: async () => new Response('missing', { status: 404 }),
    });

    expect(result.packagedImageCount).toBe(0);
    expect(result.failedImageCount).toBe(1);
    expect(result.entries[0]?.images).toEqual(['https://cdn.example.com/sample.png']);
  });
});
