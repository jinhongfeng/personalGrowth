export interface GrowthCategoryConfig {
  value: string
  label: string
  icon: string
  color: string
  bgClass: string
}

const STORAGE_KEY = 'pg_growth_categories'
const MAX_CATEGORIES = 4

export const defaultGrowthCategories: GrowthCategoryConfig[] = [
  { value: 'basketball', label: '篮球', icon: 'sports_basketball', color: 'orange', bgClass: 'cat-bg-orange' },
  { value: 'fitness', label: '健身', icon: 'fitness_center', color: 'positive', bgClass: 'cat-bg-green' },
  { value: 'sleep', label: '睡眠', icon: 'bedtime', color: 'secondary', bgClass: 'cat-bg-teal' },
  { value: 'study', label: '学习', icon: 'school', color: 'primary', bgClass: 'cat-bg-indigo' },
]

export const categoryIconOptions = [
  { label: '篮球', icon: 'sports_basketball', color: 'orange', bgClass: 'cat-bg-orange' },
  { label: '健身', icon: 'fitness_center', color: 'positive', bgClass: 'cat-bg-green' },
  { label: '睡眠', icon: 'bedtime', color: 'secondary', bgClass: 'cat-bg-teal' },
  { label: '学习', icon: 'school', color: 'primary', bgClass: 'cat-bg-indigo' },
  { label: '工作', icon: 'work', color: 'primary', bgClass: 'cat-bg-indigo' },
  { label: '阅读', icon: 'menu_book', color: 'secondary', bgClass: 'cat-bg-teal' },
  { label: '情绪', icon: 'favorite', color: 'accent', bgClass: 'cat-bg-orange' },
  { label: '目标', icon: 'flag', color: 'positive', bgClass: 'cat-bg-green' },
]

export function getGrowthCategories(): GrowthCategoryConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return [...defaultGrowthCategories]
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return [...defaultGrowthCategories]
    const merged = parsed
      .slice(0, MAX_CATEGORIES)
      .map((item, index) => normalizeCategory(item, index))
      .filter(Boolean) as GrowthCategoryConfig[]
    return merged.length ? fillToMaxCategories(merged) : [...defaultGrowthCategories]
  } catch {
    return [...defaultGrowthCategories]
  }
}

export function saveGrowthCategories(categories: GrowthCategoryConfig[]) {
  const normalized = categories
    .slice(0, MAX_CATEGORIES)
    .map((item, index) => normalizeCategory(item, index))
    .filter(Boolean) as GrowthCategoryConfig[]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fillToMaxCategories(normalized)))
  window.dispatchEvent(new Event('growth-categories-changed'))
}

export function getGrowthCategoryByValue(value: string, categories = getGrowthCategories()) {
  return categories.find(category => category.value === value) || categories[0] || defaultGrowthCategories[0]
}

function normalizeCategory(item: Partial<GrowthCategoryConfig>, index: number): GrowthCategoryConfig | null {
  const fallback = defaultGrowthCategories[index] || defaultGrowthCategories[0]
  const value = String(item.value || fallback.value || `custom-${index + 1}`).trim()
  const label = String(item.label || fallback.label || `分类 ${index + 1}`).trim().slice(0, 8)
  if (!value || !label) return null
  return {
    value,
    label,
    icon: String(item.icon || fallback.icon || 'category'),
    color: String(item.color || fallback.color || 'primary'),
    bgClass: String(item.bgClass || fallback.bgClass || 'cat-bg-indigo'),
  }
}

function fillToMaxCategories(categories: GrowthCategoryConfig[]) {
  const values = new Set(categories.map(item => item.value))
  const result = [...categories]
  defaultGrowthCategories.forEach(defaultItem => {
    if (result.length >= MAX_CATEGORIES) return
    if (!values.has(defaultItem.value)) {
      result.push({ ...defaultItem })
      values.add(defaultItem.value)
    }
  })
  return result.slice(0, MAX_CATEGORIES)
}
