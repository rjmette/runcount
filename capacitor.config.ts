import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.rbios.runcount',
  appName: 'RunCount',
  webDir: 'build',
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#1a5c45',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#1a5c45',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1a5c45',
    },
    // Android 15+/16 edge-to-edge: inject --safe-area-inset-* for CSS (default).
    // Header padding consumes these; do not also pad html/body (avoids double inset).
    SystemBars: {
      insetsHandling: 'css',
    },
  },
  server: {
    // Uncomment for live reload during development:
    // url: 'http://YOUR_IP:3000',
    // cleartext: true,
  },
};

export default config;
