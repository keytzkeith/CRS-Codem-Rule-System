import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '5f2'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '959'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '50c'),
            routes: [
              {
                path: '/getting-started/local-setup',
                component: ComponentCreator('/getting-started/local-setup', '600'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/getting-started/overview',
                component: ComponentCreator('/getting-started/overview', 'c5a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/operations/deployment',
                component: ComponentCreator('/operations/deployment', '161'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/operations/troubleshooting',
                component: ComponentCreator('/operations/troubleshooting', 'fa1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/reference/api-contract',
                component: ComponentCreator('/reference/api-contract', '372'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/reference/data-model',
                component: ComponentCreator('/reference/data-model', '5c4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/workflows/import-export',
                component: ComponentCreator('/workflows/import-export', '9b7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/workflows/trade-capture',
                component: ComponentCreator('/workflows/trade-capture', '5aa'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
