import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.personal.growth',
  appName: 'PersonalGrowth',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
