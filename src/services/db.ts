// 数据库服务 - 使用 localStorage 作为临时存储
// 后续可替换为 SQLite 或其他本地数据库

import type {
  AIAnalysisRecord,
  AliveRecommendationCache,
  GrowthRecord,
  PasswordEntry,
  TaskLog,
  UserProfile,
} from '@/types'

const DB_PREFIX = 'pg_app_'

function getItem<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(DB_PREFIX + key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(DB_PREFIX + key, JSON.stringify(value))
}

function removeItem(key: string): void {
  localStorage.removeItem(DB_PREFIX + key)
}

// 成长记录
export async function getGrowthRecords(): Promise<GrowthRecord[]> {
  return getItem<GrowthRecord[]>('growth_records') || []
}

export async function saveGrowthRecords(records: GrowthRecord[]): Promise<void> {
  setItem('growth_records', records)
}

// 密码箱
export async function getPasswordEntries(): Promise<PasswordEntry[]> {
  return getItem<PasswordEntry[]>('password_entries') || []
}

export async function savePasswordEntries(entries: PasswordEntry[]): Promise<void> {
  setItem('password_entries', entries)
}

// 活人感任务日志
export async function getTaskLogs(): Promise<TaskLog[]> {
  return getItem<TaskLog[]>('task_logs') || []
}

export async function saveTaskLogs(logs: TaskLog[]): Promise<void> {
  setItem('task_logs', logs)
}

// 活人感 AI 推荐卡片缓存
export async function getAliveRecommendationCache(): Promise<AliveRecommendationCache | null> {
  return getItem<AliveRecommendationCache>('alive_recommendation_cache')
}

export async function saveAliveRecommendationCache(cache: AliveRecommendationCache): Promise<void> {
  setItem('alive_recommendation_cache', cache)
}

export async function clearAliveRecommendationCache(): Promise<void> {
  removeItem('alive_recommendation_cache')
}

// AI 成长分析记录
export async function getAIAnalysisRecords(): Promise<AIAnalysisRecord[]> {
  return getItem<AIAnalysisRecord[]>('ai_analysis_records') || []
}

export async function saveAIAnalysisRecords(records: AIAnalysisRecord[]): Promise<void> {
  setItem('ai_analysis_records', records)
}

// 用户画像
export async function getUserProfile(): Promise<UserProfile | null> {
  return getItem<UserProfile>('user_profile')
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  setItem('user_profile', profile)
}

// 设置
export interface AppSettings {
  autoLockTimeout: number
  theme: 'light' | 'dark'
  fontSize: string
  fontFamily: string
  autoLock: boolean
  clipboardClear: boolean
  clipboardClearTimeout: number
  notifyEnabled: boolean
  notifyRecord: boolean
  notifyAlive: boolean
  notifyTime: string
}

const defaultSettings: AppSettings = {
  autoLockTimeout: 5 * 60 * 1000,
  theme: 'light',
  fontSize: '标准',
  fontFamily: '默认',
  autoLock: true,
  clipboardClear: true,
  clipboardClearTimeout: 15 * 1000,
  notifyEnabled: true,
  notifyRecord: true,
  notifyAlive: false,
  notifyTime: '20:00',
}

export async function getSettings(): Promise<AppSettings> {
  return getItem<AppSettings>('settings') || { ...defaultSettings }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  setItem('settings', settings)
}
