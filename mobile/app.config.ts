import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Mi Saluteca',
  slug: 'misaluteca-ios',
  scheme: 'com.matyalts.misaluteca',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  plugins: ['expo-router', 'expo-asset', 'expo-web-browser', 'expo-secure-store', ['expo-image-picker', { cameraPermission: 'Mi Saluteca necesita usar la cámara para adjuntar una foto de tu estudio.', microphonePermission: false, photosPermission: false }], ['expo-splash-screen', { image: './assets/brand.png', imageWidth: 128, backgroundColor: '#FFFFFF' }]],
  ios: {
    bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.matyalts.misaluteca',
    supportsTablet: false,
  },
  android: {
    package: 'com.matyalts.misaluteca',
  },
  extra: {
    eas: {
      projectId: '7dc66ca3-ddf6-4a09-85e0-27c1c7fc7e26',
    },
  },
};
export default config;
