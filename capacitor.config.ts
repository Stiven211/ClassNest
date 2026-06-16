import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.classnest.app',
  appName: 'ClassNest',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
