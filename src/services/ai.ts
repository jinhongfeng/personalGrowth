import type {
  AliveStatus,
  AliveTimeAvailable,
  GrowthRecord,
  TaskLog,
  UserProfile,
} from '@/types'

export interface AISettings {
  enabled: boolean
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIRequestOptions {
  timeoutMs?: number
  maxTokens?: number
}

export interface GrowthAnalysisInput {
  profile: UserProfile | null
  records: GrowthRecord[]
  taskLogs: TaskLog[]
  focus?: string
}

export interface AliveRecommendationInput {
  profile: UserProfile | null
  recentTaskLogs: TaskLog[]
  status: AliveStatus
  timeAvailable: AliveTimeAvailable
  canGoOut: boolean
  avoidTitles?: string[]
  analysisContext?: string
  referenceTask?: {
    title: string
    desc: string
    time: string
    tag: string
  }
}

interface AIProfileContext {
  filled: boolean
  personality: string
  recoveryStyle: string
  currentGoal: string
  sports: string[]
}

const AI_SETTINGS_KEY = 'pg_app_ai_settings'
const DEFAULT_AI_TIMEOUT_MS = 25000
const AI_TIMEOUT_MESSAGE = 'AI 请求超时，请稍后重试或检查接口配置'

const personalityLabelMap: Record<UserProfile['personality'], string> = {
  introvert: '内向，倾向独处恢复能量',
  extrovert: '外向，倾向通过连接恢复能量',
  mixed: '混合型，独处和连接都可能有效',
}

const recoveryStyleLabelMap: Record<UserProfile['recoveryStyle'], string> = {
  physical: '身体活动，优先考虑运动、拉伸、散步等身体唤醒',
  environment: '环境整理，优先考虑整理空间、清洁、降低环境阻力',
  cognitive: '认知恢复，优先考虑阅读、写作、复盘、冥想',
  social: '社会连接，优先考虑轻量联系、聊天、见面或表达支持',
}

export const defaultAISettings: AISettings = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: '',
  temperature: 0.4,
}

export function getAISettings(): AISettings {
  try {
    const saved = localStorage.getItem(AI_SETTINGS_KEY)
    if (!saved) return { ...defaultAISettings }
    const parsed = JSON.parse(saved)
    return {
      ...defaultAISettings,
      ...parsed,
      temperature: Number.isFinite(Number(parsed.temperature))
        ? Number(parsed.temperature)
        : defaultAISettings.temperature,
    }
  } catch {
    return { ...defaultAISettings }
  }
}

export function saveAISettings(settings: AISettings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify({
    ...settings,
    baseUrl: settings.baseUrl.trim(),
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim(),
    temperature: clampTemperature(settings.temperature),
  }))
}

export function hasAIConfig(settings = getAISettings()) {
  return Boolean(settings.enabled && settings.baseUrl.trim() && settings.apiKey.trim() && settings.model.trim())
}

export function hasAIConnectionConfig(settings = getAISettings()) {
  return Boolean(settings.baseUrl.trim() && settings.apiKey.trim() && settings.model.trim())
}

export function buildGrowthAnalysisMessages(input: GrowthAnalysisInput): AIMessage[] {
  const recentRecords = input.records.slice(0, 12).map(record => ({
    category: record.category,
    title: limitText(record.title, 60),
    content: limitText(record.content, 220),
    rating: record.rating,
    energy: record.energy,
    mood: record.mood,
    focus: record.focus,
    satisfaction: record.satisfaction,
    notes: limitText(record.notes, 120),
    tags: record.tags?.slice(0, 6),
    time: record.createdAt,
  }))

  const recentTaskLogs = input.taskLogs.slice(0, 12).map(log => ({
    beforeScore: log.beforeScore,
    afterScore: log.afterScore,
    feedback: limitText(log.feedback, 160),
    time: log.executedAt,
  }))

  const summary = summarizeRecords(input.records, input.taskLogs)
  const profileContext = buildAIProfileContext(input.profile)

  return [
    {
      role: 'system',
      content: [
        '你是一个温和、务实的个人成长分析助手。',
        '你只能基于用户提供的个人画像、成长记录和活人感反馈做趋势分析与下一步建议。',
        '如果个人画像已填写，必须把性格倾向、恢复偏好、当前目标和运动偏好纳入判断，不能只基于记录均值给泛泛建议。',
        '不要做医学诊断，不要替代心理咨询或医疗建议；如果数据呈现持续低落、强烈痛苦或风险信号，请建议用户寻求可信赖的人或专业帮助。',
        '输出中文，结构清晰，建议具体、可执行、低压力。',
        '结果会被前端渲染成指标条、问题表格和行动表，所以请尽量少写长段文字。',
        '优先返回 JSON，不要返回 Markdown，不要解释 JSON。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: '分析这个人的近期成长状态，并给出下一步怎么做更好的建议。',
        outputFormat: [
          '返回 JSON 对象，字段为 title、overview、issues、actions、fields。',
          'overview：最多 3 条，每条 18 字以内，适合做顶部摘要标签。',
          'issues：2-4 个对象，字段为 problem、evidence、action、level，适合表格展示，文字都要短。',
          'actions：3-7 个对象，字段为 day、action、target，适合行动表展示，每条行动 20 字以内，行动必须尽量贴合个人画像。',
          'fields：3-5 个后续建议记录字段。',
        ],
        exampleShape: {
          title: '近期成长状态分析',
          overview: ['精力波动偏低', '专注需要保护', '先稳住日常节奏'],
          issues: [
            { problem: '专注下降', evidence: '最近记录均值偏低', action: '每天一个 20 分钟专注块', level: '高' },
          ],
          actions: [
            { day: '今天', action: '做一个 10 分钟复盘', target: '明确下一步' },
          ],
          fields: ['精力', '专注', '睡眠', '完成阻力'],
        },
        userFocus: limitText(input.focus || '无特别补充', 160),
        profile: profileContext,
        profileRules: [
          '如果 personality 是内向，不要默认安排高社交压力任务。',
          '如果 personality 是外向，可以把轻量连接作为恢复策略之一。',
          '优先让 action 符合 recoveryStyle。',
          '如果 currentGoal 非空，至少 1 条 action 要服务于当前目标。',
          '如果 sports 非空，运动类建议优先使用用户已选择的运动偏好。',
        ],
        summary,
        recentRecords,
        recentTaskLogs,
      }, null, 2),
    },
  ]
}

export function buildAliveRecommendationMessages(input: AliveRecommendationInput): AIMessage[] {
  const statusLabelMap: Record<AliveStatus, string> = {
    'low-energy': '不想动',
    'can-move': '能动一点',
    'want-recover': '我想恢复',
  }
  const timeLabelMap: Record<AliveTimeAvailable, string> = {
    '5min': '1-5 分钟',
    '15min': '6-15 分钟',
    '30min': '16-30 分钟',
    '1hour': '31-60 分钟',
  }
  const profileContext = buildAIProfileContext(input.profile)

  return [
    {
      role: 'system',
      content: [
        '你是一个温和、务实的“找回活人感”微行动推荐助手。',
        '只推荐低压力、具体、可立刻执行的小行动，不做医学诊断，不替代心理咨询或医疗建议。',
        '必须考虑用户当前状态：不想动、能动一点、我想恢复；还要考虑可用时间、是否能出门、个人画像和最近反馈。',
        '如果个人画像已填写，卡片必须明显贴合画像，不要生成和恢复偏好、当前目标、运动偏好相冲突的泛用卡片。',
        '请只返回 JSON，不要返回 Markdown，不要解释。JSON 必须是数组，恰好 5 个对象。',
        '每个对象字段：title、desc、time、tag、minTime、needGoOut、minStatus。',
        'minTime 只能是 5min、15min、30min、1hour；minStatus 只能是 low-energy、can-move、want-recover。',
        'time 用中文短文本，例如“5 分钟”；tag 是预期目标，例如“身体唤醒”“情绪调节”“环境整理”。',
        '必须严格匹配用户选择的状态、时间档位和是否出门，不要返回其他状态、更短或更长时间的卡片。',
        '如果提供了 growthAnalysis，请优先围绕分析指出的问题和下一步建议生成卡片。',
        '可以参考 referenceTask 的方向，但不要重复标题和描述。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: '根据当前状态推荐 5 个活人感微行动卡片。',
        currentState: {
          status: input.status,
          statusLabel: statusLabelMap[input.status],
          timeAvailable: input.timeAvailable,
          timeLabel: timeLabelMap[input.timeAvailable],
          canGoOut: input.canGoOut,
        },
        requiredFields: {
          minStatus: input.status,
          minTime: input.timeAvailable,
          needGoOut: input.canGoOut,
        },
        profile: profileContext,
        growthAnalysis: limitText(input.analysisContext || '', 900),
        referenceTask: input.referenceTask || null,
        recentTaskLogs: input.recentTaskLogs.slice(0, 10).map(log => ({
          beforeScore: log.beforeScore,
          afterScore: log.afterScore,
          feedback: log.feedback,
          time: log.executedAt,
        })),
        avoidTitles: input.avoidTitles || [],
        rules: [
          'timeAvailable 为 5min 时，time 必须是 1-5 分钟。',
          'timeAvailable 为 15min 时，time 必须是 6-15 分钟。',
          'timeAvailable 为 30min 时，time 必须是 16-30 分钟。',
          'timeAvailable 为 1hour 时，time 必须是 31-60 分钟。',
          '如果 canGoOut 为 true，只推荐需要出门或户外完成的行动，needGoOut 必须为 true。',
          '如果 canGoOut 为 false，只推荐室内行动，needGoOut 必须为 false。',
          `每个对象的 minStatus 必须严格等于 ${input.status}，不要返回其他状态。`,
          '如果状态是不想动，动作要更低门槛、更少准备、更少决策。',
          '如果状态是能动一点，可以加入整理、拉伸、短步行，但不要设计成高强度任务。',
          '如果状态是我想恢复，可以加入复盘、运动或外出行动，目标更偏向恢复节奏。',
          '如果 profile.filled 为 true，至少 3 张卡片要明显体现 recoveryStyle、currentGoal 或 sports 中的一个。',
          '如果用户选择了运动偏好，运动类卡片优先使用这些运动，不要随意推荐陌生运动。',
          '如果用户是内向型，社交卡片要低压力；如果用户是外向型，可以适当加入轻连接。',
          '预计时间和预期目标必须和行动内容匹配。',
        ],
      }, null, 2),
    },
  ]
}

function buildAIProfileContext(profile: UserProfile | null): AIProfileContext {
  if (!profile) {
    return {
      filled: false,
      personality: '未填写',
      recoveryStyle: '未填写',
      currentGoal: '',
      sports: [],
    }
  }

  return {
    filled: true,
    personality: personalityLabelMap[profile.personality] || '未填写',
    recoveryStyle: recoveryStyleLabelMap[profile.recoveryStyle] || '未填写',
    currentGoal: limitText(profile.currentGoal || '', 120),
    sports: Array.isArray(profile.sports) ? profile.sports.slice(0, 8) : [],
  }
}

export async function requestAICompletion(
  messages: AIMessage[],
  settings = getAISettings(),
  options: AIRequestOptions = {},
) {
  if (!hasAIConnectionConfig(settings)) {
    throw new Error('请先在设置页填写 API 地址、Key 和模型名')
  }

  const url = getChatCompletionUrl(settings.baseUrl)
  const timeoutMs = normalizeTimeoutMs(options.timeoutMs)
  const maxTokens = normalizeMaxTokens(options.maxTokens)
  const body: Record<string, unknown> = {
    model: settings.model.trim(),
    messages,
    temperature: clampTemperature(settings.temperature),
    stream: false,
  }
  if (maxTokens) body.max_tokens = maxTokens
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null

  const sendCompletion = async (requestBody: Record<string, unknown>) => {
    if (window.electronAPI?.ai) {
      const response = await window.electronAPI.ai.chatCompletion({
        url,
        apiKey: settings.apiKey.trim(),
        body: requestBody,
        timeoutMs,
      })
      return parseCompletionResponse(response.text, response.ok, response.status)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller?.signal,
    })
    const text = await response.text()
    return parseCompletionResponse(text, response.ok, response.status)
  }

  const operation = (async () => {
    try {
      return await sendCompletion(body)
    } catch (error) {
      if (maxTokens && shouldRetryWithoutMaxTokens(error)) {
        const { max_tokens: _maxTokens, ...retryBody } = body
        return await sendCompletion(retryBody)
      }
      throw error
    }
  })()

  try {
    return await withTimeout(operation, timeoutMs, () => controller?.abort())
  } catch (error) {
    if (isAbortError(error)) throw new Error(AI_TIMEOUT_MESSAGE)
    throw error
  }
}

function parseCompletionResponse(text: string, ok: boolean, status: number) {
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!ok) {
    throw new Error(extractErrorMessage(data, text, status))
  }

  if (!data && text.trim()) return text.trim()

  const content = extractCompletionContent(data)
  if (!content) {
    throw new Error('AI 返回内容为空，请检查模型是否兼容 Chat Completions 格式')
  }
  return content.trim()
}

function getChatCompletionUrl(baseUrl: string) {
  const clean = baseUrl.trim().replace(/\/+$/, '')
  if (clean.endsWith('/chat/completions')) return clean
  return `${clean}/chat/completions`
}

function clampTemperature(value: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return defaultAISettings.temperature
  return Math.max(0, Math.min(1, num))
}

function normalizeMaxTokens(value?: number) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return 0
  return Math.max(64, Math.min(4096, Math.floor(num)))
}

function shouldRetryWithoutMaxTokens(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  return /max[_\s-]?tokens|unsupported|unrecognized|unknown parameter|invalid parameter/i.test(message)
}

function normalizeTimeoutMs(value?: number) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return DEFAULT_AI_TIMEOUT_MS
  return Math.max(5000, Math.min(60000, num))
}

function extractCompletionContent(data: any) {
  const choice = data?.choices?.[0]
  const candidates = [
    choice?.message?.content,
    choice?.delta?.content,
    choice?.text,
    data?.output_text,
    extractResponsesOutput(data?.output),
    data?.content,
    data?.result,
    data?.response,
    data?.message?.content,
    data?.message,
  ]

  for (const candidate of candidates) {
    const text = normalizeContent(candidate)
    if (text) return text
  }
  return ''
}

function extractResponsesOutput(output: unknown) {
  if (!Array.isArray(output)) return ''
  return output.map(item => {
    if (!item || typeof item !== 'object') return ''
    const content = (item as { content?: unknown }).content
    return normalizeContent(content)
  }).filter(Boolean).join('\n').trim()
}

function normalizeContent(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!value) return ''

  if (Array.isArray(value)) {
    return value.map(item => normalizeContent(item)).filter(Boolean).join('\n').trim()
  }

  if (typeof value === 'object') {
    const item = value as Record<string, unknown>
    return normalizeContent(item.text || item.content || item.output_text || item.value)
  }

  return String(value).trim()
}

function limitText(value: unknown, maxLength: number) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

function extractErrorMessage(data: any, rawText: string, status: number) {
  const message = normalizeContent(
    data?.error?.message ||
    data?.error ||
    data?.message ||
    data?.detail ||
    data?.details,
  )
  if (message) return message
  if (rawText.trim()) return rawText.trim().slice(0, 300)
  return `AI 请求失败，状态码 ${status}`
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, onTimeout?: () => void) {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      onTimeout?.()
      reject(new Error(AI_TIMEOUT_MESSAGE))
    }, timeoutMs)
  })
  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId)
  })
}

function isAbortError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
}

function summarizeRecords(records: GrowthRecord[], taskLogs: TaskLog[]) {
  const count = records.length
  const average = (key: 'rating' | 'energy' | 'mood' | 'focus' | 'satisfaction') => {
    if (!count) return 0
    const total = records.reduce((sum, record) => sum + (Number(record[key]) || 0), 0)
    return Math.round((total / count) * 10) / 10
  }

  const categories = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.category] = (acc[record.category] || 0) + 1
    return acc
  }, {})

  const taskImprovement = taskLogs.length
    ? Math.round((taskLogs.reduce((sum, log) => sum + (log.afterScore - log.beforeScore), 0) / taskLogs.length) * 10) / 10
    : 0

  return {
    recordCount: count,
    taskLogCount: taskLogs.length,
    averageRating: average('rating'),
    averageEnergy: average('energy'),
    averageMood: average('mood'),
    averageFocus: average('focus'),
    averageSatisfaction: average('satisfaction'),
    categoryCounts: categories,
    averageTaskImprovement: taskImprovement,
  }
}
