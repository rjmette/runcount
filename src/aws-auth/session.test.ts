import { Capacitor } from '@capacitor/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  completeAwsCallback,
  getFreshIdToken,
  signOutAws,
  startAwsSignIn,
} from './session';

import type { AppSession } from '../types/auth';

vi.mock('./pkce', () => ({
  generateCodeVerifier: () => 'test-verifier',
  generateState: () => 'test-state',
  deriveCodeChallenge: async () => 'test-challenge',
}));

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
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
  });

  afterEach(() => {
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

  it('blocks native hosted OAuth before storing PKCE or leaving the app', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { assign, pathname: '/', search: '' } });

    await expect(startAwsSignIn()).rejects.toThrow(
      'Google sign-in is available on the RunCount website only. Use email and password in the app.',
    );
    expect(assign).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
  });

  it('keeps the web Google PKCE redirect flow available', async () => {
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { assign, pathname: '/history', search: '' } });

    await startAwsSignIn();

    const url = new URL(assign.mock.calls[0][0]);
    expect(url.origin).toBe('https://auth.example.test');
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('identity_provider')).toBe('Google');
    expect(url.searchParams.get('code_challenge')).toBe('test-challenge');
    expect(JSON.parse(sessionStorage.getItem(PKCE_STORAGE_KEY)!)).toEqual({
      verifier: 'test-verifier',
      state: 'test-state',
      returnTo: '/history',
    });
  });

  it.each([false, true])(
    'clears local auth on sign-out without redirecting native users (native=%s)',
    (isNative) => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(isNative);
      const assign = vi.fn();
      vi.stubGlobal('window', { location: { assign } });
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(makeExpiredSession()));
      sessionStorage.setItem(PKCE_STORAGE_KEY, 'pending');

      signOutAws();

      expect(localStorage.getItem(TOKENS_STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
      if (isNative) {
        expect(assign).not.toHaveBeenCalled();
      } else {
        expect(assign).toHaveBeenCalledWith(
          expect.stringContaining('https://auth.example.test/logout?'),
        );
      }
    },
  );

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
