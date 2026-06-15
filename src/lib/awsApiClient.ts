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

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

  const res = await fetch(`${apiUrl}${path}`, init);
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `${res.status} ${res.statusText}`;
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
