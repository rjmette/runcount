import { Capacitor } from '@capacitor/core';

import { cognitoConfig } from './config';

/** Cognito callback for the Capacitor iOS/Android app (custom URL scheme). */
export const NATIVE_OAUTH_REDIRECT_URI = 'runcount://auth/callback';

/** Cognito logout return for the Capacitor iOS/Android app. */
export const NATIVE_OAUTH_LOGOUT_URI = 'runcount://';

export function getOAuthRedirectUri(): string {
  return Capacitor.isNativePlatform()
    ? NATIVE_OAUTH_REDIRECT_URI
    : cognitoConfig.redirectUri;
}

export function getOAuthLogoutUri(): string {
  return Capacitor.isNativePlatform() ? NATIVE_OAUTH_LOGOUT_URI : cognitoConfig.logoutUri;
}

export function isNativeAuthCallbackUrl(url: string): boolean {
  return (
    url === NATIVE_OAUTH_REDIRECT_URI || url.startsWith(`${NATIVE_OAUTH_REDIRECT_URI}?`)
  );
}

export function isNativeAuthLogoutUrl(url: string): boolean {
  if (
    url === NATIVE_OAUTH_LOGOUT_URI ||
    url === `${NATIVE_OAUTH_LOGOUT_URI}/` ||
    url.startsWith(`${NATIVE_OAUTH_LOGOUT_URI}?`)
  ) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'runcount:' &&
      parsed.hostname === '' &&
      (parsed.pathname === '' || parsed.pathname === '/')
    );
  } catch {
    return false;
  }
}
