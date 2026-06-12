<template>
  <q-layout view="hHh LpR lFr" class="app-layout">
    <!-- 顶部导航栏 -->
    <q-header class="header-bar">
      <div class="header-inner">
        <!-- 左侧品牌 -->
        <div class="header-brand">
          <div class="brand-icon">
            <q-icon name="self_improvement" size="20px" color="white" />
          </div>
          <span class="brand-text">个人成长助手</span>
        </div>

        <!-- 中间 Tab 导航 -->
        <div class="header-tabs">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="header-tab"
            :class="{ 'header-tab-active': isActive(item.path) }"
          >
            <q-icon :name="item.icon" size="18px" class="tab-icon" />
            <span class="tab-label">{{ item.label }}</span>
          </router-link>
        </div>

        <!-- 右侧操作 -->
        <div class="header-actions">
          <q-btn flat round icon="settings" size="sm" class="action-btn" @click="$router.push('/settings')" />
        </div>
      </div>
    </q-header>

    <!-- 主内容 -->
    <q-page-container class="page-container">
      <router-view v-slot="{ Component, route }">
        <transition :name="getTransitionName(route)" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </q-page-container>

    <nav class="mobile-bottom-nav" aria-label="移动端主导航">
      <router-link
        v-for="item in menuItems"
        :key="`mobile-${item.path}`"
        :to="item.path"
        class="mobile-nav-item"
        :class="{ 'mobile-nav-item-active': isActive(item.path) }"
      >
        <q-icon :name="item.icon" size="22px" class="mobile-nav-icon" />
        <span class="mobile-nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

const route = useRoute()

const menuItems = [
  { path: '/', icon: 'dashboard', label: '仪表盘' },
  { path: '/growth', icon: 'trending_up', label: '成长记录' },
  { path: '/password', icon: 'lock', label: '密码箱' },
  { path: '/alive', icon: 'favorite', label: '活人感' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// 子页面用 slide-up，同级页面用 fade
function getTransitionName(r: RouteLocationNormalized) {
  const path = r.path
  const isSubPage = path.split('/').filter(Boolean).length > 1
  return isSubPage ? 'slide-up' : 'fade'
}
</script>

<style scoped>
.app-layout {
  background: var(--color-bg);
}

/* ===== 顶部导航栏 ===== */
.header-bar {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  height: 56px;
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 32px;
}

/* 品牌 */
.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px var(--color-primary-glow);
}

.brand-text {
  font-size: var(--fs-15, 15px);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}

/* Tab 导航 */
.header-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.header-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: var(--fs-13, 13px);
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.header-tab:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.header-tab-active {
  color: var(--color-primary) !important;
  background: var(--color-primary-bg);
  font-weight: 600;
}

.header-tab-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
  animation: indicatorIn 0.25s ease;
}

@keyframes indicatorIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 16px;
    opacity: 1;
  }
}

.header-tab-active .tab-icon {
  color: var(--color-primary);
}

.tab-icon {
  transition: color 0.2s;
}

.tab-label {
  letter-spacing: -0.2px;
}

.mobile-bottom-nav {
  display: none;
}

/* 右侧操作 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn :deep(.q-btn__content) {
  cursor: pointer;
}

.action-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

/* ===== 页面切换动画 ===== */
/* 同级页面 - 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 子页面 - 从下方滑入 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .app-layout {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    --bottom-action-offset: calc(72px + env(safe-area-inset-bottom, 0px));
  }

  .header-inner {
    padding: 0 16px;
    gap: 16px;
    justify-content: space-between;
  }

  .header-tabs {
    display: none;
  }

  .brand-text {
    display: inline;
    max-width: 170px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .page-container {
    padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  }

  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1200;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 2px;
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.94);
    border-top: 1px solid var(--color-border-light);
    box-shadow: 0 -8px 24px rgba(45, 45, 58, 0.08);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
  }

  .mobile-nav-item {
    min-width: 0;
    min-height: 54px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-radius: 12px;
    text-decoration: none;
    color: var(--color-text-muted);
    font-size: var(--fs-11, 11px);
    font-weight: 650;
    line-height: 1.1;
    transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) ease;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-nav-item:active {
    transform: translateY(1px);
  }

  .mobile-nav-item-active {
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  .mobile-nav-icon {
    color: currentColor;
  }

  .mobile-nav-label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  body.dark-mode .mobile-bottom-nav {
    background: rgba(34, 34, 64, 0.94);
    border-top-color: var(--color-border);
    box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.28);
  }
}
</style>
