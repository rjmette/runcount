export const getErrorMessage = (error: unknown, fallback = 'An error occurred') => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const formatMemberSince = (raw: string | undefined): string => {
  if (!raw) return '—';
  const date = new Date(raw);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};
