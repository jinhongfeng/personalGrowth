<template>
  <router-view />

  <div v-if="isLocked" class="lock-overlay">
    <div class="lock-panel">
      <div class="lock-icon">
        <q-icon name="lock" size="26px" color="white" />
      </div>
      <div class="lock-title">应用已自动锁定</div>
      <div class="lock-desc">为保护账号信息，请输入主密码继续使用。</div>
      <q-input
        v-if="hasPwd"
        v-model="unlockPwd"
        type="password"
        placeholder="输入主密码"
        filled
        borderless
        dense
        autofocus
        hide-bottom-space
        class="lock-input"
        @keyup.enter="unlockApp"
      />
      <button class="lock-btn" @click="unlockApp">{{ hasPwd ? '解锁应用' : '继续使用' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { hasMasterPassword, verifyMasterPassword } from '@/services/crypto'
import { applyAppearanceSettings } from '@/services/appearance'

const $q = useQuasar()
const isLocked = ref(false)
const unlockPwd = ref('')
const hasPwd = computed(() => hasMasterPassword())
let idleTimer: number | undefined
let reminderTimer: number | undefined

function readAppSettings() {
  try {
    const saved = localStorage.getItem('app_settings')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function scheduleAutoLock() {
  window.clearTimeout(idleTimer)
  const settings = readAppSettings()
  if (settings.autoLock === false || isLocked.value) return
  const timeout = Number(settings.autoLockTimeout || 5 * 60 * 1000)
  idleTimer = window.setTimeout(() => {
    isLocked.value = true
    unlockPwd.value = ''
    $q.notify({ type: 'info', message: '已自动锁定，输入主密码后继续' })
  }, timeout)
}

function scheduleDailyReminder() {
  window.clearTimeout(reminderTimer)
  const settings = readAppSettings()
  if (settings.notifyEnabled === false || (settings.notifyRecord === false && settings.notifyAlive === false)) return

  const [rawHour = 20, rawMinute = 0] = String(settings.notifyTime || '20:00').split(':').map(Number)
  const hour = Number.isFinite(rawHour) ? rawHour : 20
  const minute = Number.isFinite(rawMinute) ? rawMinute : 0
  const now = new Date()
  const target = new Date(now)
  target.setHours(hour, minute, 0, 0)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }

  reminderTimer = window.setTimeout(() => {
    const latest = readAppSettings()
    if (latest.notifyEnabled !== false) {
      const message = latest.notifyRecord === false
        ? '给自己一个小行动，恢复一点状态'
        : latest.notifyAlive === false
          ? '今天也可以留下一条成长记录'
          : '记录一点成长，也给自己一个小行动'
      $q.notify({ type: 'info', message })
    }
    scheduleDailyReminder()
  }, target.getTime() - now.getTime())
}

function handleActivity() {
  if (!isLocked.value) scheduleAutoLock()
}

function unlockApp() {
  if (hasPwd.value && !verifyMasterPassword(unlockPwd.value)) {
    $q.notify({ type: 'negative', message: '主密码不正确' })
    return
  }
  isLocked.value = false
  unlockPwd.value = ''
  scheduleAutoLock()
}

function handleSettingsChanged() {
  applyAppearanceSettings()
  scheduleAutoLock()
  scheduleDailyReminder()
}

onMounted(() => {
  ;['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, handleActivity, { passive: true })
  })
  window.addEventListener('app-settings-changed', handleSettingsChanged)
  handleSettingsChanged()
})

onBeforeUnmount(() => {
  window.clearTimeout(idleTimer)
  window.clearTimeout(reminderTimer)
  ;['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(eventName => {
    window.removeEventListener(eventName, handleActivity)
  })
  window.removeEventListener('app-settings-changed', handleSettingsChanged)
})
</script>

<style>
:root {
  /* 主色调 */
  --color-primary: #5B6ABF;
  --color-primary-light: #7B8AE0;
  --color-primary-dark: #4F5DB0;
  --color-primary-bg: #F0EFF8;
  --color-primary-glow: rgba(91, 106, 191, 0.25);

  /* 功能色 */
  --color-positive: #4CAF82;
  --color-warning: #E89B3E;
  --color-negative: #E05252;
  --color-info: #5B8DEF;
  --color-teal: #2A9D8F;
  --color-orange-warm: #E07A5F;
  --color-star: #FFB300;

  /* 功能色浅底 */
  --color-warning-bg: #FFF8E1;
  --color-success-light: #E8F5E9;
  --color-danger-light: #FFEBEE;
  --color-info-light: #E3F2FD;
  --color-teal-light: #E0F2F1;
  --color-indigo-light: #E8EAF6;
  --color-orange-light: #FFF3E0;

  /* 中性色 */
  --color-text-primary: #2D2D3A;
  --color-text-secondary: #6B6B76;
  --color-text-muted: #9B9BA3;
  --color-text-disabled: #C8C8CC;

  /* 背景色 */
  --color-bg: #F5F3EF;
  --color-bg-card: white;
  --color-bg-hover: #FAFAF8;

  /* 边框 */
  --color-border: #E0DDD7;
  --color-border-light: rgba(0, 0, 0, 0.03);

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 18px;

  /* 交互 */
  --focus-ring: 0 0 0 3px rgba(91, 106, 191, 0.22);
  --motion-fast: 150ms;
  --motion-base: 220ms;
  --motion-normal: 260ms;
  --motion-slow: 360ms;
  --bottom-action-offset: 0px;
  --app-font-size: 14px;
  --app-font-scale: 1;
  --app-font-family: 'Inter', 'Noto Sans SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
}

* {
  font-family: var(--app-font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  font-size: var(--app-font-size);
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--color-bg);
  color: var(--color-text-primary);
}

#app {
  height: 100%;
}

button,
a,
[role='button'],
.q-btn,
.q-field__control,
.q-toggle {
  -webkit-tap-highlight-color: transparent;
}

button,
[role='button'] {
  touch-action: manipulation;
}

input,
textarea,
.q-field__native,
.q-field__input,
.q-field__prefix,
.q-field__suffix {
  border: 0;
  outline: 0;
  box-shadow: none;
  background: transparent;
  appearance: none;
}

textarea {
  resize: none;
}

input:focus,
textarea:focus,
.q-field__native:focus,
.q-field__input:focus {
  border: 0;
  outline: 0;
  box-shadow: none;
}

.q-field__control::before,
.q-field__control::after {
  display: none;
}

button:focus-visible,
a:focus-visible,
[role='button']:focus-visible,
.q-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: var(--focus-ring);
}

.q-field--focused .q-field__control {
  outline: none;
}

.q-field,
.q-field__inner,
.q-field__control,
.q-field__control-container {
  min-width: 0;
}

.q-field__control-container {
  flex: 1 1 auto;
}

.q-field__native,
.q-field__input {
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
}

.q-field:not(.q-textarea) .q-field__control {
  min-height: 40px;
  align-items: center;
}

.q-field:not(.q-textarea) .q-field__native,
.q-field:not(.q-textarea) .q-field__input {
  min-height: 40px;
  line-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
  box-sizing: border-box;
}

.q-field:not(.q-textarea) .q-field__append,
.q-field:not(.q-textarea) .q-field__prepend {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.q-field:not(.q-textarea) .q-field__append .q-icon,
.q-field:not(.q-textarea) .q-field__prepend .q-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

button:disabled,
[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.58;
}

/* 滚动条 — 细腻风格 */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--color-text-disabled);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* 全局选中颜色 */
::selection {
  background: rgba(91, 106, 191, 0.2);
  color: var(--color-text-primary);
}

/* 深色模式基础支持 */
body.dark-mode {
  --color-bg: #1A1A2E;
  --color-bg-card: #222240;
  --color-bg-hover: #2A2A4A;
  --color-text-primary: #E8E8F0;
  --color-text-secondary: #A8A8B8;
  --color-text-muted: #787888;
  --color-border: #3A3A5A;
  --color-border-light: rgba(255, 255, 255, 0.05);

  --color-warning-bg: #3A3020;
  --color-success-light: #1A3020;
  --color-danger-light: #3A1A1A;
  --color-info-light: #1A2040;
  --color-teal-light: #1A3030;
  --color-indigo-light: #222240;
  --color-orange-light: #3A2820;

  background: #1A1A2E;
  color: #E8E8F0;
}

body.dark-mode .page-container {
  background: var(--color-bg);
}

body.dark-mode .q-field--outlined .q-field__control {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

body.dark-mode .q-field--outlined .q-field__control:before {
  border-color: var(--color-border);
}

body.dark-mode .header-bar {
  background: rgba(34, 34, 64, 0.92) !important;
  border-bottom-color: var(--color-border) !important;
}

body.dark-mode .icon-bg-indigo,
body.dark-mode .cat-bg-indigo,
body.dark-mode .bg-indigo {
  background: rgba(123, 138, 224, 0.2) !important;
}

body.dark-mode .icon-bg-orange,
body.dark-mode .cat-bg-orange,
body.dark-mode .bg-orange {
  background: rgba(232, 155, 62, 0.2) !important;
}

body.dark-mode .icon-bg-green,
body.dark-mode .cat-bg-green,
body.dark-mode .bg-green {
  background: rgba(76, 175, 130, 0.2) !important;
}

body.dark-mode .icon-bg-teal,
body.dark-mode .cat-bg-teal,
body.dark-mode .bg-teal {
  background: rgba(42, 157, 143, 0.22) !important;
}

body.dark-mode .icon-bg-red,
body.dark-mode .cat-bg-red,
body.dark-mode .bg-red {
  background: rgba(224, 82, 82, 0.2) !important;
}

body.dark-mode .icon-bg-purple,
body.dark-mode .cat-bg-purple,
body.dark-mode .bg-purple {
  background: rgba(155, 106, 219, 0.22) !important;
}

body.dark-mode .icon-bg-grey,
body.dark-mode .cat-bg-grey,
body.dark-mode .bg-grey {
  background: rgba(232, 232, 240, 0.14) !important;
}

body.dark-mode .text-primary {
  color: #AEB8FF !important;
}

body.dark-mode .text-secondary {
  color: #65D4C8 !important;
}

body.dark-mode .text-positive,
body.dark-mode .text-green {
  color: #7EE0AD !important;
}

body.dark-mode .text-negative,
body.dark-mode .text-red {
  color: #FF9A9A !important;
}

body.dark-mode .text-orange {
  color: #FFC46F !important;
}

.q-notifications__list--bottom {
  position: fixed !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 24px !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  padding: 0 16px 12px;
  margin: 0 !important;
  pointer-events: none;
  z-index: 9500;
}

.q-notification.app-toast {
  position: relative;
  left: auto !important;
  right: auto !important;
  transform: none !important;
  display: inline-flex !important;
  align-items: center !important;
  max-width: min(420px, calc(100vw - 32px));
  min-height: 42px;
  padding: 10px 14px;
  margin: 0 !important;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96) !important;
  color: var(--color-text-primary) !important;
  border: 1px solid rgba(91, 106, 191, 0.12);
  box-shadow: 0 10px 30px rgba(45, 45, 58, 0.14);
  backdrop-filter: blur(12px);
}

.q-notification.app-toast .q-notification__wrapper,
.q-notification.app-toast .q-notification__content {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 100%;
  min-width: 0;
}

.q-notification.app-toast .q-notification__content {
  gap: 10px;
}

.q-notification.app-toast .q-notification__icon,
.q-notification.app-toast .q-notification__spinner,
.q-notification.app-toast .q-notification__avatar {
  flex: 0 0 auto;
  margin: 0 !important;
}

.q-notification.app-toast .q-notification__icon,
.q-notification.app-toast .q-notification__spinner {
  width: 22px;
  height: 22px;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.q-notification--bottom-enter-from,
.q-notification--bottom-leave-to {
  transform: translateY(16px) !important;
}

.lock-overlay {
  position: fixed;
  inset: 0;
  z-index: 7000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(245, 243, 239, 0.86);
  backdrop-filter: blur(18px);
}

.lock-panel {
  width: min(360px, 100%);
  display: grid;
  gap: 12px;
  padding: 24px;
  border-radius: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  box-shadow: 0 18px 42px rgba(45, 45, 58, 0.16);
  text-align: center;
}

.lock-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  margin: 0 auto 2px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
}

.lock-title {
  font-size: var(--fs-18, 18px);
  font-weight: 720;
  color: var(--color-text-primary);
}

.lock-desc {
  font-size: var(--fs-13, 13px);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.lock-input .q-field__control {
  min-height: 42px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
  box-shadow: none;
}

.lock-input.q-field--focused .q-field__control {
  background: white;
  box-shadow: inset 0 0 0 1px var(--color-primary), var(--focus-ring);
}

.lock-btn {
  min-height: 42px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-14, 14px);
  font-weight: 700;
  cursor: pointer;
  transition: background var(--motion-fast) ease, transform var(--motion-fast) ease;
}

.lock-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

body.dark-mode .lock-overlay {
  background: rgba(26, 26, 46, 0.84);
}

.q-notification.app-toast .q-notification__message {
  flex: 1 1 auto !important;
  min-width: 0;
  margin: 0 !important;
  padding: 0 !important;
  color: var(--color-text-primary);
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
}

body.dark-mode .q-notification.app-toast {
  background: rgba(34, 34, 64, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.android-exit-dialog .q-dialog__inner {
  align-items: flex-end;
  padding: 16px 16px calc(18px + env(safe-area-inset-bottom, 0px));
}

.android-exit-dialog .q-card {
  width: min(372px, calc(100vw - 32px));
  border-radius: 18px;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  box-shadow: 0 18px 42px rgba(45, 45, 58, 0.18);
}

.android-exit-dialog .q-dialog__title {
  font-size: var(--fs-18, 18px);
  font-weight: 720;
  line-height: 1.35;
  color: var(--color-text-primary);
}

.android-exit-dialog .q-dialog__message {
  color: var(--color-text-secondary);
  font-size: var(--fs-14, 14px);
  line-height: 1.6;
}

.android-exit-dialog .q-card__section {
  padding: 18px 18px 4px;
}

.android-exit-dialog .q-card__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 14px 18px 18px;
}

.android-exit-dialog .q-card__actions .q-btn {
  min-height: 44px;
  border-radius: var(--radius-md);
  font-size: var(--fs-14, 14px);
  font-weight: 700;
}

body.dark-mode .android-exit-dialog .q-card {
  background: var(--color-bg-card);
  border-color: var(--color-border);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.38);
}

/* 全局过渡 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
