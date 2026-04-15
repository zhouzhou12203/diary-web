import type { ApiResponse } from '../types/index.ts';
import type { SessionState } from './apiTypes.ts';

type RemoteApiClientOptions = {
  apiBaseUrl?: string;
  onSessionChange?: (session: SessionState) => void;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export class RemoteApiClient {
  private readonly apiBaseUrl: string;
  private readonly onSessionChange?: (session: SessionState) => void;
  private unauthorizedSessionRefreshPromise: Promise<void> | null = null;

  constructor(options: RemoteApiClientOptions = {}) {
    this.apiBaseUrl = options.apiBaseUrl ?? '/api';
    this.onSessionChange = options.onSessionChange;
  }

  private emitSessionChange(session: SessionState) {
    this.onSessionChange?.(session);
  }

  private async performRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      credentials: 'same-origin',
      ...options,
    });

    if (!response.ok) {
      let message = `HTTP error! status: ${response.status}`;

      try {
        const errorPayload = await response.json() as ApiResponse<unknown>;
        if (errorPayload.error) {
          message = errorPayload.error;
        }
      } catch {
        // Ignore invalid JSON error bodies.
      }

      if (response.status === 401) {
        await this.refreshSessionAfterUnauthorized(endpoint);
      }

      throw new ApiRequestError(message, response.status);
    }

    return response.json();
  }

  private async refreshSessionAfterUnauthorized(endpoint: string) {
    if (endpoint === '/auth/login') {
      return;
    }

    if (this.unauthorizedSessionRefreshPromise) {
      await this.unauthorizedSessionRefreshPromise;
      return;
    }

    this.unauthorizedSessionRefreshPromise = (async () => {
      try {
        const response = await fetch(`${this.apiBaseUrl}/auth/session`, {
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to refresh session');
        }

        const payload = await response.json() as ApiResponse<SessionState>;
        const session = payload.success && payload.data
          ? payload.data
          : { isAuthenticated: false, isAdminAuthenticated: false };
        this.emitSessionChange(session);
      } catch {
        this.emitSessionChange({
          isAuthenticated: false,
          isAdminAuthenticated: false,
        });
      }
    })().finally(() => {
      this.unauthorizedSessionRefreshPromise = null;
    });

    await this.unauthorizedSessionRefreshPromise;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers);
    const body = options.body;

    if (!(body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return this.performRequest<T>(endpoint, {
      ...options,
      headers,
    });
  }
}
