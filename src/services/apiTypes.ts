export interface SessionState {
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
}

export interface PublicSettingsResponse {
  passwordProtectionEnabled: boolean;
  quickFiltersEnabled: boolean;
  exportEnabled: boolean;
  archiveViewEnabled: boolean;
  welcomePageEnabled: boolean;
}

export interface AdminSettingsResponse extends PublicSettingsResponse {
  adminPasswordConfigured: boolean;
  appPasswordConfigured: boolean;
}
