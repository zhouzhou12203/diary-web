import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';

interface ModalHeaderProps {
  title: ReactNode;
  onClose: () => void;
  icon?: ReactNode;
  actions?: ReactNode;
  padded?: 'sm' | 'md' | 'lg';
  titleId?: string;
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function ModalHeader({
  title,
  onClose,
  icon,
  actions,
  padded = 'lg',
  titleId,
}: ModalHeaderProps) {
  const { theme } = useThemeContext();

  return (
    <div
      className={`flex items-center justify-between border-b ${paddingClasses[padded]}`}
      style={{ borderColor: theme.colors.border }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <h2 id={titleId} className="text-xl font-semibold" style={{ color: theme.colors.text }}>
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={onClose}
          className="rounded-lg p-2 transition-colors hover:bg-opacity-80"
          style={{ backgroundColor: theme.colors.border }}
        >
          <X className="h-5 w-5" style={{ color: theme.colors.text }} />
        </button>
      </div>
    </div>
  );
}
