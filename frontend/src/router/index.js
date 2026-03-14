import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'
import { CRS_ROUTE_REDIRECTS } from '@/config/navigation'

const appRedirect = () => {
  const authStore = useAuthStore()
  return authStore.isAuthenticated ? { name: 'dashboard' } : { name: 'login' }
}

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: appRedirect
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/verify-email/:token',
    name: 'verify-email',
    component: () => import('@/views/auth/EmailVerificationView.vue'),
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guest: true }
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trades',
    name: 'trades',
    component: () => import('@/views/trades/TradeListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trades/new',
    name: 'trade-create',
    component: () => import('@/views/trades/TradeFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trades/:id',
    name: 'trade-detail',
    component: () => import('@/views/trades/TradeDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trades/:id/edit',
    name: 'trade-edit',
    component: () => import('@/views/trades/TradeFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/journal',
    name: 'journal',
    component: () => import('@/views/DiaryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/journal/new',
    name: 'journal-create',
    component: () => import('@/views/DiaryFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/journal/:id/edit',
    name: 'journal-edit',
    component: () => import('@/views/DiaryFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/diary',
    redirect: '/journal'
  },
  {
    path: '/diary/new',
    redirect: '/journal/new'
  },
  {
    path: '/diary/:id/edit',
    redirect: to => `/journal/${to.params.id}/edit`
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/views/AnalyticsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/metrics',
    redirect: '/analytics'
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  ...CRS_ROUTE_REDIRECTS.map(path => ({
    path,
    redirect: appRedirect
  })),
  {
    path: '/:pathMatch(.*)*',
    redirect: appRedirect
  }
]

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

router.afterEach((to) => {
  const authStore = useAuthStore()
  const { identifyUser, trackPageView, trackFeatureUsage } = useAnalytics()

  if (authStore.isAuthenticated && authStore.user?.id) {
    identifyUser(authStore.user.id, {
      email: authStore.user.email,
      tier: authStore.user.tier || 'free'
    })
  }

  if (to.name && to.meta.requiresAuth) {
    trackPageView(to.name, { path: to.path })
    trackFeatureUsage(to.name, { path: to.path })
  }
})

export default router
