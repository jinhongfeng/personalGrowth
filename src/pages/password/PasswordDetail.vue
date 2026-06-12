<template>
  <q-page padding class="detail-page">
    <div class="page-content">
      <!-- 顶部导航 -->
      <div class="top-bar">
        <button class="btn-back" @click="$router.back()">
          <q-icon name="arrow_back" size="20px" />
        </button>
        <div class="top-title">账号详情</div>
        <button class="btn-edit" @click="$router.push(`/password/${route.params.id}/edit`)">
          <q-icon name="edit" size="18px" />
        </button>
      </div>

      <!-- 头部信息 -->
      <div class="detail-header" v-if="entry">
        <div class="header-icon" :class="iconBgClass">
          <q-icon :name="iconName" size="28px" :color="iconColor" />
        </div>
        <div class="header-info">
          <div class="header-name">{{ entry.name }}</div>
          <div class="header-url">{{ entry.url || '未设置网址' }}</div>
        </div>
        <button
          class="btn-star"
          :class="{ 'btn-star-active': entry.isStarred }"
          @click="toggleStar"
        >
          <q-icon :name="entry.isStarred ? 'star' : 'star_border'" size="22px" />
        </button>
      </div>

      <!-- 账号字段 -->
      <div class="fields-section" v-if="entry">
        <div class="field-card">
          <div class="field-label">用户名</div>
          <div class="field-value-row">
            <span class="field-value">{{ entry.username }}</span>
            <button class="btn-copy" @click="copyField('username')">
              <q-icon name="content_copy" size="16px" />
            </button>
          </div>
        </div>

        <div class="field-card">
          <div class="field-label">密码</div>
          <div class="field-value-row">
            <span class="field-value field-password" :class="{ 'field-password-hidden': !pwdVisible }">
              {{ pwdVisible ? entry.encryptedPassword : '••••••••••••' }}
            </span>
            <button class="btn-copy" @click="pwdVisible = !pwdVisible">
              <q-icon :name="pwdVisible ? 'visibility_off' : 'visibility'" size="16px" />
            </button>
            <button class="btn-copy" @click="copyField('password')">
              <q-icon name="content_copy" size="16px" />
            </button>
          </div>
        </div>

        <div class="field-card" v-if="entry.category">
          <div class="field-label">分类</div>
          <div class="field-value-row">
            <span class="field-tag" :class="categoryTagClass">{{ categoryLabel }}</span>
          </div>
        </div>

        <div class="field-card" v-if="entry.notes">
          <div class="field-label">备注</div>
          <div class="field-value-row">
            <span class="field-value field-notes">{{ entry.notes }}</span>
          </div>
        </div>

        <div class="field-card">
          <div class="field-label">最后更新</div>
          <div class="field-value-row">
            <span class="field-value field-meta">{{ entry.lastUpdated || '未知' }}</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions" v-if="entry">
        <button class="btn-action btn-action-primary" @click="copyField('password')">
          <q-icon name="content_copy" size="18px" />
          <span>复制密码</span>
        </button>
        <button class="btn-action btn-action-outline" @click="copyField('username')">
          <q-icon name="person" size="18px" />
          <span>复制用户名</span>
        </button>
      </div>

      <!-- 危险操作 -->
      <div class="danger-section" v-if="entry">
        <button class="btn-danger" @click="confirmDelete">
          <q-icon name="delete" size="16px" />
          <span>删除此账号</span>
        </button>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePasswordStore } from '@/stores/password'
import { secureCopy } from '@/services/clipboard'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const store = usePasswordStore()

const pwdVisible = ref(false)

onMounted(() => store.fetchEntries())

const entry = computed(() => store.getEntryById(route.params.id as string))

const categoryIconMap: Record<string, string> = {
  work: 'work', social: 'chat', payment: 'payment', other: 'language'
}
const categoryColorMap: Record<string, string> = {
  work: 'primary', social: 'green', payment: 'orange', other: 'primary'
}
const categoryBgMap: Record<string, string> = {
  work: 'bg-indigo', social: 'bg-green', payment: 'bg-orange', other: 'bg-blue'
}
const categoryLabelMap: Record<string, string> = {
  work: '工作', social: '社交', payment: '支付', other: '其他'
}
const categoryTagClassMap: Record<string, string> = {
  work: 'tag-indigo', social: 'tag-green', payment: 'tag-orange', other: 'tag-grey'
}

const iconName = computed(() => categoryIconMap[entry.value?.category || 'other'] || 'language')
const iconColor = computed(() => categoryColorMap[entry.value?.category || 'other'] || 'primary')
const iconBgClass = computed(() => categoryBgMap[entry.value?.category || 'other'] || 'bg-grey')
const categoryLabel = computed(() => categoryLabelMap[entry.value?.category || 'other'] || '其他')
const categoryTagClass = computed(() => categoryTagClassMap[entry.value?.category || 'other'] || 'tag-grey')

function toggleStar() {
  if (entry.value) {
    store.toggleStar(entry.value.id)
    $q.notify({
      type: 'positive',
      message: entry.value.isStarred ? '已添加星标' : '已取消星标'
    })
  }
}

async function copyField(field: string) {
  if (!entry.value) return
  let text = ''
  if (field === 'username') text = entry.value.username
  if (field === 'password') text = entry.value.encryptedPassword
  if (!text) return

  const copied = await secureCopy(text)
  if (copied) {
    const label = field === 'username' ? '用户名' : '密码'
    $q.notify({ type: 'positive', message: `${label}已复制` })
  } else {
    $q.notify({ type: 'negative', message: '复制失败' })
  }
}

function confirmDelete() {
  if (!entry.value) return
  $q.dialog({
    title: '删除账号',
    message: `确定要删除「${entry.value.name}」吗？此操作不可恢复。`,
    cancel: { label: '取消', flat: true },
    ok: { label: '删除', color: 'negative' },
  }).onOk(async () => {
    await store.deleteEntry(entry.value!.id)
    $q.notify({ type: 'positive', message: '账号已删除' })
    router.push('/password')
  })
}
</script>

<style scoped>
.detail-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.page-content {
  max-width: 560px;
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

.btn-back, .btn-edit {
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

.btn-back:hover, .btn-edit:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.top-title {
  font-size: var(--fs-16, 16px);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.2px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.header-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.bg-indigo { background: var(--color-indigo-light); }
.bg-orange { background: var(--color-orange-light); }
.bg-green { background: var(--color-success-light); }
.bg-red { background: var(--color-danger-light); }
.bg-blue { background: var(--color-info-light); }
.bg-grey { background: var(--color-bg-hover); }

.header-info { flex: 1; min-width: 0; }
.header-name { font-size: var(--fs-18, 18px); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.3px; }
.header-url { font-size: var(--fs-12, 12px); color: var(--color-text-muted); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.btn-star {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-disabled);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-star:hover { color: var(--color-star); background: var(--color-warning-bg); }
.btn-star-active { color: var(--color-star); }

.fields-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.field-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.field-label {
  font-size: var(--fs-11, 11px);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.field-value-row { display: flex; align-items: center; gap: 8px; }

.field-value {
  font-size: var(--fs-14, 14px);
  color: var(--color-text-primary);
  font-weight: 500;
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.field-password { font-family: 'SF Mono', 'Consolas', monospace; letter-spacing: 1px; }
.field-password-hidden { letter-spacing: 3px; }
.field-notes { font-size: var(--fs-13, 13px); color: var(--color-text-secondary); line-height: 1.6; }
.field-meta { font-size: var(--fs-13, 13px); color: var(--color-text-muted); }

.field-tag {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--fs-12, 12px);
  font-weight: 600;
}

.tag-indigo { background: var(--color-indigo-light); color: var(--color-primary); }
.tag-green { background: var(--color-success-light); color: var(--color-positive); }
.tag-orange { background: var(--color-orange-light); color: var(--color-warning); }
.tag-grey { background: var(--color-bg); color: var(--color-text-muted); }

.btn-copy {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text-disabled);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-copy:hover { color: var(--color-primary); background: var(--color-primary-bg); }

.quick-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action-primary {
  border: none;
  background: var(--color-primary);
  color: white;
  box-shadow: 0 2px 10px var(--color-primary-glow);
}

.btn-action-primary:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 14px rgba(91, 106, 191, 0.35);
  transform: translateY(-1px);
}

.btn-action-outline {
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
}

.btn-action-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

.danger-section { text-align: center; padding-top: 8px; }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-disabled);
  font-size: var(--fs-13, 13px);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover { color: var(--color-negative); background: var(--color-danger-light); }

@media (max-width: 640px) {
  .page-content { padding: 0 16px 40px; }
  .quick-actions { flex-direction: column; }
}
</style>

