import { defineStore } from 'pinia'
import { ref } from 'vue'
import { verifyMasterPassword, hasMasterPassword } from '@/services/crypto'

export const useUserStore = defineStore('user', () => {
  const isLocked = ref(false)
  const settings = ref({
    autoLockTimeout: 5 * 60 * 1000,
    theme: 'light' as 'light' | 'dark'
  })

  function lock() {
    isLocked.value = true
  }

  function unlock(password: string): boolean {
    if (!hasMasterPassword()) {
      // 首次使用，未设置主密码
      isLocked.value = false
      return true
    }
    if (verifyMasterPassword(password)) {
      isLocked.value = false
      return true
    }
    return false
  }

  function updateSettings(newSettings: Partial<typeof settings.value>) {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    isLocked,
    settings,
    lock,
    unlock,
    updateSettings
  }
})
