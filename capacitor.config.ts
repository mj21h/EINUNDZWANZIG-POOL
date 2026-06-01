import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.einundzwanzig.pool',
  appName: 'Einundzwanzig Pool',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#151515",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    LocalNotifications: {
      smallIcon: "ic_launcher",
      iconColor: "#F7931A",
      sound: "beep.wav",
    },
  },
};

export default config;
