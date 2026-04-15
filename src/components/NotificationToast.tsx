import { useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function NotificationToast({ message, type, onClose }: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 max-w-sm"
      style={{
        top: 'max(1rem, var(--safe-area-top))',
        right: 'max(1rem, var(--safe-area-right))',
      }}
    >
      <div
        className={`p-4 rounded-lg shadow-lg border-l-4 ${
          type === 'success'
            ? 'bg-green-50 border-green-400 text-green-800'
            : 'bg-red-50 border-red-400 text-red-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
