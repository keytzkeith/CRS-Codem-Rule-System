export const CRS_NAV_ITEMS = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    route: 'dashboard',
    activeRoutes: ['dashboard']
  },
  {
    name: 'Trades',
    to: '/trades',
    route: 'trades',
    activeRoutes: ['trades', 'trade-create', 'trade-detail', 'trade-edit', 'trade-import', 'trade-import-advanced']
  },
  {
    name: 'Journal',
    to: '/journal',
    route: 'journal',
    activeRoutes: ['journal']
  },
  {
    name: 'Analytics',
    to: '/analytics',
    route: 'analytics',
    activeRoutes: ['analytics']
  },
  {
    name: 'Settings',
    to: '/settings',
    route: 'settings',
    activeRoutes: ['settings', 'accounts']
  },
  {
    name: 'Admin',
    to: '/admin',
    route: 'admin',
    activeRoutes: ['admin'],
    adminOnly: true
  }
]

export const CRS_ROUTE_REDIRECTS = [
  '/leaderboard',
  '/gamification',
  '/markets',
  '/watchlists',
  '/watchlists/:id',
  '/analysis',
  '/analysis/analyze/:symbol',
  '/analysis/holdings/:id',
  '/analysis/trade-management',
  '/admin/users',
  '/admin/analytics',
  '/admin/oauth',
  '/admin/backups',
  '/oauth/authorize',
  '/billing',
  '/notifications',
  '/price-alerts',
  '/broker-sync',
  '/settings/broker-sync',
  '/calendar',
  '/import',
  '/cashflow',
  '/equity-history',
  '/profile',
  '/u/:username',
  '/unsubscribe'
]

export default CRS_NAV_ITEMS
