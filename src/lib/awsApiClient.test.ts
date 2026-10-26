import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameData } from '../types/game';

const { isNativePlatform, nativeRequest } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  nativeRequest: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform },
  CapacitorHttp: { request: nativeRequest },
}));

const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');

async function importClient() {
  vi.resetModules();
  return import('./awsApiClient');
}

function setFetch(value: unknown) {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreFetch() {
  if (originalFetchDescriptor) {
    Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, 'fetch');
}

describe('awsApiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isNativePlatform.mockReturnValue(false);
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    restoreFetch();
  });

  it('times out API requests that do not settle', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });
    setFetch(fetchMock);

    const { listGames } = await importClient();
    const request = expect(listGames('token')).rejects.toThrow(
      'API request timed out. Check your connection and try again.',
    );

    await vi.advanceTimersByTimeAsync(15_000);

    await request;
  });

  it('surfaces 401 responses as session expiration errors', async () => {
    setFetch(
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          statusText: 'Unauthorized',
        }),
      ),
    );

    const { listGames } = await importClient();

    await expect(listGames('token')).rejects.toThrow(
      'Your session has expired. Please sign in again.',
    );
    expect(nativeRequest).not.toHaveBeenCalled();
  });

  it('keeps web saves on browser fetch with the authenticated JSON payload', async () => {
    const game: GameData = {
      id: 'game/one',
      date: '2026-10-25T00:00:00.000Z',
      players: [],
      actions: [],
      completed: false,
      winner_id: null,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ game }), { status: 200 }));
    setFetch(fetchMock);
    const { saveGame } = await importClient();

    await expect(saveGame(game, 'token')).resolves.toEqual(game);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/games/game%2Fone',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(game),
      }),
    );
    expect(nativeRequest).not.toHaveBeenCalled();
  });

  describe('native API transport', () => {
    beforeEach(() => {
      isNativePlatform.mockReturnValue(true);
      setFetch(vi.fn());
    });

    it('loads history through native HTTP with JWT and bounded timeouts', async () => {
      vi.useFakeTimers();
      nativeRequest.mockResolvedValue({ status: 200, data: { games: [] } });
      const { listGames } = await importClient();

      await expect(listGames('token')).resolves.toEqual([]);
      expect(nativeRequest).toHaveBeenCalledWith({
        url: 'https://api.example.com/games',
        method: 'GET',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        responseType: 'json',
        connectTimeout: 15_000,
        readTimeout: 15_000,
        disableRedirects: true,
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('saves and reloads a completed game without using browser fetch', async () => {
      const game: GameData = {
        id: 'game/one',
        date: '2026-10-25T00:00:00.000Z',
        players: [],
        actions: [],
        completed: true,
        winner_id: 0,
      };
      nativeRequest
        .mockResolvedValueOnce({ status: 200, data: { game } })
        .mockResolvedValueOnce({ status: 200, data: JSON.stringify({ game }) });
      const { saveGame, getGame } = await importClient();

      await expect(saveGame(game, 'token')).resolves.toEqual(game);
      await expect(getGame(game.id, 'token')).resolves.toEqual(game);
      expect(nativeRequest).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          url: 'https://api.example.com/games/game%2Fone',
          method: 'PUT',
          data: game,
        }),
      );
      expect(nativeRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          url: 'https://api.example.com/games/game%2Fone',
          method: 'GET',
        }),
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('accepts an empty success response when deleting a game', async () => {
      nativeRequest.mockResolvedValue({ status: 204, data: '' });
      const { deleteGame } = await importClient();

      await expect(deleteGame('game-1', 'token')).resolves.toBeUndefined();
      expect(nativeRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('preserves session expiration and server error messages', async () => {
      nativeRequest
        .mockResolvedValueOnce({ status: 401, data: { error: 'Unauthorized' } })
        .mockResolvedValueOnce({ status: 503, data: { error: 'Try again later' } });
      const { listGames } = await importClient();

      await expect(listGames('token')).rejects.toThrow(
        'Your session has expired. Please sign in again.',
      );
      await expect(listGames('token')).rejects.toThrow(
        'API request failed: Try again later',
      );
    });

    it('rejects redirects without a browser fallback or automatic retry', async () => {
      nativeRequest.mockResolvedValue({ status: 302, data: '' });
      const { listGames } = await importClient();

      await expect(listGames('token')).rejects.toThrow('API request failed: 302');
      expect(nativeRequest).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('bounds an unresponsive native request and clears its timer', async () => {
      vi.useFakeTimers();
      nativeRequest.mockReturnValue(new Promise(() => {}));
      const { listGames } = await importClient();
      const request = expect(listGames('token')).rejects.toThrow(
        'API request timed out. Check your connection and try again.',
      );

      await vi.advanceTimersByTimeAsync(15_000);

      await request;
      expect(vi.getTimerCount()).toBe(0);
    });

    it('propagates native network failure and clears its timer', async () => {
      vi.useFakeTimers();
      nativeRequest.mockRejectedValue(new Error('Network unavailable'));
      const { listGames } = await importClient();

      await expect(listGames('token')).rejects.toThrow('Network unavailable');
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
