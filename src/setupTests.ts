// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.stubEnv('VITE_API_URL', 'https://api.example.test');
vi.stubEnv('VITE_COGNITO_REGION', 'us-east-1');
vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'us-east-1_testpool');
vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_COGNITO_DOMAIN', 'https://auth.example.test');
vi.stubEnv('VITE_COGNITO_REDIRECT_URI', 'http://localhost/auth/callback');
vi.stubEnv('VITE_COGNITO_LOGOUT_URI', 'http://localhost/');

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  get length() {
    return this.store.size;
  }
}

const defineStorage = (
  target: Record<string, unknown>,
  prop: 'localStorage' | 'sessionStorage',
  storage: Storage,
) => {
  Object.defineProperty(target, prop, {
    value: storage,
    configurable: true,
    writable: true,
  });
};

const localStorageShim = new MemoryStorage();
const sessionStorageShim = new MemoryStorage();

if (typeof globalThis !== 'undefined') {
  defineStorage(globalThis as Record<string, unknown>, 'localStorage', localStorageShim);
  defineStorage(
    globalThis as Record<string, unknown>,
    'sessionStorage',
    sessionStorageShim,
  );
}

if (typeof window !== 'undefined') {
  defineStorage(
    window as unknown as Record<string, unknown>,
    'localStorage',
    localStorageShim,
  );
  defineStorage(
    window as unknown as Record<string, unknown>,
    'sessionStorage',
    sessionStorageShim,
  );
}
