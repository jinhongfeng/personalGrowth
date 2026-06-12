/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ElectronAPI {
  clipboard: {
    write: (text: string, autoClear?: boolean, clearDelay?: number) => Promise<boolean>
    read: () => Promise<string>
    clear: () => Promise<boolean>
  }
  ai: {
    chatCompletion: (payload: {
      url: string
      apiKey: string
      body: Record<string, unknown>
      timeoutMs?: number
    }) => Promise<{ ok: boolean; status: number; text: string }>
  }
}

interface Window {
  electronAPI?: ElectronAPI
}
