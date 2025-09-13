import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roboedu.robocodejr',
  appName: 'RoboCode Jr',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Scanning for Sparky robots...",
        cancel: "Cancel", 
        availableDevices: "Available Devices",
        noDeviceFound: "No robot found"
      }
    }
  }
};

export default config;
