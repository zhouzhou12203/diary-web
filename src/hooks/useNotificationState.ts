import { useState } from 'react';

export interface ToastNotificationState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

const hiddenNotification: ToastNotificationState = {
  message: '',
  type: 'success',
  visible: false,
};

export function useNotificationState() {
  const [notification, setNotification] = useState<ToastNotificationState>(hiddenNotification);

  const showNotification = (message: string, type: ToastNotificationState['type']) => {
    setNotification({
      message,
      type,
      visible: true,
    });
  };

  const hideNotification = () => {
    setNotification((previous) => (
      previous.visible
        ? { ...previous, visible: false }
        : previous
    ));
  };

  return {
    hideNotification,
    notification,
    showNotification,
  };
}
