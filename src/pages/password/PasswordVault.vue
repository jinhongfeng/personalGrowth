<template>
  <q-page padding class="vault-page">
    <div class="page-content">
      <!-- 页头 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">密码箱</h1>
          <p class="page-sub">本地记录账号信息，方便查询和复制</p>
        </div>
        <button class="btn-add" @click="$router.push('/password/new')">
          <q-icon name="add" size="18px" />
          <span>新增账号</span>
        </button>
      </div>

      <!-- 概览卡片 -->
      <div class="overview-row">
        <div class="overview-card overview-primary">
          <div class="overview-icon"><q-icon name="lock" size="20px" color="white" /></div>
          <div class="overview-info">
            <div class="overview-value">{{ store.entries.length }}</div>
            <div class="overview-label">总账号</div>
          </div>
        </div>
        <div class="overview-card overview-warm">
          <div class="overview-icon"><q-icon name="star" size="20px" color="white" /></div>
          <div class="overview-info">
            <div class="overview-value">{{ store.starredEntries.length }}</div>
            <div class="overview-label">星标</div>
          </div>
        </div>
        <div class="overview-card" :class="securityScore >= 80 ? 'overview-green' : securityScore >= 60 ? 'overview-orange' : 'overview-red'">
          <div class="overview-icon"><q-icon name="security" size="20px" color="white" /></div>
          <div class="overview-info">
            <div class="overview-value">{{ securityScore }}</div>
            <div class="overview-label">检查分</div>
          </div>
        </div>
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

      <!-- 全部账号 -->
      <template v-if="tab === 'all'">
        <div class="search-wrap">
          <div class="search-shell">
            <div class="search-icon-wrap">
              <q-icon name="search" size="18px" />
            </div>
            <q-input
              v-model="store.searchQuery"
              placeholder="搜索网站或用户名..."
              filled
              borderless
              dense
              hide-bottom-space
              class="search-input"
              clearable
              clear-icon="close"
            />
          </div>
        </div>

        <div class="category-pills">
          <button
            v-for="c in categoryTabs"
            :key="c.value"
            class="category-pill"
            :class="{ 'category-pill-active': store.currentCategory === c.value }"
            @click="store.currentCategory = c.value"
          >
            <q-icon :name="c.icon" size="15px" />
            <span>{{ c.label }}</span>
          </button>
        </div>

        <div class="account-card" v-if="store.filteredEntries.length > 0">
          <div class="account-count">共 {{ store.filteredEntries.length }} 个账号</div>
          <div class="account-list">
            <account-item
              v-for="acct in store.filteredEntries"
              :key="acct.id"
              :id="acct.id"
              :icon="getIcon(acct.category)"
              :icon-color="getIconColor(acct.category)"
              :name="acct.name"
              :username="acct.username"
              @click="$router.push(`/password/${acct.id}`)"
              @copy="copyPwdById"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="store.entries.length === 0" class="empty-state">
          <div class="empty-icon">
            <q-icon name="lock_open" size="48px" color="#D1CCC6" />
          </div>
          <div class="empty-title">密码箱是空的</div>
          <div class="empty-desc">添加第一个账号后，可在这里搜索、复制和查看密码检查建议</div>
          <button class="empty-btn" @click="$router.push('/password/new')">新增账号</button>
        </div>
        <div v-else-if="store.filteredEntries.length === 0" class="empty-state">
          <div class="empty-icon">
            <q-icon name="search_off" size="48px" color="#D1CCC6" />
          </div>
          <div class="empty-title">没有匹配的账号</div>
          <div class="empty-desc">换个关键词或切回全部分类</div>
          <button class="empty-btn" @click="resetFilters">清除筛选</button>
        </div>
      </template>

      <!-- 星标 -->
      <template v-if="tab === 'star'">
        <div class="account-card" v-if="store.starredEntries.length > 0">
          <div class="account-count">星标账号</div>
          <div class="account-list">
            <account-item
              v-for="acct in store.starredEntries"
              :key="acct.id"
              :id="acct.id"
              :icon="getIcon(acct.category)"
              :icon-color="getIconColor(acct.category)"
              :name="acct.name"
              :username="acct.username"
              @click="$router.push(`/password/${acct.id}`)"
              @copy="copyPwdById"
            />
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">
            <q-icon name="star_border" size="48px" color="#D1CCC6" />
          </div>
          <div class="empty-title">还没有星标账号</div>
          <div class="empty-desc">在账号详情中点击星标图标收藏常用账号</div>
        </div>
      </template>

      <!-- 检查 -->
      <template v-if="tab === 'safe'">
        <div class="safe-grid">
          <div class="safe-card" v-for="s in safeItems" :key="s.label">
            <div class="safe-value" :style="{ color: s.color }">{{ s.count }}</div>
            <div class="safe-label">{{ s.label }}</div>
            <div class="safe-progress">
              <div class="safe-progress-bar" :style="{ transform: `scaleX(${s.ratio})`, background: s.color }"></div>
            </div>
          </div>
        </div>

        <div class="score-card">
          <div class="score-header">
            <div class="score-title">密码检查</div>
            <div class="score-value" :style="{ color: scoreColor }">{{ securityScore }}</div>
          </div>
          <div class="score-bar-track">
            <div class="score-bar-fill" :style="{ transform: `scaleX(${securityScore / 100})`, background: scoreGradient }"></div>
          </div>
          <div class="score-desc">{{ scoreDesc }}</div>
        </div>

        <div class="tips-card">
          <div class="tips-title">检查建议</div>
          <div class="tip-item" v-for="tip in tips" :key="tip.text">
            <q-icon :name="tip.icon" :color="tip.color" size="18px" />
            <span class="tip-text">{{ tip.text }}</span>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { usePasswordStore } from '@/stores/password'
import { secureCopy } from '@/services/clipboard'
import type { PasswordEntry } from '@/types'
import AccountItem from './AccountItem.vue'

const $q = useQuasar()
const store = usePasswordStore()
const tab = ref('all')

onMounted(() => store.fetchEntries())

const mainTabs = [
  { value: 'all', icon: 'list', label: '全部账号' },
  { value: 'star', icon: 'star', label: '星标' },
  { value: 'safe', icon: 'security', label: '检查' },
]

const categoryTabs = [
  { value: 'all', icon: 'apps', label: '全部' },
  { value: 'work', icon: 'work', label: '工作' },
  { value: 'social', icon: 'chat', label: '社交' },
  { value: 'payment', icon: 'payment', label: '支付' },
  { value: 'other', icon: 'language', label: '其他' },
]

const categoryIconMap: Record<string, string> = {
  work: 'work', social: 'chat', payment: 'payment', other: 'language'
}
const categoryColorMap: Record<string, string> = {
  work: 'primary', social: 'green', payment: 'orange', other: 'primary'
}

function getIcon(category: string) { return categoryIconMap[category] || 'language' }
function getIconColor(category: string) { return categoryColorMap[category] || 'primary' }
function resetFilters() {
  store.searchQuery = ''
  store.currentCategory = 'all'
}

function getPasswordText(entry: PasswordEntry) {
  return entry.encryptedPassword || ''
}

function isWeakPassword(password: string) {
  if (password.length < 8) return true
  const variety = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
  if (password.length < 10 && variety < 3) return true
  if (/^(.)\1+$/.test(password)) return true
  return /^(123456|12345678|password|qwerty|111111|000000)$/i.test(password)
}

function getDuplicatePasswordGroups(entries: PasswordEntry[]) {
  const seen = new Map<string, PasswordEntry[]>()
  entries.forEach(entry => {
    const password = getPasswordText(entry)
    if (!password) return
    seen.set(password, [...(seen.get(password) || []), entry])
  })
  return [...seen.values()].filter(group => group.length > 1)
}

const safeItems = computed(() => {
  const entries = store.entries
  const weak = entries.filter(e => isWeakPassword(getPasswordText(e))).length
  const duplicateGroups = getDuplicatePasswordGroups(entries)
  const dupes = duplicateGroups.reduce((sum, group) => sum + group.length, 0)
  const outdated = entries.filter(e => {
    const days = (Date.now() - new Date(e.lastUpdated).getTime()) / 86400000
    return days > 60
  }).length
  return [
    { label: '弱密码', count: weak || 0, ratio: weak ? weak / entries.length : 0, color: '#E05252' },
    { label: '重复密码', count: dupes || 0, ratio: dupes ? dupes / entries.length : 0, color: '#E89B3E' },
    { label: '未更新 >60天', count: outdated, ratio: outdated ? outdated / entries.length : 0, color: '#5B8DEF' },
  ]
})

const securityScore = computed(() => {
  const entries = store.entries
  if (entries.length === 0) return 100
  const weak = entries.filter(e => isWeakPassword(getPasswordText(e))).length
  const duplicateGroups = getDuplicatePasswordGroups(entries)
  const dupes = duplicateGroups.reduce((sum, group) => sum + group.length, 0)
  return Math.max(0, Math.min(100, 100 - weak * 15 - dupes * 10))
})

const scoreColor = computed(() => {
  if (securityScore.value >= 80) return '#4CAF82'
  if (securityScore.value >= 60) return '#E89B3E'
  return '#E05252'
})

const scoreGradient = computed(() => {
  if (securityScore.value >= 80) return 'linear-gradient(90deg, #4CAF82, #66BB6A)'
  if (securityScore.value >= 60) return 'linear-gradient(90deg, #E89B3E, #FFB74D)'
  return 'linear-gradient(90deg, #E05252, #EF5350)'
})

const scoreDesc = computed(() => {
  if (securityScore.value >= 80) return '密码记录状态良好，继续保持'
  if (securityScore.value >= 60) return '部分密码需要加强，建议修改弱密码'
  return '有较多弱密码或重复密码，建议尽快修改'
})

const tips = computed(() => {
  const result: { icon: string; color: string; text: string }[] = []
  const entries = store.entries
  entries.forEach(e => {
    if (isWeakPassword(getPasswordText(e))) {
      result.push({ icon: 'warning', color: 'orange', text: `${e.name} 使用弱密码，建议修改` })
    }
  })
  getDuplicatePasswordGroups(entries).forEach(group => {
    const names = group.map(entry => entry.name)
    result.push({ icon: 'repeat', color: 'red', text: `${names.join(' 与 ')} 密码相同，建议更换` })
  })
  if (result.length === 0) {
    result.push({ icon: 'check_circle', color: 'green', text: '当前没有明显的弱密码或重复密码' })
  }
  return result
})

async function copyPwdById(id: string) {
  const entry = store.getEntryById(id)
  if (entry?.encryptedPassword) {
    const copied = await secureCopy(entry.encryptedPassword)
    if (copied) {
      $q.notify({ type: 'positive', message: '密码已复制' })
    } else {
      $q.notify({ type: 'negative', message: '复制失败' })
    }
  }
}
</script>

<style scoped>
.vault-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 880px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left { flex: 1; }

/* 概览卡片 */
.overview-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  animation: cardFadeIn 0.4s ease both;
}

.overview-card:nth-child(1) { animation-delay: 0ms; }
.overview-card:nth-child(2) { animation-delay: 80ms; }
.overview-card:nth-child(3) { animation-delay: 160ms; }

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.overview-primary { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); }
.overview-warm { background: linear-gradient(135deg, var(--color-star), #FFD54F); }
.overview-green { background: linear-gradient(135deg, var(--color-positive), #66BB6A); }
.overview-orange { background: linear-gradient(135deg, var(--color-warning), #FFB74D); }
.overview-red { background: linear-gradient(135deg, var(--color-negative), #EF5350); }

.overview-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  flex-shrink: 0;
}

.overview-info { flex: 1; }
.overview-value { font-size: var(--fs-22, 22px); font-weight: 700; color: white; letter-spacing: -0.5px; line-height: 1; }
.overview-label { font-size: var(--fs-11, 11px); color: rgba(255, 255, 255, 0.75); margin-top: 3px; font-weight: 500; }

.page-title {
  font-size: var(--fs-24, 24px);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.page-sub {
  font-size: var(--fs-13, 13px);
  color: var(--color-text-muted);
  margin: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
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

.search-wrap { margin-bottom: 16px; }

.search-shell {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
}

.search-shell:focus-within {
  border-color: rgba(91, 106, 191, 0.35);
  box-shadow: var(--focus-ring);
}

.category-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--fs-12, 12px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.category-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.category-pill-active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.category-pill-active:hover {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.search-input :deep(.q-field__control) {
  min-height: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
  box-shadow: none;
  padding-right: 36px;
  position: relative;
  transition: background var(--motion-fast) ease;
}

.search-input :deep(.q-field__native) {
  min-height: 40px;
  line-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
  color: var(--color-text-primary);
  font-size: var(--fs-13, 13px);
}

.search-input :deep(.q-field__native)::placeholder {
  color: var(--color-text-disabled);
}

.search-input :deep(.q-field__append) {
  position: absolute;
  right: 8px;
  top: 50%;
  min-height: 28px;
  height: 28px;
  padding: 0;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

.search-input :deep(.q-field__append .q-icon) {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.search-input :deep(.q-field__append .q-icon:hover) {
  background: rgba(91, 106, 191, 0.1);
  color: var(--color-primary);
}

.search-icon-wrap {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.account-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.account-count {
  font-size: var(--fs-11, 11px);
  font-weight: 600;
  color: var(--color-text-disabled);
  padding: 14px 20px 10px;
  letter-spacing: 0.3px;
}

.account-list { padding: 0 8px 8px; }

.empty-state { text-align: center; padding: 48px 24px; }
.empty-icon { margin-bottom: 16px; }
.empty-title { font-size: var(--fs-16, 16px); font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; }
.empty-desc { font-size: var(--fs-13, 13px); color: var(--color-text-muted); }
.empty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  margin-top: 16px;
  padding: 0 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-13, 13px);
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.safe-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.safe-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.safe-value { font-size: var(--fs-28, 28px); font-weight: 700; letter-spacing: -0.5px; }
.safe-label { font-size: var(--fs-11, 11px); color: var(--color-text-muted); margin-top: 4px; font-weight: 500; }

.safe-progress {
  height: 3px;
  background: var(--color-bg);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 10px;
}

.safe-progress-bar {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  transform-origin: left center;
  transition: transform var(--motion-normal) ease;
}

.score-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.score-title { font-size: var(--fs-14, 14px); font-weight: 600; color: var(--color-text-primary); }
.score-value { font-size: var(--fs-24, 24px); font-weight: 700; letter-spacing: -0.5px; }

.score-bar-track {
  height: 6px;
  background: var(--color-bg);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.score-bar-fill {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  transform-origin: left center;
  transition: transform var(--motion-normal) ease;
}

.score-desc { font-size: var(--fs-12, 12px); color: var(--color-text-muted); }

.tips-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.tips-title { font-size: var(--fs-14, 14px); font-weight: 600; color: var(--color-text-primary); margin-bottom: 14px; }

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.tip-item + .tip-item { border-top: 1px solid var(--color-bg); }
.tip-text { flex: 1; font-size: var(--fs-13, 13px); color: var(--color-text-secondary); }

@media (max-width: 640px) {
  .page-content { padding: 20px 16px 40px; }
  .overview-row { grid-template-columns: 1fr; }
  .safe-grid { grid-template-columns: 1fr; }
}
</style>

