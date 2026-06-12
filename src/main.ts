import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog } from 'quasar'
import router from './router'
import App from './App.vue'
import { setupAndroidBackButton } from './composables/useAndroidBackButton'
import { applyAppearanceSettings } from './services/appearance'

import '@quasar/extras/material-icons/material-icons.css'

applyAppearanceSettings()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog
  },
  config: {
    notify: {
      position: 'bottom',
      timeout: 1800,
      classes: 'app-toast',
      textColor: 'primary'
    },
    loading: {}
  }
})

type NotifyOptions = Parameters<typeof Notify.create>[0]

const rawNotify = Notify.create.bind(Notify)
const notifyQueue: NotifyOptions[] = []
let notifyShowing = false
let activeNotifyKey = ''

function getNotifyKey(options: NotifyOptions) {
  if (typeof options === 'string') return options
  return `${options.type || ''}|${options.message || ''}|${options.caption || ''}`
}

function showNextNotify() {
  if (notifyShowing || notifyQueue.length === 0) return
  const next = notifyQueue.shift()!
  const originalDismiss = typeof next === 'object' ? next.onDismiss : undefined

  notifyShowing = true
  activeNotifyKey = getNotifyKey(next)

  const options = typeof next === 'string'
    ? { message: next }
    : next

  rawNotify({
    ...options,
    position: 'bottom',
    timeout: options.timeout ?? 1800,
    multiLine: options.multiLine ?? false,
    classes: ['app-toast', options.classes].filter(Boolean).join(' '),
    group: false,
    badgeStyle: { display: 'none' },
    onDismiss: () => {
      originalDismiss?.()
      notifyShowing = false
      activeNotifyKey = ''
      window.setTimeout(showNextNotify, 80)
    }
  })
}

function queuedNotify(options: NotifyOptions) {
  const key = getNotifyKey(options)
  if (key === activeNotifyKey || notifyQueue.some(item => getNotifyKey(item) === key)) {
    return () => {}
  }
  notifyQueue.push(options)
  showNextNotify()
  return () => {
    const index = notifyQueue.indexOf(options)
    if (index >= 0) notifyQueue.splice(index, 1)
  }
}

Notify.create = queuedNotify as typeof Notify.create
if (app.config.globalProperties.$q) {
  app.config.globalProperties.$q.notify = queuedNotify
}

app.mount('#app')

router.isReady().then(() => {
  setupAndroidBackButton(router)
})
