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
  },
  server: {
    // Uncomment for live reload during development:
    // url: 'http://YOUR_IP:3000',
    // cleartext: true,
  },
};

export default config;
