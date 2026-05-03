import { act, renderHook } from '@testing-library/react';

import { useTheme } from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('defaults to dark mode and persists the preference', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('runcount_theme')).toBe('dark');
  });

  test('restores light mode from localStorage', () => {
    localStorage.setItem('runcount_theme', 'light');

    const { result } = renderHook(() => useTheme());

    expect(result.current.darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('toggles dark mode and updates localStorage and the document class', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('runcount_theme')).toBe('light');
  });
});
