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
    activeRoutes: ['trades', 'trade-create', 'trade-detail', 'trade-edit']
  },
  {
    name: 'Journal',
    to: '/journal',
    route: 'journal',
    activeRoutes: ['journal', 'journal-create', 'journal-edit']
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
    activeRoutes: ['settings']
  }
]

export const CRS_ROUTE_REDIRECTS = [
  '/pricing',
  '/features',
  '/compare',
  '/compare/tradervue',
  '/leaderboard',
  '/gamification',
  '/public',
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
  '/accounts',
  '/cashflow',
  '/equity-history',
  '/profile',
  '/u/:username',
  '/privacy',
  '/faq',
  '/unsubscribe'
]

export default CRS_NAV_ITEMS
