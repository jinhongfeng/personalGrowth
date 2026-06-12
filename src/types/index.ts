// 成长记录类型
export interface GrowthRecord {
  id: string
  category: string
  title: string
  content: string
  startTime: string
  endTime: string
  rating: number
  energy: number
  mood: number
  focus: number
  satisfaction: number
  notes: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface GrowthTemplate {
  id: string
  category: string
  name: string
  defaultContent: string
  tags: string[]
}

// 密码箱类型
export interface PasswordEntry {
  id: string
  name: string
  url: string
  username: string
  encryptedPassword: string
  notes: string
  category: 'work' | 'social' | 'payment' | 'other'
  isStarred: boolean
  lastUpdated: string
}

// 找回活人感类型
export interface UserProfile {
  id: string
  personality: 'introvert' | 'extrovert' | 'mixed'
  recoveryStyle: 'physical' | 'environment' | 'cognitive' | 'social'
  currentGoal: string
  sports: string[]
}

export interface AliveTask {
  id: string
  name: string
  description: string
  type: 'physical' | 'environment' | 'cognitive' | 'social' | 'micro-growth'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number
  canGoOut: boolean
  tags: string[]
}

export interface TaskLog {
  id: string
  taskId: string
  executedAt: string
  beforeScore: number
  afterScore: number
  feedback: string
}

export type AliveStatus = 'low-energy' | 'can-move' | 'want-recover'
export type AliveTimeAvailable = '5min' | '15min' | '30min' | '1hour'

export interface AliveRecommendationCard {
  id: string
  title: string
  desc: string
  time: string
  tag: string
  minTime: AliveTimeAvailable
  needGoOut: boolean
  minStatus: AliveStatus
  source?: 'ai' | 'local'
  createdAt?: string
  updatedAt?: string
}

export interface AliveRecommendationCache {
  version: number
  updatedAt: string
  cardsByKey: Record<string, AliveRecommendationCard[]>
}

export interface AIAnalysisSummary {
  recordCount: number
  taskLogCount: number
  averageRating: number
  averageEnergy: number
  averageMood: number
  averageFocus: number
  averageSatisfaction: number
  averageTaskImprovement: number
}

export interface AIAnalysisRecord {
  id: string
  title: string
  focus: string
  content: string
  createdAt: string
  summary: AIAnalysisSummary
}

// 用户状态
export interface UserStatus {
  energy: 'low' | 'medium' | 'high'
  mood: 'bad' | 'neutral' | 'good'
  canGoOut: boolean
  timeAvailable: '5min' | '15min' | '30min' | '1hour'
  canSocial: boolean
}
