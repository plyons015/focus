import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.zigzag.planner',
  appName: 'ZigZag Planner',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
