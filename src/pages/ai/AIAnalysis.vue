<template>
  <q-page padding class="ai-page">
    <div class="page-content">
      <div class="top-bar">
        <button class="icon-btn" @click="$router.back()">
          <q-icon name="arrow_back" size="20px" />
        </button>
        <div>
          <div class="top-title">AI 成长分析</div>
          <div class="top-sub">根据个人画像、成长记录和活人感反馈生成建议</div>
        </div>
        <button class="settings-btn" @click="$router.push('/settings/ai/ai-config')">
          <q-icon name="settings" size="18px" />
          <span>配置</span>
        </button>
      </div>

      <div v-if="!configured" class="empty-card">
        <div class="empty-icon">
          <q-icon name="smart_toy" size="38px" color="primary" />
        </div>
        <div class="empty-title">先配置 AI 接口</div>
        <div class="empty-desc">填写 API 地址、Key 和模型名后，就可以生成个人成长分析。</div>
        <button class="primary-btn" @click="$router.push('/settings/ai/ai-config')">
          <q-icon name="api" size="17px" />
          <span>去配置接口</span>
        </button>
      </div>

      <template v-else>
        <div class="summary-grid">
          <div class="summary-card">
            <q-icon name="person" size="18px" color="primary" />
            <div>
              <div class="summary-value">{{ profileLabel }}</div>
              <div class="summary-label">个人画像</div>
            </div>
          </div>
          <div class="summary-card">
            <q-icon name="trending_up" size="18px" color="positive" />
            <div>
              <div class="summary-value">{{ growthStore.records.length }}</div>
              <div class="summary-label">成长记录</div>
            </div>
          </div>
          <div class="summary-card">
            <q-icon name="favorite" size="18px" color="orange" />
            <div>
              <div class="summary-value">{{ aliveStore.taskLogs.length }}</div>
              <div class="summary-label">活人感反馈</div>
            </div>
          </div>
        </div>

        <div class="analysis-card">
          <div class="card-head">
            <div>
              <div class="card-title">生成建议</div>
              <div class="card-sub">不会读取或发送密码箱内容。</div>
            </div>
          </div>
          <div class="focus-row">
            <div class="focus-side">
              <q-icon name="flag" size="18px" color="primary" />
              <span>关注点</span>
            </div>
            <q-input
              v-model="focus"
              placeholder="例如：最近专注力下降，想知道下一周怎么调整"
              filled
              borderless
              dense
              hide-bottom-space
              class="focus-input"
            />
          </div>
          <div class="form-note">
            <q-icon name="info" size="15px" />
            <span>AI 建议仅供自我复盘参考，不替代医疗、心理咨询或专业判断。</span>
          </div>
          <div class="generate-note">
            <q-icon name="schedule" size="15px" />
            <span>通常需要 20-45 秒，生成后会自动保存到分析记录。</span>
          </div>
          <button class="primary-btn full-width" :disabled="loading || noGrowthData" @click="generateAnalysis">
            <q-icon :name="loading ? 'hourglass_empty' : 'auto_awesome'" size="17px" />
            <span>{{ loading ? '正在分析...' : '生成成长建议' }}</span>
          </button>
          <div v-if="loading" class="analysis-progress">
            <div class="analysis-progress-head">
              <q-icon name="sync" size="15px" class="progress-spin" />
              <span>正在整理画像、记录和活人感反馈</span>
            </div>
            <div class="analysis-progress-track">
              <span></span>
            </div>
            <div class="analysis-progress-steps">
              <span>读取数据</span>
              <span>生成建议</span>
              <span>刷新卡片</span>
            </div>
          </div>
          <div v-if="noGrowthData" class="inline-warning">
            <q-icon name="priority_high" size="15px" />
            <span>至少需要一条成长记录或活人感反馈，才能生成更有意义的分析。</span>
          </div>
        </div>

        <div v-if="analysis" ref="resultCardRef" class="result-card">
          <div class="result-head">
            <div class="result-title-row">
              <q-icon name="article" size="18px" color="primary" />
              <span>分析结果</span>
            </div>
            <span v-if="activeRecord" class="result-time">{{ formatDateTime(activeRecord.createdAt) }}</span>
          </div>
          <div class="report-hero">
            <div>
              <div class="report-title">{{ visualReport.title }}</div>
              <div class="report-sub">{{ activeRecord?.focus || focus || '基于近期记录生成' }}</div>
            </div>
            <div class="report-badges">
              <span v-for="item in visualReport.overview" :key="item" class="report-badge">{{ item }}</span>
            </div>
          </div>

          <div class="metric-grid">
            <div v-for="metric in metricCards" :key="metric.label" class="metric-card">
              <div class="metric-head">
                <q-icon :name="metric.icon" size="16px" :class="metric.colorClass" />
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
              </div>
              <div class="metric-track">
                <span class="metric-fill" :class="metric.colorClass" :style="{ transform: `scaleX(${metric.percent / 100})` }"></span>
              </div>
            </div>
          </div>

          <div v-if="visualReport.issues.length" class="report-section">
            <div class="section-head">
              <q-icon name="priority_high" size="16px" color="negative" />
              <span>需要优先修改</span>
            </div>
            <div class="report-table">
              <div class="table-row table-head">
                <span>问题</span>
                <span>依据</span>
                <span>下一步</span>
              </div>
              <div v-for="item in visualReport.issues" :key="`${item.problem}-${item.action}`" class="table-row">
                <span>
                  <strong>{{ item.problem }}</strong>
                  <em>{{ item.level }}</em>
                </span>
                <span>{{ item.evidence }}</span>
                <span>{{ item.action }}</span>
              </div>
            </div>
          </div>

          <div v-if="visualReport.actions.length" class="report-section">
            <div class="section-head">
              <q-icon name="checklist" size="16px" color="primary" />
              <span>行动表</span>
            </div>
            <div class="action-table">
              <div v-for="item in visualReport.actions" :key="`${item.day}-${item.action}`" class="action-item">
                <span class="action-day">{{ item.day }}</span>
                <strong>{{ item.action }}</strong>
                <span>{{ item.target }}</span>
              </div>
            </div>
          </div>

          <div v-if="visualReport.fields.length" class="field-section">
            <span class="field-label">后续记录</span>
            <span v-for="field in visualReport.fields" :key="field" class="field-chip">{{ field }}</span>
          </div>

          <details class="raw-detail">
            <summary>查看原始分析文本</summary>
            <div class="result-content">
              <template v-for="(block, blockIndex) in analysisBlocks" :key="blockIndex">
                <div
                  v-if="block.type === 'heading'"
                  class="analysis-heading"
                  :class="`analysis-heading-${block.level}`"
                >
                  <span
                    v-for="(segment, segmentIndex) in block.segments"
                    :key="segmentIndex"
                    :class="{ 'analysis-strong': segment.strong }"
                  >{{ segment.text }}</span>
                </div>
                <ol v-else-if="block.type === 'list' && block.ordered" class="analysis-list analysis-list-ordered">
                  <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
                    <span
                      v-for="(segment, segmentIndex) in item"
                      :key="segmentIndex"
                      :class="{ 'analysis-strong': segment.strong }"
                    >{{ segment.text }}</span>
                  </li>
                </ol>
                <ul v-else-if="block.type === 'list'" class="analysis-list">
                  <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
                    <span
                      v-for="(segment, segmentIndex) in item"
                      :key="segmentIndex"
                      :class="{ 'analysis-strong': segment.strong }"
                    >{{ segment.text }}</span>
                  </li>
                </ul>
                <p v-else class="analysis-paragraph">
                  <span
                    v-for="(segment, segmentIndex) in block.segments"
                    :key="segmentIndex"
                    :class="{ 'analysis-strong': segment.strong }"
                  >{{ segment.text }}</span>
                </p>
              </template>
            </div>
          </details>
        </div>

        <div v-if="analysisRecords.length" class="history-card">
          <div class="history-head">
            <div>
              <div class="card-title">分析记录</div>
              <div class="card-sub">已保存 {{ analysisRecords.length }} 条，可随时删除。</div>
            </div>
          </div>
          <div class="history-list">
            <div
              v-for="record in analysisRecords"
              :key="record.id"
              class="history-item"
              :class="{ 'history-item-active': record.id === activeAnalysisId }"
              role="button"
              tabindex="0"
              @click="loadAnalysisRecord(record)"
              @keydown.enter="loadAnalysisRecord(record)"
            >
              <div class="history-info">
                <strong>{{ record.title }}</strong>
                <span>{{ formatDateTime(record.createdAt) }} · {{ record.focus || '无关注点' }}</span>
              </div>
              <button class="history-delete" aria-label="删除分析记录" @click.stop="deleteAnalysisRecord(record.id)">
                <q-icon name="delete" size="16px" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAliveStore } from '@/stores/alive'
import { useGrowthStore } from '@/stores/growth'
import { getAIAnalysisRecords, saveAIAnalysisRecords } from '@/services/db'
import {
  buildGrowthAnalysisMessages,
  getAISettings,
  hasAIConnectionConfig,
  requestAICompletion,
} from '@/services/ai'
import { refreshAliveRecommendationLibrary } from '@/services/aliveRecommendations'
import type { AIAnalysisRecord, AIAnalysisSummary } from '@/types'

const $q = useQuasar()
const growthStore = useGrowthStore()
const aliveStore = useAliveStore()

const focus = ref('')
const analysis = ref('')
const loading = ref(false)
const aiSettings = ref(getAISettings())
const resultCardRef = ref<HTMLElement | null>(null)
const analysisRecords = ref<AIAnalysisRecord[]>([])
const activeAnalysisId = ref('')
let analysisRequestSeq = 0

interface InlineSegment {
  text: string
  strong: boolean
}

interface AnalysisIssue {
  problem: string
  evidence: string
  action: string
  level: string
}

interface AnalysisAction {
  day: string
  action: string
  target: string
}

interface VisualReport {
  title: string
  overview: string[]
  issues: AnalysisIssue[]
  actions: AnalysisAction[]
  fields: string[]
}

interface MetricCard {
  label: string
  value: string
  percent: number
  icon: string
  colorClass: string
}

type AnalysisBlock =
  | { type: 'heading'; level: number; segments: InlineSegment[] }
  | { type: 'paragraph'; segments: InlineSegment[] }
  | { type: 'list'; ordered: boolean; items: InlineSegment[][] }

onMounted(async () => {
  await Promise.all([
    growthStore.fetchRecords(),
    aliveStore.fetchTaskLogs(),
    aliveStore.fetchUserProfile(),
  ])
  aiSettings.value = getAISettings()
  analysisRecords.value = normalizeAnalysisRecords(await getAIAnalysisRecords())

  if (analysisRecords.value[0]) {
    loadAnalysisRecord(analysisRecords.value[0], false)
  }
})

const configured = computed(() => hasAIConnectionConfig(aiSettings.value))
const noGrowthData = computed(() => growthStore.records.length === 0 && aliveStore.taskLogs.length === 0)
const analysisBlocks = computed(() => parseAnalysisMarkdown(analysis.value))
const activeRecord = computed(() => analysisRecords.value.find(record => record.id === activeAnalysisId.value) || null)
const currentSummary = computed(() => activeRecord.value?.summary || buildCurrentSummary())
const visualReport = computed(() => parseVisualReport(analysis.value, currentSummary.value))

const metricCards = computed<MetricCard[]>(() => {
  const summary = currentSummary.value
  const hasRecords = summary.recordCount > 0
  const hasTaskLogs = summary.taskLogCount > 0

  return [
    {
      label: '整体评分',
      value: hasRecords ? `${formatNumber(summary.averageRating)}/5` : '暂无',
      percent: hasRecords ? toPercent(summary.averageRating, 5) : 0,
      icon: 'star',
      colorClass: 'metric-warning',
    },
    {
      label: '精力',
      value: hasRecords ? `${formatNumber(summary.averageEnergy)}/10` : '暂无',
      percent: hasRecords ? toPercent(summary.averageEnergy, 10) : 0,
      icon: 'battery_charging_full',
      colorClass: 'metric-positive',
    },
    {
      label: '专注',
      value: hasRecords ? `${formatNumber(summary.averageFocus)}/10` : '暂无',
      percent: hasRecords ? toPercent(summary.averageFocus, 10) : 0,
      icon: 'center_focus_strong',
      colorClass: 'metric-primary',
    },
    {
      label: '活人感变化',
      value: hasTaskLogs ? `${summary.averageTaskImprovement >= 0 ? '+' : ''}${formatNumber(summary.averageTaskImprovement)}` : '暂无',
      percent: hasTaskLogs ? clamp(((summary.averageTaskImprovement + 5) / 10) * 100, 0, 100) : 0,
      icon: 'favorite',
      colorClass: summary.averageTaskImprovement >= 0 ? 'metric-info' : 'metric-danger',
    },
  ]
})

const profileLabel = computed(() => {
  const profile = aliveStore.userProfile
  if (!profile) return '未填写'
  const personalityMap: Record<string, string> = {
    introvert: '内向',
    extrovert: '外向',
    mixed: '混合型',
  }
  const recoveryMap: Record<string, string> = {
    physical: '身体活动',
    environment: '环境整理',
    cognitive: '认知恢复',
    social: '社会连接',
  }
  return `${personalityMap[profile.personality] || '已填写'} · ${recoveryMap[profile.recoveryStyle] || '恢复偏好'}`
})

async function generateAnalysis() {
  if (loading.value) return
  aiSettings.value = getAISettings()

  if (!configured.value) {
    $q.notify({ type: 'warning', message: '请先配置 AI 接口' })
    return
  }
  if (noGrowthData.value) {
    $q.notify({ type: 'warning', message: '请先添加成长记录或活人感反馈' })
    return
  }

  const requestId = ++analysisRequestSeq
  loading.value = true
  analysis.value = ''
  activeAnalysisId.value = ''

  try {
    const messages = buildGrowthAnalysisMessages({
      profile: aliveStore.userProfile,
      records: growthStore.records,
      taskLogs: aliveStore.taskLogs,
      focus: focus.value,
    })
    const result = await requestAICompletion(messages, aiSettings.value, { timeoutMs: 45000, maxTokens: 1800 })
    if (requestId !== analysisRequestSeq) return
    if (!result.trim()) throw new Error('AI 返回内容为空，请稍后重试')

    analysis.value = result
    await saveAnalysisRecord(result)
    void refreshAliveRecommendationsAfterAnalysis(result)
    await nextTick()
    resultCardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    $q.notify({ type: 'positive', message: 'AI 分析已生成，活人感卡片会在后台更新' })
  } catch (error) {
    if (requestId === analysisRequestSeq) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'AI 分析失败',
        timeout: 2600,
      })
    }
  } finally {
    if (requestId === analysisRequestSeq) {
      loading.value = false
    }
  }
}

async function refreshAliveRecommendationsAfterAnalysis(analysisContext: string) {
  await refreshAliveRecommendationLibrary({
    profile: aliveStore.userProfile,
    recentTaskLogs: aliveStore.taskLogs,
    analysisContext,
    refreshAll: true,
  })
}

async function saveAnalysisRecord(content: string) {
  const summary = buildCurrentSummary()
  const report = parseVisualReport(content, summary)
  const record: AIAnalysisRecord = {
    id: `analysis-${Date.now()}`,
    title: report.title || 'AI 成长分析',
    focus: focus.value.trim(),
    content,
    createdAt: new Date().toISOString(),
    summary,
  }

  analysisRecords.value = [record, ...analysisRecords.value.filter(item => item.id !== record.id)].slice(0, 50)
  activeAnalysisId.value = record.id
  await saveAIAnalysisRecords(analysisRecords.value)
}

function loadAnalysisRecord(record: AIAnalysisRecord, scroll = true) {
  analysis.value = record.content
  focus.value = record.focus
  activeAnalysisId.value = record.id

  if (scroll) {
    void nextTick(() => {
      resultCardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

async function deleteAnalysisRecord(id: string) {
  const wasActive = activeAnalysisId.value === id
  analysisRecords.value = analysisRecords.value.filter(record => record.id !== id)
  await saveAIAnalysisRecords(analysisRecords.value)

  if (wasActive) {
    const nextRecord = analysisRecords.value[0]
    if (nextRecord) {
      loadAnalysisRecord(nextRecord, false)
    } else {
      activeAnalysisId.value = ''
      analysis.value = ''
    }
  }
  $q.notify({ type: 'positive', message: '分析记录已删除' })
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '时间未知'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildCurrentSummary(): AIAnalysisSummary {
  const records = growthStore.records
  const taskLogs = aliveStore.taskLogs
  const recordCount = records.length
  const average = (key: 'rating' | 'energy' | 'mood' | 'focus' | 'satisfaction') => {
    if (!recordCount) return 0
    const total = records.reduce((sum, record) => sum + (Number(record[key]) || 0), 0)
    return roundOne(total / recordCount)
  }

  const averageTaskImprovement = taskLogs.length
    ? roundOne(taskLogs.reduce((sum, log) => sum + (log.afterScore - log.beforeScore), 0) / taskLogs.length)
    : 0

  return {
    recordCount,
    taskLogCount: taskLogs.length,
    averageRating: average('rating'),
    averageEnergy: average('energy'),
    averageMood: average('mood'),
    averageFocus: average('focus'),
    averageSatisfaction: average('satisfaction'),
    averageTaskImprovement,
  }
}

function parseVisualReport(content: string, summary: AIAnalysisSummary): VisualReport {
  const fallback = fallbackVisualReport(summary)
  const parsed = parseReportJson(content)
  if (!parsed) return fallback

  const title = limitText(String(parsed.title || ''), 32) || fallback.title
  const overview = normalizeStringList(parsed.overview, 3, 18)
  const issues = normalizeIssues(parsed.issues)
  const actions = normalizeActions(parsed.actions)
  const fields = normalizeStringList(parsed.fields, 5, 10)

  return {
    title,
    overview: overview.length ? overview : fallback.overview,
    issues: issues.length ? issues : fallback.issues,
    actions: actions.length ? actions : fallback.actions,
    fields: fields.length ? fields : fallback.fields,
  }
}

function parseReportJson(content: string): Record<string, unknown> | null {
  const clean = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  const jsonText = start >= 0 && end > start ? clean.slice(start, end + 1) : clean

  try {
    const data = JSON.parse(jsonText)
    return data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

function normalizeStringList(value: unknown, maxItems: number, maxLength: number) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[，,；;\n]/)
      : value && typeof value === 'object'
        ? Object.values(value as Record<string, unknown>)
        : []

  return list
    .map(item => limitText(String(item || '').replace(/^[-*•]\s*/, '').trim(), maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeIssues(value: unknown): AnalysisIssue[] {
  if (!Array.isArray(value)) return []
  return value.map(item => {
    if (typeof item === 'string') {
      return {
        problem: limitText(item, 18),
        evidence: 'AI 提醒关注',
        action: '先做一个最小调整',
        level: '关注',
      }
    }

    if (!item || typeof item !== 'object') return null
    const row = item as Record<string, unknown>
    return {
      problem: limitText(String(row.problem || row.title || row.name || ''), 18),
      evidence: limitText(String(row.evidence || row.reason || row.detail || '近期记录提示'), 24),
      action: limitText(String(row.action || row.next || row.suggestion || '做一个低压力行动'), 24),
      level: limitText(String(row.level || row.priority || '关注'), 8),
    }
  }).filter((item): item is AnalysisIssue => Boolean(item && item.problem && item.action)).slice(0, 4)
}

function normalizeActions(value: unknown): AnalysisAction[] {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => {
    if (typeof item === 'string') {
      return {
        day: index === 0 ? '今天' : `第 ${index + 1} 步`,
        action: limitText(item, 20),
        target: '降低启动难度',
      }
    }

    if (!item || typeof item !== 'object') return null
    const row = item as Record<string, unknown>
    return {
      day: limitText(String(row.day || row.time || `第 ${index + 1} 步`), 10),
      action: limitText(String(row.action || row.task || row.name || ''), 20),
      target: limitText(String(row.target || row.goal || row.reason || '形成可执行下一步'), 22),
    }
  }).filter((item): item is AnalysisAction => Boolean(item && item.action)).slice(0, 7)
}

function fallbackVisualReport(summary: AIAnalysisSummary): VisualReport {
  const issues: AnalysisIssue[] = []
  const addIssue = (problem: string, evidence: string, action: string, level = '中') => {
    if (issues.length < 4) issues.push({ problem, evidence, action, level })
  }

  if (summary.recordCount === 0 && summary.taskLogCount === 0) {
    addIssue('数据不足', '暂无可分析记录', '先补一条成长记录', '高')
  }
  if (summary.recordCount > 0 && summary.averageEnergy > 0 && summary.averageEnergy < 5.5) {
    addIssue('精力偏低', `均值 ${formatNumber(summary.averageEnergy)}/10`, '先固定睡眠和补水', '高')
  }
  if (summary.recordCount > 0 && summary.averageFocus > 0 && summary.averageFocus < 6) {
    addIssue('专注不足', `均值 ${formatNumber(summary.averageFocus)}/10`, '每天一个短专注块', '中')
  }
  if (summary.recordCount > 0 && summary.averageMood > 0 && summary.averageMood < 6) {
    addIssue('情绪波动', `均值 ${formatNumber(summary.averageMood)}/10`, '记录触发情境', '中')
  }
  if (summary.taskLogCount > 0 && summary.averageTaskImprovement <= 0) {
    addIssue('恢复动作无效', `平均 ${formatNumber(summary.averageTaskImprovement)}`, '换更小的卡片', '高')
  }
  if (issues.length === 0) {
    addIssue('节奏需保持', '近期没有明显低点', '继续做轻量复盘', '低')
  }

  return {
    title: '近期成长状态速览',
    overview: [
      `${summary.recordCount} 条成长记录`,
      `${summary.taskLogCount} 条活人感反馈`,
      summary.averageTaskImprovement > 0 ? `恢复平均 +${formatNumber(summary.averageTaskImprovement)}` : '先降低行动门槛',
    ],
    issues,
    actions: [
      { day: '今天', action: '写一条真实状态', target: '补足分析依据' },
      { day: '明天', action: '做一个 20 分钟专注块', target: '保护启动感' },
      { day: '本周', action: '复盘 3 个低分场景', target: '找出阻力模式' },
    ],
    fields: ['精力', '情绪', '专注', '睡眠', '完成阻力'],
  }
}

function normalizeAnalysisRecords(records: AIAnalysisRecord[]) {
  return (Array.isArray(records) ? records : [])
    .filter(record => record && record.id && record.content)
    .map(record => ({
      ...record,
      summary: normalizeSummary(record.summary),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function normalizeSummary(summary: AIAnalysisSummary): AIAnalysisSummary {
  return {
    recordCount: Number(summary?.recordCount) || 0,
    taskLogCount: Number(summary?.taskLogCount) || 0,
    averageRating: Number(summary?.averageRating) || 0,
    averageEnergy: Number(summary?.averageEnergy) || 0,
    averageMood: Number(summary?.averageMood) || 0,
    averageFocus: Number(summary?.averageFocus) || 0,
    averageSatisfaction: Number(summary?.averageSatisfaction) || 0,
    averageTaskImprovement: Number(summary?.averageTaskImprovement) || 0,
  }
}

function parseAnalysisMarkdown(markdown: string): AnalysisBlock[] {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .replace(/^```(?:markdown|md|json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .split('\n')

  const blocks: AnalysisBlock[] = []
  let pendingList: { ordered: boolean; items: InlineSegment[][] } | null = null

  const flushList = () => {
    if (!pendingList) return
    blocks.push({ type: 'list', ordered: pendingList.ordered, items: pendingList.items })
    pendingList = null
  }

  lines.forEach(rawLine => {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      return
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      const marker = headingMatch[1] || '#'
      const headingText = headingMatch[2] || ''
      blocks.push({
        type: 'heading',
        level: Math.min(marker.length, 3),
        segments: parseInlineMarkdown(cleanMarkdownText(headingText)),
      })
      return
    }

    const numberedMatch = line.match(/^(\d+)[.、)]\s+(.+)$/)
    const numberedText = numberedMatch?.[2]?.trim() || ''
    const sectionLine = splitSectionLine(numberedText)
    if (numberedMatch && sectionLine && isSectionTitle(sectionLine.title)) {
      flushList()
      blocks.push({
        type: 'heading',
        level: 2,
        segments: parseInlineMarkdown(cleanMarkdownText(sectionLine.title)),
      })
      if (sectionLine.body) {
        blocks.push({ type: 'paragraph', segments: parseInlineMarkdown(cleanMarkdownText(sectionLine.body)) })
      }
      return
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/)
    if (bulletMatch) {
      if (!pendingList || pendingList.ordered) {
        flushList()
        pendingList = { ordered: false, items: [] }
      }
      pendingList.items.push(parseInlineMarkdown(cleanMarkdownText(bulletMatch[1] || '')))
      return
    }

    if (numberedMatch) {
      if (!pendingList || !pendingList.ordered) {
        flushList()
        pendingList = { ordered: true, items: [] }
      }
      pendingList.items.push(parseInlineMarkdown(cleanMarkdownText(numberedText)))
      return
    }

    flushList()
    blocks.push({ type: 'paragraph', segments: parseInlineMarkdown(cleanMarkdownText(line)) })
  })

  flushList()
  return blocks
}

function isSectionTitle(text: string) {
  const clean = text.replace(/[：:]\s*$/, '')
  if (clean.length > 36) return false
  return /状态|判断|模式|建议|行动|推荐|记录|字段|下一步|今天|后续/.test(clean)
}

function splitSectionLine(text: string) {
  const clean = text.trim().replace(/[*_#`]/g, '')
  const colonMatch = clean.match(/^(.{2,24}?)[：:]\s*(.*)$/)
  if (colonMatch) {
    return {
      title: (colonMatch[1] || '').trim(),
      body: (colonMatch[2] || '').trim(),
    }
  }
  return { title: clean.replace(/[：:]\s*$/, ''), body: '' }
}

function cleanMarkdownText(text: string) {
  return text
    .replace(/^>\s*/, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

function parseInlineMarkdown(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  const regex = /(\*\*|__)(.+?)\1/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), strong: false })
    }
    segments.push({ text: match[2] || '', strong: true })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), strong: false })
  }

  return segments.length > 0 ? segments : [{ text, strong: false }]
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function toPercent(value: number, max: number) {
  return clamp((value / max) * 100, 0, 100)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function limitText(value: string, maxLength: number) {
  const text = value.trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}
</script>

<style scoped>
.ai-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.page-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 24px 52px;
}

.top-bar {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-bottom: 22px;
}

.icon-btn,
.settings-btn,
.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast) ease;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
}

.icon-btn:hover,
.settings-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.top-title {
  font-size: var(--fs-22, 22px);
  font-weight: 720;
  color: var(--color-text-primary);
}

.top-sub {
  margin-top: 4px;
  font-size: var(--fs-13, 13px);
  color: var(--color-text-secondary);
}

.settings-btn {
  min-height: 38px;
  padding: 0 13px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-weight: 650;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.summary-card,
.analysis-card,
.result-card,
.history-card,
.empty-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
}

.summary-value {
  font-size: var(--fs-16, 16px);
  font-weight: 720;
  color: var(--color-text-primary);
}

.summary-label {
  margin-top: 2px;
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
}

.analysis-card,
.result-card,
.history-card {
  padding: 16px;
  margin-bottom: 14px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.card-title,
.result-head {
  font-size: var(--fs-15, 15px);
  font-weight: 700;
  color: var(--color-text-primary);
}

.card-sub {
  margin-top: 3px;
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
}

.focus-row {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 8px;
  border-radius: var(--radius-md);
  background: rgba(91, 106, 191, 0.04);
  margin-bottom: 12px;
}

.focus-side {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
  font-weight: 650;
}

.focus-input :deep(.q-field__control) {
  min-height: 40px;
  border-radius: var(--radius-md);
  background: white;
  align-items: center;
}

.focus-input.q-field--focused :deep(.q-field__control) {
  box-shadow: inset 0 0 0 1px var(--color-primary), var(--focus-ring);
}

.form-note,
.generate-note,
.inline-warning {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 11px;
  border-radius: var(--radius-md);
  font-size: var(--fs-12, 12px);
  font-weight: 700;
}

.form-note {
  margin-bottom: 8px;
  background: var(--color-info-light);
  color: var(--color-info);
}

.generate-note {
  margin-bottom: 12px;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.inline-warning {
  margin-top: 10px;
  background: var(--color-danger-light);
  color: var(--color-negative);
}

.analysis-progress {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding: 11px 12px;
  border-radius: var(--radius-md);
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.analysis-progress-head,
.analysis-progress-steps {
  display: flex;
  align-items: center;
}

.analysis-progress-head {
  gap: 7px;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
}

.analysis-progress-track {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(91, 106, 191, 0.12);
}

.analysis-progress-track span {
  display: block;
  width: 44%;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  animation: progressSweep 1.25s ease-in-out infinite;
}

.analysis-progress-steps {
  justify-content: space-between;
  gap: 8px;
  font-size: var(--fs-11, 11px);
  font-weight: 650;
  color: var(--color-text-muted);
}

.progress-spin {
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes progressSweep {
  0% { transform: translateX(-110%); }
  50% { transform: translateX(35%); }
  100% { transform: translateX(230%); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.primary-btn {
  min-height: 42px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-13, 13px);
  font-weight: 700;
}

.primary-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.full-width {
  width: 100%;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.result-title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.result-time {
  flex: 0 0 auto;
  font-size: var(--fs-12, 12px);
  font-weight: 650;
  color: var(--color-text-muted);
}

.report-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 16px;
  margin-bottom: 14px;
  border-radius: var(--radius-md);
  background: var(--color-bg-hover);
}

.report-title {
  font-size: var(--fs-20, 20px);
  line-height: 1.35;
  font-weight: 760;
  color: var(--color-text-primary);
  text-wrap: balance;
}

.report-sub {
  margin-top: 6px;
  max-width: 56ch;
  font-size: var(--fs-12, 12px);
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.report-badges {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 7px;
  max-width: 250px;
}

.report-badge,
.field-chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--fs-12, 12px);
  font-weight: 700;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.metric-card {
  min-width: 0;
  display: grid;
  gap: 9px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

.metric-head {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.metric-head strong {
  color: var(--color-text-primary);
  font-size: var(--fs-13, 13px);
}

.metric-track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(91, 106, 191, 0.12);
}

.metric-fill {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 3px;
  border-radius: inherit;
  transform-origin: left center;
  transition: transform var(--motion-normal) ease;
}

.metric-primary { color: var(--color-primary); }
.metric-primary.metric-fill { background: var(--color-primary); }
.metric-positive { color: var(--color-positive); }
.metric-positive.metric-fill { background: var(--color-positive); }
.metric-warning { color: var(--color-warning); }
.metric-warning.metric-fill { background: var(--color-warning); }
.metric-info { color: var(--color-info); }
.metric-info.metric-fill { background: var(--color-info); }
.metric-danger { color: var(--color-negative); }
.metric-danger.metric-fill { background: var(--color-negative); }

.report-section {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.section-head {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-text-primary);
  font-size: var(--fs-14, 14px);
  font-weight: 760;
}

.report-table {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1.1fr 1.2fr;
  min-width: 0;
}

.table-row + .table-row {
  border-top: 1px solid var(--color-border);
}

.table-row > span {
  min-width: 0;
  padding: 11px 12px;
  font-size: var(--fs-12, 12px);
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.table-row > span + span {
  border-left: 1px solid var(--color-border);
}

.table-head {
  background: var(--color-bg-hover);
}

.table-head > span {
  color: var(--color-text-primary);
  font-size: var(--fs-12, 12px);
  font-weight: 760;
}

.table-row strong {
  display: block;
  margin-bottom: 4px;
  color: var(--color-text-primary);
  font-size: var(--fs-13, 13px);
}

.table-row em {
  display: inline-flex;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--color-danger-light);
  color: var(--color-negative);
  font-size: var(--fs-11, 11px);
  font-style: normal;
  font-weight: 760;
}

.action-table {
  display: grid;
  gap: 8px;
}

.action-item {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 9px 11px;
  border-radius: var(--radius-md);
  background: var(--color-bg-hover);
}

.action-day {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--color-bg-card);
  color: var(--color-primary);
  font-size: var(--fs-12, 12px);
  font-weight: 760;
}

.action-item strong {
  min-width: 0;
  color: var(--color-text-primary);
  font-size: var(--fs-13, 13px);
}

.action-item span:last-child {
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: var(--fs-12, 12px);
  line-height: 1.5;
}

.field-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

.field-label {
  font-size: var(--fs-12, 12px);
  font-weight: 760;
  color: var(--color-text-primary);
}

.raw-detail {
  margin-top: 16px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

.raw-detail summary {
  width: fit-content;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--fs-12, 12px);
  font-weight: 700;
}

.raw-detail[open] summary {
  margin-bottom: 12px;
  color: var(--color-primary);
}

.result-content {
  display: grid;
  gap: 12px;
  white-space: normal;
  line-height: 1.75;
  color: var(--color-text-secondary);
  font-size: var(--fs-14, 14px);
}

.analysis-heading {
  color: var(--color-text-primary);
  font-weight: 760;
  line-height: 1.35;
  text-wrap: balance;
}

.analysis-heading-1 {
  font-size: var(--fs-20, 20px);
  margin: 2px 0 4px;
}

.analysis-heading-2 {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--fs-15, 15px);
}

.analysis-heading-3 {
  font-size: var(--fs-14, 14px);
}

.analysis-paragraph {
  max-width: 68ch;
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.75;
  text-wrap: pretty;
}

.analysis-list {
  display: grid;
  gap: 7px;
  max-width: 70ch;
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.analysis-list li {
  padding-left: 2px;
  line-height: 1.7;
}

.analysis-list li::marker {
  color: var(--color-primary);
  font-weight: 700;
}

.analysis-list-ordered {
  padding-left: 24px;
}

.analysis-strong {
  color: var(--color-text-primary);
  font-weight: 760;
}

.empty-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 44px 24px;
  text-align: center;
}

.empty-icon {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  background: var(--color-primary-bg);
}

.empty-title {
  font-size: var(--fs-18, 18px);
  font-weight: 720;
  color: var(--color-text-primary);
}

.empty-desc {
  max-width: 360px;
  font-size: var(--fs-13, 13px);
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.history-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.history-list {
  display: grid;
  gap: 8px;
}

.history-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  gap: 10px;
  align-items: center;
  min-height: 54px;
  padding: 9px 10px 9px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) ease;
}

.history-item:hover,
.history-item:focus-visible {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  outline: none;
}

.history-item-active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.history-info {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.history-info strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-primary);
  font-size: var(--fs-13, 13px);
  font-weight: 760;
}

.history-info span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-muted);
  font-size: var(--fs-12, 12px);
}

.history-delete {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
}

.history-delete:hover,
.history-delete:focus-visible {
  background: var(--color-danger-light);
  color: var(--color-negative);
  outline: none;
}

:global(body.dark-mode) .focus-input :deep(.q-field__control),
:global(body.dark-mode) .metric-card,
:global(body.dark-mode) .history-item,
:global(body.dark-mode) .action-day {
  background: var(--color-bg-card);
}

:global(body.dark-mode) .report-hero,
:global(body.dark-mode) .generate-note,
:global(body.dark-mode) .action-item,
:global(body.dark-mode) .table-head {
  background: var(--color-bg-hover);
}

@media (max-width: 640px) {
  .page-content {
    padding: 20px 16px 40px;
  }

  .top-bar {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .settings-btn {
    grid-column: 1 / -1;
    width: 100%;
  }

  .summary-grid,
  .focus-row {
    grid-template-columns: 1fr;
  }

  .report-hero,
  .metric-grid,
  .table-row,
  .action-item {
    grid-template-columns: 1fr;
  }

  .report-badges {
    justify-content: flex-start;
    max-width: none;
  }

  .table-row > span + span {
    border-left: 0;
    border-top: 1px solid var(--color-border);
  }

  .table-head {
    display: none;
  }

  .result-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
