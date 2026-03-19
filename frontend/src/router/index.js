import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'
import { CRS_ROUTE_REDIRECTS } from '@/config/navigation'

const mode = import.meta.env.VITE_APP_MODE || 'full'

const appRedirect = () => {
  const authStore = useAuthStore()
  return authStore.isAuthenticated ? { name: 'dashboard' } : { name: 'login' }
}

const landingRoutes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/LandingView.vue')
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('@/views/PrivacyPolicyView.vue')
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('@/views/TermsOfServiceView.vue')
  },
  {
    path: '/features',
    redirect: '/'
  },
  {
    path: '/pricing',
    redirect: '/'
  },
  {
    path: '/compare',
    redirect: '/'
  },
  {
    path: '/compare/tradervue',
    redirect: '/'
  },
  {
    path: '/faq',
    redirect: '/'
  },
  {
    path: '/public',
    redirect: '/'
  }
]

const authRoutes = [
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
  }
]

const dashboardRoutes = [
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
    redirect: '/trades/import'
  },
  {
    path: '/trades/import',
    name: 'trade-import',
    component: () => import('@/views/trades/TradeImportView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trades/import/advanced',
    name: 'trade-import-advanced',
    component: () => import('@/views/trades/TradeImportAdvancedView.vue'),
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
    redirect: '/journal'
  },
  {
    path: '/journal/:id/edit',
    redirect: to => `/trades/${to.params.id}`
  },
  {
    path: '/diary',
    redirect: '/journal'
  },
  {
    path: '/diary/new',
    redirect: '/journal'
  },
  {
    path: '/diary/:id/edit',
    redirect: to => `/trades/${to.params.id}`
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
  {
    path: '/accounts',
    name: 'accounts',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings/broker-sync',
    name: 'broker-sync',
    component: () => import('@/views/BrokerSyncView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/broker-sync',
    redirect: '/settings/broker-sync'
  }
]

const adminRoutes = [
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UserManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/backups',
    name: 'admin-backups',
    component: () => import('@/views/admin/BackupManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const appOnlyRoutes = [...authRoutes, ...dashboardRoutes, ...adminRoutes]

let routes = []

if (mode === 'landing') {
  routes = [
    ...landingRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'home' }
    }
  ]
} else if (mode === 'app') {
  routes = [
    {
      path: '/',
      redirect: appRedirect
    },
    ...appOnlyRoutes,
    ...landingRoutes.filter(r => r.name !== 'home'),
    ...CRS_ROUTE_REDIRECTS.map((path) => ({
      path,
      redirect: appRedirect
    })),
    {
      path: '/:pathMatch(.*)*',
      redirect: appRedirect
    }
  ]
} else {
  routes = [
    ...landingRoutes,
    ...appOnlyRoutes,
    ...CRS_ROUTE_REDIRECTS.map((path) => ({
      path,
      redirect: appRedirect
    })),
    {
      path: '/:pathMatch(.*)*',
      redirect: appRedirect
    }
  ]
}

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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.initialized && authStore.token) {
    try {
      await authStore.ensureInitialized()
    } catch (error) {
      console.error('Auth route initialization failed:', error)
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next({ name: 'dashboard' })
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
    trackPageView(String(to.name), { path: to.path })
    trackFeatureUsage(String(to.name), { path: to.path })
  }
})

export default router
