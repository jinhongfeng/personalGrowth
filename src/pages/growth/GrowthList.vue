<template>
  <q-page padding class="growth-page">
    <div class="page-content">
      <!-- 页头 -->
      <div class="page-header">
        <div>
          <h1 class="page-title">成长记录</h1>
          <p class="page-sub">记录每一次进步，看见自己的变化</p>
        </div>
        <button class="btn-add" @click="$router.push('/growth/new')">
          <q-icon name="add" size="18px" />
          <span>写记录</span>
        </button>
      </div>

      <!-- Tab 导航 -->
      <div class="page-tabs">
        <button
          v-for="t in mainTabs"
          :key="t.value"
          class="page-tab"
          :class="{ 'page-tab-active': tab === t.value }"
          @click="tab = t.value"
        >
          <q-icon :name="t.icon" size="16px" />
          <span>{{ t.label }}</span>
        </button>
      </div>

      <!-- 记录列表 -->
      <template v-if="tab === 'list'">
        <!-- 分类筛选 -->
        <div class="cat-pills">
          <button
            v-for="c in catTabs"
            :key="c.value"
            class="cat-pill"
            :class="{ 'cat-pill-active': cat === c.value }"
            @click="cat = c.value"
          >
            {{ c.label }}
          </button>
        </div>

        <div class="list-summary">
          <div>
            <strong>{{ filteredRecords.length }}</strong>
            <span>条记录</span>
          </div>
          <button class="btn-secondary" @click="$router.push('/growth/new')">
            <q-icon name="add" size="16px" />
            <span>新增</span>
          </button>
        </div>

        <template v-if="groupedRecords.length > 0">
          <div v-for="group in groupedRecords" :key="group.key" class="record-group">
            <div class="date-label">{{ group.label }}</div>
            <div class="record-list">
              <button type="button" class="record-card" v-for="r in group.records" :key="r.id" @click="openGrowthEdit(r.id)">
                <div class="record-icon" :class="getIconBg(r.category)">
                  <q-icon :name="getIcon(r.category)" size="18px" :color="getIconColor(r.category)" />
                </div>
                <div class="record-body">
                  <div class="record-title">{{ getCategoryLabel(r.category) }} · {{ r.title }}</div>
                  <div class="record-detail">{{ formatTimeRange(r.startTime, r.endTime) }} · 评分 {{ r.rating }}/5</div>
                </div>
                <div class="record-score" :style="getScoreStyle(r.rating)">{{ r.rating }}/5</div>
                <q-icon name="chevron_right" size="16px" color="#D1CCC6" class="record-arrow" />
              </button>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-if="groupedRecords.length === 0" class="empty-state">
          <div class="empty-icon">
            <q-icon name="edit_note" size="48px" color="#D1CCC6" />
          </div>
          <div class="empty-title">还没有记录</div>
          <div class="empty-desc">点击「新增」开始记录你的成长</div>
          <button class="empty-btn" @click="$router.push('/growth/new')">新增成长记录</button>
        </div>
      </template>

      <!-- 统计 -->
      <template v-if="tab === 'stats'">
        <template v-if="safeRecords.length > 0">
          <div class="stats-grid">
            <div class="stats-card" v-for="s in statSummary" :key="s.label">
              <div class="stats-value" :style="{ color: s.color }">{{ s.value }}</div>
              <div class="stats-label">{{ s.label }}</div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">记录数量趋势</div>
              <div class="chart-period">近 7 天</div>
            </div>
            <div class="chart-bars">
              <div class="bar-col" v-for="(d, i) in weekDays" :key="i">
                <div class="bar-wrapper">
                  <div class="bar" :style="{ transform: `scaleY(${d.height / 100})`, background: d.color }"></div>
                </div>
                <div class="bar-count">{{ d.count }}</div>
                <div class="bar-label">{{ d.day }}</div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">状态评分趋势</div>
              <div class="chart-period">近 7 天</div>
            </div>
            <div class="chart-line">
              <svg viewBox="0 0 280 100" class="line-svg">
                <polyline
                  fill="none"
                  stroke="#5B6ABF"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :points="linePoints.points"
                />
                <circle v-for="(dot, di) in linePoints.dots" :key="di" :cx="dot.cx" :cy="dot.cy" r="3.5" fill="#5B6ABF" />
              </svg>
              <div class="line-labels">
                <span v-for="d in weekDays" :key="d.day">{{ d.day }}</span>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="empty-state stats-empty">
          <div class="empty-icon">
            <q-icon name="bar_chart" size="48px" color="#D1CCC6" />
          </div>
          <div class="empty-title">暂无统计数据</div>
          <div class="empty-desc">保存一条成长记录后，这里会显示记录数量和评分趋势</div>
          <button class="empty-btn" @click="$router.push('/growth/new')">新增成长记录</button>
        </div>
      </template>

      <!-- 模板 -->
      <template v-if="tab === 'tpl'">
        <div class="template-list">
          <button type="button" class="template-card" v-for="t in templates" :key="t.label" @click="useTemplate(t)">
            <div class="record-icon" :class="t.iconBg">
              <q-icon :name="t.icon" size="18px" :color="t.iconColor" />
            </div>
            <div class="record-body">
              <div class="record-title">{{ t.label }}</div>
              <div class="record-detail">{{ t.desc }}</div>
            </div>
            <span class="btn-use" aria-hidden="true">
              <q-icon name="play_arrow" size="16px" />
            </span>
          </button>
        </div>

        <div class="template-tip">
          <q-icon name="lightbulb" size="14px" color="orange" />
          <span>点击模板可快速创建记录</span>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '@/stores/growth'
import { getGrowthCategories, getGrowthCategoryByValue, type GrowthCategoryConfig } from '@/services/growthCategories'

const router = useRouter()
const store = useGrowthStore()
const tab = ref('list')
const cat = ref('all')
const categories = ref<GrowthCategoryConfig[]>(getGrowthCategories())

onMounted(() => {
  store.fetchRecords()
  window.addEventListener('growth-categories-changed', refreshCategories)
})

onBeforeUnmount(() => {
  window.removeEventListener('growth-categories-changed', refreshCategories)
})

const now = new Date()
const yesterday = new Date(now)
yesterday.setDate(yesterday.getDate() - 1)

const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const yesterdayDateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

const mainTabs = [
  { value: 'list', icon: 'list', label: '记录' },
  { value: 'stats', icon: 'bar_chart', label: '统计' },
  { value: 'tpl', icon: 'bookmark', label: '模板' },
]

const catTabs = computed(() => [
  { value: 'all', label: '全部' },
  ...categories.value.map(c => ({ value: c.value, label: c.label })),
])

const safeRecords = computed(() => (store.records || [])
  .filter(r => r && typeof r === 'object')
  .map(r => ({
    ...r,
    category: r.category || 'study',
    title: r.title || '未命名记录',
    createdAt: normalizeDateString(r.createdAt || r.updatedAt),
    rating: normalizeNumber(r.rating, 3, 1, 5),
    startTime: r.startTime || '',
    endTime: r.endTime || '',
  }))
  .filter(r => Boolean(r.createdAt)))

function refreshCategories() {
  categories.value = getGrowthCategories()
  if (cat.value !== 'all' && !categories.value.some(item => item.value === cat.value)) {
    cat.value = 'all'
  }
}

function getCategory(catValue: string) {
  return getGrowthCategoryByValue(catValue, categories.value)
}
function getIcon(catValue: string) { return getCategory(catValue).icon }
function getIconColor(catValue: string) { return getCategory(catValue).color }
function getIconBg(catValue: string) { return getCategory(catValue).bgClass.replace('cat-bg-', 'icon-bg-') }
function getCategoryLabel(catValue: string) { return getCategory(catValue).label || catValue }
function formatTimeRange(start?: string, end?: string) {
  if (start && end) return `${start}-${end}`
  if (start) return `${start} 开始`
  if (end) return `${end} 结束`
  return '未填写时间'
}
function getScoreColor(rating: number) {
  if (rating >= 4) return '#4CAF82'
  if (rating >= 3) return '#5B6ABF'
  return '#E89B3E'
}
function getScoreStyle(rating: number) {
  return { color: getScoreColor(rating) }
}
function openGrowthEdit(id: string) {
  router.push(`/growth/${id}/edit`)
}

const filteredRecords = computed(() => {
  let result = [...safeRecords.value]
  if (cat.value !== 'all') {
    result = result.filter(r => r && r.category === cat.value)
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const groupedRecords = computed(() => {
  const groups = new Map<string, typeof filteredRecords.value>()
  filteredRecords.value.forEach(r => {
    const key = r.createdAt?.slice(0, 10) || 'unknown'
    const list = groups.get(key) || []
    list.push(r)
    groups.set(key, list)
  })
  return [...groups.entries()].map(([key, records]) => ({
    key,
    label: formatDateLabel(key),
    records,
  }))
})

function formatDateLabel(key: string) {
  if (key === todayDateStr) return `今天 · ${formatDateText(key)}`
  if (key === yesterdayDateStr) return `昨天 · ${formatDateText(key)}`
  return formatDateText(key)
}

function formatDateText(key: string) {
  if (key === 'unknown') return '未知日期'
  const d = new Date(key)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function calcStreak(records: { createdAt: string }[]) {
  if (records.length === 0) return 0
  const dates = [...new Set(records.map(r => normalizeDateString(r.createdAt).slice(0, 10)).filter(Boolean))].sort().reverse()
  if (dates.length === 0) return 0
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i])
    const prev = new Date(dates[i + 1])
    if ((curr.getTime() - prev.getTime()) / 86400000 === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

const statSummary = computed(() => {
  const allRecords = safeRecords.value
  const total = allRecords.length
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().slice(0, 10)
  const thisWeek = allRecords.filter(r => r && r.createdAt >= weekStr).length
  const avgRating = total > 0
    ? (allRecords.reduce((sum, r) => sum + (r?.rating || 0), 0) / total).toFixed(1)
    : '0'
  const streak = calcStreak(allRecords)
  return [
    { label: '总记录', value: total, color: '#5B6ABF' },
    { label: '本周', value: thisWeek, color: '#2A9D8F' },
    { label: '最长连续', value: streak > 0 ? streak : '—', color: '#E07A5F' },
    { label: '平均评分', value: avgRating, color: '#4CAF82' },
  ]
})

const weekDays = computed(() => {
  const now2 = new Date()
  const buckets = getRecentDayBuckets(now2)
  const weekRecords = buckets.map(bucket =>
    safeRecords.value.filter(r => r.createdAt.startsWith(bucket.date)).length
  )

  const maxCount = Math.max(...weekRecords, 1)
  return buckets.map((bucket, i) => ({
    day: bucket.label,
    count: weekRecords[i],
    height: Math.round((weekRecords[i] / maxCount) * 100) || 4,
    color: i >= 5 ? '#7B8AE0' : '#5B6ABF',
  }))
})

const linePoints = computed(() => {
  const now2 = new Date()
  const ratings: (number | null)[] = []
  getRecentDayBuckets(now2).forEach(bucket => {
    const dayRecords = safeRecords.value.filter(r => r.createdAt.startsWith(bucket.date))
    if (dayRecords.length > 0) {
      ratings.push(dayRecords.reduce((s, r) => s + r.rating, 0) / dayRecords.length)
    } else {
      ratings.push(null)
    }
  })
  const validRatings = ratings.filter(r => r !== null) as number[]
  if (validRatings.length === 0) {
    return { points: '10,50 50,50 90,50 130,50 170,50 210,50 250,50', dots: [] as { cx: number; cy: number }[] }
  }
  const minR = Math.min(...validRatings)
  const maxR = Math.max(...validRatings)
  const range = maxR - minR || 1
  const xStep = 40
  const xStart = 10
  const yMin = 80
  const yMax = 20
  const pts: string[] = []
  const dots: { cx: number; cy: number }[] = []
  ratings.forEach((r, i) => {
    const x = xStart + i * xStep
    const y = r !== null ? yMax + ((maxR - r) / range) * (yMin - yMax) : 50
    pts.push(`${x},${Math.round(y)}`)
    if (r !== null) dots.push({ cx: x, cy: Math.round(y) })
  })
  return { points: pts.join(' '), dots }
})

function normalizeNumber(value: unknown, fallback: number, min: number, max: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(min, Math.min(max, num))
}

function normalizeDateString(value: unknown) {
  if (!value) return ''
  const raw = String(value)
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getRecentDayBuckets(base: Date) {
  const labels = ['日', '一', '二', '三', '四', '五', '六']
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(base)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (6 - index))
    return {
      date: formatDateKey(d),
      label: labels[d.getDay()],
    }
  })
}

const templates = computed(() => categories.value.map(category => ({
  icon: category.icon,
  iconColor: category.color,
  iconBg: category.bgClass.replace('cat-bg-', 'icon-bg-'),
  label: `${category.label} · 今日记录`,
  desc: `记录一次${category.label}相关的完成情况、状态变化和下一步提醒`,
  category: category.value,
})))

function useTemplate(t: typeof templates.value[0]) {
  router.push({ path: '/growth/new', query: { category: t.category, title: t.label, content: t.desc } })
}
</script>

<style scoped>
.growth-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: var(--fs-24, 24px);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.page-sub { font-size: var(--fs-13, 13px); color: var(--color-text-muted); margin: 0; }

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 10px var(--color-primary-glow);
}

.btn-add:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(91, 106, 191, 0.35);
  transform: translateY(-1px);
}

.page-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.page-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--fs-13, 13px);
  font-weight: 500;
  color: var(--color-text-muted);
  font-family: inherit;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.page-tab:hover { color: var(--color-primary); }

.page-tab-active {
  color: var(--color-primary) !important;
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.cat-pills {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.cat-pill {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--fs-12, 12px);
  font-weight: 500;
  color: var(--color-text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.cat-pill-active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.cat-pill-active:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.list-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 18px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.list-summary strong {
  font-size: var(--fs-22, 22px);
  color: var(--color-primary);
  margin-right: 4px;
}

.list-summary span {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
}

.btn-secondary,
.empty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  height: 34px;
  padding: 0 12px;
}

.btn-secondary:hover,
.empty-btn:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
}

.record-group {
  margin-bottom: 22px;
}

.date-label {
  font-size: var(--fs-11, 11px);
  font-weight: 600;
  color: var(--color-text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-left: 2px;
}

.date-label + .date-label { margin-top: 24px; }

.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.record-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: transform var(--motion-fast) ease, box-shadow var(--motion-fast) ease, border-color var(--motion-fast) ease;
}

.record-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.record-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.icon-bg-indigo { background: var(--color-indigo-light); }
.icon-bg-orange { background: var(--color-orange-light); }
.icon-bg-green { background: var(--color-success-light); }
.icon-bg-teal { background: var(--color-teal-light); }

.record-body { flex: 1; min-width: 0; }
.record-title { font-size: var(--fs-13, 13px); font-weight: 600; color: var(--color-text-primary); letter-spacing: -0.1px; }
.record-detail { font-size: var(--fs-12, 12px); color: var(--color-text-muted); margin-top: 2px; }

.record-score {
  font-size: var(--fs-12, 12px);
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--color-bg);
  flex-shrink: 0;
}

.record-arrow {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.record-card:hover .record-arrow { opacity: 1; }

.empty-state { text-align: center; padding: 48px 24px; }
.empty-icon { margin-bottom: 16px; }
.empty-title { font-size: var(--fs-16, 16px); font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; }
.empty-desc { font-size: var(--fs-13, 13px); color: var(--color-text-muted); }
.empty-btn { margin-top: 16px; padding: 9px 16px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stats-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 18px 16px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.stats-value { font-size: var(--fs-26, 26px); font-weight: 700; letter-spacing: -0.5px; }
.stats-label { font-size: var(--fs-11, 11px); color: var(--color-text-muted); margin-top: 4px; font-weight: 500; }

.chart-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chart-title { font-size: var(--fs-14, 14px); font-weight: 600; color: var(--color-text-primary); }
.chart-period { font-size: var(--fs-11, 11px); color: var(--color-text-muted); font-weight: 500; }

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 120px;
  padding: 0 8px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 100%;
  height: 100%;
  max-width: 28px;
  border-radius: 6px 6px 2px 2px;
  transform-origin: bottom center;
  transition: transform var(--motion-normal) ease;
  min-height: 4px;
}

.bar-label { font-size: var(--fs-11, 11px); color: var(--color-text-muted); margin-top: 8px; font-weight: 500; }

.chart-line { padding: 0 4px; }
.line-svg { width: 100%; height: 100px; }

.line-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 4px;
}

.line-labels span { font-size: var(--fs-11, 11px); color: var(--color-text-muted); font-weight: 500; }

.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: transform var(--motion-fast) ease, box-shadow var(--motion-fast) ease, border-color var(--motion-fast) ease;
}

.template-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-use {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  border: none;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-use:hover { background: var(--color-primary-dark); }

.template-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--color-warning-bg);
  border-radius: 10px;
  font-size: var(--fs-12, 12px);
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .page-content { padding: 20px 16px 40px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-bars { gap: 8px; }
}
</style>
