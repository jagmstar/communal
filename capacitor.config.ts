import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.krepych.communal",
  appName: "Communal",
  webDir: "dist",
  backgroundColor: "#0f766e",
  plugins: {
    Camera: {},
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#14b8a6",
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
