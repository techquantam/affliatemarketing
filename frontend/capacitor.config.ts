import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cyvanta.affiliate.app',
  appName: 'LIO MART',
  webDir: 'dist',
  server: {
    // Live Server URL for instant OTA updates upon Git push
    url: 'https://liomart.co.in',
    cleartext: true,
    androidScheme: 'https',
    // Allow the Capacitor WebView to make requests to external APIs and domains
    allowNavigation: [
      'liomart.co.in',
      '*.liomart.co.in',
      'api.liomart.co.in',
      'walrus-app-memsh.ondigitalocean.app',
      '*.ondigitalocean.app',
      '*'
    ],
  },
  android: {
    // Allow mixed content (HTTP resources on HTTPS pages)
    allowMixedContent: true,
  }
};

export default config;
