import { beforeEach, describe, expect, it, vi } from 'vitest';

const browserOpen = vi.fn();
const browserClose = vi.fn();
const appAddListener = vi.fn();
const isNativePlatform = vi.fn(() => false);

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: (options: { url: string }) => browserOpen(options),
    close: () => browserClose(),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (
      event: string,
      handler: (event: { url: string }) => void | Promise<void>,
    ) => appAddListener(event, handler),
  },
}));

import {
  completeAwsCallback,
  getFreshIdToken,
  registerNativeAuthDeepLinkListener,
  startAwsSignIn,
} from './session';

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
    isNativePlatform.mockReturnValue(false);
    browserOpen.mockReset().mockResolvedValue(undefined);
    browserClose.mockReset().mockResolvedValue(undefined);
    appAddListener.mockReset().mockResolvedValue({ remove: vi.fn() });
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

  it('completes a native deep-link callback with the custom-scheme redirect_uri', async () => {
    isNativePlatform.mockReturnValue(true);
    sessionStorage.setItem(
      PKCE_STORAGE_KEY,
      JSON.stringify({
        verifier: 'verifier-native',
        state: 'native-state',
        returnTo: '/scoreboard',
      }),
    );
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id_token: 'id-native',
          access_token: 'access-native',
          refresh_token: 'refresh-native',
          expires_in: 3600,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const returnTo = await completeAwsCallback(
      'runcount://auth/callback?code=native-code&state=native-state',
    );

    expect(returnTo).toBe('/scoreboard');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(String(init.body));
    expect(body.get('redirect_uri')).toBe('runcount://auth/callback');
    expect(body.get('code')).toBe('native-code');
    expect(body.get('code_verifier')).toBe('verifier-native');
    expect(localStorage.getItem(TOKENS_STORAGE_KEY)).toContain('id-native');
  });

  it('opens the Cognito authorize URL in the system browser on native', async () => {
    isNativePlatform.mockReturnValue(true);
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        pathname: '/',
        search: '',
        assign: assignSpy,
        reload: vi.fn(),
      },
    });

    await startAwsSignIn();

    expect(browserOpen).toHaveBeenCalledTimes(1);
    const openArg = browserOpen.mock.calls[0]?.[0] as { url: string };
    expect(openArg.url).toContain('/oauth2/authorize?');
    expect(openArg.url).toContain(
      `redirect_uri=${encodeURIComponent('runcount://auth/callback')}`,
    );
    expect(assignSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(PKCE_STORAGE_KEY)).toContain('verifier');
  });

  it('keeps the web authorize flow on window.location.assign', async () => {
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        pathname: '/',
        search: '',
        assign: assignSpy,
        reload: vi.fn(),
      },
    });

    await startAwsSignIn();

    expect(browserOpen).not.toHaveBeenCalled();
    expect(assignSpy).toHaveBeenCalledTimes(1);
    const assigned = String(assignSpy.mock.calls[0]?.[0]);
    expect(assigned).toContain('/oauth2/authorize?');
    expect(assigned).toContain(
      `redirect_uri=${encodeURIComponent('http://localhost/auth/callback')}`,
    );
  });

  it('registers an appUrlOpen listener that finishes native sign-in', async () => {
    isNativePlatform.mockReturnValue(true);
    let urlHandler: ((event: { url: string }) => Promise<void>) | undefined;
    appAddListener.mockImplementation(
      async (_event: string, handler: typeof urlHandler) => {
        urlHandler = handler;
        return { remove: vi.fn() };
      },
    );

    sessionStorage.setItem(
      PKCE_STORAGE_KEY,
      JSON.stringify({
        verifier: 'verifier-listener',
        state: 'listener-state',
        returnTo: '/home',
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id_token: 'id-listener',
            access_token: 'access-listener',
            refresh_token: 'refresh-listener',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const onSignInComplete = vi.fn();
    const onSignInError = vi.fn();
    await registerNativeAuthDeepLinkListener({ onSignInComplete, onSignInError });

    expect(appAddListener).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
    await urlHandler?.({
      url: 'runcount://auth/callback?code=listener-code&state=listener-state',
    });

    expect(browserClose).toHaveBeenCalled();
    expect(onSignInComplete).toHaveBeenCalledWith('/home');
    expect(onSignInError).not.toHaveBeenCalled();
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
