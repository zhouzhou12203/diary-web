import type { ReactNode } from 'react';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightText(text: string, query: string, highlightClassName = 'search-highlight'): ReactNode {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'ig');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={`${part}-${index}`} className={highlightClassName}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function buildHighlightedExcerpt(content: string, query: string, radius = 52) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedContent = content.toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  const matchIndex = normalizedContent.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return null;
  }

  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(content.length, matchIndex + normalizedQuery.length + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < content.length ? '...' : '';

  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}
