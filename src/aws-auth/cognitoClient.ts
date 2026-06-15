import { cognitoConfig, isAwsAuthMock, mockUser } from './config';
import { saveTokens, userFromIdToken } from './tokens';

import type { AppSession, AppUser } from '../types/auth';

interface CognitoError {
  __type?: string;
  message?: string;
}

interface CognitoAuthResult {
  AccessToken: string;
  ExpiresIn: number;
  IdToken: string;
  RefreshToken?: string;
}

interface CognitoInitiateAuthResponse {
  AuthenticationResult?: CognitoAuthResult;
}

export interface AwsSignUpResult {
  userConfirmed: boolean;
}

const COGNITO_TARGET_PREFIX = 'AWSCognitoIdentityProviderService';

function getCognitoEndpoint(): string {
  return `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/`;
}

function getErrorMessage(error: CognitoError): string {
  const type = error.__type?.split('#').pop();
  return error.message ?? type ?? 'Cognito request failed';
}

async function requestCognito<T>(
  target: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(getCognitoEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `${COGNITO_TARGET_PREFIX}.${target}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as T & CognitoError) : ({} as T & CognitoError);

  if (!res.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}

function toSession(result: CognitoAuthResult): AppSession {
  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken ?? '',
    expiresAt: Date.now() + (result.ExpiresIn - 30) * 1000,
  };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AppSession> {
  if (isAwsAuthMock) {
    const passwordMockUser: AppUser = {
      ...mockUser,
      email: email || mockUser.email,
      auth_provider: 'password',
    };
    const session: AppSession = {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
    localStorage.setItem('runcount.auth.mock-user', JSON.stringify(passwordMockUser));
    return session;
  }

  const response = await requestCognito<CognitoInitiateAuthResponse>('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: cognitoConfig.clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  if (!response.AuthenticationResult) {
    throw new Error('Sign in requires an unsupported challenge.');
  }

  const session = toSession(response.AuthenticationResult);
  saveTokens(session);
  return session;
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<AwsSignUpResult> {
  if (isAwsAuthMock) {
    return { userConfirmed: false };
  }

  const response = await requestCognito<{ UserConfirmed: boolean }>('SignUp', {
    ClientId: cognitoConfig.clientId,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });

  return { userConfirmed: response.UserConfirmed };
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  if (isAwsAuthMock) return;

  await requestCognito('ConfirmSignUp', {
    ClientId: cognitoConfig.clientId,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  if (isAwsAuthMock) return;

  await requestCognito('ForgotPassword', {
    ClientId: cognitoConfig.clientId,
    Username: email,
  });
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  password: string,
): Promise<void> {
  if (isAwsAuthMock) return;

  await requestCognito('ConfirmForgotPassword', {
    ClientId: cognitoConfig.clientId,
    Username: email,
    ConfirmationCode: code,
    Password: password,
  });
}

export async function changePassword(
  accessToken: string,
  previousPassword: string,
  proposedPassword: string,
): Promise<void> {
  if (isAwsAuthMock) return;

  await requestCognito('ChangePassword', {
    AccessToken: accessToken,
    PreviousPassword: previousPassword,
    ProposedPassword: proposedPassword,
  });
}

export async function updateEmail(accessToken: string, email: string): Promise<void> {
  if (isAwsAuthMock) return;

  await requestCognito('UpdateUserAttributes', {
    AccessToken: accessToken,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}

export async function verifyEmailUpdate(
  accessToken: string,
  code: string,
): Promise<void> {
  if (isAwsAuthMock) return;

  await requestCognito('VerifyUserAttribute', {
    AccessToken: accessToken,
    AttributeName: 'email',
    Code: code,
  });
}

export function getUserFromPasswordSession(session: AppSession): AppUser {
  if (session.idToken === 'mock-id-token') {
    const raw = localStorage.getItem('runcount.auth.mock-user');
    if (raw) return JSON.parse(raw) as AppUser;
    return mockUser;
  }
  return userFromIdToken(session.idToken);
}
