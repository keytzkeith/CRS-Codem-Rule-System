const siteIdentity = require('../config/siteIdentity.json');

const config = {
  title: 'CRS Docs',
  tagline: 'Setup, import, deploy, and operate CRS cleanly.',
  favicon: 'img/crs-logo.png',
  url: process.env.DOCS_SITE_URL || siteIdentity.urls.docs,
  baseUrl: '/',
  organizationName: 'keytzkeith',
  projectName: 'CRS-Codem-Rule-System',
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
  customFields: {
    siteIdentity,
  },
  themeConfig: {
    image: 'img/crs-main.png',
    navbar: {
      title: '',
      logo: {
        alt: 'CRS Codem Rule System',
        src: 'img/crs-main.png',
      },
      items: [
        { to: '/getting-started/overview', label: 'Overview', position: 'left' },
        { to: '/getting-started/local-setup', label: 'Local setup', position: 'left' },
        { to: '/workflows/import-export', label: 'Import/export', position: 'left' },
        { to: '/operations/deployment', label: 'Deployment', position: 'left' },
        { to: '/operations/go-live-checklist', label: 'Go live', position: 'left' },
        {
          href: siteIdentity.contact.portfolioUrl,
          label: 'Portfolio',
          position: 'right',
        },
        {
          href: siteIdentity.contact.repositoryUrl,
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
            { label: siteIdentity.creator.name, href: siteIdentity.contact.portfolioUrl },
            { label: 'GitHub', href: siteIdentity.contact.repositoryUrl },
            { label: siteIdentity.contact.supportEmail, href: `mailto:${siteIdentity.contact.supportEmail}` },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} ${siteIdentity.creator.name}. Created by ${siteIdentity.creator.name}.`,
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
