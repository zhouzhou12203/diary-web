import { ThemeConfig } from '../../hooks/useTheme';
import {
  ArchiveDisplayMode,
  ArchiveHeaderStyle,
} from './archiveTypes';

const headerStyleOptions: Array<{ value: ArchiveHeaderStyle; label: string }> = [
  { value: 'simple', label: '简洁' },
  { value: 'minimal', label: '极简' },
  { value: 'timeline', label: '时间轴' },
  { value: 'badge', label: '标签' },
];

const displayModeOptions: Array<{ value: ArchiveDisplayMode; label: string; title: string }> = [
  { value: 'list', label: '列表', title: '列表模式' },
  { value: 'cards', label: '卡片', title: '卡片模式' },
  { value: 'compact', label: '紧凑', title: '紧凑模式' },
  { value: 'timeline', label: '时间线', title: '时间线模式' },
];

interface ArchiveControlsProps {
  theme: ThemeConfig;
  displayMode: ArchiveDisplayMode;
  headerStyle: ArchiveHeaderStyle;
  useNaturalTime: boolean;
  expandedAll: boolean;
  onDisplayModeChange: (mode: ArchiveDisplayMode) => void;
  onHeaderStyleChange: (style: ArchiveHeaderStyle) => void;
  onUseNaturalTimeChange: (value: boolean) => void;
  onToggleExpandAll: () => void;
}

export function ArchiveControls({
  theme,
  displayMode,
  headerStyle,
  useNaturalTime,
  expandedAll,
  onDisplayModeChange,
  onHeaderStyleChange,
  onUseNaturalTimeChange,
  onToggleExpandAll,
}: ArchiveControlsProps) {
  const controlSurfaceStyle = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
  };

  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="archive-header-style" className="text-sm font-medium" style={{ color: theme.colors.text }}>
            标题样式:
          </label>
          <select
            id="archive-header-style"
            value={headerStyle}
            onChange={(event) => onHeaderStyleChange(event.target.value as ArchiveHeaderStyle)}
            className="rounded border px-2 py-1 text-sm"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          >
            {headerStyleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="archive-natural-time" className="flex cursor-pointer items-center gap-2">
            <input
              id="archive-natural-time"
              type="checkbox"
              checked={useNaturalTime}
              onChange={(event) => onUseNaturalTimeChange(event.target.checked)}
              style={{ accentColor: theme.colors.primary }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: useNaturalTime ? theme.colors.primary : theme.colors.text }}
            >
              自然语言时间 {useNaturalTime ? '(本周、上周)' : '(七月第X周)'}
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={onToggleExpandAll}
          className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5"
          style={{
            ...controlSurfaceStyle,
            color: theme.colors.text,
          }}
        >
          {expandedAll ? '全部收起' : '全部展开'}
        </button>
      </div>

      <div
        className="flex items-center gap-1 rounded-lg p-1"
        role="toolbar"
        aria-label="归档展示模式"
        style={controlSurfaceStyle}
      >
        {displayModeOptions.map((option) => {
          const isSelected = displayMode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onDisplayModeChange(option.value)}
              aria-pressed={isSelected}
              className={`rounded-md p-2 transition-colors ${isSelected ? 'shadow-sm' : ''}`}
              style={{
                backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                color: isSelected ? 'white' : theme.colors.textSecondary,
              }}
              title={option.title}
            >
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
