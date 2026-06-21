export const isAwsAuthMock = import.meta.env.VITE_AUTH_MOCK === '1';

function optionalEnv(name: keyof ImportMetaEnv): string {
  return (import.meta.env[name] as string | undefined) ?? '';
}

function requiredEnv(name: keyof ImportMetaEnv): string {
  const value = optionalEnv(name);
  if (isAwsAuthMock) return value || `mock-${String(name)}`;
  if (!value) {
    throw new Error(`Missing required env var: ${String(name)} for Cognito auth.`);
  }
  return value;
}

export const cognitoConfig = {
  region: requiredEnv('VITE_COGNITO_REGION'),
  userPoolId: requiredEnv('VITE_COGNITO_USER_POOL_ID'),
  clientId: requiredEnv('VITE_COGNITO_CLIENT_ID'),
  domain: requiredEnv('VITE_COGNITO_DOMAIN'),
  redirectUri: requiredEnv('VITE_COGNITO_REDIRECT_URI'),
  logoutUri: requiredEnv('VITE_COGNITO_LOGOUT_URI'),
};

export const mockUser = {
  id: import.meta.env.VITE_AUTH_MOCK_SUB ?? 'mock-user-1',
  email: import.meta.env.VITE_AUTH_MOCK_EMAIL ?? 'mock@example.com',
  auth_provider: 'password',
  created_at: new Date(0).toISOString(),
  user_metadata: {
    given_name: import.meta.env.VITE_AUTH_MOCK_GIVEN_NAME ?? 'Mock',
    family_name: import.meta.env.VITE_AUTH_MOCK_FAMILY_NAME ?? 'User',
  },
};
