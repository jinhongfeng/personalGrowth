import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue')
      },
      {
        path: 'growth',
        name: 'Growth',
        component: () => import('@/pages/growth/GrowthList.vue')
      },
      {
        path: 'growth/new',
        name: 'GrowthNew',
        component: () => import('@/pages/growth/GrowthForm.vue')
      },
      {
        path: 'growth/:id/edit',
        name: 'GrowthEdit',
        component: () => import('@/pages/growth/GrowthForm.vue'),
        props: true
      },
      {
        path: 'password',
        name: 'Password',
        component: () => import('@/pages/password/PasswordVault.vue')
      },
      {
        path: 'password/new',
        name: 'PasswordNew',
        component: () => import('@/pages/password/PasswordForm.vue')
      },
      {
        path: 'password/:id',
        name: 'PasswordDetail',
        component: () => import('@/pages/password/PasswordDetail.vue'),
        props: true
      },
      {
        path: 'password/:id/edit',
        name: 'PasswordEdit',
        component: () => import('@/pages/password/PasswordForm.vue'),
        props: true
      },
      {
        path: 'alive',
        name: 'Alive',
        component: () => import('@/pages/alive/AliveHome.vue')
      },
      {
        path: 'alive/profile',
        name: 'AliveProfile',
        component: () => import('@/pages/alive/AliveProfile.vue')
      },
      {
        path: 'ai-analysis',
        name: 'AIAnalysis',
        component: () => import('@/pages/ai/AIAnalysis.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/pages/settings/Settings.vue')
      },
      {
        path: 'settings/:section',
        name: 'SettingsSection',
        component: () => import('@/pages/settings/Settings.vue')
      },
      {
        path: 'settings/:section/:panel',
        name: 'SettingsPanel',
        component: () => import('@/pages/settings/Settings.vue')
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/pages/NotFound.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
