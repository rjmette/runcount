import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AuthRedirectModule from './authRedirect';

const loadModule = (baseUrl: string): Promise<typeof AuthRedirectModule> => {
  vi.stubEnv('BASE_URL', baseUrl);
  vi.resetModules();
  return import('./authRedirect');
};

const setLocation = (pathname: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'https://example.com',
      pathname,
      href: `https://example.com${pathname}`,
    },
    writable: true,
    configurable: true,
  });
};

describe('authRedirect', () => {
  const originalLocation = window.location;
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

  beforeEach(() => {
    replaceStateSpy.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe('with root basepath', () => {
    it('builds the callback URL at /auth/callback', async () => {
      setLocation('/');
      const { getAuthCallbackUrl } = await loadModule('/');
      expect(getAuthCallbackUrl()).toBe('https://example.com/auth/callback');
    });

    it('matches /auth/callback as the callback path', async () => {
      setLocation('/');
      const { isAuthCallbackPath } = await loadModule('/');
      expect(isAuthCallbackPath('/auth/callback')).toBe(true);
      expect(isAuthCallbackPath('/runcount/auth/callback')).toBe(false);
    });

    it('normalizes back to /', async () => {
      setLocation('/auth/callback');
      const { normalizeAuthCallbackPath } = await loadModule('/');
      normalizeAuthCallbackPath();
      expect(replaceStateSpy).toHaveBeenCalledWith({}, document.title, '/');
    });
  });

  describe('with /runcount/ basepath', () => {
    it('builds the callback URL under the basepath', async () => {
      setLocation('/runcount/');
      const { getAuthCallbackUrl } = await loadModule('/runcount/');
      expect(getAuthCallbackUrl()).toBe('https://example.com/runcount/auth/callback');
    });

    it('matches the prefixed callback path', async () => {
      setLocation('/runcount/auth/callback');
      const { isAuthCallbackPath } = await loadModule('/runcount/');
      expect(isAuthCallbackPath('/runcount/auth/callback')).toBe(true);
      expect(isAuthCallbackPath('/auth/callback')).toBe(false);
    });

    it('normalizes back to the basepath, not /', async () => {
      setLocation('/runcount/auth/callback');
      const { normalizeAuthCallbackPath } = await loadModule('/runcount/');
      normalizeAuthCallbackPath();
      expect(replaceStateSpy).toHaveBeenCalledWith({}, document.title, '/runcount/');
    });
  });
});
