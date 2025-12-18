import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { copyToClipboard } from '../copyToClipboard';

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard;
  const originalExecCommand = document.execCommand;

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
    });

    // Mock document.execCommand
    document.execCommand = vi.fn();

    // Mock isSecureContext
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
    document.execCommand = originalExecCommand;
    vi.restoreAllMocks();
  });

  it('should use navigator.clipboard.writeText when available and in secure context', async () => {
    const text = 'test text';
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

    const result = await copyToClipboard(text);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    expect(result.success).toBe(true);
  });

  it('should fall back to execCommand when navigator.clipboard fails', async () => {
    const text = 'test text';
    (navigator.clipboard.writeText as any).mockRejectedValue(
      new Error('Clipboard API failed'),
    );
    (document.execCommand as any).mockReturnValue(true);

    const result = await copyToClipboard(text);

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(result.success).toBe(true);
  });

  it('should return success: false when text is empty', async () => {
    const result = await copyToClipboard('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('No text to copy');
  });

  it('should return error when both methods fail', async () => {
    // Force fallback by making clipboard undefined
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });

    (document.execCommand as any).mockReturnValue(false);

    const result = await copyToClipboard('text');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Copy command failed');
  });
});
