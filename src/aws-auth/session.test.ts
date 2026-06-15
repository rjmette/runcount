import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeAwsCallback } from './session';

const PKCE_STORAGE_KEY = 'runcount.auth.pkce';

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
});
