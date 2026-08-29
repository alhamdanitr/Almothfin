import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.almothfin.workers',
  appName: 'إدارة العمال',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
