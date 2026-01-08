import { get } from '@vercel/edge-config'

export interface AppConfig {
  timeSlots: string[]
  viralThreshold: number
  dailyReelCount: number
  minReelGapMinutes: number
  flags: {
    enableAutoRetry: boolean
    enableNotifications: boolean
  }
}

const defaultConfig: AppConfig = {
  timeSlots: ['12:00', '15:00', '18:00', '20:00', '22:00'],
  viralThreshold: 70,
  dailyReelCount: 5,
  minReelGapMinutes: 90,
  flags: {
    enableAutoRetry: true,
    enableNotifications: false,
  },
}

export async function getConfig(): Promise<AppConfig> {
  try {
    const config = await get()
    return { ...defaultConfig, ...config }
  } catch (error) {
    console.warn('Failed to fetch Edge Config, using defaults:', error)
    return defaultConfig
  }
}

export async function getTimeSlots(): Promise<string[]> {
  const config = await getConfig()
  return config.timeSlots
}

export async function getViralThreshold(): Promise<number> {
  const config = await getConfig()
  return config.viralThreshold
}

export async function getDailyReelCount(): Promise<number> {
  const config = await getConfig()
  return config.dailyReelCount
}

export async function getMinReelGapMinutes(): Promise<number> {
  const config = await getConfig()
  return config.minReelGapMinutes
}

export async function getFeatureFlag(flag: string): Promise<boolean> {
  const config = await getConfig()
  return config.flags?.[flag] || false
}
