<template>
  <q-page padding class="form-page">
    <div class="page-content">
      <div class="top-bar">
        <button class="icon-btn" @click="$router.back()">
          <q-icon name="arrow_back" size="20px" />
        </button>
        <div>
          <div class="top-title">{{ isEdit ? '编辑成长记录' : '新增成长记录' }}</div>
          <div class="top-sub">{{ isEdit ? '调整这次记录的细节' : '把今天值得看见的变化写下来' }}</div>
        </div>
        <button class="reset-btn" @click="resetForm" v-if="!isEdit">
          <q-icon name="restart_alt" size="19px" />
          <span>重置</span>
        </button>
        <div v-else class="top-spacer"></div>
      </div>

      <div class="form-layout">
        <main class="form-main">
          <section class="form-section">
            <div class="section-head">
              <span class="section-label">分类</span>
              <button class="section-edit-btn" @click="openCategoryEditor">
                <q-icon name="edit" size="14px" />
                <span>编辑分类</span>
              </button>
            </div>
            <div class="category-grid">
              <button
                v-for="c in categories"
                :key="c.value"
                class="category-card"
                :class="{ 'category-card-active': form.category === c.value }"
                @click="form.category = c.value"
              >
                <div class="category-icon" :class="c.bgClass">
                  <q-icon :name="c.icon" size="22px" :color="c.color" />
                </div>
                <span class="category-name">{{ c.label }}</span>
              </button>
            </div>
            <div v-if="showCategoryEditor" class="category-editor">
              <div class="editor-head">
                <div>
                  <div class="editor-title">自定义成长分类</div>
                  <div class="editor-desc">最多保留 4 个分类，可修改名称和图标风格。</div>
                </div>
                <button class="editor-close" @click="cancelCategoryEdit" aria-label="关闭分类编辑">
                  <q-icon name="close" size="18px" />
                </button>
              </div>
              <div class="category-edit-list">
                <div v-for="(item, index) in categoryDrafts" :key="item.value" class="category-edit-row">
                  <div class="field-side category-edit-side">
                    <div class="category-icon" :class="item.bgClass">
                      <q-icon :name="item.icon" size="19px" :color="item.color" />
                    </div>
                    <span>分类 {{ index + 1 }}</span>
                  </div>
                  <q-input
                    v-model.trim="item.label"
                    placeholder="输入分类名称"
                    filled
                    borderless
                    dense
                    maxlength="8"
                    hide-bottom-space
                    class="field-input soft-input"
                  />
                  <div class="icon-choice-row">
                    <button
                      v-for="option in categoryIconOptions"
                      :key="`${item.value}-${option.icon}`"
                      class="icon-choice"
                      :class="{ 'icon-choice-active': item.icon === option.icon }"
                      :title="option.label"
                      @click="setCategoryIcon(index, option)"
                    >
                      <q-icon :name="option.icon" size="17px" />
                    </button>
                  </div>
                </div>
              </div>
              <div class="editor-actions">
                <button class="btn-cancel small-action" @click="cancelCategoryEdit">取消</button>
                <button class="btn-save small-action" @click="saveCategoryEdit">保存分类</button>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-head">
              <span class="section-label">基本信息</span>
              <span class="section-hint required-hint">
                <q-icon name="priority_high" size="14px" />
                标题为必填
              </span>
            </div>
            <div class="form-card">
              <div class="field-row">
                <div class="field-side">
                  <q-icon name="edit_note" size="18px" color="primary" />
                  <span>记录标题</span>
                  <q-icon v-if="!form.title" name="priority_high" size="15px" color="negative" class="required-inline" />
                </div>
                <q-input
                  v-model.trim="form.title"
                  placeholder="例如：英语阅读 30 分钟"
                  filled
                  borderless
                  dense
                  hide-bottom-space
                  class="field-input soft-input"
                />
              </div>
              <div class="field-row field-row-area">
                <div class="field-side">
                  <q-icon name="subject" size="18px" color="secondary" />
                  <span>详细内容</span>
                </div>
                <q-input
                  v-model="form.content"
                  placeholder="写下过程、完成情况、遇到的问题..."
                  filled
                  borderless
                  dense
                  type="textarea"
                  rows="5"
                  hide-bottom-space
                  class="field-input soft-input fixed-textarea"
                  :input-style="fixedTextareaStyle"
                />
              </div>
              <div class="time-tools">
                <button
                  v-for="preset in timePresets"
                  :key="preset.label"
                  class="preset-btn"
                  @click="applyTimePreset(preset.minutes)"
                >
                  {{ preset.label }}
                </button>
              </div>
              <div class="field-row">
                <div class="field-side">
                  <q-icon name="schedule" size="18px" color="orange" />
                  <span>时间</span>
                </div>
                <div class="time-row">
                  <q-input v-model="form.startTime" placeholder="开始时间" filled borderless dense type="time" hide-bottom-space class="field-input soft-input time-input" />
                  <div class="time-sep">
                    <q-icon name="arrow_forward" size="16px" color="#C8C8CC" />
                  </div>
                  <q-input v-model="form.endTime" placeholder="结束时间" filled borderless dense type="time" hide-bottom-space class="field-input soft-input time-input" />
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-head">
              <span class="section-label">状态评分</span>
              <span class="section-hint">拖动滑杆或点击加减调整</span>
            </div>
            <div class="form-card">
              <div class="rating-row">
                <div class="rating-copy">
                  <div class="rating-label">整体评分</div>
                  <div class="rating-desc">根据下方状态自动计算，{{ ratingText }}</div>
                </div>
                <div class="rating-control">
                  <q-rating
                    v-model="form.rating"
                    size="28px"
                    color="grey-4"
                    color-selected="amber-7"
                    icon="star_border"
                    icon-selected="star"
                    class="rating-stars"
                  />
                  <span class="rating-value">{{ form.rating }}/5</span>
                </div>
              </div>
              <div class="slider-grid">
                <div class="slider-group" v-for="s in statusSliders" :key="s.key">
                  <div class="slider-header">
                    <div class="slider-title">
                      <span class="slider-emoji">{{ s.mark }}</span>
                      <span class="slider-label">{{ s.label }}</span>
                    </div>
                    <div class="slider-stepper">
                      <button class="slider-step-btn" @click="adjustSlider(s.key, -1)" :disabled="form[s.key] <= 1" :aria-label="`${s.label}减少`">
                        <q-icon name="remove" size="15px" />
                      </button>
                      <span class="slider-value">{{ form[s.key] }}/10</span>
                      <button class="slider-step-btn" @click="adjustSlider(s.key, 1)" :disabled="form[s.key] >= 10" :aria-label="`${s.label}增加`">
                        <q-icon name="add" size="15px" />
                      </button>
                    </div>
                  </div>
                  <div class="slider-caption">{{ s.caption }}</div>
                  <input
                    v-model.number="form[s.key]"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    class="status-range"
                    :style="{ '--range-value': `${((form[s.key] - 1) / 9) * 100}%` }"
                    :aria-label="`${s.label}评分`"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-head">
              <span class="section-label">标签与备注</span>
              <span class="section-hint">可选，但很适合复盘</span>
            </div>
            <div class="form-card">
              <div class="field-row">
                <div class="field-side">
                  <q-icon name="sell" size="18px" color="primary" />
                  <span>标签</span>
                </div>
                <q-input
                  v-model="tagText"
                  placeholder="用逗号分隔，例如：专注,早起,复盘"
                  filled
                  borderless
                  dense
                  hide-bottom-space
                  class="field-input soft-input"
                />
              </div>
              <div class="tag-preview" v-if="tags.length > 0">
                <span v-for="tag in tags" :key="tag" class="tag-pill">{{ tag }}</span>
              </div>
              <div class="field-row field-row-area">
                <div class="field-side">
                  <q-icon name="notes" size="18px" color="secondary" />
                  <span>备注</span>
                </div>
                <q-input
                  v-model="form.notes"
                  placeholder="补充说明，例如：下次要注意的点..."
                  filled
                  borderless
                  dense
                  type="textarea"
                  rows="4"
                  hide-bottom-space
                  class="field-input soft-input fixed-textarea"
                  :input-style="noteTextareaStyle"
                />
              </div>
            </div>
          </section>
        </main>

        <aside class="side-panel">
          <div class="preview-card">
            <div class="preview-label">记录预览</div>
            <div class="preview-title">{{ form.title || '未命名记录' }}</div>
            <div class="preview-meta">
              <q-icon :name="activeCategory.icon" size="16px" :color="activeCategory.color" />
              <span>{{ activeCategory.label }}</span>
              <span>·</span>
              <span>{{ timeRangeLabel }}</span>
            </div>
            <div class="preview-score">
              <span>评分</span>
              <strong>{{ form.rating }}/5</strong>
            </div>
            <div class="preview-status">
              <div v-for="s in statusSliders" :key="s.key">
                <span>{{ s.label }}</span>
                <strong>{{ form[s.key] }}</strong>
              </div>
            </div>
          </div>

          <div class="tips-card">
            <div class="tips-title">填写建议</div>
            <button class="tip-row" v-for="tip in writingTips" :key="tip.title" @click="applyTip(tip)">
              <q-icon :name="tip.icon" size="17px" :color="tip.color" />
              <span>{{ tip.title }}</span>
            </button>
          </div>
        </aside>
      </div>

      <div class="bottom-actions">
        <button class="btn-cancel" @click="$router.back()">取消</button>
        <button class="btn-save" @click="saveRecord">
          <q-icon name="check" size="16px" />
          <span>{{ isEdit ? '保存修改' : '保存记录' }}</span>
        </button>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useGrowthStore } from '@/stores/growth'
import {
  categoryIconOptions,
  getGrowthCategories,
  saveGrowthCategories,
  type GrowthCategoryConfig,
} from '@/services/growthCategories'

type SliderKey = 'energy' | 'mood' | 'focus' | 'satisfaction'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const store = useGrowthStore()

const isEdit = computed(() => !!route.params.id)
const tagText = ref('')
const showCategoryEditor = ref(false)
const categories = ref<GrowthCategoryConfig[]>(getGrowthCategories())
const categoryDrafts = ref<GrowthCategoryConfig[]>(categories.value.map(c => ({ ...c })))
const fixedTextareaStyle = {
  minHeight: '118px',
  maxHeight: '118px',
  overflowY: 'auto',
  resize: 'none',
}
const noteTextareaStyle = {
  minHeight: '96px',
  maxHeight: '96px',
  overflowY: 'auto',
  resize: 'none',
}

const form = reactive({
  category: String(route.query.category || getGrowthCategories()[0]?.value || 'study'),
  title: (route.query.title as string) || '',
  content: (route.query.content as string) || '',
  startTime: '',
  endTime: '',
  rating: 3,
  energy: 5,
  mood: 5,
  focus: 5,
  satisfaction: 5,
  notes: ''
})

const statusSliders: { key: SliderKey; label: string; mark: string; color: string; caption: string }[] = [
  { key: 'energy', label: '精力', mark: '电量', color: 'info', caption: '从疲惫到充沛' },
  { key: 'mood', label: '情绪', mark: '心情', color: 'accent', caption: '从低落到平稳' },
  { key: 'focus', label: '专注', mark: '聚焦', color: 'positive', caption: '从分散到投入' },
  { key: 'satisfaction', label: '满意度', mark: '完成', color: 'orange', caption: '从勉强到满意' },
]

const timePresets = [
  { label: '刚刚 15 分钟', minutes: 15 },
  { label: '刚刚 30 分钟', minutes: 30 },
  { label: '刚刚 60 分钟', minutes: 60 },
]

const writingTips = [
  { icon: 'checklist', color: 'primary', title: '完成了什么？', text: '完成内容：\n完成质量：\n遇到的问题：' },
  { icon: 'psychology', color: 'secondary', title: '我学到了什么？', text: '新的理解：\n下次可以改进：\n值得保留的做法：' },
  { icon: 'flag', color: 'orange', title: '下一步是什么？', text: '下一步目标：\n预计时间：\n提醒自己：' },
]

onMounted(async () => {
  await store.fetchRecords()
  if (isEdit.value) {
    const existing = store.getRecordById(route.params.id as string)
    if (existing) {
      form.category = existing.category
      form.title = existing.title
      form.content = existing.content
      form.startTime = existing.startTime
      form.endTime = existing.endTime
      form.rating = existing.rating
      form.energy = existing.energy
      form.mood = existing.mood
      form.focus = existing.focus
      form.satisfaction = existing.satisfaction
      form.notes = existing.notes
      tagText.value = existing.tags?.join(', ') || ''
    }
  }
})

const activeCategory = computed(() =>
  categories.value.find(c => c.value === form.category) || categories.value[0]
)

const tags = computed(() =>
  tagText.value
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(Boolean)
)

const timeRangeLabel = computed(() => {
  if (form.startTime && form.endTime) return `${form.startTime}-${form.endTime}`
  if (form.startTime) return `${form.startTime} 开始`
  if (form.endTime) return `${form.endTime} 结束`
  return '未填写时间'
})

const ratingText = computed(() => {
  if (form.rating >= 5) return '非常满意'
  if (form.rating >= 4) return '状态不错'
  if (form.rating >= 3) return '完成即可'
  return '需要调整'
})

watch(
  () => [form.energy, form.mood, form.focus, form.satisfaction],
  () => {
    const average = (form.energy + form.mood + form.focus + form.satisfaction) / 4
    form.rating = Math.max(1, Math.min(5, Math.round(average / 2)))
  },
  { immediate: true }
)

function toTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function applyTimePreset(minutes: number) {
  const end = new Date()
  const start = new Date(end)
  start.setMinutes(start.getMinutes() - minutes)
  form.startTime = toTimeInputValue(start)
  form.endTime = toTimeInputValue(end)
}

function applyTip(tip: typeof writingTips[0]) {
  form.content = form.content ? `${form.content}\n\n${tip.text}` : tip.text
}

function resetForm() {
  form.category = categories.value[0]?.value || 'study'
  form.title = ''
  form.content = ''
  form.startTime = ''
  form.endTime = ''
  form.rating = 3
  form.energy = 5
  form.mood = 5
  form.focus = 5
  form.satisfaction = 5
  form.notes = ''
  tagText.value = ''
}

function adjustSlider(key: SliderKey, delta: number) {
  form[key] = Math.max(1, Math.min(10, form[key] + delta))
}

function openCategoryEditor() {
  categoryDrafts.value = categories.value.map(c => ({ ...c }))
  showCategoryEditor.value = true
}

function cancelCategoryEdit() {
  categoryDrafts.value = categories.value.map(c => ({ ...c }))
  showCategoryEditor.value = false
}

function setCategoryIcon(index: number, option: typeof categoryIconOptions[0]) {
  const target = categoryDrafts.value[index]
  if (!target) return
  target.icon = option.icon
  target.color = option.color
  target.bgClass = option.bgClass
}

function saveCategoryEdit() {
  const next = categoryDrafts.value.map((item, index) => ({
    ...item,
    label: item.label.trim() || `分类 ${index + 1}`,
  }))
  saveGrowthCategories(next)
  categories.value = getGrowthCategories()
  categoryDrafts.value = categories.value.map(c => ({ ...c }))
  if (!categories.value.some(c => c.value === form.category)) {
    form.category = categories.value[0]?.value || 'study'
  }
  showCategoryEditor.value = false
  $q.notify({ type: 'positive', message: '成长分类已保存' })
}

async function saveRecord() {
  if (!form.title) {
    $q.notify({ type: 'warning', message: '请填写标题' })
    return
  }
  if (!form.category) {
    $q.notify({ type: 'warning', message: '请选择分类' })
    return
  }

  const payload = {
    category: form.category,
    title: form.title,
    content: form.content,
    startTime: form.startTime,
    endTime: form.endTime,
    rating: form.rating,
    energy: form.energy,
    mood: form.mood,
    focus: form.focus,
    satisfaction: form.satisfaction,
    notes: form.notes,
    tags: tags.value,
  }

  if (isEdit.value) {
    await store.updateRecord(route.params.id as string, payload)
  } else {
    await store.addRecord(payload)
  }

  $q.notify({ type: 'positive', message: isEdit.value ? '记录已更新' : '记录保存成功' })
  router.push('/growth')
}
</script>

<style scoped>
.form-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.top-bar {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 16px 0 20px;
  position: sticky;
  top: 0;
  background: rgba(245, 243, 239, 0.92);
  backdrop-filter: blur(14px);
  z-index: 10;
}

.icon-btn,
.reset-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  width: auto;
  min-width: 72px;
  gap: 6px;
  padding: 0 12px;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  font-family: inherit;
}

.icon-btn:hover,
.reset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.top-spacer {
  width: 40px;
}

.top-title {
  font-size: var(--fs-18, 18px);
  font-weight: 760;
  color: var(--color-text-primary);
}

.top-sub {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.form-section {
  margin-bottom: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.section-label {
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.section-hint {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
}

.section-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 0 9px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--fs-12, 12px);
  font-weight: 650;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, color var(--motion-fast) ease;
}

.section-edit-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.required-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--color-negative);
  font-weight: 700;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  font-family: inherit;
}

.category-card:hover {
  border-color: var(--color-border);
  transform: translateY(-1px);
}

.category-card-active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 2px 12px rgba(91, 106, 191, 0.15);
}

.category-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.cat-bg-orange { background: var(--color-orange-light); }
.cat-bg-green { background: var(--color-success-light); }
.cat-bg-teal { background: var(--color-teal-light); }
.cat-bg-indigo { background: var(--color-indigo-light); }

.category-name {
  font-size: var(--fs-12, 12px);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.category-card-active .category-name {
  color: var(--color-primary);
}

.category-editor {
  margin-top: 12px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.editor-title {
  font-size: var(--fs-14, 14px);
  font-weight: 720;
  color: var(--color-text-primary);
}

.editor-desc {
  margin-top: 3px;
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
}

.editor-close {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
}

.editor-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.category-edit-list {
  display: grid;
  gap: 10px;
}

.category-edit-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 10px 12px;
  align-items: center;
  padding: 10px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
}

.category-edit-side {
  min-height: 40px;
}

.category-edit-side .category-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.icon-choice-row {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.icon-choice {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, color var(--motion-fast) ease;
}

.icon-choice:hover,
.icon-choice-active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.small-action {
  min-width: 96px;
  flex: 0 0 auto;
  padding: 10px 12px;
}

.form-card,
.preview-card,
.tips-card {
  background: rgba(255, 255, 255, 0.78);
  border-radius: 14px;
  padding: 10px;
  border: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 0 rgba(91, 106, 191, 0.06);
}

.form-card {
  display: grid;
  gap: 8px;
}

.form-field {
  margin-bottom: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: background var(--motion-fast) ease;
}

.field-row:hover {
  background: rgba(91, 106, 191, 0.04);
}

.field-row-area {
  align-items: start;
}

.field-side {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
  font-weight: 650;
}

.required-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--color-danger-light);
  flex-shrink: 0;
}

.field-input {
  min-width: 0;
}

.soft-input :deep(.q-field__control) {
  min-height: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
  box-shadow: none;
  align-items: center;
}

.fixed-textarea :deep(.q-field__control) {
  height: auto;
  min-height: 96px;
  align-items: flex-start;
}

.soft-input :deep(.q-field__control:hover) {
  background: #F4F4F8;
}

.soft-input :deep(.q-field--focused .q-field__control),
.soft-input.q-field--focused :deep(.q-field__control) {
  background: white;
  box-shadow: inset 0 0 0 1px var(--color-primary), var(--focus-ring);
}

.soft-input :deep(.q-field__native),
.soft-input :deep(.q-field__label) {
  color: var(--color-text-primary);
}

.soft-input:not(.fixed-textarea) :deep(.q-field__native),
.soft-input:not(.fixed-textarea) :deep(input) {
  min-height: 40px;
  line-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
}

.soft-input :deep(.q-field__append) {
  height: 100%;
  min-height: 40px;
  align-items: center;
  padding-left: 8px;
}

.soft-input :deep(.q-field__bottom) {
  color: var(--color-negative);
  font-weight: 650;
}

.soft-input :deep(.q-field__messages) {
  color: var(--color-negative);
}

.fixed-textarea :deep(textarea) {
  line-height: 1.6;
  padding-right: 4px;
}

.time-tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 7px 11px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--fs-12, 12px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.time-input {
  flex: 1;
}

.time-sep {
  flex-shrink: 0;
  width: 28px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  line-height: 1;
}

.rating-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
}

.rating-copy {
  min-width: 0;
}

.rating-label,
.tips-title {
  font-size: var(--fs-14, 14px);
  font-weight: 700;
  color: var(--color-text-primary);
}

.rating-desc {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.rating-value {
  font-size: var(--fs-14, 14px);
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;
}

.rating-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-self: end;
}

.rating-stars {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2px;
  white-space: nowrap;
}

.rating-stars :deep(.q-rating__icon) {
  display: inline-flex;
  color: #C8C8CC;
}

.rating-stars :deep(.q-rating__icon--active) {
  color: var(--color-star);
}

.slider-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 12px;
}

.slider-group {
  display: grid;
  gap: 8px;
  padding: 13px 14px 12px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
  min-width: 0;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 0;
}

.slider-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.slider-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: white;
  color: var(--color-text-secondary);
  font-size: var(--fs-11, 11px);
  font-weight: 700;
  white-space: nowrap;
}

.slider-label {
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  color: var(--color-text-secondary);
  flex: 1;
}

.slider-stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.slider-step-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: white;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast) ease;
}

.slider-step-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.slider-value {
  min-width: 42px;
  text-align: center;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  color: var(--color-primary);
}

.slider-caption {
  margin: 0;
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
}

.status-range {
  --range-value: 45%;
  width: 100%;
  height: 22px;
  margin: 0;
  border: 0;
  outline: 0;
  cursor: pointer;
  appearance: none;
  background: transparent;
}

.status-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--color-primary) 0%,
    var(--color-primary) var(--range-value),
    rgba(91, 106, 191, 0.16) var(--range-value),
    rgba(91, 106, 191, 0.16) 100%
  );
}

.status-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border: 2px solid white;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 2px 6px rgba(45, 45, 58, 0.2);
  appearance: none;
}

.status-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(91, 106, 191, 0.24), 0 2px 6px rgba(45, 45, 58, 0.2);
}

.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: -4px 0 0;
}

.tag-pill {
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--fs-11, 11px);
  font-weight: 700;
}

.side-panel {
  position: sticky;
  top: 82px;
  display: grid;
  gap: 14px;
}

.preview-label {
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
  font-weight: 700;
  margin-bottom: 10px;
}

.preview-title {
  font-size: var(--fs-18, 18px);
  line-height: 1.35;
  font-weight: 780;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.preview-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--fs-12, 12px);
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.preview-score strong {
  color: var(--color-primary);
  font-size: var(--fs-18, 18px);
}

.preview-status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.preview-status div {
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-hover);
}

.preview-status span {
  display: block;
  font-size: var(--fs-11, 11px);
  color: var(--color-text-muted);
}

.preview-status strong {
  font-size: var(--fs-16, 16px);
  color: var(--color-text-primary);
}

.tip-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.tip-row:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.bottom-actions {
  display: flex;
  gap: 12px;
  margin-top: 26px;
  padding-bottom: 20px;
}

.btn-cancel,
.btn-save {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 13px;
  border-radius: var(--radius-md);
  font-size: var(--fs-14, 14px);
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  flex: 1;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
}

.btn-cancel:hover {
  background: var(--color-bg);
}

.btn-save {
  flex: 2;
  border: none;
  background: var(--color-primary);
  color: white;
  box-shadow: 0 2px 10px var(--color-primary-glow);
}

.btn-save:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(91, 106, 191, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .side-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .page-content {
    padding: 0 16px calc(116px + var(--bottom-action-offset));
  }

  .category-grid,
  .slider-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rating-row {
    grid-template-columns: 1fr;
  }

  .rating-control {
    justify-self: start;
  }

  .slider-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .field-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .time-row {
    flex-direction: column;
  }

  .time-sep {
    display: none;
  }

  .bottom-actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--bottom-action-offset);
    z-index: 1240;
    margin: 0;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.96);
    border-top: 1px solid var(--color-border-light);
    box-shadow: 0 -10px 24px rgba(45, 45, 58, 0.08);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }

  .btn-cancel {
    flex: 1;
  }

  .btn-save {
    flex: 1.6;
  }

  :global(body.dark-mode) .bottom-actions {
    background: rgba(34, 34, 64, 0.96);
    border-top-color: var(--color-border);
    box-shadow: 0 -12px 28px rgba(0, 0, 0, 0.26);
  }
}
</style>
