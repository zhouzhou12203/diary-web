import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

import type { DiaryEntry } from '../types/index.ts';
import type { SessionState } from './apiTypes.ts';

const DATA_ROOT = 'diary-local';
const ENTRIES_FILE_PATH = `${DATA_ROOT}/entries.json`;
const SETTINGS_FILE_PATH = `${DATA_ROOT}/settings.json`;
const SESSION_FILE_PATH = `${DATA_ROOT}/session.json`;
const RUNTIME_FILE_PATH = `${DATA_ROOT}/runtime.json`;

type RuntimeState = {
  disableDefaults: boolean;
};

type StorageKeys = {
  entries: string;
  settings: string;
  appAuth: string;
  adminAuth: string;
  disableDefaults: string;
};

function hasLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStorageJson<T>(key: string): T | null {
  if (!hasLocalStorage()) {
    return null;
  }

  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) as T : null;
  } catch {
    return null;
  }
}

function readStorageFlag(key: string) {
  return hasLocalStorage() && localStorage.getItem(key) === 'true';
}

function isQuotaExceededError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
  }

  if (error instanceof Error) {
    return /quota|storage.*full|exceeded/i.test(error.message);
  }

  return false;
}

function writeStorageItem(key: string, value: string, quotaMessage: string) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error(quotaMessage);
    }

    throw error;
  }
}

function isSessionState(value: unknown): value is SessionState {
  return isRecord(value) &&
    typeof value.isAuthenticated === 'boolean' &&
    typeof value.isAdminAuthenticated === 'boolean';
}

function isRuntimeState(value: unknown): value is RuntimeState {
  return isRecord(value) && typeof value.disableDefaults === 'boolean';
}

async function readNativeJson<T>(path: string): Promise<T | null> {
  try {
    const result = await Filesystem.readFile({
      path,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    const raw = typeof result.data === 'string' ? result.data : '';
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

async function writeNativeJson(path: string, value: unknown): Promise<void> {
  await Filesystem.writeFile({
    path,
    directory: Directory.Data,
    data: JSON.stringify(value),
    encoding: Encoding.UTF8,
    recursive: true,
  });
}

async function deleteNativeFile(path: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path,
      directory: Directory.Data,
    });
  } catch {
    // Ignore missing files when resetting local state.
  }
}

export class LocalDataStore {
  private readonly storageKeys: StorageKeys;

  constructor(storageKeys: StorageKeys) {
    this.storageKeys = storageKeys;
  }

  private isNativeFilesystemRuntime(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Filesystem');
  }

  private async readEntriesFromNative(): Promise<DiaryEntry[] | null> {
    const nativeEntries = await readNativeJson<DiaryEntry[]>(ENTRIES_FILE_PATH);
    if (Array.isArray(nativeEntries)) {
      return nativeEntries;
    }

    const legacyEntries = readStorageJson<DiaryEntry[]>(this.storageKeys.entries);
    if (Array.isArray(legacyEntries)) {
      await writeNativeJson(ENTRIES_FILE_PATH, legacyEntries);
      return legacyEntries;
    }

    return null;
  }

  private async readSettingsFromNative(): Promise<Record<string, string> | null> {
    const nativeSettings = await readNativeJson<Record<string, string>>(SETTINGS_FILE_PATH);
    if (isRecord(nativeSettings)) {
      return nativeSettings as Record<string, string>;
    }

    const legacySettings = readStorageJson<Record<string, string>>(this.storageKeys.settings);
    if (isRecord(legacySettings)) {
      await writeNativeJson(SETTINGS_FILE_PATH, legacySettings);
      return legacySettings as Record<string, string>;
    }

    return null;
  }

  private async readSessionFromNative(): Promise<SessionState | null> {
    const nativeSession = await readNativeJson<SessionState>(SESSION_FILE_PATH);
    if (isSessionState(nativeSession)) {
      return nativeSession;
    }

    const legacySession: SessionState = {
      isAuthenticated: readStorageFlag(this.storageKeys.appAuth) || readStorageFlag(this.storageKeys.adminAuth),
      isAdminAuthenticated: readStorageFlag(this.storageKeys.adminAuth),
    };

    if (legacySession.isAuthenticated || legacySession.isAdminAuthenticated) {
      await writeNativeJson(SESSION_FILE_PATH, legacySession);
      return legacySession;
    }

    return null;
  }

  private async readRuntimeFromNative(): Promise<RuntimeState | null> {
    const nativeRuntime = await readNativeJson<RuntimeState>(RUNTIME_FILE_PATH);
    if (isRuntimeState(nativeRuntime)) {
      return nativeRuntime;
    }

    const legacyRuntime: RuntimeState = {
      disableDefaults: readStorageFlag(this.storageKeys.disableDefaults),
    };
    if (legacyRuntime.disableDefaults) {
      await writeNativeJson(RUNTIME_FILE_PATH, legacyRuntime);
      return legacyRuntime;
    }

    return null;
  }

  async getEntries(getDefaultEntries: () => DiaryEntry[]): Promise<DiaryEntry[]> {
    if (this.isNativeFilesystemRuntime()) {
      const storedEntries = await this.readEntriesFromNative();
      if (storedEntries) {
        return storedEntries;
      }

      return (await this.isDefaultDataDisabled()) ? [] : getDefaultEntries();
    }

    const storedEntries = readStorageJson<DiaryEntry[]>(this.storageKeys.entries);
    if (Array.isArray(storedEntries)) {
      return storedEntries;
    }

    return readStorageFlag(this.storageKeys.disableDefaults) ? [] : getDefaultEntries();
  }

  async saveEntries(entries: DiaryEntry[]): Promise<void> {
    if (this.isNativeFilesystemRuntime()) {
      await writeNativeJson(ENTRIES_FILE_PATH, entries);
      return;
    }

    if (hasLocalStorage()) {
      writeStorageItem(
        this.storageKeys.entries,
        JSON.stringify(entries),
        '浏览器本地存储空间已满，当前 Web 端无法继续保存这批日记。请减少导入体积、清理本地数据，或改用 APK 导入/同步。'
      );
    }
  }

  async getSettings(getDefaultSettings: () => Record<string, string>): Promise<Record<string, string>> {
    if (this.isNativeFilesystemRuntime()) {
      const storedSettings = await this.readSettingsFromNative();
      return storedSettings ?? getDefaultSettings();
    }

    const storedSettings = readStorageJson<Record<string, string>>(this.storageKeys.settings);
    return isRecord(storedSettings) ? storedSettings as Record<string, string> : getDefaultSettings();
  }

  async saveSettings(settings: Record<string, string>): Promise<void> {
    if (this.isNativeFilesystemRuntime()) {
      await writeNativeJson(SETTINGS_FILE_PATH, settings);
      return;
    }

    if (hasLocalStorage()) {
      writeStorageItem(
        this.storageKeys.settings,
        JSON.stringify(settings),
        '浏览器本地存储空间已满，当前 Web 端无法保存设置。请清理浏览器站点数据后重试。'
      );
    }
  }

  async getSession(): Promise<SessionState> {
    if (this.isNativeFilesystemRuntime()) {
      return (await this.readSessionFromNative()) ?? {
        isAuthenticated: false,
        isAdminAuthenticated: false,
      };
    }

    const isAdminAuthenticated = readStorageFlag(this.storageKeys.adminAuth);
    const isAuthenticated = isAdminAuthenticated || readStorageFlag(this.storageKeys.appAuth);

    return {
      isAuthenticated,
      isAdminAuthenticated,
    };
  }

  async saveSession(session: SessionState): Promise<void> {
    if (this.isNativeFilesystemRuntime()) {
      await writeNativeJson(SESSION_FILE_PATH, session);
      return;
    }

    if (!hasLocalStorage()) {
      return;
    }

    writeStorageItem(
      this.storageKeys.appAuth,
      String(session.isAuthenticated),
      '浏览器本地存储空间已满，当前 Web 端无法保存登录状态。请清理浏览器站点数据后重试。'
    );
    writeStorageItem(
      this.storageKeys.adminAuth,
      String(session.isAdminAuthenticated),
      '浏览器本地存储空间已满，当前 Web 端无法保存登录状态。请清理浏览器站点数据后重试。'
    );
  }

  async clearSession(): Promise<void> {
    if (this.isNativeFilesystemRuntime()) {
      await deleteNativeFile(SESSION_FILE_PATH);
    }

    if (!hasLocalStorage()) {
      return;
    }

    localStorage.removeItem(this.storageKeys.appAuth);
    localStorage.removeItem(this.storageKeys.adminAuth);
  }

  async isDefaultDataDisabled(): Promise<boolean> {
    if (this.isNativeFilesystemRuntime()) {
      return (await this.readRuntimeFromNative())?.disableDefaults ?? false;
    }

    return readStorageFlag(this.storageKeys.disableDefaults);
  }

  async setDefaultDataEnabled(enabled: boolean): Promise<void> {
    if (this.isNativeFilesystemRuntime()) {
      if (enabled) {
        await deleteNativeFile(RUNTIME_FILE_PATH);
      } else {
        await writeNativeJson(RUNTIME_FILE_PATH, { disableDefaults: true } satisfies RuntimeState);
      }
    }

    if (!hasLocalStorage()) {
      return;
    }

    if (enabled) {
      localStorage.removeItem(this.storageKeys.disableDefaults);
      return;
    }

    localStorage.setItem(this.storageKeys.disableDefaults, 'true');
  }

  async clearCoreData(): Promise<void> {
    if (this.isNativeFilesystemRuntime()) {
      await Promise.all([
        deleteNativeFile(ENTRIES_FILE_PATH),
        deleteNativeFile(SETTINGS_FILE_PATH),
        deleteNativeFile(SESSION_FILE_PATH),
        deleteNativeFile(RUNTIME_FILE_PATH),
      ]);
    }

    if (!hasLocalStorage()) {
      return;
    }

    localStorage.removeItem(this.storageKeys.entries);
    localStorage.removeItem(this.storageKeys.settings);
    localStorage.removeItem(this.storageKeys.appAuth);
    localStorage.removeItem(this.storageKeys.adminAuth);
  }
}
