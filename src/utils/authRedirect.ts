const AUTH_CALLBACK_PATH = `${import.meta.env.BASE_URL}auth/callback`.replace(
  /\/+/g,
  '/',
);

export const getAuthCallbackUrl = () =>
  new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();

export const isAuthCallbackPath = (pathname = window.location.pathname) =>
  pathname === AUTH_CALLBACK_PATH;

export const normalizeAuthCallbackPath = () => {
  if (!isAuthCallbackPath()) {
    return;
  }

  window.history.replaceState({}, document.title, import.meta.env.BASE_URL);
};
