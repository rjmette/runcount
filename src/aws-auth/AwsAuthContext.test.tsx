import type { ReactNode } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';

// Regression test for mock-mode email/password sign-in. Before the fix,
// applySession decoded the synthetic 'mock-id-token' (from VITE_AUTH_MOCK)
// as a real JWT and threw, so the live sign-in click surfaced an error
// instead of logging the mock user in.
describe('AwsAuthProvider mock-mode password sign-in', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_BACKEND', 'aws');
    vi.stubEnv('VITE_AUTH_MOCK', '1');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('signs in the mock user without throwing', async () => {
    const { AwsAuthProvider, useAwsAuth } = await import('./AwsAuthContext');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AwsAuthProvider>{children}</AwsAuthProvider>
    );

    const { result } = renderHook(() => useAwsAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signInWithPassword('player@example.com', 'whatever-password');
    });

    expect(result.current.user?.email).toBe('mock@example.com');
  });
});
