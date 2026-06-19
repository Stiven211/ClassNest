import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.classnest.app',
  appName: 'ClassNest',  // Nombre modificado para reflejar el cambio de marca
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
