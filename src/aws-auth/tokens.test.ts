import { userFromIdToken } from './tokens';

function encodeJwtPayload(payload: Record<string, unknown>): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `header.${encodedPayload}.signature`;
}

describe('userFromIdToken', () => {
  test('marks Cognito password users as password provider', () => {
    const user = userFromIdToken(
      encodeJwtPayload({
        sub: 'user-1',
        email: 'player@example.com',
        iat: 1760000000,
      }),
    );

    expect(user.auth_provider).toBe('password');
  });

  test('marks Google users from Cognito identities claim', () => {
    const user = userFromIdToken(
      encodeJwtPayload({
        sub: 'user-1',
        email: 'player@example.com',
        identities: [{ providerName: 'Google' }],
      }),
    );

    expect(user.auth_provider).toBe('google');
  });

  test('marks Google users from Cognito username fallback', () => {
    const user = userFromIdToken(
      encodeJwtPayload({
        sub: 'user-1',
        email: 'player@example.com',
        'cognito:username': 'Google_123456',
      }),
    );

    expect(user.auth_provider).toBe('google');
  });
});
