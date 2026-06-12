import {
  buildAliveRecommendationMessages,
  getAISettings,
  hasAIConnectionConfig,
  requestAICompletion,
} from '@/services/ai'
import { getBaseAliveTasksForFilters } from '@/services/aliveBaseTasks'
import { getAliveRecommendationCache, saveAliveRecommendationCache } from '@/services/db'
import type {
  AliveRecommendationCache,
  AliveRecommendationCard,
  AliveStatus,
  AliveTimeAvailable,
  TaskLog,
  UserProfile,
} from '@/types'

export interface AliveRecommendationFilters {
  status: AliveStatus
  timeAvailable: AliveTimeAvailable
  canGoOut: boolean
}

export interface AliveRecommendationRefreshInput extends AliveRecommendationFilters {
  profile: UserProfile | null
  recentTaskLogs: TaskLog[]
  avoidTitles?: string[]
  analysisContext?: string
  referenceTask?: {
    title: string
    desc: string
    time: string
    tag: string
  }
  append?: boolean
  forceRefresh?: boolean
  timeoutMs?: number
}

export interface AliveRecommendationLibraryInput {
  profile: UserProfile | null
  recentTaskLogs: TaskLog[]
  seed?: AliveRecommendationFilters
  analysisContext?: string
  maxRequests?: number
  refreshAll?: boolean
}

const CACHE_VERSION = 2
const MAX_CARDS_PER_KEY = 12
const MIN_CARDS_PER_KEY = 5
const DEFAULT_TIMEOUT_MS = 8500
const keyRefreshPromises = new Map<string, Promise<AliveRecommendationCard[]>>()
let libraryRefreshPromise: Promise<void> | null = null

export const aliveStatuses: AliveStatus[] = ['low-energy', 'can-move', 'want-recover']
export const aliveTimes: AliveTimeAvailable[] = ['5min', '15min', '30min', '1hour']
export const alivePlaces = [false, true]

export function getAliveRecommendationKey(filters: AliveRecommendationFilters) {
  return `${filters.status}|${filters.timeAvailable}|${filters.canGoOut ? 'outdoor' : 'indoor'}`
}

export function parseAliveRecommendationKey(key: string): AliveRecommendationFilters | null {
  const [status, timeAvailable, place] = key.split('|')
  if (!aliveStatuses.includes(status as AliveStatus)) return null
  if (!aliveTimes.includes(timeAvailable as AliveTimeAvailable)) return null
  if (place !== 'outdoor' && place !== 'indoor') return null
  return {
    status: status as AliveStatus,
    timeAvailable: timeAvailable as AliveTimeAvailable,
    canGoOut: place === 'outdoor',
  }
}

export async function getCachedAliveRecommendations(filters: AliveRecommendationFilters) {
  const rawCache = await getAliveRecommendationCache()
  const cache = normalizeAliveRecommendationCache(rawCache)
  if (shouldPersistNormalizedCache(rawCache, cache)) {
    await saveAliveRecommendationCache({
      ...cache,
      updatedAt: new Date().toISOString(),
    })
  }
  return filterCardsForKey(cache.cardsByKey[getAliveRecommendationKey(filters)] || [], filters)
}

export async function saveCachedAliveRecommendations(
  filters: AliveRecommendationFilters,
  cards: AliveRecommendationCard[],
  append = false,
) {
  const cache = normalizeAliveRecommendationCache(await getAliveRecommendationCache())
  const key = getAliveRecommendationKey(filters)
  const existing = append ? (cache.cardsByKey[key] || []) : []
  const next = composeCardsForKey([...cards, ...existing], filters)
  const nextCache: AliveRecommendationCache = {
    version: CACHE_VERSION,
    updatedAt: new Date().toISOString(),
    cardsByKey: {
      ...cache.cardsByKey,
      [key]: next,
    },
  }
  await saveAliveRecommendationCache(nextCache)
  return next
}

export async function refreshAliveRecommendationsForKey(input: AliveRecommendationRefreshInput) {
  const settings = getAISettings()
  if (!hasAIConnectionConfig(settings)) return []

  const filters: AliveRecommendationFilters = {
    status: input.status,
    timeAvailable: input.timeAvailable,
    canGoOut: input.canGoOut,
  }
  const existing = await getCachedAliveRecommendations(filters)

  if (!input.forceRefresh && !input.append && existing.length >= MIN_CARDS_PER_KEY) return existing
  if (!input.forceRefresh && input.append && existing.length >= MAX_CARDS_PER_KEY) return existing

  const key = getAliveRecommendationKey(filters)
  const running = keyRefreshPromises.get(key)
  if (running) return running

  const request = (async () => {
    const messages = buildAliveRecommendationMessages({
      profile: input.profile,
      recentTaskLogs: input.recentTaskLogs,
      status: input.status,
      timeAvailable: input.timeAvailable,
      canGoOut: input.canGoOut,
      avoidTitles: [...(input.avoidTitles || []), ...existing.map(card => card.title)],
      analysisContext: input.analysisContext,
      referenceTask: input.referenceTask,
    })
    const text = await requestAICompletion(messages, { ...settings, enabled: true }, {
      timeoutMs: input.timeoutMs || DEFAULT_TIMEOUT_MS,
      maxTokens: 850,
    })
    const cards = parseAliveRecommendations(text, filters)
    if (cards.length === 0) return existing

    return saveCachedAliveRecommendations(filters, cards, input.append || existing.length > 0)
  })()

  keyRefreshPromises.set(key, request)

  try {
    return await request
  } finally {
    if (keyRefreshPromises.get(key) === request) {
      keyRefreshPromises.delete(key)
    }
  }
}

export async function refreshAliveRecommendationLibrary(input: AliveRecommendationLibraryInput) {
  if (!hasAIConnectionConfig(getAISettings())) return
  if (!input.refreshAll && libraryRefreshPromise) return libraryRefreshPromise

  const refreshPromise = runAliveRecommendationLibraryRefresh(input)
  if (input.refreshAll) return refreshPromise

  libraryRefreshPromise = refreshPromise.finally(() => {
    libraryRefreshPromise = null
  })
  return libraryRefreshPromise
}

async function runAliveRecommendationLibraryRefresh(input: AliveRecommendationLibraryInput) {
  const cache = normalizeAliveRecommendationCache(await getAliveRecommendationCache())
  await saveAliveRecommendationCache(cache)

  const keys = buildRefreshQueue(input.seed, cache)
  const maxRequests = input.refreshAll
    ? keys.length
    : Math.max(1, Math.min(6, input.maxRequests || 3))

  for (const filters of keys.slice(0, maxRequests)) {
    try {
      await refreshAliveRecommendationsForKey({
        ...filters,
        profile: input.profile,
        recentTaskLogs: input.recentTaskLogs,
        analysisContext: input.analysisContext,
        append: true,
        forceRefresh: input.refreshAll,
      })
    } catch {
      // Background refill should never interrupt the user's current work.
    }
  }
}

export function normalizeAliveRecommendationCache(raw: AliveRecommendationCache | null): AliveRecommendationCache {
  const cardsByKey: Record<string, AliveRecommendationCard[]> = {}
  const source = raw?.cardsByKey && typeof raw.cardsByKey === 'object' ? raw.cardsByKey : {}

  Object.entries(source).forEach(([key, cards]) => {
    const filters = parseAliveRecommendationKey(key)
    if (!filters || !Array.isArray(cards)) return
    const validCards = composeCardsForKey(cards, filters)
    if (validCards.length > 0) cardsByKey[key] = validCards.slice(0, MAX_CARDS_PER_KEY)
  })

  buildAllFilters().forEach(filters => {
    const key = getAliveRecommendationKey(filters)
    cardsByKey[key] = composeCardsForKey(cardsByKey[key] || [], filters)
  })

  return {
    version: CACHE_VERSION,
    updatedAt: raw?.updatedAt || new Date().toISOString(),
    cardsByKey,
  }
}

function buildRefreshQueue(seed: AliveRecommendationFilters | undefined, cache: AliveRecommendationCache) {
  const allFilters = buildAllFilters()
  const sorted = allFilters.sort((a, b) => {
    const aScore = getRefreshScore(a, seed, cache)
    const bScore = getRefreshScore(b, seed, cache)
    return bScore - aScore
  })
  return sorted
}

function buildAllFilters(): AliveRecommendationFilters[] {
  return aliveStatuses.flatMap(status =>
    aliveTimes.flatMap(timeAvailable =>
      alivePlaces.map(canGoOut => ({ status, timeAvailable, canGoOut })),
    ),
  )
}

function shouldPersistNormalizedCache(
  raw: AliveRecommendationCache | null,
  cache: AliveRecommendationCache,
) {
  if (!raw || raw.version !== cache.version) return true
  const source = raw.cardsByKey && typeof raw.cardsByKey === 'object' ? raw.cardsByKey : {}

  return buildAllFilters().some(filters => {
    const key = getAliveRecommendationKey(filters)
    return filterCardsForKey(source[key] || [], filters).length < MIN_CARDS_PER_KEY
  })
}

function getRefreshScore(
  filters: AliveRecommendationFilters,
  seed: AliveRecommendationFilters | undefined,
  cache: AliveRecommendationCache,
) {
  const key = getAliveRecommendationKey(filters)
  const count = filterCardsForKey(cache.cardsByKey[key] || [], filters).length
  let score = Math.max(0, MIN_CARDS_PER_KEY - count) * 10

  if (seed) {
    if (filters.status === seed.status) score += 4
    if (filters.timeAvailable === seed.timeAvailable) score += 3
    if (filters.canGoOut === seed.canGoOut) score += 2
  }
  if (count === 0) score += 8
  return score
}

function parseAliveRecommendations(text: string, filters: AliveRecommendationFilters) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  const jsonText = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed
  let list: unknown[] = []

  try {
    const raw = JSON.parse(jsonText)
    list = Array.isArray(raw) ? raw : (raw.cards || raw.recommendations || raw.tasks || [])
  } catch {
    list = parseTextRecommendations(trimmed, filters)
  }

  if (!Array.isArray(list)) return []
  return list
    .map((item, index) => normalizeCard(item, index, filters))
    .filter((card): card is AliveRecommendationCard => Boolean(card))
}

function parseTextRecommendations(text: string, filters: AliveRecommendationFilters) {
  const fallbackTime = defaultTimeTextForBucket(filters.timeAvailable)
  return text
    .split('\n')
    .map(line => line.trim().replace(/^(\d+[.、)]|[-*•])\s*/, '').trim())
    .filter(line => line.length > 0 && !/^#+\s/.test(line))
    .slice(0, 5)
    .map(line => {
      const parts = line.split(/[：:]/)
      const title = (parts.shift() || '').replace(/\*\*/g, '').trim()
      const desc = parts.join('：').replace(/\*\*/g, '').trim()
      const detectedTime = line.match(/(\d+\s*(?:分钟|小时|min|hour))/i)?.[1] || fallbackTime
      return {
        title: title.slice(0, 28),
        desc: desc || line.replace(/\*\*/g, '').slice(0, 120),
        time: detectedTime,
        tag: inferTaskTag(line),
        minTime: filters.timeAvailable,
        minStatus: filters.status,
        needGoOut: filters.canGoOut,
      }
    })
}

function normalizeCard(item: unknown, index: number, filters: AliveRecommendationFilters) {
  if (typeof item === 'string') {
    const detectedTime = item.match(/(\d+\s*(?:分钟|小时|min|hour))/i)?.[1] || defaultTimeTextForBucket(filters.timeAvailable)
    return normalizeCard({
      title: item,
      desc: item,
      time: detectedTime,
      tag: inferTaskTag(item),
      minTime: filters.timeAvailable,
      minStatus: filters.status,
      needGoOut: filters.canGoOut,
    }, index, filters)
  }

  if (!item || typeof item !== 'object') return null
  const task = item as Record<string, unknown>
  const title = String(task.title || task.name || '').trim().slice(0, 28)
  const desc = String(task.desc || task.description || task.reason || '').trim().slice(0, 120)
  const time = String(task.time || '').trim().slice(0, 16) || defaultTimeTextForBucket(filters.timeAvailable)
  const tag = String(task.tag || task.target || '').trim().slice(0, 12) || '状态恢复'
  const minTime = normalizeMinTime(task.minTime || task.timeAvailable || task.min_time, time, filters.timeAvailable)
  const minStatus = normalizeStatus(task.minStatus || task.status || task.min_status, filters.status)
  const needGoOut = normalizeNeedGoOut(task.needGoOut ?? task.need_go_out ?? task.outdoor, filters.canGoOut)

  const card: AliveRecommendationCard = {
    id: `ai:${encodeURIComponent(title)}:${Date.now()}:${index}`,
    title,
    desc,
    time,
    tag,
    minTime,
    minStatus,
    needGoOut,
    source: 'ai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return isCardForFilters(card, filters) ? card : null
}

function mergeCards(cards: AliveRecommendationCard[], filters: AliveRecommendationFilters) {
  const seen = new Set<string>()
  return cards
    .filter(card => isCardForFilters(card, filters))
    .filter(card => {
      const key = card.title.trim()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function composeCardsForKey(cards: AliveRecommendationCard[], filters: AliveRecommendationFilters) {
  const baseCards = mergeCards(getBaseAliveTasksForFilters(filters, MIN_CARDS_PER_KEY), filters)
  const baseTitles = new Set(baseCards.map(card => card.title.trim()))
  const customLimit = Math.max(0, MAX_CARDS_PER_KEY - baseCards.length)
  const customCards = mergeCards(cards, filters)
    .filter(card => !card.id.startsWith('base:') && !baseTitles.has(card.title.trim()))
    .slice(0, customLimit)

  return mergeCards([...customCards, ...baseCards], filters).slice(0, MAX_CARDS_PER_KEY)
}

function filterCardsForKey(cards: AliveRecommendationCard[], filters: AliveRecommendationFilters) {
  return mergeCards(cards, filters)
}

function isCardForFilters(card: AliveRecommendationCard, filters: AliveRecommendationFilters) {
  if (!card.title || !card.desc) return false
  if (card.needGoOut !== filters.canGoOut) return false
  if (getTimeBucket(parseDuration(card.time)) !== filters.timeAvailable) return false
  return card.minStatus === filters.status
}

function normalizeMinTime(value: unknown, timeText: string, fallback: AliveTimeAvailable): AliveTimeAvailable {
  if (aliveTimes.includes(value as AliveTimeAvailable)) return value as AliveTimeAvailable
  const minutes = parseDuration(String(value || timeText || ''))
  return minutes > 0 ? getTimeBucket(minutes) : fallback
}

function normalizeStatus(value: unknown, fallback: AliveStatus): AliveStatus {
  if (aliveStatuses.includes(value as AliveStatus)) return value as AliveStatus
  const text = String(value || '').toLowerCase()
  if (text.includes('不想动') || text.includes('低能量') || text.includes('低电量') || text.includes('low')) return 'low-energy'
  if (text.includes('恢复') || text.includes('recover')) return 'want-recover'
  if (text.includes('能动') || text.includes('move') || text.includes('neutral')) return 'can-move'
  return fallback
}

function normalizeNeedGoOut(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  const text = String(value || '').trim().toLowerCase()
  if (!text) return fallback
  if (['false', 'no', '0', '不需要', '否', '室内', '家里', 'inside', 'indoor'].some(item => text.includes(item))) return false
  return ['true', 'yes', '1', '需要', '是', '出门', '户外', 'outside', 'outdoor'].some(item => text.includes(item))
}

function defaultTimeTextForBucket(bucket: AliveTimeAvailable) {
  const map: Record<AliveTimeAvailable, string> = {
    '5min': '5 分钟',
    '15min': '10 分钟',
    '30min': '25 分钟',
    '1hour': '45 分钟',
  }
  return map[bucket]
}

function getTimeBucket(minutes: number): AliveTimeAvailable {
  if (minutes <= 5) return '5min'
  if (minutes <= 15) return '15min'
  if (minutes <= 30) return '30min'
  return '1hour'
}

function parseDuration(timeText: string) {
  const match = timeText.match(/\d+/)
  if (!match) return 0
  const value = Number(match[0])
  if (!Number.isFinite(value)) return 0
  return /小时|hour/i.test(timeText) ? value * 60 : value
}

function inferTaskTag(text: string) {
  if (/水|吃|洗脸|睡|呼吸/.test(text)) return '基础需求'
  if (/走|跑|拉伸|深蹲|运动|出门/.test(text)) return '身体唤醒'
  if (/桌|房间|整理|收拾|清洁/.test(text)) return '环境整理'
  if (/写|复盘|计划|记录/.test(text)) return '认知恢复'
  if (/朋友|联系|聊天|消息/.test(text)) return '社会连接'
  return '状态恢复'
}
