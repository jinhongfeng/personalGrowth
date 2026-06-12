<template>
  <q-page padding class="profile-page">
    <div class="page-content">
      <!-- 顶部导航 -->
      <div class="top-bar">
        <button class="btn-back" @click="$router.back()">
          <q-icon name="arrow_back" size="20px" />
        </button>
        <div class="top-title">我的画像</div>
        <div style="width: 36px"></div>
      </div>

      <!-- 画像头部 -->
      <div class="profile-hero">
        <div class="hero-icon">
          <q-icon name="person" size="32px" color="white" />
        </div>
        <div class="hero-title">个性化画像</div>
        <div class="hero-desc">帮助我们为你推荐更合适的恢复行动</div>
      </div>

      <!-- 性格倾向 -->
      <div class="profile-section">
        <div class="section-header">
          <q-icon name="psychology" size="18px" color="primary" />
          <span class="section-title">性格倾向</span>
        </div>
        <div class="option-grid">
          <div
            v-for="p in personalityOpts"
            :key="p.value"
            class="option-card"
            :class="{ 'option-card-active': profile.personality === p.value }"
            @click="profile.personality = p.value"
          >
            <q-icon :name="p.icon" size="24px" :color="profile.personality === p.value ? 'primary' : '#C8C8CC'" />
            <span class="option-label">{{ p.label }}</span>
            <span class="option-desc">{{ p.desc }}</span>
          </div>
        </div>
      </div>

      <!-- 恢复偏好 -->
      <div class="profile-section">
        <div class="section-header">
          <q-icon name="healing" size="18px" color="positive" />
          <span class="section-title">恢复偏好</span>
        </div>
        <div class="option-grid">
          <div
            v-for="r in recoveryOpts"
            :key="r.value"
            class="option-card"
            :class="{ 'option-card-active': profile.recovery === r.value }"
            @click="profile.recovery = r.value"
          >
            <q-icon :name="r.icon" size="24px" :color="profile.recovery === r.value ? 'positive' : '#C8C8CC'" />
            <span class="option-label">{{ r.label }}</span>
            <span class="option-desc">{{ r.desc }}</span>
          </div>
        </div>
      </div>

      <!-- 运动偏好 -->
      <div class="profile-section">
        <div class="section-header">
          <q-icon name="sports" size="18px" color="orange" />
          <span class="section-title">运动偏好</span>
        </div>
        <div class="sports-grid">
          <button
            v-for="s in sports"
            :key="s"
            class="sport-chip"
            :class="{ 'sport-chip-active': profile.sports.includes(s) }"
            @click="toggleSport(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- 目标 -->
      <div class="profile-section">
        <div class="section-header">
          <q-icon name="flag" size="18px" color="info" />
          <span class="section-title">当前目标</span>
          <span class="section-hint">设定目标让推荐更精准</span>
        </div>
        <div class="goal-card">
          <div class="goal-row">
            <div class="goal-side">
              <q-icon name="flag" size="18px" color="info" />
              <span>目标</span>
            </div>
            <div class="goal-input-wrap">
              <q-input
                v-model="profile.goal"
                placeholder="例如：每周运动3次、每天早睡、学会一项新技能..."
                filled
                borderless
                dense
                type="textarea"
                rows="4"
                hide-bottom-space
                class="goal-input"
                maxlength="200"
                :input-style="goalInputStyle"
              />
              <div class="goal-counter">
                <span :class="{ 'goal-counter-warn': profile.goal.length > 160 }">{{ profile.goal.length }}</span>
                <span>/200</span>
              </div>
            </div>
          </div>
          <div class="goal-suggestions">
            <span class="goal-suggest-label">快速填写：</span>
            <button
              v-for="s in goalSuggestions"
              :key="s"
              class="goal-suggest-chip"
              @click="profile.goal = s"
            >
              {{ s }}
            </button>
          </div>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="bottom-actions">
        <button class="btn-save" @click="saveProfile">
          <q-icon name="check" size="16px" />
          <span>保存画像</span>
        </button>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAliveStore } from '@/stores/alive'
import { clearAliveRecommendationCache } from '@/services/db'

const $q = useQuasar()
const router = useRouter()
const store = useAliveStore()

const profile = reactive({
  personality: '' as string,
  recovery: '' as string,
  goal: '',
  sports: [] as string[]
})

const personalityOpts = [
  { value: 'introvert', label: '内向', icon: 'self_improvement', desc: '独处恢复能量' },
  { value: 'extrovert', label: '外向', icon: 'groups', desc: '社交恢复能量' },
  { value: 'mixed', label: '混合型', icon: 'balance', desc: '视情况而定' },
]

const recoveryOpts = [
  { value: 'physical', label: '身体活动', icon: 'directions_run', desc: '运动、拉伸、散步' },
  { value: 'environment', label: '环境整理', icon: 'cleaning_services', desc: '整理桌面、打扫' },
  { value: 'cognitive', label: '认知恢复', icon: 'auto_stories', desc: '阅读、写作、冥想' },
  { value: 'social', label: '社会连接', icon: 'forum', desc: '和朋友聊天、见面' },
]

const sports = ['篮球', '健身', '跑步', '瑜伽', '游泳', '羽毛球', '骑行']

const goalInputStyle = {
  minHeight: '112px',
  maxHeight: '112px',
  overflowY: 'auto',
  resize: 'none',
}

const goalSuggestions = [
  '每周运动3次',
  '每天11点前入睡',
  '读完一本书',
  '学会做3道新菜',
]

onMounted(async () => {
  await store.fetchUserProfile()
  if (store.userProfile) {
    profile.personality = store.userProfile.personality
    profile.recovery = store.userProfile.recoveryStyle
    profile.goal = store.userProfile.currentGoal
    profile.sports = [...store.userProfile.sports]
  }
})

function toggleSport(s: string) {
  const idx = profile.sports.indexOf(s)
  if (idx === -1) {
    profile.sports.push(s)
  } else {
    profile.sports.splice(idx, 1)
  }
}

async function saveProfile() {
  if (!profile.personality) {
    $q.notify({ type: 'warning', message: '请选择性格类型' })
    return
  }
  if (!profile.recovery) {
    $q.notify({ type: 'warning', message: '请选择恢复偏好' })
    return
  }
  await store.saveProfile({
    id: store.userProfile?.id || Date.now().toString(),
    personality: profile.personality as 'introvert' | 'extrovert' | 'mixed',
    recoveryStyle: profile.recovery as 'physical' | 'environment' | 'cognitive' | 'social',
    currentGoal: profile.goal.trim(),
    sports: profile.sports,
  })
  await clearAliveRecommendationCache()
  $q.notify({ type: 'positive', message: '画像保存成功，AI 推荐会按新画像更新' })
  router.push('/alive')
}
</script>

<style scoped>
.profile-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 20px;
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 10;
}

.btn-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.top-title {
  font-size: var(--fs-16, 16px);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.2px;
}

.profile-hero {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  text-align: center;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}

.profile-hero::before {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  top: -30px;
  right: -20px;
}

.hero-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  margin: 0 auto 14px;
}

.hero-title {
  font-size: var(--fs-20, 20px);
  font-weight: 700;
  color: white;
  letter-spacing: -0.3px;
}

.hero-desc {
  font-size: var(--fs-13, 13px);
  color: rgba(255, 255, 255, 0.7);
  margin-top: 6px;
}

.profile-section { margin-bottom: 24px; }

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title {
  font-size: var(--fs-14, 14px);
  font-weight: 600;
  color: var(--color-text-primary);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.option-card:hover { border-color: var(--color-border); }

.option-card-active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 2px 12px var(--color-primary-glow);
}

.option-label {
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  color: var(--color-text-primary);
}

.option-card-active .option-label { color: var(--color-primary); }

.option-desc {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
}

.sports-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sport-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--fs-13, 13px);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.sport-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.sport-chip-active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.sport-chip-active:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.goal-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 10px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.section-hint {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
  margin-left: auto;
}

.goal-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 8px;
  border-radius: var(--radius-md);
}

.goal-row:hover {
  background: rgba(91, 106, 191, 0.04);
}

.goal-side {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
  font-weight: 650;
}

.goal-input-wrap {
  position: relative;
  min-width: 0;
}

.goal-input :deep(.q-field__control) {
  border-radius: var(--radius-md);
  background: #F7F7FA;
  padding-bottom: 24px;
  box-shadow: none;
}

.goal-input.q-field--focused :deep(.q-field__control) {
  background: white;
  box-shadow: inset 0 0 0 1px var(--color-primary), var(--focus-ring);
}

.goal-input :deep(.q-field__native) {
  font-size: var(--fs-13, 13px);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.goal-input :deep(.q-field__native)::placeholder {
  color: var(--color-text-disabled);
}

.goal-counter {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
  pointer-events: none;
}

.goal-counter-warn {
  color: var(--color-warning);
}

.goal-suggestions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.goal-suggest-label {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.goal-suggest-chip {
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  font-size: var(--fs-11, 11px);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.goal-suggest-chip:hover {
  border-color: var(--color-info);
  color: var(--color-info);
  background: rgba(33, 150, 243, 0.06);
}

.bottom-actions {
  margin-top: 32px;
  padding-bottom: 20px;
}

.btn-save {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-15, 15px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--color-primary-glow);
}

.btn-save:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(91, 106, 191, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .page-content { padding: 0 16px calc(104px + var(--bottom-action-offset)); }
  .option-grid { grid-template-columns: 1fr; }
  .goal-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .bottom-actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--bottom-action-offset);
    z-index: 1240;
    margin: 0;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.96);
    border-top: 1px solid var(--color-border-light);
    box-shadow: 0 -10px 24px rgba(45, 45, 58, 0.08);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  :global(body.dark-mode) .bottom-actions {
    background: rgba(34, 34, 64, 0.96);
    border-top-color: var(--color-border);
    box-shadow: 0 -12px 28px rgba(0, 0, 0, 0.26);
  }
}
</style>

