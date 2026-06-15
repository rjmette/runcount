/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND?: 'supabase' | 'aws';
  readonly VITE_SUPABASE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_MOCK?: string;
  readonly VITE_AUTH_MOCK_SUB?: string;
  readonly VITE_AUTH_MOCK_EMAIL?: string;
  readonly VITE_AUTH_MOCK_GIVEN_NAME?: string;
  readonly VITE_AUTH_MOCK_FAMILY_NAME?: string;
  readonly VITE_COGNITO_REGION?: string;
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_CLIENT_ID?: string;
  readonly VITE_COGNITO_DOMAIN?: string;
  readonly VITE_COGNITO_REDIRECT_URI?: string;
  readonly VITE_COGNITO_LOGOUT_URI?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_DISABLE_SUPABASE_REALTIME?: string;
}
