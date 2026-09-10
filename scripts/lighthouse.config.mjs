export const lighthouseAuditConfig = {
  lighthouseVersion: '13.4.1',
  runs: 3,
  scenario: 'default',

  categories: [
    'performance',
    'accessibility',
    'best-practices',
    'seo',
  ],

  routes: [
    {
      id: 'home',
      path: '/',
      label: 'Início',
    },
    {
      id: 'nft-detail',
      path:
        '/nfts/sage-nomad-009',
      label:
        'Detalhe do NFT',
    },
  ],

  profiles: [
    {
      id: 'desktop',
      preset: 'desktop',
    },
    {
      id: 'mobile',
      preset: null,
    },
  ],

  thresholds: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 90,
  },

  chromeFlags: [
    '--headless=new',
    '--incognito',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
  ],
}