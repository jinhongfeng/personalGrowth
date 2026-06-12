<template>
  <q-page padding class="dashboard-page">
    <div class="page-content">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="eyebrow">{{ dateStr }}</div>
          <h1 class="greeting-title">{{ greeting }}，今天也给自己留一条清晰的轨迹</h1>
          <p class="greeting-sub">记录成长、保管账号、低能量时做一个可完成的小行动。</p>
          <div class="hero-actions">
            <button class="btn-primary" @click="$router.push('/growth/new')">
              <q-icon name="add" size="18px" />
              <span>新增成长记录</span>
            </button>
            <button class="btn-ghost" @click="$router.push('/password/new')">
              <q-icon name="vpn_key" size="18px" />
              <span>新增密码账号</span>
            </button>
          </div>
        </div>
        <div class="hero-today">
          <div class="today-label">今日面板</div>
          <div class="today-score">{{ todayRecords.length }}</div>
          <div class="today-desc">今日成长记录</div>
          <div class="today-bars">
            <div class="today-bar">
              <span>记录</span>
              <strong>{{ growthStore.records.length }}</strong>
            </div>
            <div class="today-bar">
              <span>行动</span>
              <strong>{{ aliveStore.totalCompleted }}</strong>
            </div>
            <div class="today-bar">
              <span>账号</span>
              <strong>{{ passwordStore.entries.length }}</strong>
            </div>
          </div>
        </div>
      </section>

      <div class="stat-grid">
        <button
          class="stat-card"
          v-for="(card, i) in statCards"
          :key="card.label"
          :class="card.cardClass"
          :style="{ animationDelay: i * 70 + 'ms' }"
          @click="$router.push(card.path)"
        >
          <div class="stat-card-inner">
            <div class="stat-header">
              <div class="stat-icon-wrap">
                <q-icon :name="card.icon" size="18px" />
              </div>
              <span class="stat-label">{{ card.label }}</span>
            </div>
            <div class="stat-value">{{ card.value }}<span class="stat-unit">{{ card.unit }}</span></div>
            <div class="stat-meta">{{ card.meta }}</div>
          </div>
        </button>
      </div>

      <section class="section-block">
        <div class="section-head">
          <div>
            <h2 class="section-title">快捷新增</h2>
            <p class="section-sub">所有入口都会打开独立填写页面</p>
          </div>
        </div>
        <div class="action-grid">
          <button
            v-for="action in quickActions"
            :key="action.label"
            class="action-card"
            :class="action.className"
            @click="$router.push(action.path)"
          >
            <q-icon :name="action.icon" size="20px" />
            <span>{{ action.label }}</span>
            <small>{{ action.desc }}</small>
          </button>
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="section-block">
          <div class="section-head">
            <div>
              <h2 class="section-title">最近成长</h2>
              <p class="section-sub">点击任意记录可继续编辑</p>
            </div>
            <button class="text-btn" @click="$router.push('/growth')">查看全部</button>
          </div>
          <div class="activity-card" v-if="recentActivities.length > 0">
            <button
              type="button"
              class="activity-item"
              v-for="a in recentActivities"
              :key="a.id"
              @click="$router.push(`/growth/${a.id}/edit`)"
            >
              <div class="activity-icon" :class="a.iconBg">
                <q-icon :name="a.icon" size="16px" :color="a.iconColor" />
              </div>
              <div class="activity-info">
                <div class="activity-name">{{ a.title }}</div>
                <div class="activity-detail">{{ a.detail }}</div>
              </div>
              <div class="activity-time">{{ a.time }}</div>
            </button>
          </div>
          <div v-else class="empty-activity">
            <q-icon name="edit_note" size="34px" color="#C8C8CC" />
            <span>还没有成长记录</span>
            <button class="mini-btn" @click="$router.push('/growth/new')">现在新增</button>
          </div>
        </div>

        <aside class="section-block template-panel">
          <div class="section-head">
            <div>
              <h2 class="section-title">一键套用</h2>
              <p class="section-sub">从模板进入新增页并预填字段</p>
            </div>
          </div>
          <button
            v-for="tpl in templates"
            :key="tpl.title"
            class="template-row"
            @click="useTemplate(tpl)"
          >
            <div class="template-icon" :class="tpl.bg">
              <q-icon :name="tpl.icon" size="17px" :color="tpl.color" />
            </div>
            <div>
              <div class="template-title">{{ tpl.title }}</div>
              <div class="template-desc">{{ tpl.desc }}</div>
            </div>
            <q-icon name="chevron_right" size="16px" color="#C8C8CC" />
          </button>
        </aside>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '@/stores/growth'
import { useAliveStore } from '@/stores/alive'
import { usePasswordStore } from '@/stores/password'

const router = useRouter()
const growthStore = useGrowthStore()
const aliveStore = useAliveStore()
const passwordStore = usePasswordStore()

onMounted(() => {
  growthStore.fetchRecords()
  aliveStore.fetchTaskLogs()
  passwordStore.fetchEntries()
})

const hour = new Date().getHours()
const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
const todayKey = new Date().toISOString().slice(0, 10)

const todayRecords = computed(() =>
  (growthStore.records || []).filter(r => r.createdAt?.startsWith(todayKey))
)

function calcStreak(records: { createdAt: string }[]) {
  if (!records || records.length === 0) return 0
  const dates = [...new Set(records.filter(r => r.createdAt).map(r => r.createdAt.slice(0, 10)))].sort().reverse()
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
    if ((curr.getTime() - prev.getTime()) / 86400000 === 1) streak++
    else break
  }
  return streak
}

const statCards = computed(() => {
  const totalRecords = growthStore.records.length
  const avgRating = totalRecords > 0
    ? (growthStore.records.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRecords).toFixed(1)
    : '0'
  return [
    {
      icon: 'trending_up',
      label: '成长记录',
      value: totalRecords,
      unit: '条',
      meta: `平均评分 ${avgRating}`,
      path: '/growth',
      cardClass: 'stat-card-primary',
    },
    {
      icon: 'favorite',
      label: '恢复行动',
      value: aliveStore.totalCompleted,
      unit: '次',
      meta: aliveStore.averageImprovement > 0 ? `平均提升 +${aliveStore.averageImprovement}` : '完成后会生成趋势',
      path: '/alive',
      cardClass: 'stat-card-teal',
    },
    {
      icon: 'local_fire_department',
      label: '连续坚持',
      value: calcStreak(growthStore.records),
      unit: '天',
      meta: calcStreak(growthStore.records) > 0 ? '节奏不错' : '从今天开始',
      path: '/growth/new',
      cardClass: 'stat-card-warm',
    },
  ]
})

const quickActions = [
  { icon: 'edit_note', label: '新增成长记录', desc: '填写训练、学习、睡眠等字段', path: '/growth/new', className: 'action-primary' },
  { icon: 'vpn_key', label: '新增密码账号', desc: '填写网站、账号、密码和备注', path: '/password/new', className: 'action-teal' },
  { icon: 'lightbulb', label: '开始恢复行动', desc: '选择状态并记录完成反馈', path: '/alive', className: 'action-warm' },
  { icon: 'person', label: '完善个人画像', desc: '让行动推荐更贴合你', path: '/alive/profile', className: 'action-slate' },
]

const categoryIconMap: Record<string, string> = {
  basketball: 'sports_basketball',
  fitness: 'fitness_center',
  sleep: 'bedtime',
  study: 'school',
}
const categoryIconColorMap: Record<string, string> = {
  basketball: 'orange',
  fitness: 'positive',
  sleep: 'secondary',
  study: 'primary',
}
const categoryIconBgMap: Record<string, string> = {
  basketball: 'icon-bg-orange',
  fitness: 'icon-bg-green',
  sleep: 'icon-bg-teal',
  study: 'icon-bg-indigo',
}
const categoryLabelMap: Record<string, string> = {
  basketball: '篮球',
  fitness: '健身',
  sleep: '睡眠',
  study: '学习',
}

const recentActivities = computed(() => {
  return (growthStore.records || []).filter(r => r.createdAt).slice(0, 6).map(r => {
    const d = new Date(r.createdAt)
    return {
      id: r.id,
      icon: categoryIconMap[r.category] || 'school',
      iconColor: categoryIconColorMap[r.category] || 'primary',
      iconBg: categoryIconBgMap[r.category] || 'icon-bg-indigo',
      title: `${categoryLabelMap[r.category] || r.category} · ${r.title}`,
      detail: `${r.startTime || '未填时间'}${r.endTime ? '-' + r.endTime : ''} · 评分 ${r.rating}/5`,
      time: `${d.getMonth() + 1}/${d.getDate()}`,
    }
  })
})

const templates = [
  { icon: 'fitness_center', color: 'positive', bg: 'icon-bg-green', title: '健身复盘', desc: '动作、组数、状态评分', category: 'fitness', content: '训练内容：\n完成情况：\n身体感受：' },
  { icon: 'school', color: 'primary', bg: 'icon-bg-indigo', title: '学习专注', desc: '主题、时长、收获', category: 'study', content: '学习主题：\n关键收获：\n下一步：' },
  { icon: 'bedtime', color: 'secondary', bg: 'icon-bg-teal', title: '睡眠记录', desc: '入睡、醒来、睡眠质量', category: 'sleep', content: '入睡时间：\n醒来时间：\n影响因素：' },
]

function useTemplate(tpl: typeof templates[0]) {
  router.push({
    path: '/growth/new',
    query: { category: tpl.category, title: tpl.title, content: tpl.content },
  })
}
</script>

<style scoped>
.dashboard-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 1040px;
  margin: 0 auto;
  padding: 28px 24px 52px;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 18px;
}

.hero-copy,
.hero-today,
.section-block {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.hero-copy {
  border-radius: var(--radius-lg);
  padding: 30px;
}

.eyebrow {
  font-size: var(--fs-12, 12px);
  color: var(--color-primary);
  font-weight: 700;
  margin-bottom: 10px;
}

.greeting-title {
  font-size: var(--fs-28, 28px);
  line-height: 1.25;
  font-weight: 760;
  color: var(--color-text-primary);
  margin: 0 0 10px;
}

.greeting-sub {
  font-size: var(--fs-14, 14px);
  color: var(--color-text-secondary);
  margin: 0;
}

.hero-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-ghost,
.text-btn,
.mini-btn {
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-size: var(--fs-13, 13px);
  font-weight: 700;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 14px var(--color-primary-glow);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-ghost {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.btn-ghost:hover,
.text-btn:hover,
.mini-btn:hover {
  transform: translateY(-1px);
}

.hero-today {
  border-radius: var(--radius-lg);
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.today-label,
.today-desc {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  font-weight: 600;
}

.today-score {
  font-size: var(--fs-52, 52px);
  line-height: 1;
  font-weight: 800;
  color: var(--color-primary);
  margin: 16px 0 4px;
}

.today-bars {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.today-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  font-size: var(--fs-12, 12px);
  color: var(--color-text-secondary);
}

.today-bar strong {
  color: var(--color-text-primary);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 26px;
}

.stat-card {
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
  text-align: left;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  animation: cardFadeIn 0.45s ease both;
  box-shadow: var(--shadow-sm);
  transition: transform var(--motion-fast) ease, border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(91, 106, 191, 0.18);
  box-shadow: var(--shadow-md);
}

.stat-card-inner {
  position: relative;
  z-index: 1;
  padding: 20px;
}

.stat-card-primary { --stat-color: var(--color-primary); --stat-tint: rgba(91, 106, 191, 0.1); }
.stat-card-teal { --stat-color: var(--color-teal); --stat-tint: rgba(42, 157, 143, 0.1); }
.stat-card-warm { --stat-color: var(--color-orange-warm); --stat-tint: rgba(224, 122, 95, 0.1); }

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: var(--stat-color);
  background: var(--stat-tint);
}

.stat-label {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.stat-value {
  font-size: var(--fs-34, 34px);
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-unit {
  font-size: var(--fs-14, 14px);
  font-weight: 500;
  color: var(--stat-color);
  margin-left: 2px;
}

.stat-meta {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
  margin-top: 8px;
}

.section-block {
  border-radius: var(--radius-lg);
  padding: 18px;
  margin-bottom: 18px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  font-size: var(--fs-16, 16px);
  font-weight: 760;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.section-sub {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  margin: 0;
}

.text-btn {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  padding: 7px 11px;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  flex-shrink: 0;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-card {
  min-height: 112px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  color: white;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-card span {
  font-size: var(--fs-14, 14px);
  font-weight: 760;
}

.action-card small {
  font-size: var(--fs-11, 11px);
  line-height: 1.45;
  opacity: 0.78;
}

.action-primary { background: var(--color-primary); }
.action-teal { background: var(--color-teal); }
.action-warm { background: var(--color-orange-warm); }
.action-slate { background: #56606F; }

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: start;
}

.activity-card {
  display: grid;
  gap: 6px;
}

.activity-item,
.template-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  border-radius: var(--radius-md);
  transition: background 0.15s ease;
  cursor: pointer;
}

.activity-item {
  padding: 11px 10px;
}

.activity-item:hover,
.template-row:hover {
  background: var(--color-bg-hover);
}

.activity-icon,
.template-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.icon-bg-indigo { background: var(--color-indigo-light); }
.icon-bg-orange { background: var(--color-orange-light); }
.icon-bg-green { background: var(--color-success-light); }
.icon-bg-teal { background: var(--color-teal-light); }

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-name,
.template-title {
  font-size: var(--fs-13, 13px);
  font-weight: 700;
  color: var(--color-text-primary);
}

.activity-detail,
.template-desc {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.activity-time {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-disabled);
  flex-shrink: 0;
}

.empty-activity {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--color-text-muted);
  font-size: var(--fs-13, 13px);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.mini-btn {
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
}

.template-panel {
  position: sticky;
  top: 78px;
}

.template-row {
  padding: 12px 10px;
}

.template-row > div:nth-child(2) {
  flex: 1;
  min-width: 0;
}

@media (max-width: 900px) {
  .hero-panel,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .template-panel {
    position: static;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .page-content {
    padding: 20px 16px 40px;
  }

  .hero-copy {
    padding: 22px;
  }

  .greeting-title {
    font-size: var(--fs-22, 22px);
  }

  .stat-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-ghost {
    width: 100%;
  }
}
</style>
