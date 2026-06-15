export interface AppUser {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: {
    given_name?: string;
    family_name?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface AppSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}
