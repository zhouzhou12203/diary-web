import { MapPin } from 'lucide-react';
import type { LocationInfo } from '../../types/index.ts';
import { useThemeContext } from '../ThemeProvider';

interface MapPickerSelectedLocationProps {
  location: LocationInfo | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MapPickerSelectedLocation({
  location,
  onCancel,
  onConfirm,
}: MapPickerSelectedLocationProps) {
  const { theme } = useThemeContext();

  if (!location) {
    return null;
  }

  return (
    <div className="border-t p-4" style={{ borderColor: theme.colors.border }}>
      <div className="mb-2 flex items-center gap-2">
        <MapPin className="h-4 w-4" style={{ color: theme.colors.primary }} />
        <span className="font-medium" style={{ color: theme.colors.text }}>
          {location.name}
        </span>
      </div>
      <div className="mb-3 text-sm opacity-70" style={{ color: theme.colors.textSecondary }}>
        {location.address}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border px-4 py-2"
          style={{
            borderColor: theme.colors.border,
            color: theme.colors.text,
          }}
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md px-4 py-2 font-medium text-white"
          style={{ backgroundColor: theme.colors.primary }}
        >
          确认选择
        </button>
      </div>
    </div>
  );
}
