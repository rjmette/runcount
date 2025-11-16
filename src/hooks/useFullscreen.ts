import { useState, useEffect, useCallback } from 'react';

import { useError } from '../context/ErrorContext';

type VendorDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type VendorDocumentElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

/**
 * Custom hook for managing fullscreen state and functionality
 * Handles vendor prefixes for cross-browser compatibility
 */
export const useFullscreen = () => {
  const { addError } = useError();
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Listen for fullscreen changes
  useEffect(() => {
    const vendorDocument = document as VendorDocument;
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        vendorDocument.fullscreenElement ||
        vendorDocument.webkitFullscreenElement ||
        vendorDocument.mozFullScreenElement ||
        vendorDocument.msFullscreenElement
      );
      setIsFullScreen(isFullscreen);
    };

    // Add event listeners for all vendor prefixes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      const vendorDocument = document as VendorDocument;
      const vendorDocumentElement = document.documentElement as VendorDocumentElement;

      // Check if already in fullscreen (with vendor prefixes)
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        vendorDocument.webkitFullscreenElement ||
        vendorDocument.mozFullScreenElement ||
        vendorDocument.msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        // Request fullscreen with vendor prefix support
        if (vendorDocumentElement.requestFullscreen) {
          await vendorDocumentElement.requestFullscreen();
        } else if (vendorDocumentElement.webkitRequestFullscreen) {
          await vendorDocumentElement.webkitRequestFullscreen();
        } else if (vendorDocumentElement.mozRequestFullScreen) {
          await vendorDocumentElement.mozRequestFullScreen();
        } else if (vendorDocumentElement.msRequestFullscreen) {
          await vendorDocumentElement.msRequestFullscreen();
        } else {
          throw new Error('Fullscreen not supported');
        }
      } else {
        // Exit fullscreen with vendor prefix support
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (vendorDocument.webkitExitFullscreen) {
          await vendorDocument.webkitExitFullscreen();
        } else if (vendorDocument.mozCancelFullScreen) {
          await vendorDocument.mozCancelFullScreen();
        } else if (vendorDocument.msExitFullscreen) {
          await vendorDocument.msExitFullscreen();
        }
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
      addError('Unable to toggle fullscreen. Your browser may not support this feature.');
      // For iOS Safari, provide user feedback since fullscreen is very limited
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert(
          'Fullscreen not supported on this device. Try using "Add to Home Screen" for a fullscreen-like experience.',
        );
      }
    }
  }, [addError]);

  return { isFullScreen, toggleFullscreen };
};
