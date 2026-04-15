import { useState } from 'react';
import type {
  ConfirmState,
  NotificationState,
  OperationState,
} from './adminPanelTypes';

const hiddenNotification: NotificationState = {
  message: '',
  type: 'success',
  visible: false,
};

export function useAdminPanelFeedback() {
  const [operationStates, setOperationStates] = useState<Record<number, OperationState>>({});
  const [notification, setNotification] = useState<NotificationState>(hiddenNotification);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const setOperationState = (entryId: number, state: OperationState) => {
    setOperationStates((previous) => {
      if (state === 'idle') {
        const { [entryId]: _unused, ...rest } = previous;
        return rest;
      }

      return { ...previous, [entryId]: state };
    });
  };

  const getOperationState = (entryId: number) => operationStates[entryId] || 'idle';

  const showOperationFeedback = (message: string, isError = false) => {
    setNotification({
      message,
      type: isError ? 'error' : 'success',
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

  const openConfirmDialog = (nextState: ConfirmState) => {
    setConfirmState(nextState);
  };

  const requestLogoutConfirm = () => {
    openConfirmDialog({ type: 'logout' });
  };

  const requestDeleteConfirm = (entryId: number, entryTitle: string) => {
    openConfirmDialog({
      type: 'delete',
      entryId,
      entryTitle,
    });
  };

  const clearConfirmState = () => {
    setConfirmState(null);
  };

  const closeConfirmDialog = () => {
    if (confirmLoading) {
      return;
    }

    clearConfirmState();
  };

  return {
    clearConfirmState,
    closeConfirmDialog,
    confirmLoading,
    confirmState,
    getOperationState,
    hideNotification,
    notification,
    requestDeleteConfirm,
    requestLogoutConfirm,
    setConfirmLoading,
    setOperationState,
    showOperationFeedback,
  };
}
