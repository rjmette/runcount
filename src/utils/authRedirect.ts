const AUTH_CALLBACK_PATH = '/auth/callback';

export const getAuthCallbackUrl = () =>
  new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();

export const isAuthCallbackPath = (pathname = window.location.pathname) =>
  pathname === AUTH_CALLBACK_PATH;

export const normalizeAuthCallbackPath = () => {
  if (!isAuthCallbackPath()) {
    return;
  }

  window.history.replaceState({}, document.title, '/');
};
