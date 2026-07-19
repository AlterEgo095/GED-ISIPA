import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'net.aenews.ged.isipa',
  appName: 'GED-ISIPA',
  webDir: '.next/standalone',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0d9488',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0d9488',
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
    },
    Haptics: {},
    Share: {},
    Preferences: {},
  },
}

export default config
