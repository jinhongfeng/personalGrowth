// 剪贴板服务 - 通过 Electron API 安全复制并自动清除

function shouldAutoClearClipboard() {
  try {
    const saved = localStorage.getItem('app_settings')
    if (!saved) return true
    const settings = JSON.parse(saved)
    return settings.clipboardClear !== false
  } catch {
    return true
  }
}

function getClipboardClearDelay() {
  try {
    const saved = localStorage.getItem('app_settings')
    if (!saved) return 15000
    const settings = JSON.parse(saved)
    return Number(settings.clipboardClearTimeout) || 15000
  } catch {
    return 15000
  }
}

export async function secureCopy(text: string): Promise<boolean> {
  try {
    const autoClear = shouldAutoClearClipboard()
    const clearDelay = getClipboardClearDelay()
    // 检查是否在 Electron 环境中
    if (window.electronAPI?.clipboard) {
      await window.electronAPI.clipboard.write(text, autoClear, clearDelay)
      return true
    }
    
    // 浏览器降级方案
    await navigator.clipboard.writeText(text)
    if (autoClear) {
      window.setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText()
          if (current === text) await navigator.clipboard.writeText('')
        } catch {}
      }, clearDelay)
    }
    return true
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

export async function readClipboard(): Promise<string> {
  try {
    if (window.electronAPI?.clipboard) {
      return await window.electronAPI.clipboard.read()
    }
    return await navigator.clipboard.readText()
  } catch {
    return ''
  }
}

export async function clearClipboard(): Promise<boolean> {
  try {
    if (window.electronAPI?.clipboard) {
      await window.electronAPI.clipboard.clear()
      return true
    }
    await navigator.clipboard.writeText('')
    return true
  } catch {
    return false
  }
}
