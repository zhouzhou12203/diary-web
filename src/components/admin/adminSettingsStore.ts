import { apiService } from '../../services/api';
import type {
  AdminSettings,
  AdminInterfaceSettings,
  PasswordSettings,
} from './adminPanelTypes';

interface LoadedAdminPanelSettings {
  settings: AdminSettings;
  passwordSettings: PasswordSettings;
  interfaceSettings: AdminInterfaceSettings;
}

function createInterfaceSettingsResponse(settings: Awaited<ReturnType<typeof apiService.getAdminSettings>>): AdminInterfaceSettings {
  return {
    quickFilters: { enabled: settings.quickFiltersEnabled },
    export: { enabled: settings.exportEnabled },
    archiveView: { enabled: settings.archiveViewEnabled },
  };
}

export async function loadAdminPanelSettings(): Promise<LoadedAdminPanelSettings> {
  const settings = await apiService.getAdminSettings();

  return {
    settings: {
      adminPasswordConfigured: settings.adminPasswordConfigured,
      passwordProtection: settings.passwordProtectionEnabled,
      showHiddenEntries: false,
      welcomePageEnabled: settings.welcomePageEnabled,
    },
    passwordSettings: {
      enabled: settings.passwordProtectionEnabled,
      configured: settings.appPasswordConfigured,
    },
    interfaceSettings: createInterfaceSettingsResponse(settings),
  };
}

export async function persistAdminSettings(settings: AdminSettings) {
  await Promise.all([
    apiService.setSetting('app_password_enabled', settings.passwordProtection.toString()),
    apiService.setSetting('welcome_page_enabled', settings.welcomePageEnabled.toString()),
  ]);
}

export async function persistPasswordSettings(settings: PasswordSettings) {
  await apiService.setSetting('app_password_enabled', settings.enabled.toString());
}

export async function persistFeatureToggle(key: 'quick_filters_enabled' | 'export_enabled' | 'archive_view_enabled', enabled: boolean) {
  await apiService.setSetting(key, enabled.toString());
}

export type { LoadedAdminPanelSettings };
