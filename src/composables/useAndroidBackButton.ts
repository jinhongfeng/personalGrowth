import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Dialog } from 'quasar'
import type { Router } from 'vue-router'

const ROOT_ROUTE_NAMES = new Set(['Dashboard'])

let isRegistered = false
let exitDialogOpen = false

function showExitDialog() {
  exitDialogOpen = true
  Dialog.create({
    title: '退出应用？',
    message: '再次从屏幕边缘返回也会退出应用。',
    class: 'android-exit-dialog',
    persistent: true,
    cancel: {
      label: '继续使用',
      flat: true,
      color: 'primary'
    },
    ok: {
      label: '退出应用',
      color: 'negative',
      unelevated: true
    }
  })
    .onOk(() => {
      CapacitorApp.exitApp()
    })
    .onDismiss(() => {
      exitDialogOpen = false
    })
}

export function setupAndroidBackButton(router: Router) {
  if (isRegistered || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return
  isRegistered = true

  CapacitorApp.addListener('backButton', () => {
    if (exitDialogOpen) {
      CapacitorApp.exitApp()
      return
    }

    const currentName = String(router.currentRoute.value.name || '')

    if (!ROOT_ROUTE_NAMES.has(currentName) && window.history.length > 1) {
      router.back()
      return
    }

    showExitDialog()
  })
}
