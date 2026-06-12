import { app, BrowserWindow, clipboard, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const iconFile = process.platform === 'win32' ? 'app-icon.ico' : 'app-icon.png'
  const appIcon = app.isPackaged
    ? path.join(__dirname, `../dist/${iconFile}`)
    : path.join(__dirname, `../public/${iconFile}`)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: '个人成长助手',
    backgroundColor: '#f5f5f5'
  })

  // 开发环境加载 Vite 开发服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC 事件处理
ipcMain.handle('clipboard-write', async (_event, text: string, autoClear = true, clearDelay = 15000) => {
  clipboard.writeText(text)
  if (autoClear) {
    setTimeout(() => {
      if (clipboard.readText() === text) clipboard.clear()
    }, Number(clearDelay) || 15000)
  }
  return true
})

ipcMain.handle('clipboard-read', async () => {
  return clipboard.readText()
})

ipcMain.handle('clipboard-clear', async () => {
  clipboard.clear()
  return true
})

ipcMain.handle('ai-chat-completion', async (_event, payload: {
  url: string
  apiKey: string
  body: Record<string, unknown>
  timeoutMs?: number
}) => {
  const controller = new AbortController()
  const timeoutMs = normalizeTimeoutMs(payload.timeoutMs)
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(payload.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payload.apiKey}`
      },
      body: JSON.stringify(payload.body),
      signal: controller.signal
    })
    const text = await response.text()
    return {
      ok: response.ok,
      status: response.status,
      text
    }
  } catch (error) {
    if (isAbortError(error)) {
      return {
        ok: false,
        status: 408,
        text: JSON.stringify({ message: 'AI 请求超时，请稍后重试或检查接口配置' })
      }
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
})

function normalizeTimeoutMs(value?: number) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return 25000
  return Math.max(5000, Math.min(60000, num))
}

function isAbortError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
