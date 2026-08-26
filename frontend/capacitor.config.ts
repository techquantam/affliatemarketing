import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cyvanta.affiliate.app',
  appName: 'LIO MART',
  webDir: 'dist',
  server: {
    // Allow the Capacitor WebView to make requests to external APIs
    allowNavigation: [
      'api.liomart.co.in',
      '*.liomart.co.in',
      'walrus-app-memsh.ondigitalocean.app',
      '*.ondigitalocean.app',
      'affliatemarketing.onrender.com',
      '*.onrender.com',
      'cyvantacashback-3.onrender.com',
      '192.168.1.61',
      '*'
    ],
    // Allow cleartext for local testing
    cleartext: true,
  },
  android: {
    // Allow mixed content (HTTP resources on HTTPS pages)
    allowMixedContent: true,
  }
};

export default config;
