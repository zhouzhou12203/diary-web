import { useThemeContext } from '../ThemeProvider';

interface MapPickerLegendProps {
  isVisible: boolean;
  hasUserLocation: boolean;
}

export function MapPickerLegend({ isVisible, hasUserLocation }: MapPickerLegendProps) {
  const { theme } = useThemeContext();

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="absolute bottom-4 left-4 rounded-lg bg-white bg-opacity-95 px-3 py-2 text-xs shadow-lg"
      style={{ color: theme.colors.textSecondary }}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full border border-white bg-blue-500" />
            <span>您的位置</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full border border-white bg-red-500" />
            <span>选择位置</span>
          </div>
        </div>
        <div className="border-t pt-1 text-xs opacity-70">
          💡 点击地图选择位置 | 使用定位按钮找到自己
        </div>
        {hasUserLocation && <div className="text-xs opacity-60">🎯 高精度定位已启用</div>}
      </div>
    </div>
  );
}
