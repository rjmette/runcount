import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useFullscreen } from '../useFullscreen';

const addError = vi.fn();

vi.mock('../../context/ErrorContext', () => ({
  useError: () => ({ addError }),
}));

const setDocumentProperty = (property: keyof Document, value: unknown) => {
  Object.defineProperty(document, property, {
    configurable: true,
    value,
  });
};

describe('useFullscreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDocumentProperty('fullscreenElement', null);
    setDocumentProperty('exitFullscreen', vi.fn());
    document.documentElement.requestFullscreen = vi.fn();
  });

  test('starts outside fullscreen mode', () => {
    const { result } = renderHook(() => useFullscreen());

    expect(result.current.isFullScreen).toBe(false);
  });

  test('requests fullscreen when not currently fullscreen', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = requestFullscreen;
    const { result } = renderHook(() => useFullscreen());

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  test('exits fullscreen when already fullscreen', async () => {
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    setDocumentProperty('fullscreenElement', document.documentElement);
    setDocumentProperty('exitFullscreen', exitFullscreen);
    const { result } = renderHook(() => useFullscreen());

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });

  test('updates fullscreen state from fullscreenchange events', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => {
      setDocumentProperty('fullscreenElement', document.documentElement);
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(result.current.isFullScreen).toBe(true);

    act(() => {
      setDocumentProperty('fullscreenElement', null);
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(result.current.isFullScreen).toBe(false);
  });

  test('reports unsupported fullscreen errors', async () => {
    document.documentElement.requestFullscreen = undefined;
    const { result } = renderHook(() => useFullscreen());

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    expect(addError).toHaveBeenCalledWith(
      'Unable to toggle fullscreen. Your browser may not support this feature.',
    );
  });
});
