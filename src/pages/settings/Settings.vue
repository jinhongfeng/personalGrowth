<template>
  <q-page padding class="settings-page">
    <div class="page-content">
      <div class="page-header">
        <button v-if="currentSection" class="back-btn" @click="backToParent">
          <q-icon name="arrow_back" size="19px" />
        </button>
        <div>
          <h1 class="page-title">{{ currentPanel?.label || currentSection?.label || '设置' }}</h1>
          <p class="page-subtitle">{{ currentPanel?.desc || currentSection?.desc || '管理锁定、数据、外观和应用信息' }}</p>
        </div>
      </div>

      <template v-if="currentPanel?.value === 'password'">
        <div class="settings-form-card">
          <div class="form-note">
            <q-icon name="priority_high" size="15px" />
            <span>所有字段均为必填，新密码至少 6 位。</span>
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="lock" size="17px" color="primary" />
              <span>当前密码</span>
            </div>
            <q-input v-model="pwdForm.old" placeholder="当前密码" type="password" filled borderless dense hide-bottom-space class="dialog-input" />
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="vpn_key" size="17px" color="secondary" />
              <span>新密码</span>
            </div>
            <q-input v-model="pwdForm.new" placeholder="新密码" type="password" filled borderless dense hide-bottom-space class="dialog-input" />
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="verified_user" size="17px" color="positive" />
              <span>确认密码</span>
            </div>
            <q-input v-model="pwdForm.confirm" placeholder="确认新密码" type="password" filled borderless dense hide-bottom-space class="dialog-input" />
          </div>
        </div>
        <div class="page-actions">
          <button class="btn-cancel" @click="backToParent">取消</button>
          <button class="btn-save" @click="changePassword">确认修改</button>
        </div>
      </template>

      <template v-else-if="currentPanel?.value === 'notify'">
        <div class="settings-form-card">
          <div class="notify-item">
            <div class="notify-body">
              <div class="notify-name">启用通知</div>
              <div class="notify-desc">开启后接收每日提醒</div>
            </div>
            <q-toggle v-model="notifyEnabled" color="primary" dense />
          </div>
          <div class="notify-item">
            <div class="notify-body">
              <div class="notify-name">记录提醒</div>
              <div class="notify-desc">每天 20:00 提醒记录成长</div>
            </div>
            <q-toggle v-model="notifyRecord" color="primary" dense :disable="!notifyEnabled" />
          </div>
          <div class="notify-item">
            <div class="notify-body">
              <div class="notify-name">活人感提醒</div>
              <div class="notify-desc">状态低落时推送行动建议</div>
            </div>
            <q-toggle v-model="notifyAlive" color="primary" dense :disable="!notifyEnabled" />
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="schedule" size="17px" color="primary" />
              <span>提醒时间</span>
            </div>
            <q-input v-model="notifyTime" type="time" filled borderless dense hide-bottom-space class="dialog-input" :disable="!notifyEnabled" />
          </div>
          <div class="form-note neutral-note">
            <q-icon name="info" size="15px" />
            <span>应用打开时会在设定时间显示提醒。</span>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn-cancel" @click="backToParent">取消</button>
          <button class="btn-save" @click="saveNotifySettings">保存通知设置</button>
        </div>
      </template>

      <template v-else-if="currentPanel?.value === 'auto-lock'">
        <div class="settings-form-card">
          <div class="notify-item">
            <div class="notify-body">
              <div class="notify-name">启用自动锁定</div>
              <div class="notify-desc">闲置一段时间后锁定应用</div>
            </div>
            <q-toggle v-model="autoLock" color="primary" dense @update:model-value="onAutoLockChange" />
          </div>
          <div class="form-note neutral-note">
            <q-icon name="info" size="15px" />
            <span>锁定后需要输入主密码才能继续使用。</span>
          </div>
          <div class="form-label">闲置多久后锁定</div>
          <div class="option-grid">
            <button
              v-for="opt in autoLockOptions"
              :key="opt.value"
              class="setting-option-btn"
              :class="{ 'setting-option-btn-active': autoLockTimeout === opt.value }"
              :disabled="!autoLock"
              @click="setAutoLockTimeout(opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn-cancel" @click="backToParent">取消</button>
          <button class="btn-save" @click="saveAutoLockSettings">保存自动锁定</button>
        </div>
      </template>

      <template v-else-if="currentPanel?.value === 'clipboard-clear'">
        <div class="settings-form-card">
          <div class="notify-item">
            <div class="notify-body">
              <div class="notify-name">启用剪贴板清除</div>
              <div class="notify-desc">复制密码后自动清空剪贴板</div>
            </div>
            <q-toggle v-model="clipboardClear" color="primary" dense @update:model-value="onClipboardChange" />
          </div>
          <div class="form-note neutral-note">
            <q-icon name="info" size="15px" />
            <span>适合在共享设备或手机端查询密码后减少误粘贴。</span>
          </div>
          <div class="form-label">复制多久后清除</div>
          <div class="option-grid">
            <button
              v-for="opt in clipboardClearOptions"
              :key="opt.value"
              class="setting-option-btn"
              :class="{ 'setting-option-btn-active': clipboardClearTimeout === opt.value }"
              :disabled="!clipboardClear"
              @click="setClipboardClearTimeout(opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn-cancel" @click="backToParent">取消</button>
          <button class="btn-save" @click="saveClipboardSettings">保存剪贴板设置</button>
        </div>
      </template>

      <template v-else-if="currentPanel?.value === 'font'">
        <div class="settings-form-card">
          <div class="form-label">字体大小</div>
          <div class="font-size-options">
            <button
              v-for="s in fontSizes"
              :key="s"
              class="font-size-btn"
              :class="{ 'font-size-btn-active': fontSize === s }"
              @click="fontSize = s"
            >{{ s }}</button>
          </div>
          <div class="form-label q-mt-md">字体风格</div>
          <div class="font-size-options">
            <button
              v-for="f in fontFamilies"
              :key="f"
              class="font-size-btn"
              :class="{ 'font-size-btn-active': fontFamily === f }"
              @click="fontFamily = f"
            >{{ f }}</button>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn-cancel" @click="backToParent">取消</button>
          <button class="btn-save" @click="saveFont">保存字体设置</button>
        </div>
      </template>

      <template v-else-if="currentPanel?.value === 'ai-config'">
        <div class="settings-form-card">
          <div class="notify-item">
            <div class="notify-body">
              <div class="notify-name">启用 AI 分析</div>
              <div class="notify-desc">开启后可根据画像、成长记录和活人感反馈生成建议</div>
            </div>
            <q-toggle v-model="aiForm.enabled" color="primary" dense />
          </div>
          <div class="form-note neutral-note">
            <q-icon name="info" size="15px" />
            <span>生成分析时会把成长相关数据发送到你填写的 API，不会发送密码箱内容。</span>
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="api" size="17px" color="primary" />
              <span>API 地址</span>
            </div>
            <q-input
              v-model.trim="aiForm.baseUrl"
              placeholder="https://api.openai.com/v1"
              spellcheck="false"
              filled
              borderless
              dense
              hide-bottom-space
              class="dialog-input"
            />
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="vpn_key" size="17px" color="secondary" />
              <span>API Key</span>
            </div>
            <q-input
              v-model.trim="aiForm.apiKey"
              :type="showAIKey ? 'text' : 'password'"
              placeholder="输入你的 API Key"
              spellcheck="false"
              filled
              borderless
              dense
              hide-bottom-space
              class="dialog-input api-key-input"
            >
              <template #append>
                <q-icon
                  :name="showAIKey ? 'visibility_off' : 'visibility'"
                  class="input-action-icon"
                  @click="showAIKey = !showAIKey"
                />
              </template>
            </q-input>
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="memory" size="17px" color="positive" />
              <span>模型名称</span>
            </div>
            <q-input
              v-model.trim="aiForm.model"
              placeholder="例如：gpt-4o-mini"
              spellcheck="false"
              filled
              borderless
              dense
              hide-bottom-space
              class="dialog-input"
            />
          </div>
          <div class="dialog-field-row">
            <div class="dialog-field-side">
              <q-icon name="tune" size="17px" color="orange" />
              <span>建议稳定度</span>
            </div>
            <div class="range-field">
              <input v-model.number="aiForm.temperature" type="range" min="0" max="1" step="0.1" class="ai-range" />
              <span class="range-value">{{ aiForm.temperature.toFixed(1) }}</span>
            </div>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn-cancel" @click="backToParent">取消</button>
          <button class="btn-cancel" :disabled="testingAI" @click="testAIConfig">
            {{ testingAI ? '测试中...' : '测试连接' }}
          </button>
          <button class="btn-save" @click="saveAIConfig">保存 AI 配置</button>
        </div>
      </template>

      <template v-else-if="currentPanel?.value === 'guide'">
        <div class="settings-form-card">
          <div class="guide-section" v-for="g in guides" :key="g.title">
            <div class="guide-icon" :class="g.bg">
              <q-icon :name="g.icon" size="20px" :color="g.color" />
            </div>
            <div class="guide-content">
              <div class="guide-title">{{ g.title }}</div>
              <div class="guide-desc">{{ g.desc }}</div>
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="!currentSection" class="settings-overview">
        <button
          v-for="item in mainTabs"
          :key="item.value"
          class="overview-card"
          @click="openSection(item.value)"
        >
          <div class="setting-icon" :class="item.bg">
            <q-icon :name="item.icon" size="20px" :class="`setting-icon-${item.color}`" />
          </div>
          <div class="setting-body">
            <div class="setting-name">{{ item.label }}</div>
            <div class="setting-desc">{{ item.desc }}</div>
          </div>
          <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
        </button>
      </div>

      <template v-else-if="section === 'safe'">
        <div class="settings-list">
          <button type="button" class="setting-card" @click="openPanel('password')">
            <div class="setting-icon icon-bg-indigo">
              <q-icon name="lock" size="18px" class="setting-icon-primary" />
            </div>
            <div class="setting-body">
              <div class="setting-name">修改主密码</div>
              <div class="setting-desc">设置打开密码箱前的本地校验</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
          <button type="button" class="setting-card" @click="openPanel('auto-lock')">
            <div class="setting-icon icon-bg-orange">
              <q-icon name="timer" size="18px" class="setting-icon-orange" />
            </div>
            <div class="setting-body">
              <div class="setting-name">自动锁定</div>
              <div class="setting-desc">{{ autoLock ? `闲置 ${autoLockLabel} 后自动锁定` : '已关闭' }}</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
          <button type="button" class="setting-card" @click="openPanel('clipboard-clear')">
            <div class="setting-icon icon-bg-green">
              <q-icon name="security" size="18px" class="setting-icon-positive" />
            </div>
            <div class="setting-body">
              <div class="setting-name">剪贴板清除</div>
              <div class="setting-desc">{{ clipboardClear ? `复制密码 ${clipboardClearLabel} 后自动清空` : '已关闭' }}</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
        </div>
      </template>

      <template v-else-if="section === 'data'">
        <div class="settings-list">
          <button type="button" class="setting-card" @click="exportBackup">
            <div class="setting-icon icon-bg-indigo">
              <q-icon name="backup" size="18px" class="setting-icon-primary" />
            </div>
            <div class="setting-body">
              <div class="setting-name">导出备份</div>
              <div class="setting-desc">导出所有本地数据</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
          <button type="button" class="setting-card" @click="importBackup">
            <div class="setting-icon icon-bg-teal">
              <q-icon name="restore" size="18px" class="setting-icon-secondary" />
            </div>
            <div class="setting-body">
              <div class="setting-name">导入备份</div>
              <div class="setting-desc">从备份文件恢复数据</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
          <button type="button" class="setting-card" @click="confirmClear">
            <div class="setting-icon icon-bg-red">
              <q-icon name="delete" size="18px" class="setting-icon-negative" />
            </div>
            <div class="setting-body">
              <div class="setting-name">清除所有数据</div>
              <div class="setting-desc">清除所有本地数据，操作前会再次确认</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
        </div>
      </template>

      <template v-else-if="section === 'ui'">
        <div class="theme-card">
          <div class="theme-title">主题模式</div>
          <div class="theme-options">
            <button
              class="theme-btn"
              :class="{ 'theme-btn-active': theme === 'light' }"
              @click="setTheme('light')"
            >
              <q-icon name="light_mode" size="18px" />
              <span>浅色</span>
            </button>
            <button
              class="theme-btn"
              :class="{ 'theme-btn-active': theme === 'dark' }"
              @click="setTheme('dark')"
            >
              <q-icon name="dark_mode" size="18px" />
              <span>深色</span>
            </button>
          </div>
        </div>
        <div class="settings-list">
          <button type="button" class="setting-card" @click="openPanel('notify')">
            <div class="setting-icon icon-bg-red">
              <q-icon name="notifications" size="18px" class="setting-icon-negative" />
            </div>
            <div class="setting-body">
              <div class="setting-name">通知提醒</div>
              <div class="setting-desc">{{ notifyEnabled ? '每日记录与行动提醒' : '已关闭' }}</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
          <button type="button" class="setting-card" @click="openPanel('font')">
            <div class="setting-icon icon-bg-purple">
              <q-icon name="font_download" size="18px" class="setting-icon-purple" />
            </div>
            <div class="setting-body">
              <div class="setting-name">字体设置</div>
              <div class="setting-desc">当前：{{ fontSize }} · {{ fontFamily }}</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
        </div>
      </template>

      <template v-else-if="section === 'ai'">
        <div class="settings-list">
          <button type="button" class="setting-card" @click="openPanel('ai-config')">
            <div class="setting-icon icon-bg-purple">
              <q-icon name="smart_toy" size="18px" class="setting-icon-purple" />
            </div>
            <div class="setting-body">
              <div class="setting-name">接口配置</div>
              <div class="setting-desc">{{ aiSummary }}</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
          <button type="button" class="setting-card" @click="openAIAnalysis">
            <div class="setting-icon icon-bg-indigo">
              <q-icon name="auto_awesome" size="18px" class="setting-icon-primary" />
            </div>
            <div class="setting-body">
              <div class="setting-name">生成成长分析</div>
              <div class="setting-desc">根据个人画像和记录生成状态判断与下一步建议</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
        </div>
      </template>

      <template v-else-if="section === 'about'">
        <div class="about-card">
          <div class="about-icon">
            <q-icon name="self_improvement" size="40px" color="white" />
          </div>
          <div class="about-name">个人成长助手</div>
          <div class="about-version">v1.0.0</div>
          <div class="about-desc">一个帮你记录成长、管理密码、恢复状态的个人桌面工具。</div>
        </div>
        <div class="settings-list">
          <button type="button" class="setting-card" @click="openPanel('guide')">
            <div class="setting-icon icon-bg-grey">
              <q-icon name="description" size="18px" class="setting-icon-grey" />
            </div>
            <div class="setting-body">
              <div class="setting-name">使用说明</div>
              <div class="setting-desc">查看功能介绍</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
          <button type="button" class="setting-card" @click="checkUpdate">
            <div class="setting-icon icon-bg-indigo">
              <q-icon name="system_update" size="18px" class="setting-icon-primary" />
            </div>
            <div class="setting-body">
              <div class="setting-name">检查更新</div>
              <div class="setting-desc">当前版本 v1.0.0</div>
            </div>
            <q-icon name="chevron_right" color="#C8C8CC" size="18px" />
          </button>
        </div>
      </template>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { setMasterPassword, hasMasterPassword, changeMasterPassword } from '@/services/crypto'
import {
  defaultAISettings,
  getAISettings,
  hasAIConnectionConfig,
  requestAICompletion,
  saveAISettings,
} from '@/services/ai'
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  applyAppearanceSettings,
} from '@/services/appearance'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const theme = ref('light')

const autoLock = ref(true)
const clipboardClear = ref(true)
const autoLockTimeout = ref(5 * 60 * 1000)
const clipboardClearTimeout = ref(15 * 1000)
const pwdForm = reactive({ old: '', new: '', confirm: '' })

const notifyEnabled = ref(true)
const notifyRecord = ref(true)
const notifyAlive = ref(false)
const notifyTime = ref('20:00')
const fontSize = ref('标准')
const fontFamily = ref('默认')
const showAIKey = ref(false)
const testingAI = ref(false)
const aiForm = reactive({ ...defaultAISettings })
const fontSizes = [...FONT_SIZE_OPTIONS]
const fontFamilies = [...FONT_FAMILY_OPTIONS]
const autoLockOptions = [
  { label: '1 分钟', value: 60 * 1000 },
  { label: '5 分钟', value: 5 * 60 * 1000 },
  { label: '15 分钟', value: 15 * 60 * 1000 },
  { label: '30 分钟', value: 30 * 60 * 1000 },
]
const clipboardClearOptions = [
  { label: '5 秒', value: 5 * 1000 },
  { label: '15 秒', value: 15 * 1000 },
  { label: '30 秒', value: 30 * 1000 },
  { label: '60 秒', value: 60 * 1000 },
]

const mainTabs = [
  { value: 'safe', icon: 'shield', label: '保护', desc: '主密码、自动锁定和剪贴板清除', color: 'primary', bg: 'icon-bg-indigo' },
  { value: 'data', icon: 'storage', label: '数据', desc: '备份、导入和清除本地数据', color: 'secondary', bg: 'icon-bg-teal' },
  { value: 'ui', icon: 'tune', label: '个性化', desc: '主题、通知和字体偏好', color: 'orange', bg: 'icon-bg-orange' },
  { value: 'ai', icon: 'smart_toy', label: 'AI 分析', desc: '接口配置、成长分析和下一步建议', color: 'purple', bg: 'icon-bg-purple' },
  { value: 'about', icon: 'self_improvement', label: '关于', desc: '版本信息和使用说明', color: 'positive', bg: 'icon-bg-green' },
] as const

const section = computed(() => String(route.params.section || ''))
const panel = computed(() => String(route.params.panel || ''))
const currentSection = computed(() => mainTabs.find(item => item.value === section.value))
const panelItems = [
  { value: 'password', section: 'safe', label: '修改主密码', desc: '填写当前密码并设置新的主密码' },
  { value: 'auto-lock', section: 'safe', label: '自动锁定', desc: '设置闲置多久后锁定应用' },
  { value: 'clipboard-clear', section: 'safe', label: '剪贴板清除', desc: '设置复制密码后的自动清除时间' },
  { value: 'notify', section: 'ui', label: '通知提醒', desc: '设置记录提醒和活人感提醒' },
  { value: 'font', section: 'ui', label: '字体设置', desc: '调整字体大小和阅读风格' },
  { value: 'ai-config', section: 'ai', label: 'AI 接口配置', desc: '填写 API 地址、Key 和模型名称' },
  { value: 'guide', section: 'about', label: '使用说明', desc: '查看各功能模块的说明' },
] as const
const currentPanel = computed(() =>
  panelItems.find(item => item.section === section.value && item.value === panel.value)
)

const guides = [
  { icon: 'trending_up', color: 'primary', bg: 'icon-bg-indigo', title: '成长记录', desc: '记录篮球、健身、睡眠、学习等成长数据，支持模板快速记录和统计分析。' },
  { icon: 'lock', color: 'secondary', bg: 'icon-bg-teal', title: '密码箱', desc: '本地记录账号密码，支持一键复制、搜索筛选和密码检查建议。' },
  { icon: 'favorite', color: 'accent', bg: 'icon-bg-orange', title: '找回活人感', desc: '状态低落时，根据你的画像推荐可执行的微行动，帮助你恢复状态。' },
  { icon: 'security', color: 'positive', bg: 'icon-bg-green', title: '本地保护', desc: '主密码校验、自动锁定、剪贴板清除，降低误操作泄露的风险。' },
]

const aiSummary = computed(() => {
  if (!hasAIConnectionConfig(aiForm)) return '未配置，请填写 API 地址、Key 和模型名'
  return aiForm.enabled ? `已启用：${aiForm.model}` : `已配置：${aiForm.model}`
})

onMounted(() => {
  if (section.value && !currentSection.value) {
    router.replace('/settings')
  } else if (panel.value && !currentPanel.value) {
    router.replace(`/settings/${section.value}`)
  }

  const saved = localStorage.getItem('app_settings')
  if (saved) {
    try {
      const s = JSON.parse(saved)
      if (s.theme) theme.value = s.theme
      if (s.fontSize) fontSize.value = s.fontSize
      if (s.fontFamily) fontFamily.value = s.fontFamily
      if (s.autoLock !== undefined) autoLock.value = s.autoLock
      if (s.autoLockTimeout !== undefined) autoLockTimeout.value = Number(s.autoLockTimeout) || autoLockTimeout.value
      if (s.clipboardClear !== undefined) clipboardClear.value = s.clipboardClear
      if (s.clipboardClearTimeout !== undefined) clipboardClearTimeout.value = Number(s.clipboardClearTimeout) || clipboardClearTimeout.value
      if (s.notifyEnabled !== undefined) notifyEnabled.value = s.notifyEnabled
      if (s.notifyRecord !== undefined) notifyRecord.value = s.notifyRecord
      if (s.notifyAlive !== undefined) notifyAlive.value = s.notifyAlive
      if (s.notifyTime) notifyTime.value = s.notifyTime
      applyAppearanceSettings(s)
    } catch {}
  }

  Object.assign(aiForm, getAISettings())
})

function openSection(value: string) {
  router.push(`/settings/${value}`)
}

function openPanel(value: string) {
  router.push(`/settings/${section.value}/${value}`)
}

function backToParent() {
  if (panel.value) {
    router.push(`/settings/${section.value}`)
    return
  }
  router.push('/settings')
}

function saveSettings() {
  localStorage.setItem('app_settings', JSON.stringify({
    theme: theme.value,
    fontSize: fontSize.value,
    fontFamily: fontFamily.value,
    autoLockTimeout: autoLockTimeout.value,
    autoLock: autoLock.value,
    clipboardClear: clipboardClear.value,
    clipboardClearTimeout: clipboardClearTimeout.value,
    notifyEnabled: notifyEnabled.value,
    notifyRecord: notifyRecord.value,
    notifyAlive: notifyAlive.value,
    notifyTime: notifyTime.value,
  }))
  applyAppearanceSettings({
    theme: theme.value,
    fontSize: fontSize.value,
    fontFamily: fontFamily.value,
  })
  window.dispatchEvent(new Event('app-settings-changed'))
}

const autoLockLabel = computed(() =>
  autoLockOptions.find(opt => opt.value === autoLockTimeout.value)?.label || '5 分钟'
)

const clipboardClearLabel = computed(() =>
  clipboardClearOptions.find(opt => opt.value === clipboardClearTimeout.value)?.label || '15 秒'
)

function onAutoLockChange(val: boolean | number | string) {
  saveSettings()
  $q.notify({ type: 'info', message: val ? '已开启自动锁定' : '已关闭自动锁定' })
}

function onClipboardChange(val: boolean | number | string) {
  saveSettings()
  $q.notify({ type: 'info', message: val ? '已开启剪贴板清除' : '已关闭剪贴板清除' })
}

function toggleAutoLock() {
  autoLock.value = !autoLock.value
  onAutoLockChange(autoLock.value)
}

function toggleClipboardClear() {
  clipboardClear.value = !clipboardClear.value
  onClipboardChange(clipboardClear.value)
}

function saveAutoLockSettings() {
  saveSettings()
  $q.notify({ type: 'positive', message: `自动锁定已保存：${autoLock.value ? autoLockLabel.value : '已关闭'}` })
  router.push('/settings/safe')
}

function saveClipboardSettings() {
  saveSettings()
  $q.notify({ type: 'positive', message: `剪贴板清除已保存：${clipboardClear.value ? clipboardClearLabel.value : '已关闭'}` })
  router.push('/settings/safe')
}

function setAutoLockTimeout(value: number) {
  autoLockTimeout.value = value
  saveSettings()
  $q.notify({ type: 'positive', message: `自动锁定时间已设为 ${autoLockLabel.value}` })
}

function setClipboardClearTimeout(value: number) {
  clipboardClearTimeout.value = value
  saveSettings()
  $q.notify({ type: 'positive', message: `剪贴板清除时间已设为 ${clipboardClearLabel.value}` })
}

function changePassword() {
  if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
    $q.notify({ type: 'warning', message: '请填写所有字段' })
    return
  }
  if (pwdForm.new !== pwdForm.confirm) {
    $q.notify({ type: 'negative', message: '两次输入的新密码不一致' })
    return
  }
  if (pwdForm.new.length < 6) {
    $q.notify({ type: 'warning', message: '新密码至少 6 位' })
    return
  }
  if (hasMasterPassword()) {
    if (!changeMasterPassword(pwdForm.old, pwdForm.new)) {
      $q.notify({ type: 'negative', message: '当前密码错误' })
      return
    }
  } else {
    setMasterPassword(pwdForm.new)
  }
  $q.notify({ type: 'positive', message: '密码修改成功' })
  pwdForm.old = ''
  pwdForm.new = ''
  pwdForm.confirm = ''
  router.push('/settings/safe')
}

function exportBackup() {
  const excludeKeys = ['pg_app_master_pwd_hash', 'pg_app_master_pwd_salt']
  const data: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && !excludeKeys.includes(key)) {
      data[key] = localStorage.getItem(key) || ''
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `personal-growth-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  $q.notify({ type: 'positive', message: '备份文件已导出' })
}

function importBackup() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (re) => {
      try {
        const data = JSON.parse(re.target?.result as string)
        $q.dialog({
          title: '导入备份',
          message: `找到 ${Object.keys(data).length} 条数据，此操作将覆盖当前业务数据，并保留当前主密码，确定继续？`,
          cancel: { label: '取消', flat: true },
          ok: { label: '确定导入', color: 'primary' },
        }).onOk(() => {
          const masterHash = localStorage.getItem('pg_app_master_pwd_hash')
          const masterSalt = localStorage.getItem('pg_app_master_pwd_salt')
          localStorage.clear()
          Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v as string))
          if (masterHash) localStorage.setItem('pg_app_master_pwd_hash', masterHash)
          if (masterSalt) localStorage.setItem('pg_app_master_pwd_salt', masterSalt)
          $q.notify({ type: 'positive', message: '数据导入成功，页面将刷新' })
          setTimeout(() => location.reload(), 1000)
        })
      } catch {
        $q.notify({ type: 'negative', message: '备份文件格式错误' })
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function confirmClear() {
  $q.dialog({
    title: '清除所有数据',
    message: '此操作不可恢复，确定要清除所有本地数据吗？',
    cancel: { label: '取消', flat: true },
    ok: { label: '确定清除', color: 'negative' },
  }).onOk(() => {
    localStorage.clear()
    $q.notify({ type: 'positive', message: '所有数据已清除' })
    setTimeout(() => location.reload(), 1000)
  })
}

function setTheme(t: string) {
  theme.value = t
  saveSettings()
  $q.notify({ type: 'info', message: t === 'dark' ? '已切换为深色模式' : '已切换为浅色模式' })
}

function saveFont() {
  saveSettings()
  $q.notify({ type: 'positive', message: '字体设置已保存' })
  router.push('/settings/ui')
}

function saveNotifySettings() {
  saveSettings()
  $q.notify({ type: 'positive', message: '通知设置已保存' })
  router.push('/settings/ui')
}

function saveAIConfig() {
  if (!hasAIConnectionConfig(aiForm)) {
    $q.notify({ type: 'warning', message: '请填写 API 地址、Key 和模型名' })
    return
  }
  aiForm.enabled = true
  saveAISettings(aiForm)
  $q.notify({ type: 'positive', message: 'AI 配置已保存' })
  router.push('/settings/ai')
}

async function testAIConfig() {
  const testSettings = { ...aiForm, enabled: true }
  if (!hasAIConnectionConfig(testSettings)) {
    $q.notify({ type: 'warning', message: '请先填写 API 地址、Key 和模型名' })
    return
  }
  testingAI.value = true
  try {
    await requestAICompletion([
      { role: 'system', content: '你是一个接口连通性测试助手。' },
      { role: 'user', content: '请只回复：连接成功' },
    ], testSettings)
    $q.notify({ type: 'positive', message: 'AI 接口连接成功' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'AI 接口连接失败',
      timeout: 2600,
    })
  } finally {
    testingAI.value = false
  }
}

function openAIAnalysis() {
  if (!hasAIConnectionConfig(aiForm)) {
    $q.notify({ type: 'warning', message: '请先完成 AI 接口配置' })
    router.push('/settings/ai/ai-config')
    return
  }
  router.push('/ai-analysis')
}

function checkUpdate() {
  $q.notify({ type: 'info', message: '当前已是最新版本 v1.0.0' })
}
</script>

<style scoped>
.settings-page {
  background: var(--color-bg);
  min-height: 100vh;
}

.settings-page *,
.settings-page *::before,
.settings-page *::after {
  box-sizing: border-box;
}

.page-content {
  max-width: 700px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast) ease;
  flex-shrink: 0;
}

.back-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.page-title {
  font-size: var(--fs-24, 24px);
  font-weight: 720;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: 0;
}

.page-subtitle {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
}

.settings-overview,
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.overview-card,
.setting-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform var(--motion-fast) ease, border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
}

.overview-card:hover,
.setting-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: var(--color-border);
}

.overview-card:hover .setting-icon,
.setting-card:hover .setting-icon {
  transform: scale(1.04);
}

.setting-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
  transition: transform var(--motion-fast) ease;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.icon-bg-indigo { background: linear-gradient(135deg, #EEF0FF, #E4E8FF); }
.icon-bg-orange { background: linear-gradient(135deg, #FFF4E2, #FFEAC4); }
.icon-bg-green { background: linear-gradient(135deg, #EAF8EF, #DDF3E7); }
.icon-bg-teal { background: linear-gradient(135deg, #E2F6F3, #D5EFEB); }
.icon-bg-red { background: linear-gradient(135deg, #FFEDEE, #FFE1E4); }
.icon-bg-purple { background: linear-gradient(135deg, #F5ECFF, #EDE1FF); }
.icon-bg-grey { background: linear-gradient(135deg, #F3F4F7, #E9EBF0); }

.setting-body {
  flex: 1;
  min-width: 0;
}

.setting-name {
  font-size: var(--fs-14, 14px);
  font-weight: 650;
  color: var(--color-text-primary);
}

.setting-desc {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-secondary);
  margin-top: 3px;
  line-height: 1.5;
}

.theme-card {
  width: 100%;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.settings-form-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.compact-settings {
  gap: 10px;
  padding: 16px;
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

.neutral-note {
  background: var(--color-info-light);
  color: var(--color-info);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.setting-option-btn {
  min-height: 36px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--fs-12, 12px);
  font-weight: 650;
  cursor: pointer;
  transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, color var(--motion-fast) ease;
}

.setting-option-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.setting-option-btn-active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.setting-option-btn-active:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.page-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.theme-title {
  font-size: var(--fs-14, 14px);
  font-weight: 650;
  color: var(--color-text-primary);
  margin-bottom: 14px;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  color: var(--color-text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast) ease;
}

.theme-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.theme-btn-active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.theme-btn-active:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.setting-icon-primary { color: var(--color-primary); }
.setting-icon-secondary { color: var(--color-teal); }
.setting-icon-orange { color: var(--color-warning); }
.setting-icon-positive { color: var(--color-positive); }
.setting-icon-negative { color: var(--color-negative); }
.setting-icon-purple { color: #9B6ADB; }
.setting-icon-grey { color: var(--color-text-muted); }

:global(body.dark-mode) .icon-bg-indigo { background: rgba(123, 138, 224, 0.18); }
:global(body.dark-mode) .icon-bg-orange { background: rgba(232, 155, 62, 0.18); }
:global(body.dark-mode) .icon-bg-green { background: rgba(76, 175, 130, 0.18); }
:global(body.dark-mode) .icon-bg-teal { background: rgba(42, 157, 143, 0.2); }
:global(body.dark-mode) .icon-bg-red { background: rgba(224, 82, 82, 0.18); }
:global(body.dark-mode) .icon-bg-purple { background: rgba(155, 106, 219, 0.2); }
:global(body.dark-mode) .icon-bg-grey { background: rgba(232, 232, 240, 0.12); }

:global(body.dark-mode) .setting-icon-primary { color: #AEB8FF; }
:global(body.dark-mode) .setting-icon-secondary { color: #65D4C8; }
:global(body.dark-mode) .setting-icon-orange { color: #FFC46F; }
:global(body.dark-mode) .setting-icon-positive { color: #7EE0AD; }
:global(body.dark-mode) .setting-icon-negative { color: #FF9A9A; }
:global(body.dark-mode) .setting-icon-purple { color: #D4B8FF; }
:global(body.dark-mode) .setting-icon-grey { color: #D8DAE8; }

.about-card {
  background: linear-gradient(135deg, #5B6ABF, #7B8AE0);
  border-radius: var(--radius-lg);
  padding: 30px 24px;
  text-align: center;
  margin-bottom: 14px;
  position: relative;
  overflow: hidden;
}

.about-card::before,
.about-card::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.about-card::before {
  width: 140px;
  height: 140px;
  top: -44px;
  right: -32px;
}

.about-card::after {
  width: 82px;
  height: 82px;
  bottom: -24px;
  left: 20px;
}

.about-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-lg);
  margin: 0 auto 16px;
  position: relative;
  z-index: 1;
}

.about-name,
.about-version,
.about-desc {
  position: relative;
  z-index: 1;
}

.about-name {
  font-size: var(--fs-20, 20px);
  font-weight: 720;
  color: white;
}

.about-version {
  font-size: var(--fs-12, 12px);
  color: rgba(255, 255, 255, 0.72);
  margin-top: 4px;
}

.about-desc {
  max-width: 360px;
  margin: 14px auto 0;
  font-size: var(--fs-13, 13px);
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.6;
}

.form-dialog {
  width: 420px;
  border-radius: 18px !important;
  overflow: hidden;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.form-title {
  font-size: var(--fs-18, 18px);
  font-weight: 700;
  color: var(--color-text-primary);
}

.form-close {
  color: var(--color-text-muted);
}

.form-body {
  padding: 16px 24px;
  display: grid;
  gap: 10px;
}

.form-field {
  margin-bottom: 12px;
}

.dialog-field-row {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: background var(--motion-fast) ease;
}

.dialog-field-row:hover {
  background: rgba(91, 106, 191, 0.04);
}

.dialog-field-side {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  color: var(--color-text-secondary);
  font-size: var(--fs-12, 12px);
  font-weight: 650;
}

.dialog-input {
  min-width: 0;
  width: 100%;
}

.dialog-input :deep(.q-field__control) {
  min-height: 40px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
  box-shadow: none;
  align-items: center;
}

.dialog-input :deep(.q-field__control-container) {
  min-width: 0;
  flex: 1 1 auto;
}

.dialog-input :deep(.q-field__native),
.dialog-input :deep(.q-field__input) {
  width: 100%;
  min-width: 0;
}

.dialog-input :deep(.q-field__append) {
  min-height: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-left: 8px;
  padding-right: 2px;
}

.api-key-input :deep(.q-field__control) {
  position: relative;
  padding-right: 44px;
}

.api-key-input :deep(.q-field__control-container) {
  padding-right: 0;
}

.api-key-input :deep(.q-field__append) {
  position: absolute;
  top: 50%;
  right: 8px;
  z-index: 2;
  width: 32px;
  min-height: 32px;
  height: 32px;
  padding: 0;
  transform: translateY(-50%);
}

.dialog-input.q-field--focused :deep(.q-field__control) {
  background: white;
  box-shadow: inset 0 0 0 1px var(--color-primary), var(--focus-ring);
}

.input-action-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
}

.input-action-icon:hover {
  background: rgba(91, 106, 191, 0.1);
  color: var(--color-primary);
}

.range-field {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
}

.ai-range {
  flex: 1;
  width: 100%;
  height: 24px;
  margin: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
}

.ai-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-primary), rgba(91, 106, 191, 0.18));
}

.ai-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border: 2px solid white;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 2px 6px rgba(45, 45, 58, 0.18);
  appearance: none;
}

.ai-range::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: rgba(91, 106, 191, 0.2);
}

.ai-range::-moz-range-progress {
  height: 4px;
  border-radius: 999px;
  background: var(--color-primary);
}

.ai-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 2px 6px rgba(45, 45, 58, 0.18);
}

.ai-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(91, 106, 191, 0.22), 0 2px 6px rgba(45, 45, 58, 0.18);
}

.range-value {
  min-width: 34px;
  text-align: right;
  font-size: var(--fs-12, 12px);
  font-weight: 700;
  color: var(--color-primary);
}

.form-label {
  font-size: var(--fs-12, 12px);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  padding: 12px 24px 20px;
}

.full-width {
  width: 100%;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast) ease;
}

.btn-cancel {
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
}

.btn-cancel:hover {
  background: var(--color-bg);
}

.btn-save {
  border: none;
  background: var(--color-primary);
  color: white;
}

.btn-save:hover {
  background: var(--color-primary-dark);
}

.page-actions .btn-cancel,
.page-actions .btn-save {
  min-height: 42px;
}

.notify-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
}

.notify-item + .notify-item {
  border-top: 1px solid var(--color-bg);
}

.notify-body {
  flex: 1;
}

.notify-name {
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  color: var(--color-text-primary);
}

.notify-desc {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.font-size-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.font-size-btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--fs-13, 13px);
  font-weight: 500;
  color: var(--color-text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast) ease;
}

.font-size-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.font-size-btn-active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.font-size-btn-active:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.guide-dialog {
  width: 460px;
  border-radius: 18px !important;
  overflow: hidden;
}

.guide-body {
  padding: 12px 24px 20px;
}

.guide-section {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: #F7F7FA;
}

.guide-section + .guide-section {
  border-top: 0;
}

.guide-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.guide-content {
  flex: 1;
}

.guide-title {
  font-size: var(--fs-14, 14px);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.guide-desc {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .page-content {
    padding: 20px 16px 40px;
  }

  .form-dialog,
  .guide-dialog {
    width: calc(100vw - 32px);
  }

  .dialog-field-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .theme-options {
    flex-direction: column;
  }

  .option-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

