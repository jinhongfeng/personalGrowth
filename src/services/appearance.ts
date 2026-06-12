export const FONT_SIZE_OPTIONS = ['小', '标准', '大', '特大'] as const
export const FONT_FAMILY_OPTIONS = ['默认', '衬线', '等宽'] as const

type AppearanceSettings = {
  theme?: string
  fontSize?: string
  fontFamily?: string
}

const sizeMap: Record<string, { root: string; scale: string }> = {
  '小': { root: '13px', scale: '0.93' },
  '标准': { root: '14px', scale: '1' },
  '大': { root: '16px', scale: '1.12' },
  '特大': { root: '18px', scale: '1.24' },
}

const familyMap: Record<string, string> = {
  '默认': "'Inter', 'Noto Sans SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
  '衬线': "'Noto Serif SC', 'Songti SC', 'SimSun', Georgia, serif",
  '等宽': "'SF Mono', Consolas, 'Cascadia Mono', monospace",
}

export function readAppearanceSettings(): AppearanceSettings {
  try {
    const saved = localStorage.getItem('app_settings')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function applyAppearanceSettings(settings: AppearanceSettings = readAppearanceSettings()) {
  const fontSize = sizeMap[settings.fontSize || '标准'] || sizeMap['标准']
  const fontFamily = familyMap[settings.fontFamily || '默认'] || familyMap['默认']
  const scale = Number(fontSize.scale)

  document.documentElement.style.setProperty('--app-font-size', fontSize.root)
  document.documentElement.style.setProperty('--app-font-scale', fontSize.scale)
  document.documentElement.style.setProperty('--app-font-family', fontFamily)
  for (let px = 8; px <= 72; px++) {
    document.documentElement.style.setProperty(`--fs-${px}`, `${Math.round(px * scale * 100) / 100}px`)
  }
  document.body.classList.toggle('dark-mode', settings.theme === 'dark')
}
