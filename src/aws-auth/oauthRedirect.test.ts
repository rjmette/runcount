import { beforeEach, describe, expect, it, vi } from 'vitest';

const isNativePlatform = vi.fn(() => false);

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

import {
  getOAuthLogoutUri,
  getOAuthRedirectUri,
  isNativeAuthCallbackUrl,
  isNativeAuthLogoutUrl,
  NATIVE_OAUTH_LOGOUT_URI,
  NATIVE_OAUTH_REDIRECT_URI,
} from './oauthRedirect';

describe('oauthRedirect', () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(false);
  });

  it('uses the https Cognito redirect and logout URIs on web', () => {
    expect(getOAuthRedirectUri()).toBe('http://localhost/auth/callback');
    expect(getOAuthLogoutUri()).toBe('http://localhost/');
  });

  it('uses the runcount custom scheme on native platforms', () => {
    isNativePlatform.mockReturnValue(true);
    expect(getOAuthRedirectUri()).toBe(NATIVE_OAUTH_REDIRECT_URI);
    expect(getOAuthLogoutUri()).toBe(NATIVE_OAUTH_LOGOUT_URI);
  });

  it('recognizes native auth callback URLs', () => {
    expect(isNativeAuthCallbackUrl('runcount://auth/callback')).toBe(true);
    expect(isNativeAuthCallbackUrl('runcount://auth/callback?code=abc&state=xyz')).toBe(
      true,
    );
    expect(isNativeAuthCallbackUrl('https://runcount.rbios.net/auth/callback')).toBe(
      false,
    );
    expect(isNativeAuthCallbackUrl('runcount://')).toBe(false);
  });

  it('recognizes native logout return URLs', () => {
    expect(isNativeAuthLogoutUrl('runcount://')).toBe(true);
    expect(isNativeAuthLogoutUrl('runcount:///')).toBe(true);
    expect(isNativeAuthLogoutUrl('runcount://?')).toBe(true);
    expect(isNativeAuthLogoutUrl('runcount://auth/callback')).toBe(false);
  });
});
