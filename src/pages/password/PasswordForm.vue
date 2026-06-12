<template>
  <q-page padding class="form-page">
    <div class="page-content">
      <!-- 顶部导航 -->
      <div class="top-bar">
        <button class="btn-back" @click="$router.back()">
          <q-icon name="arrow_back" size="20px" />
        </button>
        <div class="top-title">{{ isEdit ? '编辑账号' : '新增账号' }}</div>
        <div style="width: 36px"></div>
      </div>

      <!-- 分类选择 -->
      <div class="section-label">选择分类</div>
      <div class="category-grid">
        <button
          v-for="c in categories"
          :key="c.value"
          type="button"
          class="category-card"
          :class="{ 'category-card-active': form.category === c.value }"
          @click="form.category = c.value"
        >
          <div class="category-icon" :class="c.bgClass">
            <q-icon :name="c.icon" size="20px" :color="c.color" />
          </div>
          <span class="category-name">{{ c.label }}</span>
        </button>
      </div>

      <div class="form-section">
        <div class="section-label">账号信息</div>
        <div class="form-card">
          <div class="form-note">
            <q-icon name="priority_high" size="15px" />
            <span>网站名称、账号和密码为必填。</span>
          </div>
          <div class="field-row">
            <div class="field-side">
              <q-icon name="public" size="18px" color="primary" />
              <span>网站名称</span>
              <q-icon v-if="!form.name" name="priority_high" size="15px" color="negative" class="required-inline" />
            </div>
            <q-input
              v-model="form.name"
              placeholder="例如：Google"
              filled
              borderless
              dense
              hide-bottom-space
              class="field-input soft-input"
            />
          </div>
          <div class="field-row">
            <div class="field-side">
              <q-icon name="link" size="18px" color="secondary" />
              <span>网站地址</span>
            </div>
            <q-input
              v-model="form.url"
              placeholder="https://google.com"
              filled
              borderless
              dense
              hide-bottom-space
              class="field-input soft-input"
            />
          </div>
          <div class="field-row">
            <div class="field-side">
              <q-icon name="person" size="18px" color="positive" />
              <span>账号</span>
              <q-icon v-if="!form.username" name="priority_high" size="15px" color="negative" class="required-inline" />
            </div>
            <q-input
              v-model="form.username"
              placeholder="用户名 / 邮箱"
              filled
              borderless
              dense
              hide-bottom-space
              class="field-input soft-input"
            />
          </div>
          <div class="field-row">
            <div class="field-side">
              <q-icon name="key" size="18px" color="orange" />
              <span>密码</span>
              <q-icon v-if="!form.password" name="priority_high" size="15px" color="negative" class="required-inline" />
            </div>
            <q-input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="输入或生成强密码"
              filled
              borderless
              dense
              hide-bottom-space
              class="field-input soft-input password-input"
            >
              <template v-slot:append>
                <q-icon
                  :name="showPwd ? 'visibility_off' : 'visibility'"
                  class="password-eye cursor-pointer"
                  size="18px"
                  color="#9B9BA3"
                  @click="showPwd = !showPwd"
                />
              </template>
            </q-input>
          </div>
          <button class="btn-generate" @click="generatePassword">
            <q-icon name="auto_awesome" size="16px" />
            <span>生成强密码</span>
          </button>
        </div>
      </div>

      <div class="form-section">
        <div class="section-label">备注</div>
        <div class="form-card">
          <div class="field-row field-row-area">
            <div class="field-side">
              <q-icon name="notes" size="18px" color="primary" />
              <span>备注</span>
            </div>
            <q-input
              v-model="form.notes"
              placeholder="补充说明..."
              filled
              borderless
              dense
              type="textarea"
              rows="5"
              hide-bottom-space
              class="field-input soft-input fixed-textarea"
              :input-style="notesInputStyle"
            />
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="bottom-actions">
        <button class="btn-cancel" @click="$router.back()">取消</button>
        <button class="btn-save" @click="saveEntry">
          <q-icon name="check" size="16px" />
          <span>{{ isEdit ? '保存修改' : '保存账号' }}</span>
        </button>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePasswordStore } from '@/stores/password'
import { generateSecurePassword } from '@/services/crypto'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const store = usePasswordStore()

const isEdit = computed(() => !!route.params.id)
const showPwd = ref(false)
const notesInputStyle = {
  minHeight: '118px',
  maxHeight: '118px',
  overflowY: 'auto',
  resize: 'none',
}

const form = reactive({
  name: '',
  url: '',
  username: '',
  password: '',
  category: 'other' as 'work' | 'social' | 'payment' | 'other',
  notes: ''
})

const categories = [
  { value: 'work', label: '工作', icon: 'work', color: 'primary', bgClass: 'cat-bg-indigo' },
  { value: 'social', label: '社交', icon: 'chat', color: 'green', bgClass: 'cat-bg-green' },
  { value: 'payment', label: '支付', icon: 'payment', color: 'orange', bgClass: 'cat-bg-orange' },
  { value: 'other', label: '其他', icon: 'language', color: 'primary', bgClass: 'cat-bg-blue' },
]

onMounted(async () => {
  await store.fetchEntries()
  if (isEdit.value) {
    const existing = store.getEntryById(route.params.id as string)
    if (existing) {
      form.name = existing.name
      form.url = existing.url
      form.username = existing.username
      form.password = existing.encryptedPassword
      form.category = existing.category
      form.notes = existing.notes
    }
  }
})

function generatePassword() {
  form.password = generateSecurePassword(16)
  $q.notify({ type: 'info', message: '已生成 16 位强密码' })
}

async function saveEntry() {
  if (!form.name) {
    $q.notify({ type: 'warning', message: '请填写网站名称' })
    return
  }
  if (!form.username) {
    $q.notify({ type: 'warning', message: '请填写用户名' })
    return
  }
  if (!form.password) {
    $q.notify({ type: 'warning', message: '请填写密码' })
    return
  }

  if (isEdit.value) {
    await store.updateEntry(route.params.id as string, {
      name: form.name,
      url: form.url,
      username: form.username,
      encryptedPassword: form.password,
      category: form.category,
      notes: form.notes,
    })
  } else {
    await store.addEntry({
      name: form.name,
      url: form.url,
      username: form.username,
      encryptedPassword: form.password,
      category: form.category,
      notes: form.notes,
      isStarred: false,
    })
  }

  $q.notify({ type: 'positive', message: isEdit.value ? '账号已更新' : '账号保存成功' })
  router.push('/password')
}
</script>

<style scoped>
.form-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 20px;
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 10;
}

.btn-back {
  width: 36px;
  height: 36px;
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

.btn-back:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.top-title {
  font-size: var(--fs-16, 16px);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.2px;
}

.section-label {
  font-size: var(--fs-12, 12px);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 28px;
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
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.category-card:hover { border-color: var(--color-border); }

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
  border-radius: var(--radius-md);
}

.cat-bg-indigo { background: var(--color-indigo-light); }
.cat-bg-green { background: var(--color-success-light); }
.cat-bg-orange { background: var(--color-orange-light); }
.cat-bg-blue { background: var(--color-info-light); }

.category-name {
  font-size: var(--fs-12, 12px);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.category-card-active .category-name {
  color: var(--color-primary);
  font-weight: 600;
}

.form-section { margin-bottom: 24px; }

.form-card {
  background: rgba(255, 255, 255, 0.78);
  border-radius: 14px;
  padding: 10px;
  border: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 0 rgba(91, 106, 191, 0.06);
  display: grid;
  gap: 8px;
}

.form-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 11px;
  border-radius: var(--radius-md);
  background: var(--color-danger-light);
  color: var(--color-negative);
  font-size: var(--fs-12, 12px);
  font-weight: 700;
}

.form-field { margin-bottom: 0; }
.form-field:last-child { margin-bottom: 0; }

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
  border-radius: var(--radius-md);
  background: #F7F7FA;
  box-shadow: none;
  align-items: center;
}

.soft-input :deep(.q-field__control:hover) {
  background: #F4F4F8;
}

.soft-input.q-field--focused :deep(.q-field__control) {
  background: white;
  box-shadow: inset 0 0 0 1px var(--color-primary), var(--focus-ring);
}

.soft-input :deep(.q-field__native),
.soft-input :deep(.q-field__label) {
  color: var(--color-text-primary);
}

.soft-input :deep(.q-field__append) {
  height: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 8px;
}

.password-input {
  position: relative;
}

.password-input :deep(.q-field__control) {
  padding-right: 44px;
  position: relative;
}

.password-input :deep(.q-field__append) {
  position: absolute;
  right: 8px;
  top: 50%;
  height: 28px;
  min-height: 28px;
  padding: 0;
  transform: translateY(-50%);
  z-index: 1;
}

.password-eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
}

.password-eye:hover {
  background: rgba(91, 106, 191, 0.1);
  color: var(--color-primary) !important;
}

.fixed-textarea :deep(textarea) {
  line-height: 1.6;
  padding-right: 4px;
}

.btn-generate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--color-text-disabled);
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  font-size: var(--fs-12, 12px);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-generate:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.bottom-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-bottom: 20px;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--fs-14, 14px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover { background: var(--color-bg); }

.btn-save {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-14, 14px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 10px var(--color-primary-glow);
}

.btn-save:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(91, 106, 191, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .page-content { padding: 0 16px calc(116px + var(--bottom-action-offset)); }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .field-row {
    grid-template-columns: 1fr;
    gap: 6px;
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

