type EnvValueGetter = (key: 'MODE' | 'VITE_USE_MOCK_API') => string | undefined;

export class ApiModeStore {
  private static readonly FORCE_LOCAL_KEY = 'diary_force_local';
  private static readonly DISABLE_DEFAULTS_KEY = 'diary_disable_defaults';
  private static readonly ENTRY_STORAGE_KEY = 'diary_app_data';
  private static readonly SETTINGS_STORAGE_KEY = 'diary_app_settings';
  private static readonly APP_AUTH_KEY = 'diary-app-authenticated';
  private static readonly ADMIN_AUTH_KEY = 'diary-admin-authenticated';

  shouldUseMockService(getEnvValue: EnvValueGetter): boolean {
    const useMock = getEnvValue('VITE_USE_MOCK_API') === 'true';
    const forceLocal = localStorage.getItem(ApiModeStore.FORCE_LOCAL_KEY) === 'true';
    const mode = getEnvValue('MODE');

    return mode === 'mock' || useMock || forceLocal;
  }

  getStatus(useMockService: boolean): { useMockService: boolean; reason: string } {
    return {
      useMockService,
      reason: useMockService ? 'Mock服务' : '远程API服务',
    };
  }

  enableLocalMode(): void {
    localStorage.setItem(ApiModeStore.FORCE_LOCAL_KEY, 'true');
  }

  enableRemoteMode(): void {
    localStorage.removeItem(ApiModeStore.FORCE_LOCAL_KEY);
  }

  clearLocalData(): void {
    localStorage.removeItem(ApiModeStore.ENTRY_STORAGE_KEY);
    localStorage.removeItem(ApiModeStore.SETTINGS_STORAGE_KEY);
    localStorage.removeItem(ApiModeStore.APP_AUTH_KEY);
    localStorage.removeItem(ApiModeStore.ADMIN_AUTH_KEY);
    localStorage.setItem(ApiModeStore.DISABLE_DEFAULTS_KEY, 'true');
  }

  setDefaultDataEnabled(enabled: boolean): void {
    if (enabled) {
      localStorage.removeItem(ApiModeStore.DISABLE_DEFAULTS_KEY);
      return;
    }

    localStorage.setItem(ApiModeStore.DISABLE_DEFAULTS_KEY, 'true');
  }
}
