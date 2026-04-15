import { useEffect, useState } from 'react';
import type {
  AdminSettings,
  AdminAuthenticatedSettingsState,
  AdminInterfaceSettings,
  InterfaceFeatureKey,
  PasswordSettings,
} from './adminPanelTypes';
import { loadAdminPanelSettings } from './adminSettingsStore';
import { createDefaultInterfaceSettings } from './adminPanelSettingsSchema';
import { isUnauthorizedAdminPanelError } from './adminPanelHelpers';
import { debugError } from '../../utils/logger.ts';

interface UseAdminPanelSettingsOptions {
  isAuthenticated: boolean;
  isOpen: boolean;
  onUnauthorized: () => void;
}

export function useAdminPanelSettings({
  isAuthenticated,
  isOpen,
  onUnauthorized,
}: UseAdminPanelSettingsOptions) {
  const [settingsState, setSettingsState] = useState<AdminAuthenticatedSettingsState>({
    settings: {
      passwordProtection: false,
      adminPasswordConfigured: false,
      showHiddenEntries: false,
      welcomePageEnabled: true,
    },
    showPasswordSettings: false,
    passwordSettings: { enabled: false, configured: false },
    showAppPasswordSettings: false,
    newAppPassword: '',
    newPassword: '',
    interfaceSettings: createDefaultInterfaceSettings(),
  });

  const updateSettings = (updater: (previous: AdminSettings) => AdminSettings) => {
    setSettingsState((previous) => ({
      ...previous,
      settings: updater(previous.settings),
    }));
  };

  const updatePasswordSettings = (updater: (previous: PasswordSettings) => PasswordSettings) => {
    setSettingsState((previous) => ({
      ...previous,
      passwordSettings: updater(previous.passwordSettings),
    }));
  };

  const updateInterfaceSetting = (
    key: InterfaceFeatureKey,
    updater: (previous: AdminInterfaceSettings[InterfaceFeatureKey]) => AdminInterfaceSettings[InterfaceFeatureKey]
  ) => {
    setSettingsState((previous) => ({
      ...previous,
      interfaceSettings: {
        ...previous.interfaceSettings,
        [key]: updater(previous.interfaceSettings[key]),
      },
    }));
  };

  const loadSettings = async () => {
    try {
      const loadedSettings = await loadAdminPanelSettings();
      setSettingsState((previous) => ({
        ...previous,
        settings: loadedSettings.settings,
        passwordSettings: loadedSettings.passwordSettings,
        interfaceSettings: loadedSettings.interfaceSettings,
      }));
    } catch (error) {
      if (isUnauthorizedAdminPanelError(error)) {
        onUnauthorized();
      }

      debugError('加载设置失败:', error);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      void loadSettings();
    }
  }, [isAuthenticated, isOpen]);

  return {
    closeAppPasswordSettings: () => {
      setSettingsState((previous) => ({ ...previous, showAppPasswordSettings: false }));
    },
    closePasswordSettings: () => {
      setSettingsState((previous) => ({ ...previous, showPasswordSettings: false }));
    },
    loadSettings,
    setNewAppPassword: (newAppPassword: string) => {
      setSettingsState((previous) => ({ ...previous, newAppPassword }));
    },
    setNewPassword: (newPassword: string) => {
      setSettingsState((previous) => ({ ...previous, newPassword }));
    },
    settingsState,
    toggleAppPasswordSettings: () => {
      setSettingsState((previous) => ({
        ...previous,
        showAppPasswordSettings: !previous.showAppPasswordSettings,
      }));
    },
    togglePasswordSettings: () => {
      setSettingsState((previous) => ({
        ...previous,
        showPasswordSettings: !previous.showPasswordSettings,
      }));
    },
    updateInterfaceSetting,
    updatePasswordSettings,
    updateSettings,
  };
}
