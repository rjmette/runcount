import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import { cognitoConfig, isAwsAuthMock, mockUser } from './config';
import {
  getOAuthLogoutUri,
  getOAuthRedirectUri,
  isNativeAuthCallbackUrl,
  isNativeAuthLogoutUrl,
} from './oauthRedirect';
import { deriveCodeChallenge, generateCodeVerifier, generateState } from './pkce';
import {
  clearTokens,
  exchangeCodeForTokens,
  loadTokens,
  refreshTokens,
  saveTokens,
  TokenRefreshError,
  userFromIdToken,
} from './tokens';

import type { AppSession, AppUser } from '../types/auth';

type NativeDeepLinkListener = Awaited<ReturnType<typeof App.addListener>>;

const PKCE_STORAGE_KEY = 'runcount.auth.pkce';
const MOCK_USER_STORAGE_KEY = 'runcount.auth.mock-user';

interface PendingPkce {
  verifier: string;
  state: string;
  returnTo: string;
}

function stashPkce(pending: PendingPkce): void {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));
}

function takePkce(): PendingPkce | null {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  try {
    return JSON.parse(raw) as PendingPkce;
  } catch {
    return null;
  }
}

function callbackSearchParams(callbackUrl?: string): URLSearchParams {
  if (!callbackUrl) {
    return new URLSearchParams(window.location.search);
  }
  try {
    return new URL(callbackUrl).searchParams;
  } catch {
    const queryIndex = callbackUrl.indexOf('?');
    return new URLSearchParams(queryIndex >= 0 ? callbackUrl.slice(queryIndex + 1) : '');
  }
}

async function openAuthUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  window.location.assign(url);
}

export function getStoredAwsSession(): AppSession | null {
  return loadTokens();
}

export function getUserFromSession(session: AppSession): AppUser {
  return userFromIdToken(session.idToken);
}

export function getStoredMockUser(): AppUser | null {
  const raw = localStorage.getItem(MOCK_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export async function startAwsSignIn(): Promise<void> {
  if (isAwsAuthMock) {
    localStorage.setItem(
      MOCK_USER_STORAGE_KEY,
      JSON.stringify({ ...mockUser, auth_provider: 'google' }),
    );
    window.location.reload();
    return;
  }

  const verifier = generateCodeVerifier();
  const challenge = await deriveCodeChallenge(verifier);
  const state = generateState();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = window.location.pathname;
  const routerPath = base && path.startsWith(base) ? path.slice(base.length) : path;

  stashPkce({
    verifier,
    state,
    returnTo: (routerPath || '/') + window.location.search,
  });

  const redirectUri = getOAuthRedirectUri();
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    identity_provider: 'Google',
  });

  await openAuthUrl(`${cognitoConfig.domain}/oauth2/authorize?${params}`);
}

export async function signOutAws(): Promise<void> {
  if (isAwsAuthMock) {
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    window.location.reload();
    return;
  }

  clearTokens();
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: getOAuthLogoutUri(),
  });
  await openAuthUrl(`${cognitoConfig.domain}/logout?${params}`);
}

export async function getFreshIdToken(
  session: AppSession | null,
  applySession: (session: AppSession | null) => void,
): Promise<string | null> {
  if (!session) return null;
  if (Date.now() < session.expiresAt) return session.idToken;
  if (!session.refreshToken) {
    applySession(null);
    return null;
  }

  try {
    const refreshed = await refreshTokens(session.refreshToken);
    saveTokens(refreshed);
    applySession(refreshed);
    return refreshed.idToken;
  } catch (err) {
    // Only wipe the session on a definitive auth failure (Cognito rejected
    // the refresh token, e.g. 400 invalid_grant). Network errors and 5xx
    // responses are transient - keep the existing session so a later retry
    // can succeed instead of silently signing the user out mid-session.
    if (err instanceof TokenRefreshError && !err.isAuthFailure) {
      return null;
    }
    clearTokens();
    applySession(null);
    return null;
  }
}

let inFlightCallback: Promise<string> | null = null;

// React StrictMode (and any accidental double-mount) runs the auth effect
// twice in dev. The PKCE verifier and authorization code are single-use, so a
// second run would find the PKCE already consumed and throw. Dedupe so both
// invocations share one in-flight exchange; reset on failure so a later
// sign-in attempt can retry cleanly.
export function completeAwsCallback(callbackUrl?: string): Promise<string> {
  if (!inFlightCallback) {
    const pending = runAwsCallback(callbackUrl);
    inFlightCallback = pending;
    // Clear after settle so a later native sign-in (no full page reload) can
    // exchange again. queueMicrotask on success keeps StrictMode's double
    // invoke on the same tick sharing one in-flight promise.
    void pending.then(
      () => {
        queueMicrotask(() => {
          if (inFlightCallback === pending) {
            inFlightCallback = null;
          }
        });
      },
      () => {
        inFlightCallback = null;
      },
    );
  }
  return inFlightCallback;
}

async function runAwsCallback(callbackUrl?: string): Promise<string> {
  const params = callbackSearchParams(callbackUrl);
  const error = params.get('error');
  if (error) {
    throw new Error(`${error}: ${params.get('error_description') ?? 'no description'}`);
  }

  const code = params.get('code');
  const state = params.get('state');
  const pending = takePkce();
  if (!code || !state || !pending || pending.state !== state) {
    throw new Error('Invalid auth callback. Try signing in again.');
  }

  const tokens = await exchangeCodeForTokens(code, pending.verifier);
  saveTokens(tokens);
  return pending.returnTo && pending.returnTo !== '/auth/callback'
    ? pending.returnTo
    : '/';
}

export interface NativeAuthDeepLinkHandlers {
  onSignInComplete: (returnTo: string) => void;
  onSignInError: (error: Error) => void;
  onLogoutComplete?: () => void;
}

/**
 * Listen for Cognito custom-scheme returns on iOS/Android. Closes the in-app
 * browser, finishes the PKCE exchange for sign-in, and acknowledges logout.
 */
export async function registerNativeAuthDeepLinkListener(
  handlers: NativeAuthDeepLinkHandlers,
): Promise<NativeDeepLinkListener | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return App.addListener('appUrlOpen', async ({ url }) => {
    if (isNativeAuthCallbackUrl(url)) {
      try {
        await Browser.close();
      } catch {
        // Browser may already be closed.
      }
      try {
        const returnTo = await completeAwsCallback(url);
        handlers.onSignInComplete(returnTo);
      } catch (err) {
        handlers.onSignInError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }

    if (isNativeAuthLogoutUrl(url)) {
      try {
        await Browser.close();
      } catch {
        // Browser may already be closed.
      }
      handlers.onLogoutComplete?.();
    }
  });
}
