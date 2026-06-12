import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  clipboard: {
    write: (text: string, autoClear = true, clearDelay = 15000) => ipcRenderer.invoke('clipboard-write', text, autoClear, clearDelay),
    read: () => ipcRenderer.invoke('clipboard-read'),
    clear: () => ipcRenderer.invoke('clipboard-clear')
  },
  ai: {
    chatCompletion: (payload: { url: string, apiKey: string, body: Record<string, unknown>, timeoutMs?: number }) =>
      ipcRenderer.invoke('ai-chat-completion', payload)
  }
})
