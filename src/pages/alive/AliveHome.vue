<template>
  <q-page padding class="alive-page">
    <div class="page-content">
      <!-- 页头 -->
      <div class="page-header">
        <div>
          <h1 class="page-title">找回活人感</h1>
          <p class="page-sub">停下来，给自己一个微小的开始</p>
        </div>
        <button class="btn-icon" @click="$router.push('/alive/profile')">
          <q-icon name="person" size="18px" />
        </button>
      </div>

      <!-- 概览卡片 -->
      <div class="overview-row">
        <div class="overview-card overview-teal">
          <div class="overview-icon"><q-icon name="check_circle" size="20px" color="white" /></div>
          <div class="overview-info">
            <div class="overview-value">{{ store.totalCompleted }}</div>
            <div class="overview-label">已完成</div>
          </div>
        </div>
        <div class="overview-card overview-primary">
          <div class="overview-icon"><q-icon name="trending_up" size="20px" color="white" /></div>
          <div class="overview-info">
            <div class="overview-value">{{ store.averageImprovement > 0 ? '+' + store.averageImprovement : '—' }}</div>
            <div class="overview-label">平均提升</div>
          </div>
        </div>
        <div class="overview-card overview-warm">
          <div class="overview-icon"><q-icon name="history" size="20px" color="white" /></div>
          <div class="overview-info">
            <div class="overview-value">{{ store.taskLogs.length }}</div>
            <div class="overview-label">总记录</div>
          </div>
        </div>
      </div>

      <button class="analysis-entry" @click="$router.push('/ai-analysis')">
        <span class="analysis-entry-icon">
          <q-icon name="auto_awesome" size="18px" />
        </span>
        <span class="analysis-entry-main">
          <span class="analysis-entry-title">生成成长分析</span>
          <span class="analysis-entry-sub">完成后会更新每组活人感卡片，本地保留可直接切换</span>
        </span>
        <q-icon name="chevron_right" size="19px" class="analysis-entry-arrow" />
      </button>

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

      <!-- 推荐 -->
      <template v-if="tab === 'task'">
        <!-- 状态选择 -->
        <div class="status-grid">
          <button
            type="button"
            v-for="s in statusOpts"
            :key="s.value"
            class="status-card"
            :class="{ 'status-card-active': status === s.value }"
            @click="status = s.value"
          >
            <q-icon :name="s.icon" size="26px" :color="status === s.value ? s.activeColor : '#C8C8CC'" />
            <span class="status-label" :class="{ 'status-label-active': status === s.value }">{{ s.label }}</span>
          </button>
        </div>

        <!-- 条件选择 -->
        <div class="condition-row">
          <div class="condition-group">
            <div class="condition-label">可用时间</div>
            <div class="condition-pills">
              <button
                v-for="t in timeOpts"
                :key="t.value"
                class="condition-pill"
                :class="{ 'condition-pill-active': timeAvail === t.value }"
                @click="timeAvail = t.value"
              >{{ t.label }}</button>
            </div>
          </div>
          <div class="condition-group">
            <div class="condition-label">能出门吗</div>
            <div class="condition-pills">
              <button class="condition-pill" :class="{ 'condition-pill-active': canGo === true }" @click="canGo = true">可以</button>
              <button class="condition-pill" :class="{ 'condition-pill-active': canGo === false }" @click="canGo = false">室内</button>
            </div>
          </div>
        </div>

        <!-- 推荐任务卡片 -->
        <transition name="card-swap" mode="out-in">
          <div class="recommend-card" :key="`${currentTask.id}-${currentTaskIdx}`">
            <div class="recommend-meta-row">
              <span class="recommend-source" :class="{ 'recommend-source-ai': isCurrentTaskAI }">
                <q-icon :name="isCurrentTaskAI ? 'auto_awesome' : 'inventory_2'" size="14px" />
                {{ recommendationLabel }}
              </span>
              <span class="recommend-condition">{{ currentConditionLabel }}</span>
            </div>
            <div class="recommend-title">{{ currentTask.title }}</div>
            <div class="recommend-desc">{{ currentTask.desc }}</div>
            <div class="recommend-chips">
              <span class="chip chip-blue">预计 {{ currentTask.time }}</span>
              <span class="chip chip-green">{{ currentTask.tag }}</span>
            </div>
          </div>
        </transition>

        <!-- 操作按钮 -->
        <div class="action-row">
          <button class="btn-outline" @click="changeTask">
            <q-icon :name="aiLoading ? 'hourglass_empty' : 'refresh'" size="16px" />
            <span>{{ aiLoading ? '换一个 · 补充中' : '换一个' }}</span>
          </button>
          <button class="btn-primary" @click="showFb = true">
            <q-icon name="check" size="16px" />
            <span>我完成了</span>
          </button>
        </div>

        <!-- 反馈区 -->
        <transition name="slide">
          <div v-if="showFb" class="feedback-card">
            <div class="feedback-title">完成「{{ currentTask.title }}」的感受</div>
            <div class="feedback-sliders">
              <div class="slider-group">
                <div class="feedback-slider-head">
                  <span class="slider-label">做之前</span>
                  <div class="slider-stepper">
                    <button class="slider-step-btn" @click="adjustFeedback('before', -1)" :disabled="beforeScore <= 1" aria-label="做之前评分减少">
                      <q-icon name="remove" size="15px" />
                    </button>
                    <span class="slider-value">{{ beforeScore }}/10</span>
                    <button class="slider-step-btn" @click="adjustFeedback('before', 1)" :disabled="beforeScore >= 10" aria-label="做之前评分增加">
                      <q-icon name="add" size="15px" />
                    </button>
                  </div>
                </div>
                <div class="slider-caption">行动前的状态感受</div>
                <input
                  v-model.number="beforeScore"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  class="feedback-range"
                  :style="{ '--range-value': `${((beforeScore - 1) / 9) * 100}%` }"
                  aria-label="做之前评分"
                />
              </div>
              <div class="slider-group">
                <div class="feedback-slider-head">
                  <span class="slider-label">做之后</span>
                  <div class="slider-stepper">
                    <button class="slider-step-btn" @click="adjustFeedback('after', -1)" :disabled="afterScore <= 1" aria-label="做之后评分减少">
                      <q-icon name="remove" size="15px" />
                    </button>
                    <span class="slider-value">{{ afterScore }}/10</span>
                    <button class="slider-step-btn" @click="adjustFeedback('after', 1)" :disabled="afterScore >= 10" aria-label="做之后评分增加">
                      <q-icon name="add" size="15px" />
                    </button>
                  </div>
                </div>
                <div class="slider-caption">行动后的状态感受</div>
                <input
                  v-model.number="afterScore"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  class="feedback-range"
                  :style="{ '--range-value': `${((afterScore - 1) / 9) * 100}%` }"
                  aria-label="做之后评分"
                />
              </div>
            </div>
            <div class="feedback-note-row">
              <div class="feedback-note-side">
                <q-icon name="notes" size="18px" color="primary" />
                <span>备注</span>
              </div>
              <q-input
                v-model="fbNotes"
                placeholder="简单说说感受..."
                filled
                borderless
                dense
                type="textarea"
                rows="3"
                hide-bottom-space
                class="feedback-input"
                :input-style="feedbackInputStyle"
              />
            </div>
            <button class="btn-primary full-width" @click="submitFb">提交反馈</button>
          </div>
        </transition>
      </template>

      <!-- 记录 -->
      <template v-if="tab === 'log'">
        <div class="log-card" v-if="store.taskLogs.length > 0">
          <div class="log-count">共 {{ store.taskLogs.length }} 条执行记录</div>
          <div class="log-list">
            <div class="log-item" v-for="l in store.taskLogs" :key="l.id">
              <div class="log-icon">
                <q-icon name="check_circle" color="positive" size="18px" />
              </div>
              <div class="log-body">
                <div class="log-name">{{ getTaskName(l.taskId) }}</div>
                <div class="log-notes" v-if="l.feedback">{{ l.feedback }}</div>
                <div class="log-meta">
                  状态 {{ l.beforeScore }} → {{ l.afterScore }}
                  <span class="log-delta" :class="l.afterScore > l.beforeScore ? 'delta-up' : 'delta-down'">
                    {{ l.afterScore > l.beforeScore ? '+' : '' }}{{ l.afterScore - l.beforeScore }}
                  </span>
                  · {{ formatTime(l.executedAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">
            <q-icon name="history" size="48px" color="#D1CCC6" />
          </div>
          <div class="empty-title">还没有执行记录</div>
          <div class="empty-desc">完成推荐任务后，记录会显示在这里</div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAliveStore } from '@/stores/alive'
import {
  getAliveRecommendationKey,
  getCachedAliveRecommendations,
  refreshAliveRecommendationLibrary,
  refreshAliveRecommendationsForKey,
  type AliveRecommendationFilters,
} from '@/services/aliveRecommendations'
import { getBaseAliveTasks } from '@/services/aliveBaseTasks'
import type { AliveRecommendationCard, AliveStatus, AliveTimeAvailable } from '@/types'

type RecommendTask = AliveRecommendationCard

const $q = useQuasar()
const store = useAliveStore()
const tab = ref('task')

const status = ref<AliveStatus>('low-energy')
const timeAvail = ref<AliveTimeAvailable>('15min')
const canGo = ref(false)
const beforeScore = ref(3)
const afterScore = ref(5)
const showFb = ref(false)
const fbNotes = ref('')
const currentTaskIdx = ref(0)
const aiTasks = ref<RecommendTask[]>([])
const aiLoading = ref(false)
const preferAITasks = ref(false)
let aiRequestSeq = 0
const aiFailureAtByKey: Record<string, number> = {}
const AI_RETRY_COOLDOWN_MS = 10 * 1000
const AI_RECOMMENDATION_TIMEOUT_MS = 8500
const AI_MAX_VISIBLE_TASKS = 12
const AI_MIN_READY_TASKS = 5
const feedbackInputStyle = {
  minHeight: '82px',
  maxHeight: '82px',
  overflowY: 'auto',
  resize: 'none',
}

onMounted(async () => {
  await Promise.all([
    store.fetchTaskLogs(),
    store.fetchUserProfile(),
  ])
  const hasCachedTasks = await loadCachedAITasks(true)
  void maybeRefreshAIRecommendations(hasCachedTasks, !hasCachedTasks)
  void warmRecommendationLibrary()
})

const mainTabs = [
  { value: 'task', icon: 'lightbulb', label: '推荐' },
  { value: 'log', icon: 'history', label: '记录' },
]

const statusOpts: { value: AliveStatus; icon: string; label: string; activeColor: string }[] = [
  { value: 'low-energy', icon: 'sentiment_dissatisfied', label: '不想动', activeColor: 'primary' },
  { value: 'can-move', icon: 'sentiment_neutral', label: '能动一点', activeColor: 'secondary' },
  { value: 'want-recover', icon: 'sentiment_satisfied', label: '我想恢复', activeColor: 'accent' },
]

const timeOpts: { label: string; value: AliveTimeAvailable }[] = [
  { label: '5分钟', value: '5min' },
  { label: '15分钟', value: '15min' },
  { label: '30分钟', value: '30min' },
  { label: '1小时', value: '1hour' },
]

const taskPool: RecommendTask[] = [
  ...getBaseAliveTasks(),
  { id: 'task-1', title: '下楼走 10 分钟', desc: '不需要任何准备，站起来，走到楼下。让身体动起来，大脑会跟着清醒。', time: '10 分钟', tag: '身体唤醒', minTime: '5min', needGoOut: true, minStatus: 'low-energy' },
  { id: 'task-2', title: '整理桌面 5 分钟', desc: '把眼前的物品归位，清理掉不需要的东西。整洁的环境能减少焦虑感。', time: '5 分钟', tag: '环境整理', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-3', title: '做 10 个深蹲', desc: '不需要任何器材，站起来就能做。激活腿部肌肉，提升血液循环。', time: '3 分钟', tag: '身体唤醒', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-4', title: '喝一杯温水', desc: '去倒一杯温水，慢慢喝完。身体缺水时会更容易疲惫。', time: '2 分钟', tag: '基础需求', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-5', title: '听一首喜欢的歌', desc: '戴上耳机，闭上眼睛，专注听完一首歌。让大脑短暂放空。', time: '5 分钟', tag: '情绪调节', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-6', title: '出门散步 20 分钟', desc: '走到附近的公园或街道，观察周围的人和事。换个环境，换个心情。', time: '20 分钟', tag: '自然疗愈', minTime: '15min', needGoOut: true, minStatus: 'can-move' },
  { id: 'task-7', title: '做 5 分钟拉伸', desc: '从脖子到脚踝，每个部位轻轻拉伸。释放身体的紧张感。', time: '5 分钟', tag: '身体放松', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-8', title: '写 3 件今天感恩的事', desc: '不需要大事，哪怕是「今天天气不错」也算。训练大脑关注积极面。', time: '5 分钟', tag: '认知恢复', minTime: '5min', needGoOut: false, minStatus: 'can-move' },
  { id: 'task-9', title: '洗一把脸', desc: '用温水或冷水洗脸，顺手擦干桌边的水渍。让身体先收到一个清醒信号。', time: '3 分钟', tag: '身体唤醒', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-10', title: '开窗通风 5 分钟', desc: '打开窗户，站在旁边做 5 次深呼吸。空气流动会让房间和脑袋都松一点。', time: '5 分钟', tag: '环境唤醒', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-11', title: '把杯子洗干净', desc: '只处理一个杯子，不扩大战场。完成一个很小的清洁动作，给自己一点掌控感。', time: '3 分钟', tag: '环境整理', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-12', title: '肩颈放松 3 分钟', desc: '慢慢转动肩膀，轻轻拉伸脖子两侧。不要追求标准，只要让紧绷感下降一点。', time: '3 分钟', tag: '身体放松', minTime: '5min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-30', title: '清理通知 10 分钟', desc: '坐着处理手机里最打扰你的通知，只关闭、归档或删除，不继续刷内容。', time: '10 分钟', tag: '环境整理', minTime: '15min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-13', title: '收拾一个角落', desc: '只选桌面、床头或地面的一小块区域。把明显碍眼的东西放回原位就停。', time: '10 分钟', tag: '环境整理', minTime: '15min', needGoOut: false, minStatus: 'can-move' },
  { id: 'task-14', title: '做一份轻食', desc: '给自己准备一点简单食物，比如水果、酸奶或热汤。先照顾身体，再处理事情。', time: '15 分钟', tag: '基础需求', minTime: '15min', needGoOut: false, minStatus: 'can-move' },
  { id: 'task-15', title: '给朋友发一句话', desc: '不需要展开聊天，只发一句「我今天有点累，想冒个泡」。连接感可以很轻。', time: '5 分钟', tag: '社会连接', minTime: '5min', needGoOut: false, minStatus: 'can-move' },
  { id: 'task-16', title: '下楼买一瓶水', desc: '把目标定得很小，只完成出门、购买、回来。让行动重新启动，不追求更多。', time: '15 分钟', tag: '身体唤醒', minTime: '15min', needGoOut: true, minStatus: 'can-move' },
  { id: 'task-17', title: '写 5 行状态复盘', desc: '写下现在的身体感受、情绪、最卡的事、能做的一步、完成后的奖励。短一点就好。', time: '10 分钟', tag: '认知恢复', minTime: '15min', needGoOut: false, minStatus: 'want-recover' },
  { id: 'task-18', title: '做 20 分钟专注块', desc: '选一件最小任务，开计时器 20 分钟。只要求开始，不要求今天彻底解决。', time: '20 分钟', tag: '专注恢复', minTime: '30min', needGoOut: false, minStatus: 'want-recover' },
  { id: 'task-19', title: '去附近走一圈', desc: '不设路线，只走到一个熟悉地点再回来。用环境变化帮自己从原地拔出来。', time: '30 分钟', tag: '自然疗愈', minTime: '30min', needGoOut: true, minStatus: 'want-recover' },
  { id: 'task-20', title: '计划明天第一步', desc: '只写明天醒来后最先做的一件小事，并把需要的物品放到看得见的位置。', time: '10 分钟', tag: '行动准备', minTime: '15min', needGoOut: false, minStatus: 'want-recover' },
  { id: 'task-21', title: '到门口晒 5 分钟', desc: '走到楼下或门口，站一会儿看看天光。只完成出门这一步就好。', time: '5 分钟', tag: '身体唤醒', minTime: '5min', needGoOut: true, minStatus: 'low-energy' },
  { id: 'task-22', title: '楼下慢走 25 分钟', desc: '不追求速度，沿着熟悉路线慢慢走一圈。让身体从低电量里缓慢启动。', time: '25 分钟', tag: '身体唤醒', minTime: '30min', needGoOut: true, minStatus: 'low-energy' },
  { id: 'task-23', title: '洗澡换衣 20 分钟', desc: '洗个澡，换一身干净衣服。把恢复状态先落到身体上。', time: '20 分钟', tag: '基础需求', minTime: '30min', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-24', title: '便利店往返 40 分钟', desc: '只买一瓶水或一份小食，路线越简单越好。目标是完成一次轻出门。', time: '40 分钟', tag: '身体唤醒', minTime: '1hour', needGoOut: true, minStatus: 'low-energy' },
  { id: 'task-25', title: '轻整理 40 分钟', desc: '设一个 40 分钟计时，只整理一块区域。时间到就停，保留一点余力。', time: '40 分钟', tag: '环境整理', minTime: '1hour', needGoOut: false, minStatus: 'low-energy' },
  { id: 'task-26', title: '附近快走 45 分钟', desc: '选择安全熟悉的路线，保持能说话的速度。回来后喝水休息。', time: '45 分钟', tag: '自然疗愈', minTime: '1hour', needGoOut: true, minStatus: 'can-move' },
  { id: 'task-27', title: '做饭和收尾 45 分钟', desc: '做一份简单饭，顺手把台面收干净。让身体和环境一起回到可用状态。', time: '45 分钟', tag: '基础需求', minTime: '1hour', needGoOut: false, minStatus: 'can-move' },
  { id: 'task-28', title: '公园走坐 50 分钟', desc: '走到附近公园或空地，坐 10 分钟再回来。给大脑一点空间。', time: '50 分钟', tag: '自然疗愈', minTime: '1hour', needGoOut: true, minStatus: 'want-recover' },
  { id: 'task-29', title: '复盘整理 50 分钟', desc: '写下最近最卡的一件事、下一步和明天第一步，再整理桌面收尾。', time: '50 分钟', tag: '认知恢复', minTime: '1hour', needGoOut: false, minStatus: 'want-recover' },
]

const fallbackTasks = computed(() => taskPool.filter(task => matchesTaskTime(task) && matchesTaskPlace(task) && matchesTaskStatus(task)))
const strictFallbackTask = computed(() => buildStrictFallbackTask())
const localTasks = computed(() => filterTasks(taskPool, true))
const currentAIKey = computed(() => getAliveRecommendationKey(currentFilters()))
const activeTasks = computed(() => preferAITasks.value && aiTasks.value.length > 0 ? aiTasks.value : localTasks.value)
const currentTask = computed(() => {
  const list = activeTasks.value.length > 0 ? activeTasks.value : (fallbackTasks.value.length > 0 ? fallbackTasks.value : [strictFallbackTask.value])
  return list[currentTaskIdx.value % list.length]
})

const isCurrentTaskAI = computed(() => currentTask.value.source === 'ai' || currentTask.value.id.startsWith('ai:'))
const currentConditionLabel = computed(() => {
  const statusLabel = statusOpts.find(item => item.value === status.value)?.label || '当前状态'
  const timeLabel = timeOpts.find(item => item.value === timeAvail.value)?.label || '当前时间'
  return `${statusLabel} · ${timeLabel} · ${canGo.value ? '可出门' : '室内'}`
})

const recommendationLabel = computed(() => {
  if (isCurrentTaskAI.value) return 'AI 推荐'
  if (aiLoading.value) return '本地推荐 · AI 补充中'
  return '本地推荐'
})

function getTaskName(taskId: string) {
  const task = [...taskPool, ...aiTasks.value].find(t => t.id === taskId)
  if (!task && taskId.startsWith('ai:')) {
    try {
      return decodeURIComponent(taskId.slice(3))
    } catch {}
  }
  return task?.title || taskId
}

function formatTime(isoStr: string) {
  const d = new Date(isoStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  if (isToday) return `今天 ${time}`
  if (isYesterday) return `昨天 ${time}`
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

function changeTask() {
  showFb.value = false

  if (!preferAITasks.value && aiTasks.value.length > 0) {
    preferAITasks.value = true
    currentTaskIdx.value = 0
    maybeRefreshAIRecommendations(true, false)
    $q.notify({ type: 'info', message: '已换一张推荐卡片' })
    return
  }

  currentTaskIdx.value++
  if (preferAITasks.value && aiTasks.value.length > 0 && currentTaskIdx.value + 2 >= aiTasks.value.length) {
    maybeRefreshAIRecommendations(true, false)
  } else {
    maybeRefreshAIRecommendations(false, false)
  }
  $q.notify({ type: 'info', message: '已换一张推荐卡片' })
}

function adjustFeedback(target: 'before' | 'after', delta: number) {
  if (target === 'before') {
    beforeScore.value = Math.max(1, Math.min(10, beforeScore.value + delta))
    return
  }
  afterScore.value = Math.max(1, Math.min(10, afterScore.value + delta))
}

async function submitFb() {
  store.currentTask = {
    id: currentTask.value.id,
    name: currentTask.value.title,
    description: currentTask.value.desc,
    type: 'physical',
    difficulty: 'easy',
    duration: parseDuration(currentTask.value.time),
    canGoOut: currentTask.value.needGoOut,
    tags: [currentTask.value.tag],
  }
  await store.completeTask({
    beforeScore: beforeScore.value,
    afterScore: afterScore.value,
    notes: fbNotes.value,
  })
  $q.notify({ type: 'positive', message: '反馈已记录，状态提升了 ' + (afterScore.value - beforeScore.value) + ' 分' })
  showFb.value = false
  beforeScore.value = 3
  afterScore.value = 5
  fbNotes.value = ''
  currentTaskIdx.value++
}

watch([status, timeAvail, canGo], async () => {
  aiRequestSeq++
  aiLoading.value = false
  preferAITasks.value = false
  currentTaskIdx.value = 0
  showFb.value = false
  const hasCachedTasks = await loadCachedAITasks(true)
  void maybeRefreshAIRecommendations(hasCachedTasks, !hasCachedTasks)
})

function filterTasks(tasks: RecommendTask[], fallbackToLocal = true) {
  const filtered = tasks.filter(task => {
    if (!matchesTaskTime(task)) return false
    if (!matchesTaskPlace(task)) return false
    if (!matchesTaskStatus(task)) return false
    return true
  })
  return filtered.length > 0 || !fallbackToLocal ? filtered : fallbackTasks.value
}

function matchesTaskTime(task: RecommendTask) {
  return getTaskTimeBucket(task) === timeAvail.value
}

function matchesTaskPlace(task: RecommendTask) {
  return task.needGoOut === canGo.value
}

function matchesTaskStatus(task: RecommendTask) {
  return task.minStatus === status.value
}

function getTimeBucket(minutes: number): AliveTimeAvailable {
  if (minutes <= 5) return '5min'
  if (minutes <= 15) return '15min'
  if (minutes <= 30) return '30min'
  return '1hour'
}

function getTaskTimeBucket(task: RecommendTask): AliveTimeAvailable {
  const minutes = parseDuration(task.time)
  return minutes > 0 ? getTimeBucket(minutes) : task.minTime
}

function defaultMinutesForBucket(bucket: AliveTimeAvailable) {
  const map: Record<AliveTimeAvailable, number> = {
    '5min': 5,
    '15min': 10,
    '30min': 25,
    '1hour': 45,
  }
  return map[bucket]
}

function defaultTimeTextForBucket(bucket: AliveTimeAvailable) {
  return `${defaultMinutesForBucket(bucket)} 分钟`
}

function buildStrictFallbackTask(): RecommendTask {
  const minutes = defaultMinutesForBucket(timeAvail.value)
  const time = `${minutes} 分钟`
  const map: Record<AliveTimeAvailable, { indoor: Omit<RecommendTask, 'id' | 'time' | 'minTime' | 'needGoOut' | 'minStatus'>; outdoor: Omit<RecommendTask, 'id' | 'time' | 'minTime' | 'needGoOut' | 'minStatus'> }> = {
    '5min': {
      indoor: { title: '喝水并开窗 5 分钟', desc: '倒一杯水，打开窗户站一会儿。只让身体先收到一个清醒信号。', tag: '基础需求' },
      outdoor: { title: '到门口站 5 分钟', desc: '走到楼下、门口或楼道口，看看天光。只完成出门这一步就好。', tag: '身体唤醒' },
    },
    '15min': {
      indoor: { title: '整理一小块 10 分钟', desc: '只处理桌面或床头的一小块区域，时间到就停，不扩大范围。', tag: '环境整理' },
      outdoor: { title: '楼下慢走 10 分钟', desc: '沿熟悉路线走一小圈，不追求速度，回来后喝水休息。', tag: '身体唤醒' },
    },
    '30min': {
      indoor: { title: '洗澡换衣 25 分钟', desc: '洗个澡，换一身干净衣服。把恢复状态先落到身体上。', tag: '基础需求' },
      outdoor: { title: '附近走一圈 25 分钟', desc: '走到一个熟悉地点再回来，用环境变化把自己从原地带出来。', tag: '自然疗愈' },
    },
    '1hour': {
      indoor: { title: '轻整理 45 分钟', desc: '设一个计时，只整理一个区域。结束时保留一点余力，不追求一次弄完。', tag: '环境整理' },
      outdoor: { title: '公园走坐 45 分钟', desc: '走到附近公园或空地，坐一会儿再回来。给大脑一点空间。', tag: '自然疗愈' },
    },
  }
  const template = canGo.value ? map[timeAvail.value].outdoor : map[timeAvail.value].indoor

  return {
    ...template,
    id: `fallback:${timeAvail.value}:${canGo.value ? 'outdoor' : 'indoor'}`,
    time,
    minTime: timeAvail.value,
    needGoOut: canGo.value,
    minStatus: status.value,
  }
}

function currentFilters(): AliveRecommendationFilters {
  return {
    status: status.value,
    timeAvailable: timeAvail.value,
    canGoOut: canGo.value,
  }
}

async function loadCachedAITasks(autoShow = true) {
  const cached = await getCachedAliveRecommendations(currentFilters())
  aiTasks.value = cached
  if (cached.length === 0) return false
  preferAITasks.value = autoShow
  currentTaskIdx.value = 0
  return true
}

function toReferenceTask(task: RecommendTask) {
  return {
    title: task.title,
    desc: task.desc,
    time: task.time,
    tag: task.tag,
  }
}

async function maybeRefreshAIRecommendations(append = false, autoShow = true) {
  if (aiLoading.value) return false
  const key = currentAIKey.value
  const cached = await getCachedAliveRecommendations(currentFilters())
  if (!append && cached.length > 0) {
    aiTasks.value = cached
    preferAITasks.value = autoShow
    if (autoShow) currentTaskIdx.value = 0
    if (cached.length >= AI_MIN_READY_TASKS) return true
  }
  if (append && cached.length >= AI_MAX_VISIBLE_TASKS) {
    aiTasks.value = cached
    return true
  }
  if (Date.now() - (aiFailureAtByKey[key] || 0) < AI_RETRY_COOLDOWN_MS) return false
  void generateAIRecommendations(append, true, autoShow)
  return true
}

async function generateAIRecommendations(append = false, silent = false, autoShow = true) {
  if (aiLoading.value) return false

  const requestId = ++aiRequestSeq
  const filters = currentFilters()
  const requestKey = currentAIKey.value
  aiLoading.value = true
  try {
    const referenceTask = currentTask.value
    const nextTasks = await refreshAliveRecommendationsForKey({
      ...filters,
      profile: store.userProfile,
      recentTaskLogs: store.taskLogs,
      avoidTitles: [
        ...aiTasks.value.map(task => task.title),
        ...localTasks.value.slice(0, 5).map(task => task.title),
      ],
      referenceTask: referenceTask ? toReferenceTask(referenceTask) : undefined,
      append,
      timeoutMs: AI_RECOMMENDATION_TIMEOUT_MS,
    })
    if (requestId !== aiRequestSeq) return false
    if (requestKey !== currentAIKey.value) return false

    aiTasks.value = nextTasks.slice(0, AI_MAX_VISIBLE_TASKS)
    if (nextTasks.length > 0) {
      preferAITasks.value = autoShow || preferAITasks.value
      if (autoShow) currentTaskIdx.value = 0
    }
    aiFailureAtByKey[requestKey] = 0
    void warmRecommendationLibrary()
    return nextTasks.length > 0
  } catch (error) {
    if (requestId === aiRequestSeq && !silent) {
      $q.notify({
        type: 'warning',
        message: error instanceof Error ? `AI 推荐失败，已使用本地推荐：${error.message}` : 'AI 推荐失败，已使用本地推荐',
        timeout: 2200,
      })
    }
    if (silent) aiFailureAtByKey[requestKey] = Date.now()
    return false
  } finally {
    if (requestId === aiRequestSeq) {
      aiLoading.value = false
    }
  }
}

async function warmRecommendationLibrary() {
  await refreshAliveRecommendationLibrary({
    profile: store.userProfile,
    recentTaskLogs: store.taskLogs,
    seed: currentFilters(),
    maxRequests: 3,
  })
}

function parseDuration(timeText: string) {
  const match = timeText.match(/\d+/)
  if (!match) return 0
  const value = Number(match[0])
  if (!Number.isFinite(value)) return 0
  return /小时|hour/i.test(timeText) ? value * 60 : value
}
</script>

<style scoped>
.alive-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 660px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

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

.overview-teal { background: linear-gradient(135deg, var(--color-teal), #4ECDC4); }
.overview-primary { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); }
.overview-warm { background: linear-gradient(135deg, var(--color-orange-warm), #F0A07A); }

.analysis-entry {
  width: 100%;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 22px;
  gap: 12px;
  align-items: center;
  min-height: 58px;
  padding: 10px 12px;
  margin: -8px 0 22px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(91, 106, 191, 0.18);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) ease;
}

.analysis-entry:hover,
.analysis-entry:focus-visible {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  transform: translateY(-1px);
}

.analysis-entry-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.analysis-entry-main {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.analysis-entry-title {
  font-size: var(--fs-13, 13px);
  font-weight: 720;
  color: var(--color-text-primary);
}

.analysis-entry-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--fs-12, 12px);
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.analysis-entry-arrow {
  color: var(--color-text-muted);
}

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

.page-sub { font-size: var(--fs-13, 13px); color: var(--color-text-muted); margin: 0; }

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover { border-color: var(--color-primary); color: var(--color-primary); }

.page-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
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

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 18px 12px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  box-shadow: var(--shadow-sm);
  transition: transform var(--motion-fast) ease, border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease, background var(--motion-fast) ease;
}

.status-card:hover,
.status-card:focus-visible {
  border-color: var(--color-border);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.status-card-active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 2px 12px var(--color-primary-glow);
}

.status-label { font-size: var(--fs-12, 12px); font-weight: 500; color: var(--color-text-muted); }
.status-label-active { color: var(--color-primary); font-weight: 600; }

.condition-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.condition-group { flex: 1; }
.condition-label { font-size: var(--fs-12, 12px); font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; }

.condition-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.condition-pill {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--fs-12, 12px);
  font-weight: 500;
  color: var(--color-text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.condition-pill:hover { border-color: var(--color-primary); color: var(--color-primary); }

.condition-pill-active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.condition-pill-active:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.recommend-card {
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(91, 106, 191, 0.16);
  box-shadow: var(--shadow-sm);
}

.recommend-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.recommend-source,
.recommend-condition {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: var(--fs-11, 11px);
  font-weight: 700;
  line-height: 1;
}

.recommend-source {
  flex-shrink: 0;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.recommend-source-ai {
  background: rgba(42, 157, 143, 0.12);
  color: var(--color-teal);
}

.recommend-condition {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.recommend-title {
  font-size: var(--fs-22, 22px);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.recommend-desc {
  font-size: var(--fs-13, 13px);
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: 14px;
}

.recommend-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: var(--fs-11, 11px);
  font-weight: 600;
}

.chip-blue { background: var(--color-info-light); color: var(--color-info); }
.chip-green { background: var(--color-success-light); color: var(--color-positive); }

.card-swap-enter-active, .card-swap-leave-active { transition: opacity var(--motion-normal) ease, transform var(--motion-normal) ease; }
.card-swap-enter-from { opacity: 0; transform: translateX(30px); }
.card-swap-leave-to { opacity: 0; transform: translateX(-30px); }

.action-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-outline {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

.btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--color-primary-glow);
}

.btn-primary:hover { background: var(--color-primary-dark); box-shadow: 0 4px 14px rgba(91, 106, 191, 0.35); }
.full-width { width: 100%; }

.feedback-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.feedback-title { font-size: var(--fs-15, 15px); font-weight: 600; color: var(--color-text-primary); margin-bottom: 16px; }

.feedback-sliders {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.slider-group {
  min-width: 0;
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
}

.feedback-slider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.slider-label {
  font-size: var(--fs-12, 12px);
  font-weight: 650;
  color: var(--color-text-secondary);
}

.slider-stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.slider-step-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: white;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast) ease;
}

.slider-step-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.slider-value {
  min-width: 42px;
  text-align: center;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  color: var(--color-primary);
}

.slider-caption {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
}

.feedback-range {
  --range-value: 45%;
  width: 100%;
  height: 22px;
  margin: 0;
  border: 0;
  outline: 0;
  cursor: pointer;
  appearance: none;
  background: transparent;
}

.feedback-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--color-primary) 0%,
    var(--color-primary) var(--range-value),
    rgba(91, 106, 191, 0.16) var(--range-value),
    rgba(91, 106, 191, 0.16) 100%
  );
}

.feedback-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border: 2px solid white;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 2px 6px rgba(45, 45, 58, 0.2);
  appearance: none;
}

.feedback-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(91, 106, 191, 0.24), 0 2px 6px rgba(45, 45, 58, 0.2);
}

.feedback-note-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 8px;
  border-radius: var(--radius-md);
  background: rgba(91, 106, 191, 0.04);
  margin-bottom: 14px;
}

.feedback-note-side {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
  font-weight: 650;
}

.feedback-input {
  min-width: 0;
}

.feedback-input :deep(.q-field__control) {
  border-radius: var(--radius-md);
  background: white;
  box-shadow: none;
  align-items: flex-start;
}

.feedback-input.q-field--focused :deep(.q-field__control) {
  box-shadow: inset 0 0 0 1px var(--color-primary), var(--focus-ring);
}

.log-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.log-count {
  font-size: var(--fs-11, 11px);
  font-weight: 600;
  color: var(--color-text-disabled);
  padding: 14px 20px 10px;
}

.log-list { padding: 0 12px 8px; }

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
}

.log-item + .log-item { border-top: 1px solid var(--color-bg); }

.log-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-success-light);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.log-body { flex: 1; }
.log-name { font-size: var(--fs-13, 13px); font-weight: 600; color: var(--color-text-primary); }
.log-notes { font-size: var(--fs-12, 12px); color: var(--color-text-secondary); margin-top: 2px; line-height: 1.4; }
.log-meta { font-size: var(--fs-12, 12px); color: var(--color-text-muted); margin-top: 2px; display: flex; align-items: center; gap: 4px; }

.log-delta {
  font-weight: 600;
  font-size: var(--fs-11, 11px);
  padding: 1px 6px;
  border-radius: 4px;
}

.delta-up { color: var(--color-positive); background: var(--color-success-light); }
.delta-down { color: var(--color-negative); background: var(--color-danger-light); }

.empty-state { text-align: center; padding: 48px 24px; }
.empty-icon { margin-bottom: 16px; }
.empty-title { font-size: var(--fs-16, 16px); font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; }
.empty-desc { font-size: var(--fs-13, 13px); color: var(--color-text-muted); }

.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 640px) {
  .page-content { padding: 20px 16px 40px; }
  .overview-row { grid-template-columns: 1fr; }
  .analysis-entry {
    margin-top: 0;
    grid-template-columns: 36px minmax(0, 1fr) 20px;
  }
  .analysis-entry-sub {
    white-space: normal;
  }
  .condition-row { flex-direction: column; gap: 16px; }
  .feedback-sliders { grid-template-columns: 1fr; }
  .feedback-note-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>

