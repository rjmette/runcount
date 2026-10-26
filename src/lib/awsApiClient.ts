import { Capacitor, CapacitorHttp } from '@capacitor/core';

import type { GameData } from '../types/game';

export interface CurrentUserResponse {
  user: {
    userId: string;
    email: string | null;
    givenName: string | null;
    familyName: string | null;
    displayName: string | null;
  };
  stats: {
    totalGames: number;
    lastGameDate: string | null;
  };
}

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
export const apiUrl = rawApiUrl?.replace(/\/$/, '') ?? '';
export const isApiConfigured = apiUrl.length > 0;
const API_REQUEST_TIMEOUT_MS = 15_000;
const TIMEOUT_MESSAGE = 'API request timed out. Check your connection and try again.';

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function apiRequest<T>(
  path: string,
  token: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (!apiUrl) throw new Error('VITE_API_URL is not configured.');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  let status: number;
  let statusText = '';
  let responseData: unknown;

  if (Capacitor.isNativePlatform()) {
    // Only our authenticated API uses the native transport. Do not patch global
    // fetch or change browser CORS protections for the rest of the application.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        CapacitorHttp.request({
          url: `${apiUrl}${path}`,
          method: opts.method ?? 'GET',
          headers,
          ...(opts.body !== undefined ? { data: opts.body } : {}),
          responseType: 'json',
          connectTimeout: API_REQUEST_TIMEOUT_MS,
          readTimeout: API_REQUEST_TIMEOUT_MS,
          disableRedirects: true,
        }),
        new Promise<never>((_resolve, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(TIMEOUT_MESSAGE)),
            API_REQUEST_TIMEOUT_MS,
          );
        }),
      ]);
      status = response.status;
      responseData = response.data;
    } finally {
      clearTimeout(timeoutId);
    }
  } else {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
    const init: RequestInit = {
      method: opts.method ?? 'GET',
      signal: controller.signal,
      headers,
    };

    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

    try {
      const response = await fetch(`${apiUrl}${path}`, init);
      status = response.status;
      statusText = response.statusText;
      responseData = await response.text();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(TIMEOUT_MESSAGE);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  let data: unknown = responseData ?? null;
  if (typeof responseData === 'string') {
    try {
      data = JSON.parse(responseData);
    } catch {
      data = null;
    }
  }

  if (status < 200 || status >= 300) {
    if (status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    const message =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `${status} ${statusText}`.trim();
    throw new Error(`API request failed: ${message}`);
  }

  return data as T;
}

export async function listGames(token: string): Promise<GameData[]> {
  const data = await apiRequest<{ games: GameData[] }>('/games', token);
  return data.games;
}

export async function getGame(gameId: string, token: string): Promise<GameData> {
  const data = await apiRequest<{ game: GameData }>(
    `/games/${encodeURIComponent(gameId)}`,
    token,
  );
  return data.game;
}

export async function saveGame(game: GameData, token: string): Promise<GameData> {
  const data = await apiRequest<{ game: GameData }>(
    `/games/${encodeURIComponent(game.id)}`,
    token,
    {
      method: 'PUT',
      body: game,
    },
  );
  return data.game;
}

export async function deleteGame(gameId: string, token: string): Promise<void> {
  await apiRequest<void>(`/games/${encodeURIComponent(gameId)}`, token, {
    method: 'DELETE',
  });
}

export async function getCurrentUser(token: string): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>('/users/me', token);
}
