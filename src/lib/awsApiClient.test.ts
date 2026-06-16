import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/');
  });

  afterEach(() => {
    vi.useRealTimers();
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
  });
});
