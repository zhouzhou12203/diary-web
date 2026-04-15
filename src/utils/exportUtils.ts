import { Database, FileText } from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';
import { getEntryMoodLabel, getEntryWeatherLabel } from '../components/entry/entryMeta';
import type { DiaryEntry } from '../types/index.ts';

export type DiaryExportFormat = 'json' | 'txt';

interface DiaryExportPayloadOptions {
  entries: DiaryEntry[];
  exportType: string;
  includeHidden: boolean;
  exportedAt?: Date;
}

interface DiaryTextExportOptions extends DiaryExportPayloadOptions {}

export interface ExportFormatOption {
  value: DiaryExportFormat;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
}

const exportTypeFileSegments: Record<string, string> = {
  全部日记: 'all',
  搜索结果: 'search',
  筛选结果: 'filter',
};

const exportVersion = '1.0';
const zhCnLocale = 'zh-CN';

export const exportFormatOptions: ExportFormatOption[] = [
  {
    value: 'json',
    title: 'JSON 格式',
    description: '完整数据，可重新导入',
    icon: Database,
  },
  {
    value: 'txt',
    title: '文本格式',
    description: '纯文本，易于阅读',
    icon: FileText,
  },
];

function formatExportDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatExportTimestamp(value: string | Date): string {
  return new Date(value).toLocaleString(zhCnLocale);
}

function buildEntryTextBlock(entry: DiaryEntry, index: number): string {
  const sections = [
    `## ${index + 1}. ${entry.title || '无标题'}`,
    '',
    `📅 创建时间: ${formatExportTimestamp(entry.created_at!)}`,
  ];

  if (entry.mood && entry.mood !== 'neutral') {
    sections.push(`😊 心情: ${getEntryMoodLabel(entry.mood)}`);
  }

  if (entry.weather && entry.weather !== 'unknown') {
    sections.push(`🌤️ 天气: ${getEntryWeatherLabel(entry.weather)}`);
  }

  if (entry.tags && entry.tags.length > 0) {
    sections.push(`🏷️ 标签: ${entry.tags.map((tag) => `#${tag}`).join(' ')}`);
  }

  if (entry.location?.name) {
    sections.push(`📍 位置: ${entry.location.name}`);
  }

  sections.push('', entry.content, '', '-'.repeat(30), '');
  return sections.join('\n');
}

export function buildDiaryExportFileName(exportType: string, exportedAt = new Date()): string {
  const scope = exportTypeFileSegments[exportType] ?? 'custom';
  return `diary-${scope}-${formatExportDate(exportedAt)}`;
}

export function buildDiaryBackupFileName(exportedAt = new Date()): string {
  return `diary-backup-${formatExportDate(exportedAt)}`;
}

export function createDiaryExportPayload({
  entries,
  exportType,
  includeHidden,
  exportedAt = new Date(),
}: DiaryExportPayloadOptions) {
  return {
    entries,
    exportDate: exportedAt.toISOString(),
    exportType,
    totalCount: entries.length,
    includeHidden,
    version: exportVersion,
  };
}

export function createDiaryTextExport({
  entries,
  exportType,
  includeHidden,
  exportedAt = new Date(),
}: DiaryTextExportOptions): string {
  const header = [
    `# ${exportType}`,
    '',
    `导出时间: ${formatExportTimestamp(exportedAt)}`,
    `日记数量: ${entries.length} 条`,
    `包含隐藏日记: ${includeHidden ? '是' : '否'}`,
    '',
    '='.repeat(50),
    '',
  ];

  return [
    ...header,
    ...entries.flatMap((entry, index) => [buildEntryTextBlock(entry, index), '']),
  ].join('\n').trimEnd() + '\n';
}

export function downloadBlobFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
