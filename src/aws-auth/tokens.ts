import { cognitoConfig } from './config';

import type { AppSession, AppUser } from '../types/auth';

const STORAGE_KEY = 'runcount.auth.tokens';

interface CognitoUserClaims {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  identities?: unknown;
  'cognito:username'?: string;
  iat?: number;
}

interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

function decodeJwt<T = unknown>(token: string): T {
  const [, payload] = token.split('.');
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(padded)) as T;
}

function getProviderFromIdentities(identities: unknown): string | undefined {
  const parsedIdentities =
    typeof identities === 'string' ? (JSON.parse(identities) as unknown) : identities;

  if (!Array.isArray(parsedIdentities)) return undefined;

  const [primaryIdentity] = parsedIdentities;
  if (!primaryIdentity || typeof primaryIdentity !== 'object') return undefined;

  const providerName = (primaryIdentity as { providerName?: unknown }).providerName;
  return typeof providerName === 'string' ? providerName.toLowerCase() : undefined;
}

function getAuthProvider(claims: CognitoUserClaims): AppUser['auth_provider'] {
  try {
    const identityProvider = getProviderFromIdentities(claims.identities);
    if (identityProvider) return identityProvider;
  } catch {
    return 'password';
  }

  if (claims['cognito:username']?.toLowerCase().startsWith('google_')) {
    return 'google';
  }

  return 'password';
}

function toSession(res: TokenResponse, existingRefresh?: string): AppSession {
  return {
    idToken: res.id_token,
    accessToken: res.access_token,
    refreshToken: res.refresh_token ?? existingRefresh ?? '',
    expiresAt: Date.now() + (res.expires_in - 30) * 1000,
  };
}

export function loadTokens(): AppSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveTokens(session: AppSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function userFromIdToken(idToken: string): AppUser {
  const claims = decodeJwt<CognitoUserClaims>(idToken);
  return {
    id: claims.sub,
    email: claims.email,
    auth_provider: getAuthProvider(claims),
    created_at: claims.iat ? new Date(claims.iat * 1000).toISOString() : undefined,
    user_metadata: {
      given_name: claims.given_name,
      family_name: claims.family_name,
      name: claims.name,
    },
  };
}

export async function exchangeCodeForTokens(
  code: string,
  verifier: string,
): Promise<AppSession> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cognitoConfig.clientId,
    code,
    redirect_uri: cognitoConfig.redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return toSession((await res.json()) as TokenResponse);
}

export async function refreshTokens(refreshToken: string): Promise<AppSession> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: cognitoConfig.clientId,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return toSession((await res.json()) as TokenResponse, refreshToken);
}
