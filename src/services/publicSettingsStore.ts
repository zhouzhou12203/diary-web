import type { PublicSettingsResponse } from './apiTypes.ts';
import { applyPublicSettingsMutation } from './publicSettingsSchema.ts';

const SETTINGS_CACHE_TTL_MS = 8000;

export class PublicSettingsStore {
  private cache: { value: PublicSettingsResponse; expiresAt: number } | null = null;
  private requestPromise: Promise<PublicSettingsResponse> | null = null;

  getSnapshot(): PublicSettingsResponse | undefined {
    return this.cache?.value;
  }

  getCached(now = Date.now()): PublicSettingsResponse | null {
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.value;
    }

    return null;
  }

  getPending(): Promise<PublicSettingsResponse> | null {
    return this.requestPromise;
  }

  remember(value: PublicSettingsResponse, now = Date.now()): PublicSettingsResponse {
    this.cache = {
      value,
      expiresAt: now + SETTINGS_CACHE_TTL_MS,
    };

    return value;
  }

  track(requestPromise: Promise<PublicSettingsResponse>): Promise<PublicSettingsResponse> {
    this.requestPromise = requestPromise.finally(() => {
      this.requestPromise = null;
    });

    return this.requestPromise;
  }

  clear(): void {
    this.cache = null;
    this.requestPromise = null;
  }

  applyMutation(previousSettings: PublicSettingsResponse | undefined, key: string, value: string): void {
    if (!previousSettings) {
      return;
    }

    this.cache = {
      value: applyPublicSettingsMutation(previousSettings, key, value),
      expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
    };
  }
}
