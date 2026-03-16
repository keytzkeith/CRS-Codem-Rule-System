const config = {
  title: 'CRS Docs',
  tagline: 'Setup, import, deploy, and operate CRS cleanly.',
  favicon: 'img/favicon.svg',
  url: 'https://docs.crs.local',
  baseUrl: '/',
  organizationName: 'crs',
  projectName: 'crs-docs',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  themes: [],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themeConfig: {
    image: 'img/favicon.svg',
    navbar: {
      title: 'CRS Docs',
      logo: {
        alt: 'CRS',
        src: 'img/favicon.svg',
      },
      items: [
        { to: '/getting-started/overview', label: 'Overview', position: 'left' },
        { to: '/getting-started/local-setup', label: 'Local setup', position: 'left' },
        { to: '/workflows/import-export', label: 'Import/export', position: 'left' },
        { to: '/operations/deployment', label: 'Deployment', position: 'left' },
        {
          href: 'https://keytz-portfolio.vercel.app/',
          label: 'Portfolio',
          position: 'right',
        },
        {
          href: 'https://github.com/keytzkeith/CRS-Codem-Rule-System/',
          label: 'Repo',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Getting started',
          items: [
            { label: 'Overview', to: '/getting-started/overview' },
            { label: 'Local setup', to: '/getting-started/local-setup' },
          ],
        },
        {
          title: 'Workflows',
          items: [
            { label: 'Import/export', to: '/workflows/import-export' },
            { label: 'Trade model', to: '/reference/data-model' },
          ],
        },
        {
          title: 'Creator',
          items: [
            { label: 'Keith Odera', href: 'https://keytz-portfolio.vercel.app/' },
            { label: 'GitHub', href: 'https://github.com/keytzkeith/CRS-Codem-Rule-System/' },
            { label: 'codemtrader@gmail.com', href: 'mailto:codemtrader@gmail.com' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Keith Odera. Created by Keith Odera.`,
    },
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
  },
};

module.exports = config;
