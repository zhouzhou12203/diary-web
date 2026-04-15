export function createEntryPreview(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[#>*`_-]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getEntryPreview(content: string, maxLength: number) {
  const preview = createEntryPreview(content);

  if (preview.length <= maxLength) {
    return preview;
  }

  return `${preview.slice(0, maxLength)}...`;
}
