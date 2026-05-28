import type { CapacitorConfig } from '@capacitor/cli';

// Set to your production URL when deploying
const PRODUCTION_URL = process.env.CAPACITOR_SERVER_URL || '';

const config: CapacitorConfig = {
  appId: 'com.fieldswork.app',
  appName: 'Fields.work',
  webDir: 'out',
  server: {
    // Use production URL if set, otherwise use local dev server
    ...(PRODUCTION_URL ? { url: PRODUCTION_URL } : {
      url: 'http://localhost:3000',
      cleartext: true, // Required for http on Android
    }),
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2d5a3d',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#2d5a3d',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true, // Allow http for development
  },
};

export default config;
