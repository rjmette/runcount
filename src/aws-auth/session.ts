import { cognitoConfig, isAwsAuthMock, mockUser } from './config';
import { deriveCodeChallenge, generateCodeVerifier, generateState } from './pkce';
import {
  clearTokens,
  exchangeCodeForTokens,
  loadTokens,
  refreshTokens,
  saveTokens,
  userFromIdToken,
} from './tokens';

import type { AppSession, AppUser } from '../types/auth';

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
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
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

  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: cognitoConfig.redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    identity_provider: 'Google',
  });

  window.location.assign(`${cognitoConfig.domain}/oauth2/authorize?${params}`);
}

export function signOutAws(): void {
  if (isAwsAuthMock) {
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    window.location.reload();
    return;
  }

  clearTokens();
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.logoutUri,
  });
  window.location.assign(`${cognitoConfig.domain}/logout?${params}`);
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
  } catch {
    clearTokens();
    applySession(null);
    return null;
  }
}

export async function completeAwsCallback(): Promise<string> {
  const params = new URLSearchParams(window.location.search);
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
