import { Loader } from 'lucide-react';
import { useThemeContext } from '../ThemeProvider';

interface MapPickerStatusOverlayProps {
  isLoadingMap: boolean;
  isMapLoaded: boolean;
  mapError: string | null;
  isMobile: boolean;
  onRetry: () => void;
  onRefresh: () => void;
}

export function MapPickerStatusOverlay({
  isLoadingMap,
  isMapLoaded,
  mapError,
  isMobile,
  onRetry,
  onRefresh,
}: MapPickerStatusOverlayProps) {
  const { theme } = useThemeContext();

  if (!isLoadingMap && isMapLoaded && !mapError) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
      <div className="p-4 text-center">
        {mapError ? (
          <>
            <div className="mb-4 text-4xl">⚠️</div>
            <div className={`mb-2 font-medium ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: theme.colors.text }}>
              地图加载失败
            </div>
            <div className={`mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: theme.colors.textSecondary }}>
              {mapError}
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={onRetry}
                className={`rounded-md font-medium transition-colors ${
                  isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
                }`}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                }}
              >
                重试
              </button>
              <button
                onClick={onRefresh}
                className={`rounded-md font-medium transition-colors ${
                  isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
                }`}
                style={{
                  backgroundColor: theme.colors.textSecondary,
                  color: 'white',
                }}
              >
                刷新页面
              </button>
            </div>
          </>
        ) : (
          <>
            <Loader
              className={`mx-auto mb-2 animate-spin ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}
              style={{ color: theme.colors.primary }}
            />
            <div className={isMobile ? 'text-xs' : 'text-sm'} style={{ color: theme.colors.textSecondary }}>
              {isLoadingMap ? '正在获取位置...' : '正在加载地图...'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
