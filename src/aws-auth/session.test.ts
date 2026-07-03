import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeAwsCallback, getFreshIdToken } from './session';

import type { AppSession } from '../types/auth';

const PKCE_STORAGE_KEY = 'runcount.auth.pkce';
const TOKENS_STORAGE_KEY = 'runcount.auth.tokens';

function makeExpiredSession(overrides: Partial<AppSession> = {}): AppSession {
  return {
    accessToken: 'access-1',
    idToken: 'id-1',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000,
    ...overrides,
  };
}

describe('AWS auth session', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('rejects a callback with a mismatched PKCE state before token exchange', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    sessionStorage.setItem(
      PKCE_STORAGE_KEY,
      JSON.stringify({
        verifier: 'verifier-1',
        state: 'expected-state',
        returnTo: '/history',
      }),
    );
    window.history.replaceState({}, '', '/auth/callback?code=abc&state=wrong-state');

    await expect(completeAwsCallback()).rejects.toThrow(
      'Invalid auth callback. Try signing in again.',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
  });

  describe('getFreshIdToken', () => {
    it('keeps the session on a network error during token refresh', async () => {
      const session = makeExpiredSession();
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(session));
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      const applySession = vi.fn();

      const token = await getFreshIdToken(session, applySession);

      expect(token).toBeNull();
      expect(applySession).not.toHaveBeenCalled();
      expect(localStorage.getItem(TOKENS_STORAGE_KEY)).not.toBeNull();
    });

    it('keeps the session on a 5xx response from the token endpoint', async () => {
      const session = makeExpiredSession();
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(session));
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
      );
      const applySession = vi.fn();

      const token = await getFreshIdToken(session, applySession);

      expect(token).toBeNull();
      expect(applySession).not.toHaveBeenCalled();
      expect(localStorage.getItem(TOKENS_STORAGE_KEY)).not.toBeNull();
    });

    it('clears the session on a 400 invalid_grant response from the token endpoint', async () => {
      const session = makeExpiredSession();
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(session));
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }),
          ),
      );
      const applySession = vi.fn();

      const token = await getFreshIdToken(session, applySession);

      expect(token).toBeNull();
      expect(applySession).toHaveBeenCalledWith(null);
      expect(localStorage.getItem(TOKENS_STORAGE_KEY)).toBeNull();
    });
  });
});
