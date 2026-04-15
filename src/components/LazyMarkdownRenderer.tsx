import { lazy, Suspense } from 'react';
import { useThemeContext } from './ThemeProvider';

const MarkdownRenderer = lazy(() =>
  import('./MarkdownRenderer').then((module) => ({ default: module.MarkdownRenderer }))
);

interface LazyMarkdownRendererProps {
  content: string;
  className?: string;
}

export function LazyMarkdownRenderer({ content, className = '' }: LazyMarkdownRendererProps) {
  const { theme } = useThemeContext();

  return (
    <Suspense
      fallback={
        <div
          className={className}
          style={{
            color: theme.colors.textSecondary,
            lineHeight: 1.9,
          }}
        >
          正在加载内容排版...
        </div>
      }
    >
      <MarkdownRenderer content={content} className={className} />
    </Suspense>
  );
}
