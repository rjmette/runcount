/**
 * Robust cross-platform copy to clipboard utility with mobile fallback support
 *
 * Handles various mobile browser limitations:
 * - iOS Safari clipboard API restrictions
 * - Android WebView inconsistencies
 * - Touch event handling for mobile devices
 * - Fallback to legacy execCommand for older browsers
 */

export interface CopyResult {
  success: boolean;
  error?: string;
}

/**
 * Copy text to clipboard with comprehensive mobile browser support
 * @param text - Text to copy to clipboard
 * @returns Promise with success status and optional error message
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  // Early return for empty text
  if (!text || text.trim() === '') {
    return { success: false, error: 'No text to copy' };
  }

  // Try modern Clipboard API first (works on HTTPS and secure contexts)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback method:', err);
      // Continue to fallback instead of returning error
    }
  }

  // Fallback method for older browsers and mobile issues
  return fallbackCopyToClipboard(text);
}

/**
 * Fallback copy method using execCommand and temporary textarea
 * Optimized for mobile browser compatibility
 */
function fallbackCopyToClipboard(text: string): CopyResult {
  const textArea = document.createElement('textarea');

  // Configure textarea for mobile compatibility
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  textArea.readOnly = true;

  // Add to DOM
  document.body.appendChild(textArea);

  try {
    // Focus and select text (required for mobile)
    textArea.focus();
    textArea.select();

    // For iOS Safari - ensure range selection
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Execute copy command
    const successful = document.execCommand('copy');

    if (successful) {
      return { success: true };
    } else {
      return { success: false, error: 'Copy command failed' };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown copy error',
    };
  } finally {
    // Always clean up
    document.body.removeChild(textArea);
  }
}

/**
 * Enhanced copy function with user feedback integration
 * Returns a promise that can be used with React state management
 */
export async function copyWithFeedback(
  text: string,
  onSuccess?: () => void,
  onError?: (error: string) => void,
): Promise<CopyResult> {
  const result = await copyToClipboard(text);

  if (result.success) {
    onSuccess?.();
  } else {
    onError?.(result.error || 'Copy failed');
  }

  return result;
}
