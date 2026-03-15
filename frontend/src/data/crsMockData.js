/**
 * @typedef {Object} TradeChecklist
 * @property {boolean} htfBosConfirmed
 * @property {boolean} pullbackToOb
 * @property {boolean} m15Confirmation
 * @property {boolean} tradedWithBias
 * @property {boolean} validSession
 * @property {boolean} minimumRRMet
 */

/**
 * @typedef {Object} TradeJournal
 * @property {string} whyTaken
 * @property {string} htfBias
 * @property {string} entryModel
 * @property {boolean} followedPlan
 * @property {string} emotionBefore
 * @property {string} emotionAfter
 * @property {string} mistakeMade
 * @property {string} lessonLearned
 * @property {string} notes
 */

/**
 * @typedef {Object} TradeRecord
 * @property {string} id
 * @property {string} date
 * @property {string} pair
 * @property {'Long'|'Short'} direction
 * @property {string} setupType
 * @property {string} session
 * @property {number} entry
 * @property {number} stopLoss
 * @property {number} takeProfit
 * @property {'Win'|'Loss'|'Breakeven'} status
 * @property {number} resultR
 * @property {number} resultAmount
 * @property {string[]} tags
 * @property {TradeJournal} journal
 * @property {TradeChecklist} checklist
 * @property {string | null} screenshot
 */

export const crsMockTrades = [
  {
    id: 'crs-001',
    date: '2026-02-03',
    pair: 'EURUSD',
    direction: 'Long',
    setupType: 'OB retest',
    session: 'London',
    entry: 1.0812,
    stopLoss: 1.0796,
    takeProfit: 1.0854,
    status: 'Win',
    resultR: 2.6,
    resultAmount: 325,
    tags: ['continuation', 'OB retest', 'London', 'A+ setup'],
    screenshot: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=1200&q=80',
    journal: {
      whyTaken: 'Daily bullish displacement reclaimed the London open and left a clean order block on M15.',
      htfBias: 'Bullish after 4H BOS and Asia liquidity sweep.',
      entryModel: 'M15 engulf + retest of displacement leg.',
      followedPlan: true,
      emotionBefore: 'Calm and selective.',
      emotionAfter: 'Confident without chasing.',
      mistakeMade: 'No major mistake.',
      lessonLearned: 'When the higher-timeframe bias is clear, patience around the retest matters more than speed.',
      notes: 'Textbook continuation. Partials respected the plan and left runner to target.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-002',
    date: '2026-02-05',
    pair: 'GBPUSD',
    direction: 'Short',
    setupType: 'Liquidity sweep',
    session: 'New York',
    entry: 1.2681,
    stopLoss: 1.2705,
    takeProfit: 1.2629,
    status: 'Win',
    resultR: 2.1,
    resultAmount: 260,
    tags: ['liquidity sweep', 'BOS entry', 'New York'],
    screenshot: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1200&q=80',
    journal: {
      whyTaken: 'New York buy-side sweep tagged premium and immediately failed back below the intraday range.',
      htfBias: 'Bearish under daily supply.',
      entryModel: 'Sweep + bearish BOS entry.',
      followedPlan: true,
      emotionBefore: 'Focused.',
      emotionAfter: 'Satisfied.',
      mistakeMade: 'Exited one partial too early.',
      lessonLearned: 'Keep the first scale-out but let the second target breathe when momentum confirms.',
      notes: 'Strong reaction from premium pricing. Setup aligns with my best NY fade pattern.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-003',
    date: '2026-02-07',
    pair: 'XAUUSD',
    direction: 'Long',
    setupType: 'Reversal',
    session: 'London',
    entry: 2031.4,
    stopLoss: 2027.8,
    takeProfit: 2038.6,
    status: 'Loss',
    resultR: -1,
    resultAmount: -125,
    tags: ['reversal', 'counter-trend', 'London'],
    screenshot: null,
    journal: {
      whyTaken: 'Saw early rejection and anticipated a deeper squeeze higher before news.',
      htfBias: 'Mixed, leaning bearish.',
      entryModel: 'Counter-trend M5 reclaim.',
      followedPlan: false,
      emotionBefore: 'Impatient.',
      emotionAfter: 'Annoyed but clear on the error.',
      mistakeMade: 'Forced a counter-trend reversal before higher-timeframe confirmation.',
      lessonLearned: 'No reversal trades unless daily narrative and session context agree.',
      notes: 'The setup never truly matched the playbook. This belongs in the avoid list.'
    },
    checklist: {
      htfBosConfirmed: false,
      pullbackToOb: false,
      m15Confirmation: false,
      tradedWithBias: false,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-004',
    date: '2026-02-10',
    pair: 'NAS100',
    direction: 'Short',
    setupType: 'Continuation',
    session: 'New York',
    entry: 21542.5,
    stopLoss: 21612.5,
    takeProfit: 21382.5,
    status: 'Win',
    resultR: 2.3,
    resultAmount: 410,
    tags: ['continuation', 'New York', 'A+ setup'],
    screenshot: 'https://images.unsplash.com/photo-1642104704191-e30a4fd7f4f1?auto=format&fit=crop&w=1200&q=80',
    journal: {
      whyTaken: 'The index repriced lower after CPI and offered a clean pullback into a bearish imbalance.',
      htfBias: 'Bearish intraday continuation.',
      entryModel: 'New York pullback into imbalance.',
      followedPlan: true,
      emotionBefore: 'Prepared.',
      emotionAfter: 'In rhythm.',
      mistakeMade: 'No mistake.',
      lessonLearned: 'When volatility expands, predefined levels matter more than extra confirmation.',
      notes: 'Fast execution but still disciplined. Great example of respecting session volatility.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-005',
    date: '2026-02-13',
    pair: 'USDJPY',
    direction: 'Long',
    setupType: 'BOS entry',
    session: 'London',
    entry: 149.42,
    stopLoss: 149.08,
    takeProfit: 150.14,
    status: 'Breakeven',
    resultR: 0,
    resultAmount: 0,
    tags: ['BOS entry', 'London'],
    screenshot: null,
    journal: {
      whyTaken: 'Break of the Asian range aligned with a bullish 4H continuation idea.',
      htfBias: 'Bullish.',
      entryModel: 'M15 BOS entry with retrace.',
      followedPlan: true,
      emotionBefore: 'Neutral.',
      emotionAfter: 'Content.',
      mistakeMade: 'Moved to breakeven a little early.',
      lessonLearned: 'Breakeven protection is fine, but not before the first objective is tested.',
      notes: 'Flat result but process was acceptable.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-006',
    date: '2026-02-17',
    pair: 'EURJPY',
    direction: 'Short',
    setupType: 'OB retest',
    session: 'London',
    entry: 161.77,
    stopLoss: 162.05,
    takeProfit: 161.09,
    status: 'Loss',
    resultR: -1,
    resultAmount: -140,
    tags: ['OB retest', 'London', 'FOMO'],
    screenshot: null,
    journal: {
      whyTaken: 'Late chase back into a bearish order block after the initial move had already expanded.',
      htfBias: 'Bearish.',
      entryModel: 'Delayed OB retest.',
      followedPlan: false,
      emotionBefore: 'Fear of missing the move.',
      emotionAfter: 'Frustrated.',
      mistakeMade: 'Chased after the first clean entry already passed.',
      lessonLearned: 'If the clean retest is gone, let it go. FOMO entries damage expectancy.',
      notes: 'Clear discipline violation. Useful reminder.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: false,
      m15Confirmation: false,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: false
    }
  },
  {
    id: 'crs-007',
    date: '2026-02-20',
    pair: 'GBPJPY',
    direction: 'Long',
    setupType: 'Continuation',
    session: 'New York',
    entry: 191.62,
    stopLoss: 191.11,
    takeProfit: 192.81,
    status: 'Win',
    resultR: 2.2,
    resultAmount: 305,
    tags: ['continuation', 'New York', 'M15 confirmation'],
    screenshot: 'https://images.unsplash.com/photo-1642790551116-18e74fd5cbf5?auto=format&fit=crop&w=1200&q=80',
    journal: {
      whyTaken: 'Trend continuation after lunch-hour compression broke higher with clean displacement.',
      htfBias: 'Bullish.',
      entryModel: 'Continuation with M15 confirmation.',
      followedPlan: true,
      emotionBefore: 'Patient.',
      emotionAfter: 'Positive.',
      mistakeMade: 'No mistake.',
      lessonLearned: 'Compression breakouts work best when session liquidity returns.',
      notes: 'Good example of waiting through chop for a quality trigger.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-008',
    date: '2026-02-24',
    pair: 'AUDUSD',
    direction: 'Short',
    setupType: 'Liquidity sweep',
    session: 'London',
    entry: 0.6579,
    stopLoss: 0.6591,
    takeProfit: 0.6547,
    status: 'Win',
    resultR: 2.4,
    resultAmount: 295,
    tags: ['liquidity sweep', 'London', 'A+ setup'],
    screenshot: null,
    journal: {
      whyTaken: 'Asian highs were swept right into a weekly supply pocket before bearish displacement.',
      htfBias: 'Bearish.',
      entryModel: 'Sweep and return under range high.',
      followedPlan: true,
      emotionBefore: 'Clear-headed.',
      emotionAfter: 'Confident.',
      mistakeMade: 'No mistake.',
      lessonLearned: 'The cleaner the sweep, the less I need extra indicators.',
      notes: 'Fast rejection, easy management.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-009',
    date: '2026-03-01',
    pair: 'US30',
    direction: 'Long',
    setupType: 'Reversal',
    session: 'New York',
    entry: 43221,
    stopLoss: 43138,
    takeProfit: 43394,
    status: 'Win',
    resultR: 2.1,
    resultAmount: 370,
    tags: ['reversal', 'New York', 'liquidity sweep'],
    screenshot: 'https://images.unsplash.com/photo-1642790481827-d2ed09852ffb?auto=format&fit=crop&w=1200&q=80',
    journal: {
      whyTaken: 'Sell-side liquidity sweep into daily discount produced a strong impulsive reclaim.',
      htfBias: 'Bullish after sweep.',
      entryModel: 'Reversal after failed breakdown.',
      followedPlan: true,
      emotionBefore: 'Locked in.',
      emotionAfter: 'Good discipline.',
      mistakeMade: 'Slight hesitation on entry.',
      lessonLearned: 'When the reversal fits the full checklist, trust the playbook faster.',
      notes: 'High-quality reversal because it was with higher-timeframe context, not against it.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-010',
    date: '2026-03-05',
    pair: 'EURUSD',
    direction: 'Short',
    setupType: 'OB retest',
    session: 'London',
    entry: 1.0902,
    stopLoss: 1.092,
    takeProfit: 1.086,
    status: 'Loss',
    resultR: -1,
    resultAmount: -150,
    tags: ['OB retest', 'London'],
    screenshot: null,
    journal: {
      whyTaken: 'Took a bearish retest under prior support after weak overnight action.',
      htfBias: 'Bearish intraday.',
      entryModel: 'Order block retest.',
      followedPlan: true,
      emotionBefore: 'Composed.',
      emotionAfter: 'Fine with it.',
      mistakeMade: 'No mistake, just normal variance.',
      lessonLearned: 'A valid loss still adds confidence when process stays clean.',
      notes: 'Respecting good losses is part of consistency.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-011',
    date: '2026-03-09',
    pair: 'BTCUSD',
    direction: 'Long',
    setupType: 'Continuation',
    session: 'New York',
    entry: 68420,
    stopLoss: 67680,
    takeProfit: 69980,
    status: 'Win',
    resultR: 2.1,
    resultAmount: 440,
    tags: ['continuation', 'New York', 'BOS entry'],
    screenshot: 'https://images.unsplash.com/photo-1640161704729-cbe966a08476?auto=format&fit=crop&w=1200&q=80',
    journal: {
      whyTaken: 'Strong reclaim of weekend range high with continuation structure on M15.',
      htfBias: 'Bullish.',
      entryModel: 'BOS continuation.',
      followedPlan: true,
      emotionBefore: 'Measured.',
      emotionAfter: 'Calm.',
      mistakeMade: 'No mistake.',
      lessonLearned: 'The same playbook works across markets when context is respected.',
      notes: 'Clean crypto continuation, managed like FX.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  },
  {
    id: 'crs-012',
    date: '2026-03-12',
    pair: 'XAUUSD',
    direction: 'Short',
    setupType: 'Liquidity sweep',
    session: 'London',
    entry: 2164.8,
    stopLoss: 2169.2,
    takeProfit: 2155.6,
    status: 'Win',
    resultR: 2.0,
    resultAmount: 280,
    tags: ['liquidity sweep', 'London', 'A+ setup'],
    screenshot: null,
    journal: {
      whyTaken: 'London engineered highs into prior daily premium and failed sharply.',
      htfBias: 'Bearish.',
      entryModel: 'Liquidity sweep reversal.',
      followedPlan: true,
      emotionBefore: 'Confident.',
      emotionAfter: 'Satisfied.',
      mistakeMade: 'No mistake.',
      lessonLearned: 'My best gold setups are still the clean sweep reversals at session extremes.',
      notes: 'Strong finish to the week.'
    },
    checklist: {
      htfBosConfirmed: true,
      pullbackToOb: true,
      m15Confirmation: true,
      tradedWithBias: true,
      validSession: true,
      minimumRRMet: true
    }
  }
]

export const crsDefaultSettings = {
  currency: 'USD',
  riskMode: 'amount',
  riskPerTrade: 125,
  preferredPeriod: 'monthly',
  reviewCadence: 'weekend',
  previewEmptyState: false,
  activeAccountId: 'account-1',
  accounts: [
    {
      id: 'account-1',
      name: 'Primary account',
      size: 25000
    }
  ],
  customSetupTypes: [
    'OB retest',
    'Continuation',
    'Liquidity sweep',
    'BOS entry',
    'Reversal'
  ],
  customTags: [
    'continuation',
    'reversal',
    'liquidity sweep',
    'BOS entry',
    'OB retest',
    'London',
    'New York',
    'A+ setup',
    'FOMO',
    'counter-trend'
  ]
}
